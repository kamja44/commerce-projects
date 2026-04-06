# Step 3: Suspense + Streaming 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Suspense 경계와 카드형 스켈레톤 UI를 추가하여 상품 목록 로딩 중 사용자 체감 속도를 개선한다.

**Architecture:** 스켈레톤 컴포넌트(ProductCardSkeleton → ProductListSkeleton)를 먼저 만들고, loading.tsx(자동 Suspense)와 수동 `<Suspense>` 경계 두 가지 방식을 순서대로 적용하여 차이를 학습한다. 데이터 페칭은 기존 TanStack Query를 유지한다.

**Tech Stack:** Next.js 15 App Router, React 19 Suspense, Tailwind CSS (animate-pulse)

---

## 파일 구조

| 작업 | 파일 경로 | 역할 |
|------|----------|------|
| Create | `frontend/src/components/ProductCardSkeleton.tsx` | 개별 카드 스켈레톤 |
| Create | `frontend/src/components/ProductListSkeleton.tsx` | 스켈레톤 그리드 (재사용) |
| Create | `frontend/src/app/marketplace/loading.tsx` | 라우트 레벨 자동 Suspense fallback |
| Modify | `frontend/src/app/marketplace/page.tsx` | 수동 Suspense 경계 추가 |
| Modify | `frontend/src/components/ProductList.tsx` | 로딩 UI를 스켈레톤으로 교체 |

---

## Task 1: ProductCardSkeleton 컴포넌트 생성

**Files:**
- Create: `frontend/src/components/ProductCardSkeleton.tsx`

- [ ] **Step 1: ProductCardSkeleton 작성**

실제 ProductCard와 동일한 구조(이미지 영역 + 상태 뱃지 + 제목 + 가격 + 위치/카테고리)를 회색 플레이스홀더로 구현한다.

```tsx
// frontend/src/components/ProductCardSkeleton.tsx

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

- [ ] **Step 2: 브라우저에서 확인**

개발 서버에서 ProductCardSkeleton을 임시로 import하여 렌더링 확인. 실제 ProductCard와 크기/구조가 일치하는지 비교.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/components/ProductCardSkeleton.tsx
git commit -m "feat: add ProductCardSkeleton component"
```

---

## Task 2: ProductListSkeleton 컴포넌트 생성

**Files:**
- Create: `frontend/src/components/ProductListSkeleton.tsx`

- [ ] **Step 1: ProductListSkeleton 작성**

ProductList와 동일한 그리드 레이아웃에 ProductCardSkeleton 8개를 배치한다.

```tsx
// frontend/src/components/ProductListSkeleton.tsx

import { ProductCardSkeleton } from './ProductCardSkeleton';

export function ProductListSkeleton() {
  return (
    <div className="space-y-6">
      {/* 카테고리 필터 스켈레톤 */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-16 bg-gray-200 rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* 상품 개수 스켈레톤 */}
      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />

      {/* 상품 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 브라우저에서 확인**

ProductListSkeleton이 ProductList의 레이아웃과 일치하는지 비교. 카테고리 필터 영역, 상품 개수 영역, 그리드가 모두 포함되어야 한다.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/components/ProductListSkeleton.tsx
git commit -m "feat: add ProductListSkeleton component"
```

---

## Task 3: loading.tsx로 라우트 레벨 Suspense 적용

**Files:**
- Create: `frontend/src/app/marketplace/loading.tsx`

- [ ] **Step 1: loading.tsx 작성**

```tsx
// frontend/src/app/marketplace/loading.tsx

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

- [ ] **Step 2: 동작 확인**

1. 개발 서버 실행: `cd frontend && npm run dev`
2. 홈(`/`)에서 marketplace 링크 클릭
3. 라우트 전환 시 스켈레톤이 먼저 보이고, 이후 실제 페이지로 교체되는지 확인
4. Chrome DevTools Network 탭에서 Slow 3G로 설정하면 더 확실히 확인 가능

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/app/marketplace/loading.tsx
git commit -m "feat: add marketplace loading.tsx for route-level Suspense"
```

---

## Task 4: page.tsx에 수동 Suspense 경계 추가

**Files:**
- Modify: `frontend/src/app/marketplace/page.tsx`

- [ ] **Step 1: page.tsx에 Suspense 경계 추가**

ProductList를 `<Suspense>`로 감싸서 헤더/등록 버튼은 즉시 보이고 상품 목록만 스켈레톤으로 대체되도록 한다.

```tsx
// frontend/src/app/marketplace/page.tsx

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

- [ ] **Step 2: loading.tsx와 수동 Suspense 비교 학습**

두 방식의 차이를 확인한다:

1. **loading.tsx 있는 상태**: 라우트 전환 시 헤더 포함 전체가 스켈레톤
2. **loading.tsx 제거 후**: 헤더는 즉시 보이고 ProductList 영역만 스켈레톤

비교를 위해 loading.tsx를 임시로 이름 변경(`loading.tsx` → `loading.tsx.bak`)하여 수동 Suspense만 동작하는 것을 확인한다. 확인 후 원래대로 복원한다.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/app/marketplace/page.tsx
git commit -m "feat: add manual Suspense boundary around ProductList"
```

---

## Task 5: ProductList 로딩 UI를 스켈레톤으로 교체

**Files:**
- Modify: `frontend/src/components/ProductList.tsx`

- [ ] **Step 1: 로딩 텍스트를 ProductListSkeleton으로 교체**

ProductList 내부의 isLoading 분기에서 기존 텍스트를 스켈레톤으로 바꾼다.

기존 코드 (삭제):
```tsx
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">상품을 불러오는 중...</div>
      </div>
    );
  }
```

새 코드 (교체):
```tsx
  if (isLoading) {
    return <ProductListSkeleton />;
  }
```

상단에 import 추가:
```tsx
import { ProductListSkeleton } from './ProductListSkeleton';
```

- [ ] **Step 2: 동작 확인**

1. 개발 서버에서 marketplace 페이지 접속
2. Chrome DevTools Network → Slow 3G로 설정
3. 카테고리 필터 클릭 시 텍스트 대신 스켈레톤이 보이는지 확인

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/components/ProductList.tsx
git commit -m "feat: replace loading text with ProductListSkeleton"
```

---

## Task 6: Lighthouse FCP 측정 및 README 기록

**Files:**
- Modify: `README.md` (측정 기록표)

- [ ] **Step 1: Before 측정**

1. `cd frontend && npm run build && npm start`
2. Chrome DevTools → Lighthouse → Performance 탭
3. `/marketplace` 페이지에서 FCP 점수 기록

- [ ] **Step 2: After 측정**

Suspense + Skeleton 적용 후 동일한 조건에서 FCP 재측정.

- [ ] **Step 3: README 측정 기록표 업데이트**

README.md의 측정 기록표에서 Step 3 행을 업데이트한다:

```markdown
| 3 | Lighthouse FCP | {Before 값} | {After 값} |
```

- [ ] **Step 4: 커밋**

```bash
git add README.md
git commit -m "docs: record Step 3 Lighthouse FCP measurements"
```
