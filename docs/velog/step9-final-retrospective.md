# Next.js 15 성능 최적화 — 마무리 & 전체 회고

> 8단계에 걸친 성능 최적화 시리즈를 마무리합니다. 수치로 보는 변화와, 측정하면서 배운 것들을 정리합니다.

---

## 들어가며

Step 1부터 시작해서 Step 8까지 `/marketplace` 페이지를 중심으로 성능 최적화를 진행했습니다.

이번 글은 전체 과정을 돌아보는 회고입니다.

---

## 최종 Lighthouse 결과

```
측정 환경: Desktop, Navigation
(Lighthouse 경고에 따라 시크릿 창에서 측정)
```

| 항목 | 최종 결과 |
|---|---|
| **Performance** | **100** ✅ |
| FCP | 0.2s ✅ |
| LCP | 0.4s ✅ |
| TBT | 0ms ✅ |
| CLS | 0 ✅ |
| Speed Index | 0.2s ✅ |

---

## 전체 변화 기록

### Lighthouse 지표 변화

| 항목 | Step 1 (시작) | 최종 |
|---|---|---|
| Performance | 100 | 100 |
| FCP | 0.2s | 0.2s |
| LCP | 0.6s | **0.4s** |
| CLS | 0.024 | **0** |
| TBT | 0ms | 0ms |

LCP가 0.6s → 0.4s로 개선됐습니다. Step 4 Server Component + Step 8 revalidate 캐시가 누적되어 나타난 결과입니다.

### 전체 측정 기록표

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
| 8 | 카테고리 재방문 시 네트워크 요청 | gcTime 내 캐시 동작 중 | staleTime으로 refetch 방지 |
| **9** | **LCP (최종)** | **0.6s** | **0.4s** ✅ |
| **9** | **Lighthouse Performance (최종)** | **100** | **100** |

---

## 각 Step 회고

### Step 1 — Code Splitting 기본 설정
`next build` 출력을 처음 제대로 읽어본 단계였습니다. First Load JS 수치가 무엇인지, shared 청크가 무엇인지 파악했어요. 이후 모든 측정의 기준선이 됐습니다.

### Step 2 — Dynamic Import
`ProductForm`을 `dynamic()`으로 lazy load했습니다. First Load JS가 137 kB → 140 kB로 오히려 늘었는데, ProductForm을 감싸는 Modal 컴포넌트 때문이었어요. "최적화가 항상 수치 개선을 의미하진 않는다"는 걸 처음 경험했습니다.

### Step 3 — Skeleton / CLS 제거
CLS 0.024 → 0. 이미지 없이 텍스트만 먼저 그려지다가 이미지가 들어오면서 레이아웃이 밀리는 문제였습니다. Skeleton 컴포넌트와 Suspense로 해결했어요.

### Step 4 — Server Component 데이터 페칭
클라이언트에서 하던 API 호출을 서버로 올렸습니다. LCP 0.6s → 0.5s. 클라이언트 요청 횟수도 1회 → 0회. Server Component의 핵심을 직접 체험한 단계입니다.

### Step 5 — next/image 고급 옵션
**가장 많이 배운 단계**입니다. `blur placeholder`를 동적으로 생성하려다 TTFB가 9ms → 2.03s로 폭증했어요. Critical Path에 외부 API를 넣으면 안 된다는 교훈을 직접 경험했습니다. 정적 base64로 전환해서 해결했어요.

### Step 6 — React.memo + useCallback
React DevTools Profiler를 처음 사용했습니다. 카테고리 클릭 시 ProductCard 20개가 전부 재렌더되는 걸 시각적으로 확인하고, `memo` + `useCallback`으로 0개로 만들었어요. 단, memo와 useCallback은 반드시 함께 써야 효과가 있다는 것도 배웠습니다.

### Step 7 — Bundle Analyzer
Treemap을 보고 "axios가 모든 페이지에 로드된다"고 추론했다가 틀렸습니다. 청크 이름(해시값)만으로 내용물을 추측하면 안 되고, 직접 드릴다운해서 확인해야 한다는 것을 배웠어요. "최적화할 게 없다"는 결론도 측정해야 알 수 있습니다.

### Step 8 — 캐싱 전략
`staleTime`을 설정했는데 Before/After가 동일했습니다. TanStack Query의 `gcTime`이 이미 기본적인 캐싱을 제공하고 있었기 때문이에요. 최적화 전에 기존 라이브러리가 무엇을 해주고 있는지 먼저 파악해야 한다는 교훈을 얻었습니다.

---

## 이 시리즈에서 반복된 패턴

### 1. 측정 없는 최적화는 의미 없다

Step 5에서 blur 동적 생성이 오히려 LCP를 악화시켰습니다. Step 7에서 최적화할 게 없다는 걸 측정으로 확인했어요. Step 8에서 기대와 다른 결과를 얻었습니다.

> **"측정 → 적용 → 재측정 → 비교"** 이 흐름을 지키지 않으면 최적화가 오히려 퇴화가 됩니다.

### 2. 기대와 다른 결과가 더 좋은 학습이 됐다

Step 2에서 번들이 오히려 늘었고, Step 5에서 LCP가 2배 악화됐고, Step 7에서 내 추론이 틀렸고, Step 8에서 차이가 없었습니다. 이 실패들이 더 오래 기억에 남아요.

### 3. 도구를 알면 보인다

Lighthouse, React DevTools Profiler, Bundle Analyzer, Network 탭. 각 도구가 측정할 수 있는 것과 없는 것이 다릅니다.

- Lighthouse: 첫 로드 성능 (LCP, CLS, FCP)
- Profiler: 인터랙션 시 재렌더
- Bundle Analyzer: 번들 구성과 크기
- Network 탭: 실시간 요청 횟수와 타이밍

---

## 핵심 정리

| Step | 핵심 개념 | 교훈 |
|---|---|---|
| 1 | Code Splitting, First Load JS | 기준선 측정부터 |
| 2 | Dynamic Import | 최적화가 항상 수치 개선은 아님 |
| 3 | Skeleton, Suspense, CLS | 레이아웃 안정성도 성능이다 |
| 4 | Server Component | 데이터 페칭 위치가 LCP에 직결 |
| 5 | next/image, blur, Critical Path | Critical Path에 외부 의존성 금지 |
| 6 | React.memo, useCallback | 둘은 반드시 세트 |
| 7 | Bundle Analyzer, Treemap | 추측 말고 직접 드릴다운 |
| 8 | revalidate, staleTime, gcTime | 기존 캐시 먼저 파악 |

---

> "성능 최적화는 도구와 지표를 이해하고, 측정하고, 틀리고, 다시 측정하는 과정이다."
