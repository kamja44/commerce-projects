# Next.js 15 성능 최적화 — Bundle Analyzer로 번들 구성 파악하기

> "최적화할 게 없다"는 것도 측정해야 알 수 있다. @next/bundle-analyzer로 번들을 분석하고, 잘못된 추론을 바로잡은 기록입니다.

---

## 들어가며

이전 글에서 React.memo와 useCallback으로 불필요한 리렌더를 제거했습니다.

이번 글에서는 **번들 크기** 를 분석합니다. 코드가 브라우저에 얼마나 많이 전달되는지, 어떤 라이브러리가 얼마나 차지하는지 시각적으로 파악하는 게 목표입니다.

```
현재 상태:
- /marketplace First Load JS: 140 kB
- 어떤 라이브러리가 얼마를 차지하는지 모름 ❌
- 줄일 수 있는 게 있는지 모름 ❌
```

---

## 핵심 개념

### First Load JS란?

Next.js 빌드 후 터미널에 출력되는 수치입니다.

```
Route (app)                   Size     First Load JS
├ ƒ /marketplace            33.1 kB         140 kB
├ ○ /social                  141 B          101 kB
└ ○ /subscription            141 B          101 kB

+ First Load JS shared by all  101 kB
  ├ chunks/4bd1b696...js      53.2 kB
  ├ chunks/684-8acb6...js     45.9 kB
  └ other shared chunks        2.03 kB
```

- **Size:** 해당 페이지 전용 JS 크기
- **First Load JS:** Size + 모든 페이지가 공통으로 로드하는 shared 청크 합계
- **shared by all:** 어떤 페이지를 열든 무조건 로드되는 공통 청크

### Chunk(청크)란?

Next.js는 번들을 여러 파일로 쪼갭니다. 이 파일 하나하나가 청크입니다.

```
framework-4d7f...js   → React, React-DOM 프레임워크
684-8acb6...js        → Next.js 내부 라우터, app-router 등
4bd1b696...js         → react-dom 클라이언트
marketplace/page...js → /marketplace 페이지 전용
```

이름이 해시값이라 목록만으로는 내용물을 알 수 없습니다. **Treemap 시각화**가 필요한 이유예요.

### Treemap이란?

번들 내부 구성을 **면적**으로 표현한 시각화입니다. 면적이 클수록 그 라이브러리가 번들에서 차지하는 비중이 큰 것입니다.

```
┌──────────────────────────────────────────────────────────┐
│                  react-dom (53 kB)                       │
│                                                          │
├──────────────────────────┬───────────────────────────────┤
│   Next.js router (45 kB) │   axios (작게)  │  기타  │   │
├──────────────────────────┴───────────────────────────────┤
│  TanStack Query  │  zod  │  react-hook-form  │  ...      │
└──────────────────────────────────────────────────────────┘
```

---

## 설정

이미 `@next/bundle-analyzer`가 설치되어 있고, `next.config.ts`와 `package.json`에도 설정이 되어 있었습니다.

```ts
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
```

```json
// package.json
"scripts": {
  "analyze": "cross-env ANALYZE=true next build"
}
```

실행:

```bash
npm run analyze
```

빌드가 완료되면 브라우저에 Treemap이 자동으로 열립니다.

---

## 분석 결과

### 번들 구성 (Before)

```
Route (app)                   Size     First Load JS
├ ƒ /marketplace            33.1 kB         140 kB
├ ○ /social                  141 B          101 kB
└ ○ /subscription            141 B          101 kB

+ First Load JS shared by all  101 kB
  ├ chunks/4bd1b696...js      53.2 kB   → react-dom
  ├ chunks/684-8acb6...js     45.9 kB   → Next.js 내부 (router 등)
  └ other shared chunks        2.03 kB
```

### shared by all 청크 내부 확인

`684-8acb6...js` 청크를 클릭해서 드릴다운하면 내부가 보입니다.

```
router-reducer.js
app-router.js
layout-router.js
links.js
react.production.js
react-server-dom-webpack-client...
```

**Next.js 프레임워크 내부 코드**였습니다.

---

## 잘못된 추론과 교훈

### 처음에 한 추론 (틀림)

Treemap에서 `axios`가 보이고, `shared by all`에 45.9 kB 청크가 있어서 **"axios가 모든 페이지에 로드되고 있다"** 고 추론했습니다.

하지만 실제로 확인해보니:
- `shared by all` 45.9 kB 청크 = **Next.js 내부 라우터**
- axios는 marketplace 전용 청크에만 포함 = **다른 페이지에 영향 없음**

### 교훈

> **"청크 이름(해시값)으로는 내용물을 알 수 없다"**

목록의 수치만 보고 판단하지 말고, **Treemap에서 직접 해당 청크를 클릭해서 드릴다운**해야 정확히 알 수 있습니다.

---

## 최적화 여지 파악

| 청크 | 크기 | 제거 가능 여부 |
|---|---|---|
| react-dom | 53.2 kB | ❌ React 필수 |
| Next.js router | 45.9 kB | ❌ Next.js 필수 |
| marketplace 전용 | 33.1 kB | 일부 가능 |

**marketplace 전용 33.1 kB 안에 있는 것들:**
- TanStack Query (상태 관리 → 제거하면 기능 변경)
- zod (유효성 검증 → Step 2에서 dynamic import됨)
- react-hook-form (폼 → Step 2에서 dynamic import됨)

zod와 react-hook-form은 이미 Step 2에서 ProductForm과 함께 dynamic import로 분리되어 있습니다. 추가로 제거할 수 있는 것이 없었습니다.

**"최적화할 게 없다"는 것도 측정해야 알 수 있습니다.**

---

## Treemap 읽는 법

```
1. 전체 보기: 축소해서 청크별 면적 비교
2. 드릴다운: 청크 클릭 → 내부 라이브러리 확인
3. 수치 확인: 좌측 상단 Stat / Parsed / Gzipped size 비교

Stat size:   원본 크기
Parsed size: 브라우저가 파싱하는 실제 크기
Gzipped:     네트워크로 전송되는 압축 크기 (가장 중요)
```

**실제로 사용자가 받는 크기는 Gzipped size**입니다. 터미널에 표시되는 수치도 gzip 기준이에요.

---

## 핵심 정리

| 개념 | 설명 |
|---|---|
| `First Load JS` | 페이지 전용 JS + shared 청크의 합계 |
| `shared by all` | 모든 페이지가 공통으로 로드하는 청크 |
| `Treemap` | 번들 구성을 면적으로 시각화. 청크 클릭으로 드릴다운 가능 |
| `Gzipped size` | 실제 네트워크 전송 크기. 가장 중요한 수치 |

```
이번 Step의 핵심 교훈:
"청크 이름(해시값)으로 내용물을 추측하지 말고 직접 드릴다운하라"
"최적화할 게 없다는 것도 측정해야 알 수 있다"
"측정 → 분석 → 판단"
```

---

## 다음 단계

```
Step 8. 캐싱 전략
  → fetch cache 옵션 (revalidate)
  → TanStack Query staleTime 조정
  → 불필요한 네트워크 요청 제거
```

---

> 측정 기록표

| Step | 항목 | Before | After |
|------|------|--------|-------|
| 1 | First Load JS (marketplace) | — | 137 kB |
| 1 | Lighthouse Performance | — | 100 |
| 2 | First Load JS (marketplace) | 137 kB | 140 kB |
| 2 | ProductForm 초기 로드 여부 | — | 미포함 (lazy) |
| 3 | Lighthouse CLS | 0.024 | 0 |
| 3 | Lighthouse FCP | 0.2s | 0.2s |
| 4 | Lighthouse LCP | 0.6s | 0.5s |
| 4 | marketplace/products 클라이언트 호출 | 1회 | 0회 |
| 5 | TTFB (동적 blur 시도) | 9ms | 2.03s ⚠️ |
| 5 | Lighthouse LCP (동적 blur) | 0.5s | 1.0s ⚠️ |
| 5 | TTFB (정적 blur) | 9ms | 9ms ✅ |
| 5 | Lighthouse LCP (정적 blur) | 0.5s | 0.5s ✅ |
| 6 | ProductCard 재렌더 (카테고리 클릭 시) | 20개 | 0개 ✅ |
| 6 | CategoryButton 재렌더 (카테고리 클릭 시) | 6개 | 2개 ✅ |
| 7 | marketplace First Load JS | 140 kB | 140 kB (변화 없음) |
| 7 | shared by all | 101 kB | 101 kB (프레임워크, 불변) |
