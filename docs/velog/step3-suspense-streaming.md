# Next.js 15 성능 최적화 — Suspense + Streaming으로 로딩 UX 개선하기

> 상품 목록이 로딩되는 동안 빈 화면 대신 스켈레톤 UI를 보여주는 과정을 기록합니다.

---

## 들어가며

이전 글에서 번들 분석과 Code Splitting을 적용했습니다.

이번 글에서는 **사용자가 체감하는 로딩 속도**를 개선합니다.

```
문제: 상품 목록을 불러오는 동안 "상품을 불러오는 중..." 텍스트만 보인다
목표: 실제 레이아웃과 동일한 스켈레톤 UI로 대체한다
```

---

## 현재 상태 분석

### 로딩 중 화면

```
┌──────────────────────────────────────┐
│  중고거래              [상품 등록]     │
│  안전하고 편리한 중고 물품 거래        │
│                                      │
│                                      │
│       상품을 불러오는 중...            │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

문제점:
- 로딩 중에 **레이아웃 정보가 전혀 없음** → 콘텐츠가 로드되면 화면이 갑자기 변함
- **CLS(Cumulative Layout Shift) 0.024** 발생 — 이미지 로드 시 레이아웃이 밀림
- 느린 네트워크에서 사용자는 빈 화면을 오래 봐야 함

### Lighthouse Before 측정

프로덕션 빌드(`npm run build && npm start`) 기준:

| 항목 | Before |
|------|--------|
| FCP | 0.2s |
| LCP | 0.6s |
| TBT | 0ms |
| CLS | 0.024 |
| Speed Index | 0.2s |

---

## 핵심 개념: Suspense란?

React의 `<Suspense>`는 **자식 컴포넌트가 준비되지 않았을 때 fallback UI를 보여주는** 경계(boundary)입니다.

```tsx
<Suspense fallback={<Skeleton />}>
  <ProductList />   {/* 준비될 때까지 Skeleton이 보임 */}
</Suspense>
```

Next.js에서는 두 가지 방식으로 Suspense를 적용할 수 있습니다:

### 1. `loading.tsx` — 자동 Suspense

파일을 만들면 Next.js가 **페이지 전체**를 자동으로 Suspense로 감쌉니다.

```
app/marketplace/
├── page.tsx
└── loading.tsx    ← 이 파일만 추가하면 됨
```

Next.js가 내부적으로 이렇게 처리합니다:

```tsx
// Next.js가 자동으로 생성하는 구조
<Suspense fallback={<Loading />}>    {/* loading.tsx */}
  <MarketplacePage />                {/* page.tsx 전체 */}
</Suspense>
```

→ 라우트 전환 시 헤더, 버튼, 상품 목록 **전부** 스켈레톤으로 대체

### 2. 수동 `<Suspense>` — 세밀한 제어

page.tsx에서 직접 Suspense 경계를 배치합니다.

```tsx
export default function MarketplacePage() {
  return (
    <div>
      <h1>중고거래</h1>           {/* 즉시 보임 */}
      <ProductFormModal />         {/* 즉시 보임 */}

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList />            {/* 여기만 스켈레톤 */}
      </Suspense>
    </div>
  );
}
```

→ 헤더/버튼은 **바로 보이고**, 상품 목록만 스켈레톤

### 두 방식의 차이

```
loading.tsx (자동):
┌──────────────────────────────────────┐
│  ████████              ██████████    │  ← 헤더도 스켈레톤
│  ██████████████████████████          │
│                                      │
│  ██ ██ ██ ██ ██ ██                   │  ← 카테고리 스켈레톤
│  ████████████                        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │  ← 상품 카드 스켈레톤
│  │████│ │████│ │████│ │████│       │
│  └────┘ └────┘ └────┘ └────┘       │
└──────────────────────────────────────┘

수동 Suspense:
┌──────────────────────────────────────┐
│  중고거래              [상품 등록]     │  ← 실제 헤더 즉시 표시
│  안전하고 편리한 중고 물품 거래        │
│                                      │
│  ██ ██ ██ ██ ██ ██                   │  ← 카테고리 스켈레톤
│  ████████████                        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │  ← 상품 카드 스켈레톤
│  │████│ │████│ │████│ │████│       │
│  └────┘ └────┘ └────┘ └────┘       │
└──────────────────────────────────────┘
```

> **둘 다 적용하면?** `loading.tsx`가 바깥쪽 Suspense, 수동이 안쪽입니다.
> 라우트 전환 시에는 바깥쪽이 먼저 잡고, 페이지 렌더링이 시작되면 안쪽이 동작합니다.

---

## 구현

### 1. ProductCardSkeleton — 카드형 스켈레톤

실제 `ProductCard`와 동일한 구조를 회색 플레이스홀더로 만듭니다.

```tsx
// components/ProductCardSkeleton.tsx

export function ProductCardSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 이미지 영역 */}
      <div className="aspect-square bg-gray-200 animate-pulse" />

      <div className="p-4 space-y-3">
        {/* 상태 뱃지 */}
        <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
        {/* 제목 */}
        <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
        {/* 가격 */}
        <div className="h-7 w-1/3 bg-gray-200 rounded animate-pulse" />
        {/* 위치 + 카테고리 */}
        <div className="flex justify-between">
          <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-1/5 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
```

**핵심:** 스켈레톤은 실제 콘텐츠와 **같은 크기**여야 합니다. 크기가 다르면 콘텐츠 로드 시 레이아웃이 밀려서 CLS가 발생합니다.

### 2. ProductListSkeleton — 그리드 스켈레톤

```tsx
// components/ProductListSkeleton.tsx

import { ProductCardSkeleton } from './ProductCardSkeleton';

export function ProductListSkeleton() {
  return (
    <div className="space-y-6">
      {/* 카테고리 필터 스켈레톤 */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-16 bg-gray-200 rounded-full animate-pulse" />
        ))}
      </div>

      {/* 상품 개수 스켈레톤 */}
      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />

      {/* 상품 그리드 — ProductList와 동일한 grid 구조 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
```

> 카테고리 필터, 상품 개수, 상품 그리드까지 모두 스켈레톤으로 만들어서
> 실제 레이아웃과 1:1로 대응시킵니다.

### 3. loading.tsx — 라우트 레벨 Suspense

```tsx
// app/marketplace/loading.tsx

import { ProductListSkeleton } from '@/components/ProductListSkeleton';

export default function MarketplaceLoading() {
  return (
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-9 w-40 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-60 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      <ProductListSkeleton />
    </div>
  );
}
```

### 4. page.tsx — 수동 Suspense 경계 추가

```tsx
// app/marketplace/page.tsx

import { Suspense } from 'react';
import { ProductList } from '@/components/ProductList';
import { ProductFormModal } from '@/components/ProductFormModal';
import { ProductListSkeleton } from '@/components/ProductListSkeleton';

export const metadata = {
  title: '중고거래 | 통합 커머스 플랫폼',
  description: '안전하고 편리한 중고 물품 거래',
};

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">중고거래</h1>
          <p className="text-gray-600">안전하고 편리한 중고 물품 거래</p>
        </div>
        <ProductFormModal />
      </div>

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList />
      </Suspense>
    </div>
  );
}
```

### 5. ProductList 로딩 UI 교체

기존 텍스트를 스켈레톤으로 교체합니다.

```tsx
// Before
if (isLoading) {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="text-lg text-gray-600">상품을 불러오는 중...</div>
    </div>
  );
}

// After
if (isLoading) {
  return <ProductListSkeleton />;
}
```

---

## 측정 결과

| 항목 | Before | After | 변화 |
|------|--------|-------|------|
| FCP | 0.2s | 0.2s | 동일 |
| LCP | 0.6s | 0.6s | 동일 |
| TBT | 0ms | 0ms | 동일 |
| **CLS** | **0.024** | **0** | **개선** |
| Speed Index | 0.2s | 0.2s | 동일 |

### CLS가 개선된 이유

```
Before: CLS 0.024
┌──────────────────────────────────────┐
│  로딩 중... (텍스트만)                │
│                ↓                      │
│  이미지 로드 → 카드 높이 변경 → 밀림!  │
└──────────────────────────────────────┘

After: CLS 0
┌──────────────────────────────────────┐
│  ┌────┐ ┌────┐  (스켈레톤이 자리 확보) │
│  │████│ │████│                       │
│  └────┘ └────┘                       │
│           ↓                           │
│  ┌────┐ ┌────┐  (콘텐츠로 교체, 같은 크기) │
│  │ 📱 │ │ 💻 │                       │
│  └────┘ └────┘                       │
└──────────────────────────────────────┘
```

스켈레톤이 실제 카드와 **동일한 크기로 공간을 미리 확보**하기 때문에, 콘텐츠가 로드되어도 레이아웃이 밀리지 않습니다.

### 나머지 수치가 동일한 이유

FCP, LCP 등이 변하지 않은 이유는 현재 데이터 페칭이 **클라이언트 사이드(TanStack Query)**에서 이루어지기 때문입니다.

```
현재 흐름:
서버 → HTML 전송 (데이터 없음) → 브라우저에서 API 호출 → 렌더링

Suspense/Streaming의 본래 효과:
서버 → HTML 스트리밍 (데이터 포함) → 점진적 렌더링
```

Suspense + Streaming의 서버 쪽 효과는 **Step 4(Server Component로 데이터 페칭)**에서 서버 사이드 fetch를 도입하면 확실히 나타납니다.

---

## `loading.tsx` vs 수동 Suspense — 언제 어떤 걸 쓸까?

| | `loading.tsx` | 수동 `<Suspense>` |
|---|---|---|
| 적용 범위 | 페이지 전체 | 원하는 영역만 |
| 설정 방법 | 파일 하나 추가 | JSX에 직접 배치 |
| 라우트 전환 | 자동 적용 | 적용 안 됨 |
| 세밀한 제어 | 불가 | 가능 |
| 사용 시점 | 페이지 전체 로딩이 필요할 때 | 일부만 로딩 상태일 때 |

> **실무 팁:** 둘 다 같이 쓸 수 있습니다.
> `loading.tsx`로 라우트 전환을 커버하고, 페이지 내부에서는 수동 Suspense로 세밀하게 제어하는 조합이 일반적입니다.

---

## 핵심 정리

| 개념 | 설명 |
|------|------|
| `<Suspense>` | 자식이 준비될 때까지 fallback UI를 보여주는 경계 |
| `loading.tsx` | Next.js가 자동으로 페이지를 Suspense로 감싸는 파일 컨벤션 |
| 스켈레톤 UI | 실제 레이아웃과 동일한 크기의 플레이스홀더 — CLS 방지가 핵심 |
| CLS | 콘텐츠 로드 시 레이아웃이 밀리는 정도, 스켈레톤으로 0에 가깝게 개선 가능 |

```
스켈레톤 UI의 핵심 가치:
"예쁘게 보이는 것"이 아니라
"콘텐츠와 동일한 공간을 미리 확보하는 것"
```

---

## 다음 단계

```
Step 4. Server Component 데이터 페칭
  → 현재 브라우저에서 API 호출 → 서버에서 데이터 포함한 HTML 전달로 전환
  → Suspense + Streaming의 진짜 효과가 나타남
  → FCP, LCP, TBT 개선 기대
```

---

> 측정 기록표

| Step | 항목 | Before | After |
|------|------|--------|-------|
| 1 | First Load JS (marketplace) | — | 137 kB |
| 1 | Lighthouse Performance | — | 100 |
| 2 | First Load JS (marketplace) | 137 kB | 140 kB |
| 2 | ProductForm 초기 로드 여부 | — | 미포함 (lazy) |
| 3 | Lighthouse CLS | 0.024 | 0 |
| 3 | Lighthouse FCP | 0.2s | 0.2s |
