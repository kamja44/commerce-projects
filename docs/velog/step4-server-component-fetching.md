# Next.js 15 성능 최적화 — Server Component로 데이터 페칭하기

> 클라이언트가 마운트 후에 API를 호출하는 방식에서, 서버가 데이터를 포함한 HTML을 내려주는 방식으로 전환합니다.

---

## 들어가며

이전 글에서 Suspense + Streaming으로 스켈레톤 UI를 적용했습니다. CLS는 0으로 좋아졌지만, FCP/LCP는 거의 변하지 않았습니다.

이유는 간단합니다 — **데이터 페칭이 여전히 클라이언트에서 일어났기 때문**입니다.

```
Step 3까지의 흐름:
서버 → HTML 전송 (데이터 없음, 스켈레톤만)
브라우저 → JS 로드 → TanStack Query가 fetch → 응답 → 카드 렌더링
```

이번 글에서는 데이터 페칭을 **서버 쪽으로 끌어올립니다.**

```
Step 4 목표:
서버 → 백엔드 API 호출 → 데이터 포함된 HTML 생성 → 브라우저로 전송
브라우저 → 즉시 카드 표시 (fetch 없음)
```

---

## 핵심 개념

### 1. Server Component란?

Next.js 15 App Router의 컴포넌트는 기본적으로 **Server Component**입니다. 파일 최상단에 `'use client'`가 없으면 서버에서 실행됩니다.

```tsx
// page.tsx (Server Component)
export default async function MarketplacePage() {
  const products = await fetch('...').then(r => r.json());
  return <ProductList initialProducts={products} />;
}
```

특징:
- **`async` 함수로 작성 가능** — 컴포넌트 안에서 직접 `await` 사용
- **브라우저에 JS가 전송되지 않음** — 서버에서만 실행
- **백엔드 API, DB에 직접 접근 가능** — 클라이언트 비밀키 노출 걱정 없음

### 2. `initialData`란?

TanStack Query의 옵션입니다. `useQuery`가 마운트되는 시점에 **이미 캐시에 데이터가 있는 것처럼** 동작하게 만듭니다.

```tsx
// Before: 마운트 → data=undefined → queryFn 실행 → 로딩
useQuery({ queryKey: ['products'], queryFn: getProducts });

// After: 마운트 → data=initialData (즉시) → 로딩 스킵
useQuery({
  queryKey: ['products'],
  queryFn: getProducts,
  initialData: serverProducts,  // ← 여기
});
```

`initialData`가 있으면 `isLoading`이 처음부터 `false`고, 카드가 즉시 렌더링됩니다.

### 3. 두 개념을 어떻게 연결하는가?

핵심 의문: **"서버에서 받은 데이터가 어떻게 클라이언트의 `useQuery`까지 전달되는가?"**

답은 **Next.js가 Server Component → Client Component로 넘긴 props를 자동으로 직렬화해서 HTML에 같이 끼워 보낸다**는 것입니다.

```
[서버]
  page.tsx에서 fetch → products 배열 받음
  <ProductList initialProducts={products} />를 SSR
  ↓
  HTML + products를 JSON으로 직렬화해서 <script>에 같이 넣음

[브라우저]
  HTML을 받자마자 카드 렌더링 (사용자는 즉시 봄)
  JS 로드 → React 하이드레이션
  <script>의 JSON을 복원해서 ProductList에 props로 전달
  useProducts({ initialData: products })가 캐시에 박음 → fetch 안 함
```

페이지 소스 보기(Ctrl+U)로 직접 확인할 수 있습니다 — HTML 안에 카드 마크업과 함께 `__next_f.push([...{"_id":"..","title":"아이폰".."}..])` 같은 직렬화된 데이터가 들어있습니다.

---

## 구현

### 1. useProducts 훅에 initialData 옵션 추가

```tsx
// features/marketplace/hooks/useProducts.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/productApi';
import { Product } from '../types/product';

interface UseProductsOptions {
  initialData?: Product[];
}

export function useProducts(options?: UseProductsOptions) {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    initialData: options?.initialData,
  });
}
```

> `initialData`를 넘기지 않으면 `undefined`가 되고, 기존과 완전히 동일하게 동작합니다.
> 즉, 이 변경은 **하위 호환성**이 보장됩니다.

### 2. ProductList에 initialProducts props 추가

```tsx
// components/ProductList.tsx
interface ProductListProps {
  initialProducts?: Product[];
  onProductClick?: (product: Product) => void;
}

export function ProductList({ initialProducts, onProductClick }: ProductListProps) {
  const allProductsQuery = useProducts({ initialData: initialProducts });
  // ...
}
```

`initialProducts`가 있으면 `useProducts`가 즉시 데이터를 들고 시작합니다.

### 3. page.tsx를 async Server Component로 변경

가장 중요한 변경입니다.

```tsx
// app/marketplace/page.tsx
import { ProductList } from '@/components/ProductList';
import { ProductFormModal } from '@/components/ProductFormModal';
import { Suspense } from 'react';
import { ProductListSkeleton } from '@/components/ProductListSkeleton';
import { Product } from '@/features/marketplace/types/product';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/marketplace/products`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  return res.json();
}

export default async function MarketplacePage() {
  const products = await getProducts();

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
        <ProductList initialProducts={products} />
      </Suspense>
    </div>
  );
}
```

핵심 변경점:
- `export default function` → `export default async function`
- 컴포넌트 안에서 `await getProducts()` 직접 호출
- `<ProductList>`에 `initialProducts={products}` 전달

---

## fetch 캐싱 옵션

Next.js의 `fetch`는 `cache` 옵션으로 캐싱 동작을 제어합니다.

| 옵션 | 동작 | 사용 시점 |
|------|------|----------|
| `cache: 'no-store'` | 매 요청마다 새로 fetch | **실시간 데이터 (중고거래, 채팅 등)** |
| `cache: 'force-cache'` | 빌드 시점에 한 번만 fetch, 영구 캐시 | 정적 콘텐츠 (블로그 글 등) |
| `next: { revalidate: 10 }` | 10초마다 백그라운드에서 갱신 | 자주 안 변하는 데이터 (랭킹 등) |

중고거래는 **새 상품이 즉시 반영되어야** 하므로 `no-store`를 선택했습니다.

```tsx
// 만약 force-cache를 쓰면?
// → 빌드 후에 새 상품을 등록해도 목록에 안 보임 (캐시된 값만 반환)

// revalidate: 10을 쓰면?
// → 새 상품 등록 후 10초 뒤에 새로고침하면 반영됨
```

---

## 동작 확인

### 1. Network 탭 — `marketplace/products` 호출이 사라졌는가?

DevTools → Network 탭 → `/marketplace` 접속 → 필터에 `products` 입력

- **Before:** `marketplace/products` 호출이 보임 (클라이언트가 fetch함)
- **After:** 호출이 **사라짐** ✅ (서버에서 받은 데이터를 그대로 사용)

> 이것이 Step 4의 가장 명확한 성공 지표입니다.

### 2. 페이지 소스 보기 — HTML에 데이터가 박혀있는가?

`/marketplace`에서 우클릭 → 페이지 소스 보기(Ctrl+U) → Ctrl+F로 상품 제목 검색

- 두 군데에서 발견됨:
  - `<div>아이폰...</div>` ← 사람이 보는 HTML 마크업
  - `"title":"아이폰"...` ← `<script>` 안의 직렬화된 JSON (RSC payload)

이 JSON이 바로 `initialProducts`가 브라우저로 전달되는 통로입니다.

---

## 측정 결과

| 항목 | Step 3 After | Step 4 After | 변화 |
|------|--------------|--------------|------|
| FCP | 0.2s | 0.2s | 동일 |
| **LCP** | **0.6s** | **0.5s** | **개선** |
| TBT | 0ms | 0ms | 동일 |
| CLS | 0 | 0 | 동일 |
| Speed Index | 0.2s | 0.2s | 동일 |

### LCP가 개선된 이유

```
Step 3:
서버 → HTML (스켈레톤만) → 브라우저
브라우저 → JS 로드 → fetch → 응답 → 카드 렌더링 → LCP 측정
                    ⬆️ 이 시간만큼 LCP가 늦어짐

Step 4:
서버 → 백엔드 fetch → 데이터 포함 HTML → 브라우저
브라우저 → HTML 수신 → 즉시 카드 렌더링 → LCP 측정
```

브라우저에서의 fetch 왕복 시간이 사라지면서 LCP가 개선되었습니다. 변화 폭이 작은 것은 로컬 환경에서 백엔드 응답이 매우 빨라서 fetch 자체의 오버헤드가 크지 않기 때문입니다. 실제 프로덕션 환경(느린 네트워크, 먼 거리의 백엔드)에서는 차이가 더 커집니다.

### 진짜 효과는 측정값보다 큰 것

수치 개선보다 더 중요한 변화는:

1. **API 호출 1회 감소** — 사용자가 페이지에 들어올 때마다 클라이언트가 한 번 덜 fetch
2. **로딩 깜빡임 제거** — 스켈레톤 → 카드로 교체되는 순간이 사라짐 (서버에서 이미 카드를 그려서 보냄)
3. **SEO 개선** — 검색 엔진 크롤러가 빈 HTML이 아니라 데이터가 포함된 HTML을 받음

---

## Server Component vs Client Component 데이터 페칭

| | Client (TanStack Query만) | Server (Step 4 방식) |
|---|---|---|
| 첫 진입 시 fetch 위치 | 브라우저 | 서버 |
| HTML에 데이터 포함 여부 | ❌ | ✅ |
| 로딩 깜빡임 | 있음 | 없음 |
| SEO | 약함 | 강함 |
| 캐시 무효화 / refetch | 자유로움 | 카테고리 필터 같은 인터랙션은 클라이언트가 담당 |

> **중요:** 둘 중 하나만 골라야 하는 게 아닙니다.
> Step 4의 구조는 **첫 진입은 서버에서, 이후 인터랙션(카테고리 필터)은 클라이언트에서** 처리하는 하이브리드 방식입니다.
> `initialData`가 그 둘을 자연스럽게 이어주는 다리 역할을 합니다.

---

## 핵심 정리

| 개념 | 설명 |
|------|------|
| Server Component | 서버에서 실행되며 `async` 함수로 작성 가능. 백엔드 API에 직접 접근 |
| `initialData` | TanStack Query에 "이미 있는 데이터"를 주입하여 마운트 시 fetch를 스킵 |
| RSC payload | Server Component가 Client Component에 넘긴 props를 직렬화한 데이터. HTML에 함께 포함되어 전송됨 |
| `cache: 'no-store'` | 매 요청마다 새로 fetch. 실시간 데이터에 적합 |

```
Server Component 데이터 페칭의 핵심:
"서버가 HTML을 만들 때 데이터까지 함께 그려서 보낸다"
"클라이언트는 그 데이터를 다시 fetch할 필요가 없다"
```

---

## 다음 단계

```
Step 5. 이미지 최적화
  → next/image, AVIF/WebP, blur placeholder
  → LCP 추가 개선 (현재 0.5s → 더 줄일 수 있을지)
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
| 4 | Lighthouse LCP | 0.6s | 0.5s |
| 4 | `marketplace/products` 클라이언트 호출 | 1회 | **0회** |
