# Step 5: 이미지 최적화 설계

## 목표

상품 카드 이미지의 LCP를 추가로 개선하고, 사용자가 체감하는 이미지 로딩 경험을 개선한다. `next/image`의 고급 옵션(`priority`, `placeholder="blur"`, `blurDataURL`)을 학습하고, 외부 이미지에 대해 동적으로 blurDataURL을 생성하는 패턴을 익힌다.

## 현재 상태

- `next/image` 이미 사용 중
- `sizes` 적절히 설정됨: `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw`
- `next.config.ts`의 `remotePatterns`은 와일드카드(`**`) — 보안상 좁힐 여지 있음
- `priority` 미사용 → LCP 이미지가 다른 이미지와 동일한 우선순위로 로드됨
- `placeholder` 미사용 → 이미지 로딩 동안 회색 박스만 보임

## 핵심 변경 사항

### 1. priority — 첫 4개 카드만

데스크톱 한 줄(grid: `xl:grid-cols-4`)에 해당하는 첫 4개 카드에만 `priority`를 적용한다. 이 이미지들은 화면 진입 즉시 보이는 LCP 후보다.

**왜 4개인가:**
- A안(1개): 정석에 가깝지만 효과 폭이 제한적
- C안(8개): priority의 의미가 약해짐 (모든 이미지에 priority면 priority가 없는 것과 같음)
- **B안(4개): 데스크톱 첫 줄 전체 — 진짜로 viewport에 보이는 만큼**

### 2. placeholder="blur" + 동적 blurDataURL

**문제:** unsplash 같은 외부 이미지는 빌드 시점 정적 분석이 불가능해서 Next.js가 blurDataURL을 자동 생성하지 못한다.

**해결:** Server Component(page.tsx)에서 상품 데이터를 fetch한 직후, 각 이미지의 tiny 버전을 unsplash URL 파라미터로 받아 base64로 변환하여 product 객체에 부착한다.

**unsplash URL 파라미터 활용:**
```
원본: https://images.unsplash.com/photo-xxxxx
tiny: https://images.unsplash.com/photo-xxxxx?w=10&blur=50&q=10
```

`w=10`으로 가로 10px의 매우 작은 이미지를 받고, `blur=50`으로 흐림 처리, `q=10`으로 품질을 낮춰 수 KB 수준으로 가져온다. 이를 buffer → base64 → `data:image/jpeg;base64,...` 형태로 변환한다.

**서버 사이드 처리의 장점:**
- 클라이언트 번들 크기 영향 없음
- 페이지가 SSR될 때 한 번만 실행
- Step 4의 `cache: 'no-store'`와 함께 동작하므로 매 요청마다 새로 생성됨
- 향후 ISR로 전환 시 자연스럽게 캐싱됨

### 3. remotePatterns 좁히기

`**` → unsplash 도메인만 허용 (`images.unsplash.com`).

## 데이터 흐름

```
[서버: page.tsx]
  1. fetch(/marketplace/products) → Product[]
  2. enrichProductsWithBlur(products):
       각 product.images[0]에 대해 병렬로
       fetch(`${url}?w=10&blur=50&q=10`) → arrayBuffer → base64
       product.blurDataURL = `data:image/jpeg;base64,${base64}`
  3. <ProductList initialProducts={enrichedProducts} />

[클라이언트: ProductCard]
  4. <Image
       priority={index < 4}
       placeholder={product.blurDataURL ? "blur" : "empty"}
       blurDataURL={product.blurDataURL}
       ...
     />
```

## 타입 변경

`Product` 타입에는 `blurDataURL`을 추가하지 않는다. 이건 백엔드 데이터가 아니라 서버 사이드에서 가공한 부가 정보이므로, 별도 타입을 만든다:

```ts
type ProductWithBlur = Product & {
  blurDataURL?: string;
};
```

`ProductList`와 `ProductCard`가 이 확장 타입을 받도록 수정한다.

## 측정 항목

| 항목 | Before | 측정 방법 |
|---|---|---|
| LCP | 0.5s (Step 4) | Lighthouse |
| 이미지 포맷 | ? (확인 필요) | Network 탭 → 이미지 요청의 Type 컬럼 |
| 첫 화면 이미지 총 전송 크기 | ? | Network 탭 → 이미지 요청 size 합산 |
| LCP 이미지 시작 시점 | ? | Network 탭 → 첫 이미지의 Waterfall |

## 트레이드오프

**장점:**
- LCP 개선 (priority + 이미지 preload)
- 체감 로딩 속도 개선 (blur placeholder)
- 이미지 로딩 중 빈 회색 박스 → 흐린 이미지로 시각적 연속성

**단점:**
- 서버 사이드 비용 추가: 페이지 요청마다 N개 이미지의 tiny 버전을 추가 fetch
- 외부 이미지 의존성: unsplash가 다운되거나 URL 파라미터를 거부하면 blurDataURL 생성 실패
- 첫 페이지 응답 시간(TTFB)이 약간 늘어날 수 있음

**완화책:**
- `enrichProductsWithBlur`에서 `Promise.allSettled` 사용 → 일부 실패해도 전체는 성공
- 실패한 이미지는 `blurDataURL`이 `undefined` → ProductCard에서 자동으로 `placeholder="empty"`로 폴백

## 범위 외 (다음 단계로)

- 로컬 이미지 사용 시 `import` 기반 자동 blur (Next.js 기본 기능)
- `plaiceholder` 같은 라이브러리 도입
- ISR 적용 (`next: { revalidate: 60 }`)
- LQIP 외 다른 placeholder 전략 (color, dominant color)
