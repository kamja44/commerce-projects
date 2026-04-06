# Step 3. Suspense + Streaming 설계

## 목표

- 상품 목록 로딩 중 페이지 전체가 블로킹되는 문제를 Suspense로 해결
- 카드형 스켈레톤 UI로 사용자 체감 로딩 속도 개선
- `loading.tsx`(자동)와 수동 `<Suspense>` 경계 두 가지 방식을 모두 학습

## 현재 상태

- `marketplace/page.tsx`: Server Component이지만 데이터 페칭 없음
- `ProductList`: Client Component에서 TanStack Query로 클라이언트 사이드 데이터 페칭
- Suspense 경계: 없음
- Skeleton UI: 없음 (텍스트 "상품을 불러오는 중...")
- `loading.tsx`: 없음

## 설계

### 새로 만들 파일

#### `components/ProductCardSkeleton.tsx`

- 실제 ProductCard와 동일한 크기/구조의 플레이스홀더
- 이미지 영역 (회색 사각형) + 제목 줄 + 가격 줄
- Tailwind `animate-pulse` 사용
- Server Component (상태 없음)

#### `components/ProductListSkeleton.tsx`

- ProductCardSkeleton을 그리드로 배치
- ProductList와 동일한 grid 구조 (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4)
- 기본 8개 카드 렌더링
- `loading.tsx`와 수동 Suspense fallback 양쪽에서 재사용

#### `app/marketplace/loading.tsx`

- ProductListSkeleton을 렌더링
- Next.js가 자동으로 페이지 전체를 Suspense로 감싸는 역할

### 수정할 파일

#### `app/marketplace/page.tsx`

- `<Suspense fallback={<ProductListSkeleton />}>`로 ProductList를 감싸기
- 헤더 + ProductFormModal은 Suspense 바깥 → 즉시 렌더링

#### `components/ProductList.tsx`

- 기존 로딩 텍스트 ("상품을 불러오는 중...")를 ProductListSkeleton으로 교체

### 변경하지 않는 것

- 데이터 페칭 방식 (TanStack Query 유지 → Step 4에서 변경)
- ProductCard, ProductForm 로직
- 카테고리 필터링 로직

## 학습 흐름

1. **스켈레톤 컴포넌트 생성**: ProductCardSkeleton → ProductListSkeleton
2. **loading.tsx 생성**: 라우트 전환 시 스켈레톤 확인, Next.js 자동 Suspense 원리 이해
3. **수동 Suspense 경계 배치**: page.tsx에서 ProductList만 감싸기, loading.tsx와 비교
4. **ProductList 로딩 UI 개선**: 텍스트 → 스켈레톤 교체
5. **Lighthouse FCP 측정**: Before/After 비교

## 측정 항목

| 항목 | Before | After |
|------|--------|-------|
| Lighthouse FCP | 측정 필요 | - |
| 라우트 전환 시 빈 화면 시간 | 있음 | 스켈레톤으로 대체 |
