# Step 2: Code Splitting 설계 문서

## 목표

`/marketplace` 페이지의 First Load JS를 줄인다.
`ProductForm`을 항상 로드하는 대신, 모달이 열리는 순간에만 로드한다.

## 기준점 (Step 1)

| 항목 | 수치 |
|------|------|
| First Load JS (marketplace) | 137 kB |
| marketplace 고유 청크 | 30.8 kB |

## 컴포넌트 구조

```
marketplace/page.tsx          ← Server Component (변경 최소화)
    └── ProductFormModal.tsx  ← 신규 Client Component
            └── ProductForm   ← next/dynamic으로 lazy load
```

## 파일별 역할

### `ProductFormModal.tsx` (신규)
- `'use client'`
- `useState`로 모달 열림/닫힘 상태 관리
- `next/dynamic`으로 `ProductForm` lazy load (`ssr: false`)
- 모달 오버레이 UI (Tailwind CSS, 외부 라이브러리 없음)
- 모달 닫기: 배경 클릭 또는 취소 버튼

### `marketplace/page.tsx` (수정)
- `<ProductFormModal />` 추가
- Server Component 유지 (`'use client'` 추가하지 않음)

### `ProductForm.tsx` (변경 없음)
- 기존 코드 그대로 사용

## dynamic import 방식

```ts
const ProductForm = dynamic(
  () => import('@/components/ProductForm').then(m => ({ default: m.ProductForm })),
  {
    loading: () => <p className="text-center py-8">로딩 중...</p>,
    ssr: false,
  }
);
```

- `ssr: false`: 폼은 서버 렌더링 불필요, 클라이언트에서만 동작
- `loading`: 청크 로드 중 표시할 fallback UI

## 기대 결과

- 모달을 열기 전: ProductForm 청크 로드 안 됨
- 모달을 처음 열 때: ProductForm 청크 네트워크 요청 발생
- First Load JS 감소 예상 (정확한 수치는 Step 2 완료 후 측정)

## 설계 결정 이유

`marketplace/page.tsx`를 Client Component로 변환하지 않고 `ProductFormModal`을 분리한 이유:
- Server Component는 최대한 유지하는 것이 Next.js App Router의 핵심 원칙
- 이 패턴이 Step 4(Server Component 데이터 페칭)에서 다시 활용됨
