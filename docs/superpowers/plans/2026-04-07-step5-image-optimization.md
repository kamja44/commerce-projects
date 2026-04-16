# Step 5: 이미지 최적화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** `next/image`의 `priority`와 `placeholder="blur"`를 적용하여 LCP와 체감 로딩 속도를 개선한다. 외부 이미지(unsplash)에 대해 서버 사이드에서 동적으로 blurDataURL을 생성한다.

**Architecture:** page.tsx에서 상품을 fetch한 후, 각 이미지의 tiny 버전을 unsplash URL 파라미터로 받아 base64로 변환한다. 이를 product 객체에 부착하여 ProductList → ProductCard로 전달한다. ProductCard는 첫 4개 카드(첫 줄)에만 priority를 적용한다.

**Tech Stack:** Next.js 15 Image, fetch API, Buffer.from('base64')

---

## 파일 구조

| 작업 | 파일 경로 | 역할 |
|------|----------|------|
| Create | `frontend/src/features/marketplace/utils/blurDataURL.ts` | unsplash URL → base64 blurDataURL 변환 함수 |
| Modify | `frontend/src/app/marketplace/page.tsx` | products fetch 후 blurDataURL 부착 |
| Modify | `frontend/src/components/ProductList.tsx` | 확장 타입 받기 + index를 ProductCard에 전달 |
| Modify | `frontend/src/components/ProductCard.tsx` | priority + placeholder="blur" 적용 |
| Modify | `frontend/next.config.ts` | remotePatterns를 unsplash로 좁히기 |

---

## Task 1: blurDataURL 생성 유틸 함수

**Files:**
- Create: `frontend/src/features/marketplace/utils/blurDataURL.ts`

- [ ] **Step 1: 유틸 함수 작성**

```ts
/**
 * unsplash 이미지 URL을 받아 tiny 버전을 fetch하고 base64 data URI로 변환한다.
 * 서버 사이드에서만 호출되어야 한다 (page.tsx의 Server Component).
 *
 * @param imageUrl 원본 이미지 URL
 * @returns data:image/jpeg;base64,... 형태의 문자열, 실패 시 undefined
 */
export async function generateBlurDataURL(imageUrl: string): Promise<string | undefined> {
  try {
    // unsplash URL 파라미터로 10px 폭의 흐린 이미지 요청
    const tinyUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}w=10&blur=50&q=10`;

    const res = await fetch(tinyUrl);
    if (!res.ok) {
      return undefined;
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return `data:${contentType};base64,${base64}`;
  } catch {
    return undefined;
  }
}
```

> 함수형 코딩 원칙: 입력은 imageUrl 하나, 출력은 string|undefined만. 외부 상태 변경 없음. 실패 시에도 throw하지 않고 undefined 반환 → 호출하는 쪽이 자연스럽게 폴백 처리할 수 있음.

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/features/marketplace/utils/blurDataURL.ts
git commit -m "feat: add generateBlurDataURL utility for external images"
```

---

## Task 2: page.tsx에서 blurDataURL 부착

**Files:**
- Modify: `frontend/src/app/marketplace/page.tsx`

- [ ] **Step 1: page.tsx에 enrichProductsWithBlur 추가**

기존 `getProducts` 함수 아래에 추가:

```tsx
import { generateBlurDataURL } from '@/features/marketplace/utils/blurDataURL';
import { Product } from '@/features/marketplace/types/product';

type ProductWithBlur = Product & { blurDataURL?: string };

async function enrichProductsWithBlur(products: Product[]): Promise<ProductWithBlur[]> {
  return Promise.all(
    products.map(async (product) => {
      const firstImage = product.images?.[0];
      if (!firstImage) {
        return product;
      }
      const blurDataURL = await generateBlurDataURL(firstImage);
      return { ...product, blurDataURL };
    }),
  );
}
```

> 함수형 원칙: spread로 새 객체 생성 (카피-온-라이트). 원본 product를 변경하지 않음.

- [ ] **Step 2: MarketplacePage에서 호출**

```tsx
export default async function MarketplacePage() {
  const products = await getProducts();
  const enrichedProducts = await enrichProductsWithBlur(products);

  return (
    <div className="space-y-6">
      {/* ... */}
      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList initialProducts={enrichedProducts} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 3: 동작 확인**

1. `npm run dev`
2. `/marketplace` 접속
3. 페이지 소스 보기(Ctrl+U) → `data:image/jpeg;base64,` 검색
4. 여러 개가 발견되면 성공 (각 product의 blurDataURL이 RSC payload에 포함됨)

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/app/marketplace/page.tsx
git commit -m "feat: enrich products with blurDataURL on server"
```

---

## Task 3: ProductList에 ProductWithBlur 타입 전달

**Files:**
- Modify: `frontend/src/components/ProductList.tsx`

- [ ] **Step 1: 타입 import 및 확장**

`ProductList.tsx` 상단에 추가:

```tsx
type ProductWithBlur = Product & { blurDataURL?: string };
```

`ProductListProps` 변경:

```tsx
// 기존
interface ProductListProps {
  initialProducts?: Product[];
  onProductClick?: (product: Product) => void;
}

// 새 코드
interface ProductListProps {
  initialProducts?: ProductWithBlur[];
  onProductClick?: (product: Product) => void;
}
```

- [ ] **Step 2: ProductCard에 index 전달**

기존 ProductCard 렌더링 부분을 찾아서 `index`를 넘기도록 수정:

```tsx
// 기존 (예시)
{products.map((product) => (
  <ProductCard key={product._id} product={product} onClick={onProductClick} />
))}

// 새 코드
{products.map((product, index) => (
  <ProductCard
    key={product._id}
    product={product}
    index={index}
    onClick={onProductClick}
  />
))}
```

> `useProducts({ initialData: initialProducts })`는 그대로 둔다. TanStack Query는 `initialData`의 타입을 그대로 유지하므로 `data`도 `ProductWithBlur[]` 타입이 된다.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/components/ProductList.tsx
git commit -m "feat: pass blurDataURL and index to ProductCard"
```

---

## Task 4: ProductCard에 priority + placeholder 적용

**Files:**
- Modify: `frontend/src/components/ProductCard.tsx`

- [ ] **Step 1: Props 확장**

```tsx
type ProductWithBlur = Product & { blurDataURL?: string };

interface ProductCardProps {
  product: ProductWithBlur;
  index?: number;
  onClick?: (product: Product) => void;
}

export function ProductCard({ product, index = 0, onClick }: ProductCardProps) {
```

- [ ] **Step 2: Image 컴포넌트 수정**

기존:
```tsx
<Image
  src={product.images[0]}
  alt={product.title}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
/>
```

새 코드:
```tsx
<Image
  src={product.images[0]}
  alt={product.title}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
  priority={index < 4}
  placeholder={product.blurDataURL ? 'blur' : 'empty'}
  blurDataURL={product.blurDataURL}
/>
```

> 핵심 포인트:
> - `priority={index < 4}` → 첫 4개 카드에만 preload 힌트
> - `placeholder`는 `blurDataURL`이 있을 때만 `'blur'`, 없으면 `'empty'` (자동 폴백)
> - `blurDataURL`이 `undefined`여도 안전 (Next.js가 무시함)

- [ ] **Step 3: 동작 확인**

1. `/marketplace` 접속
2. **빠른 네트워크에서는 blur가 거의 안 보일 수 있음** → DevTools Network 탭에서 Slow 4G로 throttle
3. 카드를 천천히 스크롤하면서 회색 박스 대신 흐린 이미지가 잠깐 보이고 → 선명한 이미지로 교체되는지 확인
4. Network 탭에서 첫 4개 이미지가 다른 이미지보다 먼저 요청되는지 확인 (priority 효과)

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/ProductCard.tsx
git commit -m "feat: add priority and blur placeholder to ProductCard"
```

---

## Task 5: remotePatterns 좁히기

**Files:**
- Modify: `frontend/next.config.ts`

- [ ] **Step 1: unsplash 도메인만 허용**

기존:
```ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**',
    },
  ],
},
```

새 코드:
```ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
  ],
},
```

- [ ] **Step 2: 동작 확인**

1. `npm run dev` 재시작 (next.config.ts 변경은 재시작 필요)
2. `/marketplace` 접속
3. 이미지가 정상적으로 표시되는지 확인
4. 다른 도메인을 사용하면 next/image가 거부함 (보안 강화)

- [ ] **Step 3: 커밋**

```bash
git add frontend/next.config.ts
git commit -m "chore: restrict image remotePatterns to unsplash only"
```

---

## Task 6: 측정 및 README 기록

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 프로덕션 빌드**

```bash
cd frontend && npm run build && npm start
```

- [ ] **Step 2: Lighthouse 측정 (3G)**

1. Chrome DevTools → Lighthouse → Performance
2. `/marketplace` 페이지에서 측정
3. LCP 값 기록

- [ ] **Step 3: Network 탭 측정**

1. DevTools → Network 탭 → Img 필터
2. 페이지 새로고침
3. 다음 항목 기록:
   - **이미지 포맷**: Type 컬럼이 `webp` 또는 `avif`인지 (`jpeg`이면 next/image 최적화 미적용)
   - **첫 4개 이미지의 시작 시점**: Waterfall에서 priority 이미지가 다른 이미지보다 먼저 시작되는지
   - **첫 화면 이미지 총 전송 크기**: 모든 이미지 요청의 Size 합산

- [ ] **Step 4: README 측정 기록표 업데이트**

```markdown
| 5 | Lighthouse LCP | 0.5s | {After 값} |
| 5 | 이미지 포맷 | (확인 전) | webp/avif |
| 5 | 첫 화면 이미지 총 크기 | {Before} | {After} |
```

- [ ] **Step 5: 커밋**

```bash
git add README.md
git commit -m "docs: record Step 5 image optimization measurements"
```

---

## Task 7: 벨로그 글 작성

**Files:**
- Create: `docs/velog/step5-image-optimization.md`

Step 3, 4와 동일한 패턴으로 작성:
1. 들어가며 (현재 상태와 목표)
2. 핵심 개념 (priority, placeholder="blur", blurDataURL, 외부 이미지 처리의 어려움)
3. 구현 (5개 Task 코드)
4. 동작 확인 (Network 탭, 페이지 소스)
5. 측정 결과
6. 다음 단계
