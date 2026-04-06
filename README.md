# 통합 커머스 플랫폼 — Next.js 최적화 학습 프로젝트

> Next.js 15 App Router 기반의 e-커머스 프로젝트.
> 기능 구현보다 **성능 최적화 기법을 직접 적용하고 수치로 확인**하는 것이 목표입니다.

---

## 기술 스택

### Frontend
- **프레임워크**: Next.js 15 (App Router, Turbopack)
- **언어**: TypeScript 5+
- **서버 상태**: TanStack Query v5
- **스타일링**: Tailwind CSS
- **HTTP 클라이언트**: Axios
- **유효성 검사**: Zod + React Hook Form

### Backend
- **프레임워크**: NestJS
- **언어**: TypeScript 5+
- **데이터베이스**: MongoDB + Mongoose
- **인증**: JWT
- **API 문서**: Swagger (`http://localhost:3000/api/docs`)

---

## 시작하기

```bash
# Frontend
cd frontend
npm install
cp .env.local.example .env.local   # 환경변수 설정
npm run dev                         # http://localhost:3000

# Backend
cd backend
npm install
cp .env.example .env
npm run dev                         # http://localhost:3000
```

### 환경변수

**frontend/.env.local**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

**backend/.env**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/commerce
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

---

## 라우팅 구조

```
/                  홈
/marketplace       중고거래 (상품 목록, 등록)
/subscription      구독 커머스
/social            소셜 커머스
```

---

## 최적화 학습 로드맵

각 단계는 **측정 → 적용 → 비교** 순서로 진행합니다.
적용 전후 Lighthouse 점수와 번들 크기를 기록하세요.

---

### ✅ Step 0. Next.js 15 마이그레이션
Vite + React → Next.js 15 App Router로 전환

- [x] App Router 구조로 페이지 이동
- [x] `react-router-dom` 제거, `next/link` / `next/navigation` 사용
- [x] `import.meta.env` → `process.env.NEXT_PUBLIC_*`
- [x] Server Component 기본값 적용, 필요한 곳에만 `'use client'`
- [x] `next/image`로 이미지 최적화 기반 마련

---

### 🔲 Step 1. 번들 분석 (기준점 잡기)

> 최적화는 측정에서 시작합니다. 지금 번들이 얼마나 무거운지 눈으로 확인합니다.

**목표**
- 현재 번들 구성 시각화
- Lighthouse 초기 점수 기록
- 무거운 청크 식별

**사용 도구**
- `@next/bundle-analyzer` — 번들 트리맵 시각화
- Chrome DevTools Lighthouse — 성능 점수
- Chrome DevTools Network 탭 — 실제 전송 크기

**학습 포인트**
- 번들이 어떤 chunk로 나뉘는지 이해
- First Load JS 크기가 성능에 미치는 영향
- 어떤 라이브러리가 번들을 무겁게 만드는지 파악

**적용 방법**
```bash
npm install @next/bundle-analyzer
# next.config.ts 수정 후
ANALYZE=true npm run build
```

---

### 🔲 Step 2. Code Splitting (코드 분할)

> 지금 `/marketplace` 페이지는 ProductForm을 항상 로드합니다.
> 폼은 "상품 등록" 버튼을 눌렀을 때만 필요합니다.

**목표**
- 초기 JS 번들 크기 축소
- 필요한 시점에만 컴포넌트 로드

**핵심 개념**
```ts
// Before: 항상 로드
import { ProductForm } from '@/components/ProductForm';

// After: 필요할 때만 로드
const ProductForm = dynamic(() => import('@/components/ProductForm'), {
  loading: () => <Skeleton />,
});
```

**학습 포인트**
- `next/dynamic` 사용법
- Dynamic import가 chunk를 분리하는 원리
- `loading` 옵션으로 로딩 UI 처리
- `ssr: false` 옵션이 필요한 경우 (window, document 접근)

---

### 🔲 Step 3. Suspense + Streaming

> 상품 목록 로딩 중 페이지 전체가 블로킹됩니다.
> Suspense로 감싸면 나머지 UI는 먼저 보여줄 수 있습니다.

**목표**
- 사용자 체감 로딩 속도 개선
- 스켈레톤 UI 구현

**핵심 개념**
```tsx
// 상품 목록이 로딩되는 동안 Skeleton이 보임
<Suspense fallback={<ProductListSkeleton />}>
  <ProductList />
</Suspense>
```

**학습 포인트**
- React Suspense 경계(boundary) 설계
- Next.js의 Streaming 렌더링 동작 원리
- `loading.tsx` 파일로 자동 Suspense 적용
- 어디에 Suspense 경계를 두는 것이 적절한지

---

### 🔲 Step 4. Server Component로 데이터 페칭

> 현재는 브라우저에서 API 호출 → 클라이언트에서 렌더링.
> Server Component에서 fetch하면 HTML에 데이터가 포함되어 전달됩니다.

**목표**
- 클라이언트 JS 번들에서 API 호출 로직 제거
- 초기 렌더링 속도 개선 (TBT, LCP)

**핵심 개념**
```tsx
// Server Component (async 함수 가능)
export default async function MarketplacePage() {
  const products = await fetch(`${API_URL}/marketplace/products`);
  return <ProductGrid products={products} />;
}
```

**학습 포인트**
- Server Component와 Client Component의 경계 설계
- `fetch` 캐싱 옵션 (`cache: 'force-cache'` / `no-store` / `revalidate`)
- TanStack Query는 인터랙션(필터, 검색)에만 사용
- 민감한 정보(API key 등)가 클라이언트에 노출되지 않는 구조

---

### 🔲 Step 5. 이미지 최적화

> `next/image`는 자동으로 WebP 변환, 리사이즈를 해줍니다.
> 하지만 `sizes`, `priority`, `placeholder` 속성을 잘못 쓰면 역효과가 납니다.

**목표**
- LCP(Largest Contentful Paint) 점수 개선
- 불필요한 이미지 로딩 제거

**학습 포인트**
- `priority`: 뷰포트 안의 첫 번째 이미지에만 사용 (LCP 요소)
- `sizes`: 뷰포트 크기별 이미지 크기 힌트 — 잘못 설정하면 과도하게 큰 이미지 로드
- `placeholder="blur"`: 로딩 중 흐린 미리보기 (blurDataURL 필요)
- lazy loading 기본 동작 이해

---

### 🔲 Step 6. 렌더링 최적화 (리렌더 방지)

> 카테고리 필터 클릭 시 변경되지 않은 ProductCard들도 리렌더됩니다.

**목표**
- 불필요한 리렌더 제거
- React DevTools Profiler로 측정

**핵심 개념**
```tsx
// memo: props가 바뀌지 않으면 리렌더 안 함
const ProductCard = memo(({ product }) => { ... });

// useCallback: 함수 참조 고정
const handleClick = useCallback((product) => { ... }, []);

// useMemo: 계산 결과 캐싱
const filteredProducts = useMemo(() =>
  products.filter(...), [products, category]
);
```

**학습 포인트**
- 리렌더가 발생하는 3가지 원인 (state, props, context)
- `memo`가 효과 없는 경우 (객체/함수를 매번 새로 생성)
- `useMemo` / `useCallback`을 남발하면 오히려 느려지는 이유
- React DevTools Profiler 사용법

---

### 🔲 Step 7. 가상화 (Virtualization)

> 상품이 500개면 DOM에 500개의 노드가 생깁니다.
> 화면에 보이는 것만 렌더링하면 메모리와 렌더링 비용이 대폭 감소합니다.

**목표**
- 대용량 상품 목록에서 스크롤 성능 유지
- DOM 노드 수 최소화

**사용 라이브러리**
- `@tanstack/react-virtual`

**학습 포인트**
- 가상화의 원리 (보이는 영역만 마운트)
- 고정 높이 vs 동적 높이 가상화
- 가상화가 필요한 기준 (보통 100개 이상)
- 가상화의 단점 (Ctrl+F 검색 불가, SEO 불리)

---

## 측정 기록표

최적화 전후를 비교해 실제 효과를 확인합니다.

| Step | 항목 | Before | After |
|------|------|--------|-------|
| 1 | First Load JS (marketplace) | 137 kB | - |
| 1 | Lighthouse Performance | 100 | - |
| 2 | First Load JS (marketplace) | 137 kB | 140 kB (ProductFormModal +2 kB, ProductForm은 별도 lazy 청크) |
| 3 | Lighthouse FCP | 0.2s | 0.2s |
| 3 | Lighthouse CLS | 0.024 | 0 (스켈레톤 UI로 레이아웃 시프트 제거) |
| 4 | Lighthouse TBT | - | - |
| 5 | Lighthouse LCP | - | - |
| 6 | 리렌더 횟수 (Profiler) | - | - |
| 7 | DOM 노드 수 (500개 상품) | - | - |

---

## 프로젝트 구조

```
commerce-projects/
├── frontend/                        # Next.js 15
│   ├── src/
│   │   ├── app/                     # App Router 페이지
│   │   │   ├── layout.tsx           # 루트 레이아웃
│   │   │   ├── page.tsx             # 홈
│   │   │   ├── marketplace/page.tsx
│   │   │   ├── subscription/page.tsx
│   │   │   └── social/page.tsx
│   │   ├── components/              # 공통 컴포넌트
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductList.tsx
│   │   │   └── ProductForm.tsx
│   │   ├── features/
│   │   │   └── marketplace/
│   │   │       ├── api/             # API 함수
│   │   │       ├── hooks/           # TanStack Query 훅
│   │   │       ├── schemas/         # Zod 스키마
│   │   │       ├── types/           # 타입 정의
│   │   │       └── utils/           # 포맷팅 유틸
│   │   └── shared/
│   │       ├── api/client.ts        # Axios 인스턴스
│   │       ├── components/          # Button, Card
│   │       ├── hooks/useAuth.ts
│   │       └── types/
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── .env.local
│
└── backend/                         # NestJS
    └── src/
        └── modules/
            ├── marketplace/
            ├── subscription/
            └── social-commerce/
```

---

## Git 커밋 컨벤션

```
feat:     새로운 기능
fix:      버그 수정
perf:     성능 최적화  ← 이 프로젝트의 주요 커밋 타입
refactor: 리팩토링
docs:     문서 수정
chore:    설정, 패키지
```

---

## 스크립트

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드 (번들 크기 확인 가능)
npm run build

# 번들 분석 (Step 1 설치 후)
ANALYZE=true npm run build
```
