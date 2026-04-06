# Next.js 15 성능 최적화 — 번들 분석과 Code Splitting

> Next.js 15 App Router 기반 커머스 프로젝트에서 번들 크기를 측정하고, `next/dynamic`으로 코드 분할을 적용한 과정을 기록합니다.

---

## 들어가며

성능 최적화는 **측정 없이 시작하면 의미가 없습니다.**

"느린 것 같다"는 감각이 아니라, 수치로 현재 상태를 파악하고, 개선을 적용하고, 다시 수치로 검증하는 사이클이 중요합니다.

이번 글에서는 다음 두 단계를 다룹니다.

```
Step 1. 번들 분석 — 지금 번들이 어떻게 구성되어 있는가?
Step 2. Code Splitting — 필요한 시점에만 코드를 로드할 수 있는가?
```

---

## 프로젝트 구조

```
/marketplace    중고거래 (상품 목록, 등록)
/subscription   구독 커머스
/social         소셜 커머스
```

**기술 스택**
- Next.js 15 (App Router, Turbopack)
- TanStack Query v5
- Tailwind CSS
- NestJS 백엔드 (MongoDB)

---

## Step 1. 번들 분석 — 기준점 잡기

### 설치 및 설정

```bash
npm install @next/bundle-analyzer
```

```ts
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
```

```json
// package.json
"scripts": {
  "analyze": "cross-env ANALYZE=true next build"
}
```

### 분석 실행

```bash
npm run analyze
```

### 결과

```
Route (app)                          Size    First Load JS
┌ ○ /                               496 B        105 kB
├ ○ /_not-found                     977 B        102 kB
├ ○ /marketplace                   30.8 kB       137 kB  ← 가장 무거움
├ ○ /social                         138 B        101 kB
└ ○ /subscription                   138 B        101 kB

+ First Load JS shared by all       101 kB
  ├ chunks/4bd1b696-...            53.2 kB
  ├ chunks/684-...                 45.9 kB
  └ other shared chunks             1.99 kB
```

### 수치 해석

```
┌─────────────────────────────────────────────────────────┐
│                 /marketplace  137 kB                    │
│                                                         │
│  ┌──────────────────────────┐  ┌─────────────────────┐ │
│  │   Shared (모든 페이지)    │  │  Route 고유 청크     │ │
│  │        101 kB            │  │      30.8 kB         │ │
│  │                          │  │                      │ │
│  │  • react-dom  ~99 kB     │  │  • ProductList       │ │
│  │  • 기타 작은 청크 다수    │  │  • ProductCard       │ │
│  │                          │  │  • TanStack Query    │ │
│  └──────────────────────────┘  └─────────────────────┘ │
│             줄일 수 없음              줄일 수 있음        │
└─────────────────────────────────────────────────────────┘
```

> **핵심:** Shared 101 kB(React DOM 포함)는 손댈 수 없습니다.
> 최적화 대상은 route 고유 청크인 **30.8 kB** 쪽입니다.

### 번들 트리맵에서 확인한 것

CLI 빌드 출력은 큰 청크 2개만 보여주고 나머지를 `other shared chunks (total) 1.99 kB`로 묶어버립니다. 하지만 트리맵을 열면 실제로는 청크가 훨씬 많습니다.

Next.js는 번들을 다음 기준으로 **자동으로 잘게 쪼갭니다:**

| 청크 종류 | 내용 |
|-----------|------|
| Framework 청크 | React, React DOM — 가장 큰 블록 |
| Shared vendor 청크 | 여러 페이지에서 공통으로 쓰는 라이브러리 |
| 라이브러리별 청크 | 특정 라이브러리만 쓰는 경우 별도 분리 |
| Route 청크 | 각 페이지 고유 코드 |
| Dynamic 청크 | `dynamic()`으로 선언한 컴포넌트 (lazy load) |

트리맵의 진짜 가치는 여기 있습니다. CLI 숫자로는 "101 kB"라고만 보이지만, 트리맵에서는 **어떤 라이브러리가 얼마나 차지하는지를 면적으로** 한눈에 파악할 수 있습니다. `react-dom-client.production.js`가 가장 큰 블록을 차지하는 것을 직접 눈으로 확인할 수 있죠.

### Lighthouse 점수

| 항목 | 점수 |
|------|------|
| Performance | 100 |

> 백엔드 서버 없이 정적 페이지로 측정했기 때문에 100점입니다.
> 실제 API 호출이 생기면 수치가 변합니다. 이 값이 Step 3, 4에서 어떻게 바뀌는지 추적할 기준점입니다.

---

## Step 2. Code Splitting — 필요할 때만 로드하기

### 문제 정의

`ProductForm`(상품 등록 폼)은 "상품 등록" 버튼을 클릭했을 때만 필요합니다.
하지만 **static import**로 연결하면 버튼을 한 번도 클릭하지 않아도 초기 번들에 포함됩니다.

```
static import의 문제:
┌──────────────────────────────────────────────┐
│  사용자가 /marketplace 접속                   │
│                                              │
│  브라우저가 로드하는 것:                       │
│    ✅ ProductList  (항상 필요)                 │
│    ✅ ProductCard  (항상 필요)                 │
│    ❌ ProductForm  (버튼 클릭 전엔 불필요)     │
└──────────────────────────────────────────────┘
```

### 해결책: `next/dynamic`

```
dynamic import의 동작:
┌──────────────────────────────────────────────┐
│  사용자가 /marketplace 접속                   │
│    → ProductForm 청크 로드 안 됨              │
│                                              │
│  [상품 등록] 버튼 클릭                        │
│    → 그 순간 ProductForm 청크 요청 발생       │
│    → 이후 재클릭 시 캐시에서 즉시 로드        │
└──────────────────────────────────────────────┘
```

### 컴포넌트 설계

Server/Client 경계를 고려한 컴포넌트 분리:

```
marketplace/page.tsx        ← Server Component 유지
    └── ProductFormModal    ← Client Component (신규)
            └── ProductForm ← dynamic import (클릭 시에만 로드)
```

> `page.tsx`에 `'use client'`를 추가하지 않고, 모달 상태 관리를 담당하는
> `ProductFormModal`만 Client Component로 분리했습니다.
> **Server Component는 최대한 유지** — Next.js App Router의 핵심 원칙입니다.

### 구현 코드

**`ProductFormModal.tsx`**

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';

// 핵심: ProductForm을 lazy load
// 모달이 처음 열리는 순간에만 청크가 네트워크에서 로드됩니다
const ProductForm = dynamic(
  () => import('@/components/ProductForm').then((m) => ({ default: m.ProductForm })),
  {
    loading: () => (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">폼 로딩 중...</p>
      </div>
    ),
    ssr: false, // 폼은 서버 렌더링 불필요
  }
);

export function ProductFormModal() {
  const [isOpen, setIsOpen] = useState(false);

  // useCallback: 매 렌더마다 새 함수 인스턴스 생성 방지
  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        상품 등록
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">상품 등록</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
            <ProductForm onSuccess={handleClose} onCancel={handleClose} />
          </div>
        </div>
      )}
    </>
  );
}
```

**`marketplace/page.tsx`** (Server Component 유지)

```tsx
import { ProductList } from '@/components/ProductList';
import { ProductFormModal } from '@/components/ProductFormModal';

export const metadata = {
  title: '중고거래 | 통합 커머스 플랫폼',
  description: '안전하고 편리한 중고 물품 거래',
};

// 'use client' 없음 → Server Component 유지
export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">중고거래</h1>
          <p className="text-gray-600">안전하고 편리한 중고 물품 거래</p>
        </div>
        <ProductFormModal />  {/* Client Component를 import해도 Server Component 유지 */}
      </div>
      <ProductList />
    </div>
  );
}
```

### 측정 결과

```bash
npm run analyze
```

```
Route (app)                          Size    First Load JS
├ ○ /marketplace                   32.8 kB       140 kB
```

| | Before | After |
|---|---|---|
| First Load JS | 137 kB | 140 kB |
| marketplace 고유 청크 | 30.8 kB | 32.8 kB |

> **오, 오히려 늘었다?** 처음엔 당황했습니다.

### 왜 늘었는가? — 올바른 비교 기준

```
❌ 잘못된 비교:
   "Step 1 → Step 2 에서 번들이 늘었으니 최적화 실패"

✅ 올바른 비교:
   "ProductForm을 static import로 추가했을 때 vs dynamic import로 추가했을 때"
```

```
static import로 추가했다면:
  137 kB + ProductForm(~8-10 kB) ≈ 145~147 kB  (초기 로드에 전부 포함)

dynamic import로 추가했다면:
  140 kB  (초기 로드, ProductFormModal 래퍼만 포함)
  + ProductForm 청크는 클릭 시 별도 로드
```

번들 분석기 트리맵에서 ProductForm이 **별도 청크**로 분리된 것을 확인할 수 있습니다.

```
네트워크 흐름:
┌──────────────────────────────────────────────────────┐
│  페이지 진입                                          │
│    GET /marketplace  → main chunk (140 kB) 로드      │
│    ProductForm 청크 요청 없음 ✅                      │
│                                                      │
│  [상품 등록] 버튼 클릭                                │
│    GET /_next/static/chunks/ProductForm-[hash].js    │
│    → 로딩 UI 표시 ("폼 로딩 중...")                   │
│    → 청크 로드 완료 → 폼 렌더링                       │
│                                                      │
│  다시 [상품 등록] 클릭                                │
│    브라우저 캐시에서 즉시 로드 ✅                      │
└──────────────────────────────────────────────────────┘
```

---

## `ssr: false`가 필요한 이유

`next/dynamic`의 `ssr: false` 옵션을 사용한 이유:

```tsx
const ProductForm = dynamic(() => import('...'), {
  ssr: false,  // 이게 왜 필요할까?
});
```

`ProductForm`은 `react-hook-form`을 사용합니다. 폼 상태는 클라이언트에서만 의미가 있고, 서버에서 HTML을 미리 생성해도 사용자에게 도움이 되지 않습니다. `ssr: false`로 서버 렌더링을 건너뛰면 불필요한 서버 작업을 줄일 수 있습니다.

반면, `ssr: false`가 **맞지 않는** 경우:
- SEO가 중요한 콘텐츠 (상품 목록, 상품 상세)
- 초기 HTML에 포함되어야 하는 데이터

---

## 핵심 정리

| 개념 | 설명 |
|------|------|
| `next/dynamic` | 컴포넌트를 별도 청크로 분리, 필요 시점에 로드 |
| `ssr: false` | 서버 렌더링 생략, 클라이언트에서만 동작하는 컴포넌트에 사용 |
| `loading` | 청크 로드 중 표시할 fallback UI |
| Server/Client 경계 | Client Component를 import해도 Server Component는 유지됨 |

```
Code Splitting의 핵심 가치:
"번들을 줄이는 것"이 아니라
"초기 로드에 꼭 필요한 것만 포함시키는 것"
```

---

## 다음 단계

```
Step 3. Suspense + Streaming
  → 상품 목록이 로딩되는 동안 페이지 전체가 블로킹되는 문제 해결
  → Skeleton UI로 체감 속도 개선

Step 4. Server Component 데이터 페칭
  → 현재 클라이언트에서 API 호출 → 서버에서 데이터 포함한 HTML 전달로 전환
  → TBT(Total Blocking Time), LCP(Largest Contentful Paint) 개선
```

---

> 측정 기록표

| Step | 항목 | Before | After |
|------|------|--------|-------|
| 1 | First Load JS (marketplace) | — | 137 kB |
| 1 | Lighthouse Performance | — | 100 |
| 2 | First Load JS (marketplace) | 137 kB | 140 kB |
| 2 | ProductForm 초기 로드 여부 | — | 미포함 (lazy) |
