# Code Splitting (Step 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ProductForm`을 `next/dynamic`으로 lazy load하여 `/marketplace` First Load JS를 줄인다.

**Architecture:** `marketplace/page.tsx`는 Server Component를 유지하고, 모달 상태와 dynamic import를 담당하는 `ProductFormModal` Client Component를 신규 생성한다. `ProductForm`은 모달이 처음 열리는 순간에만 청크가 로드된다.

**Tech Stack:** Next.js 15 (App Router), `next/dynamic`, Tailwind CSS

---

## 파일 맵

| 파일 | 작업 |
|------|------|
| `frontend/src/components/ProductFormModal.tsx` | 신규 생성 |
| `frontend/src/app/marketplace/page.tsx` | 수정 (ProductFormModal 추가) |

---

### Task 1: ProductFormModal 컴포넌트 생성

**Files:**
- Create: `frontend/src/components/ProductFormModal.tsx`

- [ ] **Step 1: 파일 생성**

`frontend/src/components/ProductFormModal.tsx`를 아래 내용으로 생성한다.

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const ProductForm = dynamic(
  () => import('@/components/ProductForm').then((m) => ({ default: m.ProductForm })),
  {
    loading: () => (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">폼 로딩 중...</p>
      </div>
    ),
    ssr: false,
  }
);

export function ProductFormModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        상품 등록
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">상품 등록</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <ProductForm
              onSuccess={() => setIsOpen(false)}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: 동작 확인 포인트 메모**

모달이 닫혀 있는 동안 Network 탭에서 ProductForm 청크가 **로드되지 않아야** 한다.
모달을 처음 열 때 `_next/static/chunks/` 하위에 새 청크 요청이 **1회 발생**해야 한다.
두 번째 열 때는 청크 요청이 발생하지 않아야 한다 (캐시됨).

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/components/ProductFormModal.tsx
git commit -m "feat: add ProductFormModal with dynamic import"
```

---

### Task 2: marketplace/page.tsx에 ProductFormModal 추가

**Files:**
- Modify: `frontend/src/app/marketplace/page.tsx`

- [ ] **Step 1: page.tsx 수정**

`frontend/src/app/marketplace/page.tsx`를 아래와 같이 수정한다.

```tsx
import { ProductList } from '@/components/ProductList';
import { ProductFormModal } from '@/components/ProductFormModal';

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

      <ProductList />
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/app/marketplace/page.tsx
git commit -m "feat: add ProductFormModal to marketplace page"
```

---

### Task 3: 번들 크기 측정 및 기록

**Files:**
- Modify: `README.md` (측정 기록표 After 값 업데이트)

- [ ] **Step 1: 번들 재분석**

```bash
cd frontend
npm run analyze
```

- [ ] **Step 2: 수치 확인**

빌드 출력에서 `/marketplace` First Load JS 확인.
Step 1 기준(137 kB)과 비교.

- [ ] **Step 3: README 측정 기록표 업데이트**

`README.md`의 Step 2 After 값을 실측 수치로 업데이트한다.

- [ ] **Step 4: 커밋**

```bash
git add README.md
git commit -m "docs: record Step 2 bundle size measurement"
```
