# Next.js 15 성능 최적화 — next/image 고급 옵션과 외부 이미지 blur placeholder

> `priority`, `placeholder="blur"`, `blurDataURL`을 적용하면서 "최적화 시도가 항상 성공하지는 않는다"는 것을 직접 경험한 기록입니다.

---

## 들어가며

이전 글에서 Server Component로 데이터 페칭을 서버로 올려 LCP를 0.6s → 0.5s로 개선했습니다.

이번 글에서는 **이미지 자체**를 최적화합니다. `next/image`는 이미 Step 0에서 마이그레이션할 때 적용했지만, 고급 옵션들은 아직 사용하지 않고 있었어요.

```
현재 상태:
- next/image 사용 중 ✅
- sizes 설정됨 ✅
- priority 미사용 ❌ → LCP 이미지가 다른 이미지와 동일한 우선순위
- placeholder 미사용 ❌ → 로딩 중 회색 박스만 보임
```

---

## 핵심 개념

### 1. `priority`

```tsx
<Image priority={true} src="..." alt="..." />
```

`priority`가 있으면 Next.js는 해당 이미지에 `<link rel="preload">`를 HTML `<head>`에 추가합니다. 브라우저가 HTML을 파싱하자마자 이미지를 미리 다운로드하기 시작해요.

```html
<!-- priority가 있을 때 HTML <head>에 추가됨 -->
<link rel="preload" as="image" href="/marketplace-image.webp" />
```

**언제 쓰는가:** 페이지 진입 시 viewport에 바로 보이는 이미지(LCP 후보)에만 사용합니다. 모든 이미지에 달면 우선순위가 없어지므로 역효과예요.

### 2. `placeholder="blur"` + `blurDataURL`

```tsx
<Image
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  src="..."
  alt="..."
/>
```

이미지가 로드되는 동안 흐린 미리보기를 보여줍니다. 회색 박스 대신 실제 이미지 분위기의 placeholder가 보여서 체감 로딩 속도가 개선되는 효과가 있어요.

**로컬 이미지:** Next.js가 빌드 시 자동으로 생성합니다. `blurDataURL` 직접 지정 불필요.

**외부 이미지:** 빌드 시 접근할 수 없으므로 자동 생성이 안 됩니다. `blurDataURL`을 직접 제공해야 해요.

### 3. `blurDataURL`이란?

`data:image/jpeg;base64,...` 형태의 아주 작은 이미지를 base64로 인코딩한 문자열입니다. 수 KB 이하의 작은 이미지를 HTML에 직접 포함시켜서 추가 네트워크 요청 없이 즉시 표시해요.

---

## 구현 계획

### 결정사항

**`priority` 범위:** 데스크톱 기준 첫 줄 4개 카드 (`index < 4`)

- 1개만: 효과 제한적
- 8개: priority 의미 약해짐
- **4개: 데스크톱 viewport에 실제로 보이는 만큼 (선택)**

**`blurDataURL` 생성 방식:**

처음에는 unsplash URL 파라미터(`?w=10&blur=50`)로 서버에서 tiny 이미지를 fetch해서 base64로 변환하는 **동적 방식**을 시도했습니다.

결과: **LCP가 0.5s → 1.0s로 악화됐어요.**

---

## 실패 사례: 동적 blurDataURL

### 구현 코드

```ts
// 처음 시도한 방식 (동적 fetch)
export async function generateBlurDataURL(
  imageUrl: string,
): Promise<string | undefined> {
  try {
    const tinyUrl = `${imageUrl}?w=10&blur=50&q=10`;
    const res = await fetch(tinyUrl);
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return undefined;
  }
}
```

```ts
// page.tsx에서 모든 상품 이미지에 대해 tiny fetch
async function enrichProductsWithBlur(
  products: Product[],
): Promise<ProductWithBlur[]> {
  return Promise.all(
    products.map(async (product) => {
      const blurDataURL = await generateBlurDataURL(product.images?.[0]);
      return { ...product, blurDataURL };
    }),
  );
}
```

### 측정 결과

| 항목    | 이전     | 동적 blur 적용 후 |
| ------- | -------- | ----------------- |
| **LCP** | **0.5s** | **1.0s ❌**       |
| FCP     | 0.2s     | 0.5s              |
| TTFB    | ~9ms     | **2.03s ❌**      |

### 원인 분석

```
[서버에서 일어나는 일]
  1. getProducts() → 백엔드 fetch      15ms
  2. enrichProductsWithBlur()          ← 여기가 문제
     → unsplash tiny fetch × 21개     ~1.9초 (외부 API 응답 대기)
  3. HTML 렌더링                        ~5ms
  ──────────────────────────────────────────
  총 TTFB:                             ~2초
```

**21개 이미지의 tiny 버전을 병렬로 fetch해도, 가장 느린 응답 하나가 전체를 잡아요.** unsplash는 항상 빠른 게 아니라서 요청마다 TTFB가 달라졌습니다.

### 교훈

> **"Critical path에 외부 API 의존성을 넣으면 안 된다"**

LCP를 개선하려고 한 시도가 오히려 TTFB를 2초나 늘려서 LCP를 악화시켰어요. 사용자가 첫 번째 바이트를 받기까지 기다리는 시간이 늘어나니, 그 뒤의 모든 최적화가 의미 없어집니다.

---

## 해결: 정적 blurDataURL

동적 fetch 대신 **빌드 시 미리 만들어둔 고정 base64 값**을 사용합니다.

```ts
// features/marketplace/utils/blurDataURL.ts

/**
 * 모든 상품 카드에 공통으로 사용하는 정적 blur placeholder.
 * 외부 fetch 없이 즉시 사용 가능하므로 TTFB에 영향 없음.
 * 10x10 회색 단색 jpeg을 base64로 인코딩한 값.
 */
export const STATIC_BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAKAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AB//Z";
```

### page.tsx 수정

```tsx
import { STATIC_BLUR_DATA_URL } from "@/features/marketplace/utils/blurDataURL";

type ProductWithBlur = Product & { blurDataURL?: string };

// async 제거, Promise.all 제거, 외부 fetch 0회
function enrichProductsWithBlur(products: Product[]): ProductWithBlur[] {
  return products.map((product) => ({
    ...product,
    blurDataURL: product.images?.[0] ? STATIC_BLUR_DATA_URL : undefined,
  }));
}

export default async function MarketplacePage() {
  const products = await getProducts();
  const enrichedProducts = enrichProductsWithBlur(products); // await 없음
  // ...
}
```

> 함수형 원칙: `map`으로 새 배열 생성 (카피-온-라이트), 원본 products 불변 유지.

### ProductList.tsx — index 전달

```tsx
type ProductWithBlur = Product & { blurDataURL?: string };

interface ProductListProps {
  initialProducts?: ProductWithBlur[];
}

// map에서 index 추가
{
  products.map((product, index) => (
    <ProductCard key={product._id} index={index} product={product} />
  ));
}
```

### ProductCard.tsx — priority + placeholder 적용

```tsx
type ProductWithBlur = Product & { blurDataURL?: string };

interface ProductCardProps {
  product: ProductWithBlur;
  index?: number;
}

export function ProductCard({ product, index = 0, onClick }: ProductCardProps) {
  return (
    // ...
    <Image
      src={product.images[0]}
      alt={product.title}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      priority={index < 4} // ← 첫 4개만
      placeholder={product.blurDataURL ? "blur" : "empty"} // ← blurDataURL 있을 때만
      blurDataURL={product.blurDataURL}
    />
  );
}
```

### next.config.ts — remotePatterns 보안 강화

```ts
// Before: 모든 https 도메인 허용 (보안 취약)
images: {
  remotePatterns: [{ protocol: 'https', hostname: '**' }],
},

// After: unsplash만 허용
images: {
  remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
},
```

---

## 동작 확인

### blur placeholder 체험

빠른 네트워크에서는 blur가 거의 안 보여요. DevTools → Network → **Disable cache 체크** + **Slow 4G throttling** 후 새로고침하면 회색 박스 대신 **흐린 회색 이미지 → 선명한 이미지**로 부드럽게 전환되는 걸 확인할 수 있어요.

단, `priority`가 적용된 첫 4개 카드는 `<link rel="preload">`로 매우 일찍 다운로드가 시작되어 blur placeholder가 나타날 틈이 없을 수 있어요. **5번째 카드 이후**에서 blur 효과가 더 잘 보입니다.

### priority 효과 확인

DevTools → Network → Img 필터 → Waterfall 컬럼 확인.

첫 4개 이미지가 다른 이미지보다 Waterfall에서 **더 빨리 시작**되면 priority가 동작하는 거예요.

### 이미지 포맷 확인

Network → Img 필터 → Type 컬럼이 `webp` 또는 `avif`라면 next/image가 자동으로 포맷 변환을 하고 있는 거예요. 브라우저가 지원하는 최신 포맷으로 자동 변환되므로 별도 설정 없이도 용량이 줄어들어요.

---

## 측정 결과

### TTFB 확인 (No throttling 상태)

| 시점          | TTFB          |
| ------------- | ------------- |
| 동적 blur     | 2.03s ❌      |
| **정적 blur** | **9.38ms ✅** |

서버 콘솔 로그:

```
[PERF] getProducts: 15ms, enrich: 0ms
```

### Lighthouse (3G 시뮬레이션)

| 항목        | Step 4 After | Step 5 (동적 blur) | Step 5 (정적 blur) |
| ----------- | ------------ | ------------------ | ------------------ |
| FCP         | 0.2s         | 0.5s ❌            | **0.2s ✅**        |
| **LCP**     | **0.5s**     | 1.0s ❌            | **0.5s ✅**        |
| TBT         | 0ms          | 0ms                | 0ms                |
| CLS         | 0            | 0                  | 0                  |
| Speed Index | 0.2s         | 0.5s ❌            | **0.2s ✅**        |

**정적 blur는 LCP 손해 없이 placeholder UX를 얻었습니다.**

---

## next/image가 자동으로 해주는 것들

이번 Step에서 수동으로 적용한 옵션들 외에, `next/image`가 기본으로 해주는 최적화들도 있어요.

| 기능             | 설명                                                 |
| ---------------- | ---------------------------------------------------- |
| **포맷 변환**    | 브라우저가 지원하면 자동으로 WebP/AVIF로 변환        |
| **리사이즈**     | `sizes` 속성을 기반으로 실제 표시 크기에 맞게 축소   |
| **lazy loading** | `priority` 없는 이미지는 viewport에 들어올 때만 로드 |
| **캐싱**         | `/marketplace-image.webp?w=800&q=75` 형태로 캐시됨   |

`<img>` 태그를 그냥 쓰면 이 모든 걸 직접 구현해야 해요.

---

## 핵심 정리

| 개념                 | 설명                                                                             |
| -------------------- | -------------------------------------------------------------------------------- |
| `priority`           | LCP 후보 이미지에 `<link rel="preload">` 추가. viewport에 보이는 이미지에만 사용 |
| `placeholder="blur"` | 로딩 중 흐린 미리보기 표시. `blurDataURL` 필요                                   |
| `blurDataURL`        | base64로 인코딩한 tiny 이미지. 외부 이미지는 직접 제공해야 함                    |
| `remotePatterns`     | 허용할 외부 이미지 도메인 화이트리스트. 구체적으로 지정할수록 보안 강화          |

```
이번 Step의 핵심 교훈:
"최적화 시도가 항상 성공하지는 않는다"
"외부 API를 Critical Path에 넣으면 TTFB가 폭증할 수 있다"
"측정 → 적용 → 재측정 → 비교"가 왜 중요한지 직접 체험
```

---

## 다음 단계

```
Step 6. 렌더링 최적화 (리렌더 방지)
  → 카테고리 필터 클릭 시 변경되지 않은 카드도 리렌더되는 문제
  → React.memo, useCallback, useMemo 적용
  → React DevTools Profiler로 측정
```

---

> 측정 기록표

| Step | 항목                                 | Before | After         |
| ---- | ------------------------------------ | ------ | ------------- |
| 1    | First Load JS (marketplace)          | —      | 137 kB        |
| 1    | Lighthouse Performance               | —      | 100           |
| 2    | First Load JS (marketplace)          | 137 kB | 140 kB        |
| 2    | ProductForm 초기 로드 여부           | —      | 미포함 (lazy) |
| 3    | Lighthouse CLS                       | 0.024  | 0             |
| 3    | Lighthouse FCP                       | 0.2s   | 0.2s          |
| 4    | Lighthouse LCP                       | 0.6s   | 0.5s          |
| 4    | marketplace/products 클라이언트 호출 | 1회    | 0회           |
| 5    | TTFB (동적 blur 시도)                | 9ms    | 2.03s ⚠️      |
| 5    | Lighthouse LCP (동적 blur)           | 0.5s   | 1.0s ⚠️       |
| 5    | TTFB (정적 blur)                     | 9ms    | 9ms ✅        |
| 5    | Lighthouse LCP (정적 blur)           | 0.5s   | 0.5s ✅       |
