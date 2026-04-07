# Step 4. Server Component로 데이터 페칭 설계

## 목표

- 초기 상품 데이터를 서버에서 가져와 HTML에 포함시킴
- 클라이언트 JS 번들에서 초기 API 호출 로직 제거
- 초기 렌더링 속도 개선 (TBT, LCP)
- TanStack Query initialData를 활용한 서버/클라이언트 데이터 통합

## 현재 상태

- `page.tsx`: Server Component이지만 데이터 페칭 없음
- `ProductList`: Client Component에서 TanStack Query로 전체 데이터 페칭
- 초기 로드 시: HTML 전송 → 브라우저에서 API 호출 → 렌더링 (워터폴)

## 설계

### 데이터 흐름

```
서버 (page.tsx)
  → fetch로 전체 상품 조회
  → ProductList에 initialProducts props 전달

클라이언트 (ProductList)
  → useProducts({ initialData: initialProducts })
  → 초기 렌더링: 서버 데이터 즉시 표시 (네트워크 요청 없음)
  → 카테고리 필터 클릭: TanStack Query가 클라이언트에서 API 호출
  → staleTime 이후: 백그라운드에서 자동 revalidation
```

### 변경할 파일

#### `app/marketplace/page.tsx`

- `async` 함수로 변경
- 서버에서 `fetch()`로 전체 상품 조회 (`cache: 'no-store'`)
- ProductList에 `initialProducts` props 전달
- Suspense 경계 유지

#### `components/ProductList.tsx`

- `initialProducts?: Product[]` props 추가
- `useProducts()`에 `initialData: initialProducts` 전달
- `initialProducts`가 있을 때 초기 isLoading 상태 불필요해짐

#### `features/marketplace/hooks/useProducts.ts`

- `initialData` 옵션을 인자로 받을 수 있도록 수정

### 서버 fetch 설정

```tsx
// page.tsx에서 서버 사이드 fetch
const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/products`, {
  cache: 'no-store', // 매 요청마다 새로운 데이터
});
const products = await res.json();
```

### fetch 캐싱 옵션 (학습용)

| 옵션 | 동작 | 사용 시점 |
|------|------|----------|
| `cache: 'no-store'` | 매 요청마다 새 데이터 | 자주 변경되는 데이터 (중고거래 상품) |
| `cache: 'force-cache'` | 빌드 시 캐시, 이후 재사용 | 거의 변경 안 되는 데이터 |
| `next: { revalidate: 60 }` | 60초마다 갱신 | 적당히 신선한 데이터 필요 시 |

### 변경하지 않는 것

- ProductCard, ProductForm, ProductFormModal
- 카테고리 필터링 로직 (TanStack Query 유지)
- loading.tsx, Suspense 경계 (Step 3 유지)
- 백엔드 코드
- 클라이언트용 axios API 함수 (카테고리 필터에서 계속 사용)

## 측정 항목

| 항목 | Before | After |
|------|--------|-------|
| Lighthouse TBT | 측정 필요 | - |
| Lighthouse LCP | 측정 필요 | - |
| 초기 API 호출 | 브라우저에서 발생 | 서버에서 발생 (클라이언트 네트워크 탭에 안 보임) |
