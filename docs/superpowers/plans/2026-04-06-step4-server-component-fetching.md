# Step 4: Server Component 데이터 페칭 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초기 상품 데이터를 서버에서 fetch하여 HTML에 포함시키고, TanStack Query initialData로 클라이언트에 넘겨 하이드레이션한다.

**Architecture:** page.tsx를 async Server Component로 만들어 서버에서 상품 데이터를 가져온다. ProductList에 initialProducts props로 전달하고, useProducts 훅에서 initialData로 활용한다. 카테고리 필터링은 기존 TanStack Query로 유지한다.

**Tech Stack:** Next.js 15 App Router, TanStack Query v5 (initialData), fetch API

---

## 파일 구조

| 작업 | 파일 경로 | 역할 |
|------|----------|------|
| Modify | `frontend/src/features/marketplace/hooks/useProducts.ts` | initialData 옵션 지원 추가 |
| Modify | `frontend/src/components/ProductList.tsx` | initialProducts props 받아서 useProducts에 전달 |
| Modify | `frontend/src/app/marketplace/page.tsx` | async 서버 fetch + ProductList에 데이터 전달 |

---

## Task 1: useProducts 훅에 initialData 지원 추가

**Files:**
- Modify: `frontend/src/features/marketplace/hooks/useProducts.ts`

- [ ] **Step 1: useProducts에 initialData 파라미터 추가**

기존 코드:
```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/productApi';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });
}
```

새 코드:
```tsx
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

- [ ] **Step 2: 동작 확인**

개발 서버에서 기존과 동일하게 동작하는지 확인. `initialData`를 넘기지 않으면 기존과 완전히 동일하게 동작해야 한다.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/features/marketplace/hooks/useProducts.ts
git commit -m "feat: add initialData support to useProducts hook"
```

---

## Task 2: ProductList에 initialProducts props 추가

**Files:**
- Modify: `frontend/src/components/ProductList.tsx`

- [ ] **Step 1: initialProducts props 추가 및 useProducts에 전달**

변경할 부분 1 — interface에 initialProducts 추가:

기존:
```tsx
interface ProductListProps {
  onProductClick?: (product: Product) => void;
}
```

새 코드:
```tsx
interface ProductListProps {
  initialProducts?: Product[];
  onProductClick?: (product: Product) => void;
}
```

변경할 부분 2 — 컴포넌트에서 props 받기:

기존:
```tsx
export function ProductList({ onProductClick }: ProductListProps) {
```

새 코드:
```tsx
export function ProductList({ initialProducts, onProductClick }: ProductListProps) {
```

변경할 부분 3 — useProducts에 initialData 전달:

기존:
```tsx
  const allProductsQuery = useProducts();
```

새 코드:
```tsx
  const allProductsQuery = useProducts({ initialData: initialProducts });
```

- [ ] **Step 2: 동작 확인**

개발 서버에서 기존과 동일하게 동작하는지 확인. `initialProducts`를 넘기지 않으면 기존 동작과 동일해야 한다.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/components/ProductList.tsx
git commit -m "feat: add initialProducts props to ProductList"
```

---

## Task 3: page.tsx를 async Server Component로 변경

**Files:**
- Modify: `frontend/src/app/marketplace/page.tsx`

- [ ] **Step 1: page.tsx에 서버 사이드 fetch 추가**

기존 코드:
```tsx
import { ProductList } from '@/components/ProductList';
import { ProductFormModal } from '@/components/ProductFormModal';
import { Suspense } from 'react';
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

새 코드:
```tsx
import { ProductList } from '@/components/ProductList';
import { ProductFormModal } from '@/components/ProductFormModal';
import { Suspense } from 'react';
import { ProductListSkeleton } from '@/components/ProductListSkeleton';
import { Product } from '@/features/marketplace/types/product';

export const metadata = {
  title: '중고거래 | 통합 커머스 플랫폼',
  description: '안전하고 편리한 중고 물품 거래',
};

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

- [ ] **Step 2: 서버 fetch 동작 확인**

1. 개발 서버 실행: `cd frontend && npm run dev`
2. `http://localhost:3000/marketplace` 접속
3. 상품 목록이 보이는지 확인
4. **Chrome DevTools Network 탭**에서 `marketplace/products` API 호출이 **보이지 않아야** 함 (서버에서 이미 가져왔으므로)

- [ ] **Step 3: Suspense + Streaming 동작 확인**

page.tsx가 async 함수가 되었으므로, 서버에서 fetch하는 동안 `loading.tsx`의 스켈레톤이 보임.
홈(`/`) → marketplace 링크 클릭 시 스켈레톤이 보이고, 데이터 로드 후 상품 목록으로 교체되는지 확인.

- [ ] **Step 4: 카테고리 필터 동작 확인**

카테고리 버튼 클릭 시 TanStack Query가 클라이언트에서 API를 호출하는지 확인.
Network 탭에서 카테고리 필터 클릭 시에만 `marketplace/products/category/:category` 호출이 보여야 함.

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/app/marketplace/page.tsx
git commit -m "feat: add server-side data fetching to marketplace page"
```

---

## Task 4: Lighthouse TBT/LCP 측정 및 README 기록

**Files:**
- Modify: `README.md` (측정 기록표)

- [ ] **Step 1: Before 측정 (이미 있음)**

Step 3에서 측정한 값을 Before로 사용:
- LCP: 0.6s
- TBT: 0ms

- [ ] **Step 2: After 측정**

1. `cd frontend && npm run build && npm start`
2. Chrome DevTools → Lighthouse → Performance
3. `/marketplace` 페이지에서 측정

- [ ] **Step 3: README 측정 기록표 업데이트**

```markdown
| 4 | Lighthouse TBT | {Before 값} | {After 값} |
| 4 | Lighthouse LCP | {Before 값} | {After 값} |
```

- [ ] **Step 4: 커밋**

```bash
git add README.md
git commit -m "docs: record Step 4 Lighthouse TBT/LCP measurements"
```

---

## Task 5: fetch 캐싱 옵션 체험 (학습용)

이 Task는 코드를 최종적으로 변경하지 않습니다. 캐싱 옵션의 차이를 체험하는 학습 단계입니다.

- [ ] **Step 1: `cache: 'force-cache'` 테스트**

page.tsx의 fetch 옵션을 변경:
```tsx
const res = await fetch(`${API_URL}/marketplace/products`, {
  cache: 'force-cache',
});
```

`npm run build && npm start` 후 페이지 접속. 새 상품을 등록해도 목록이 변하지 않는 것을 확인.

- [ ] **Step 2: `next: { revalidate: 10 }` 테스트**

```tsx
const res = await fetch(`${API_URL}/marketplace/products`, {
  next: { revalidate: 10 },
});
```

빌드 후 접속 → 새 상품 등록 → 10초 후 새로고침 시 반영되는 것을 확인.

- [ ] **Step 3: `cache: 'no-store'`로 원복**

중고거래는 실시간 데이터가 중요하므로 `no-store`로 원복:
```tsx
const res = await fetch(`${API_URL}/marketplace/products`, {
  cache: 'no-store',
});
```
