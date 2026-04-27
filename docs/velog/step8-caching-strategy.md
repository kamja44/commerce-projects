# Next.js 15 성능 최적화 — 캐싱 전략 (fetch revalidate + TanStack Query staleTime)

> "캐시가 이미 있었다." 최적화를 적용했는데 Before/After가 같았다. 왜 그런지 파악한 기록입니다.

---

## 들어가며

이전 글에서 Bundle Analyzer로 번들 구성을 분석했습니다.

이번 글에서는 **불필요한 네트워크 요청**을 줄이는 캐싱 전략을 다룹니다. 서버 캐시(Next.js fetch revalidate)와 클라이언트 캐시(TanStack Query staleTime) 두 가지를 적용합니다.

```
현재 상태:
- page.tsx: cache: 'no-store' → 매 요청마다 백엔드 API 호출
- useProducts: staleTime 없음 → 기본값 0
- useProductsByCategory: staleTime 없음 → 기본값 0
```

---

## 핵심 개념

### 1. Next.js fetch 캐시 옵션

Next.js App Router의 Server Component에서 `fetch`를 쓸 때 캐시 전략을 지정할 수 있습니다.

```ts
// 캐시 없음: 매 요청마다 백엔드 재호출
fetch(url, { cache: 'no-store' })

// ISR: 60초마다 백엔드 재호출, 그 사이 요청은 캐시 반환
fetch(url, { next: { revalidate: 60 } })

// 빌드 시 1회: 정적 데이터에 사용
fetch(url, { cache: 'force-cache' })
```

**`revalidate: 60`의 동작:**

```
첫 번째 요청 → 백엔드 호출 → 응답 캐시
  ↓
60초 이내 요청 → 캐시 반환 (백엔드 호출 없음)
  ↓
60초 후 첫 요청 → 캐시 반환 + 백그라운드에서 백엔드 재호출
  ↓
그 다음 요청 → 새로 받은 데이터 반환
```

마지막 패턴을 **Stale-While-Revalidate**라고 부릅니다. 사용자에게 항상 즉각적인 응답을 주면서 백그라운드로 갱신합니다.

### 2. TanStack Query staleTime

TanStack Query는 두 가지 시간 개념을 가집니다.

```
gcTime (기본: 5분)
  → 데이터를 메모리에 유지하는 시간
  → 이 시간 동안 캐시에서 데이터를 꺼낼 수 있음

staleTime (기본: 0)
  → 데이터를 "신선하다"고 간주하는 시간
  → 이 시간 내에는 refetch를 트리거하지 않음
```

**staleTime이 0일 때:**

```
카테고리 전환 → 전자기기 선택 (요청 #1)
→ 가구 선택 (요청 #2)
→ 전자기기 재선택 → 캐시 반환 (gcTime 내) + 백그라운드 refetch 트리거
→ 탭 전환 후 복귀 → window focus → refetch 트리거
```

**staleTime이 60초일 때:**

```
카테고리 전환 → 전자기기 선택 (요청 #1)
→ 가구 선택 (요청 #2)
→ 전자기기 재선택 → 캐시 반환, refetch 없음 ✅
→ 탭 전환 후 복귀 → refetch 없음 ✅ (60초 내)
```

---

## 구현

### page.tsx — fetch revalidate

```tsx
// Before
const res = await fetch(`${API_URL}/marketplace/products`, {
  cache: 'no-store',
});

// After
const res = await fetch(`${API_URL}/marketplace/products`, {
  next: { revalidate: 60 },
});
```

### useProducts.ts — staleTime 추가

```ts
export function useProducts(options?: UseProductsOptions) {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    initialData: options?.initialData,
    staleTime: 60 * 1000, // 1분
  });
}
```

### useProductsByCategory.ts — staleTime 추가

```ts
export function useProductsByCategory(category: string) {
  return useQuery({
    queryKey: ['products', 'category', category],
    queryFn: () => getProductsByCategory(category),
    enabled: !!category,
    staleTime: 60 * 1000, // 1분
  });
}
```

---

## 측정 결과 — 기대와 달랐다

### 테스트 시나리오

DevTools → Network → Fetch/XHR 필터

```
전체 → 전자기기 클릭 → 가구 클릭 → 전자기기 재클릭
```

| 항목 | Before (staleTime 없음) | After (staleTime 60s) |
|---|---|---|
| 네트워크 요청 수 | 2회 | 2회 |

**Before와 After가 동일했습니다.**

### 왜 차이가 없었나

TanStack Query는 `staleTime`이 없어도 **gcTime(기본 5분)** 동안 데이터를 메모리에 유지합니다.

```
staleTime = 0일 때:
  재방문 시 → 캐시 반환(즉시) + 백그라운드 refetch 트리거

staleTime = 60000일 때:
  재방문 시 → 캐시 반환(즉시) + refetch 없음
```

카테고리를 빠르게 전환하는 시나리오에서는 두 경우 모두 캐시를 반환하는 겉보기 동작이 같아서, Network 탭에서 차이가 보이지 않았습니다.

### staleTime 차이가 실제로 드러나는 시나리오

```
1. 전자기기 클릭 (요청 발생)
2. 다른 탭으로 이동 후 돌아오기 (window focus)

staleTime = 0    → 요청 발생 (stale이라 refetch)
staleTime = 60s  → 요청 없음 (60초 내 fresh)
```

이처럼 **탭 전환**, **페이지 이동 후 뒤로가기**, **여러 컴포넌트 동시 마운트** 상황에서 staleTime 효과가 명확하게 드러납니다.

### 교훈

> **"이미 동작 중인 캐시가 있었다"**

최적화를 적용하기 전에 기존 라이브러리가 어떤 캐싱을 제공하는지 먼저 파악해야 합니다. TanStack Query의 gcTime은 이미 기본적인 캐싱을 제공하고 있었어요.

그렇다고 staleTime 설정이 의미 없는 건 아닙니다. 백그라운드 refetch를 막아서 불필요한 서버 부하를 줄이고, window focus 시 요청을 방지하는 효과가 있습니다.

---

## fetch revalidate vs TanStack Query staleTime 비교

| 항목 | fetch revalidate | TanStack Query staleTime |
|---|---|---|
| 동작 위치 | 서버 (Next.js) | 클라이언트 (브라우저) |
| 캐시 저장소 | Next.js 서버 캐시 | 브라우저 메모리 |
| 적용 대상 | Server Component fetch | useQuery 훅 |
| 효과 | 백엔드 API 호출 감소 | 클라이언트 재요청 감소 |
| 페이지 새로고침 후 | 캐시 유지 (서버) | 캐시 초기화 (메모리) |

---

## 핵심 정리

| 개념 | 설명 |
|---|---|
| `cache: 'no-store'` | 캐시 없음. 매 요청마다 백엔드 호출 |
| `next: { revalidate: N }` | N초 캐시. Stale-While-Revalidate 패턴 |
| `gcTime` | TanStack Query 메모리 유지 시간 (기본 5분) |
| `staleTime` | TanStack Query 데이터 신선도 시간 (기본 0) |
| Stale-While-Revalidate | 캐시 반환 + 백그라운드 갱신. 응답속도 vs 신선도 균형 |

```
이번 Step의 핵심 교훈:
"최적화 전에 기존 라이브러리가 무엇을 해주고 있는지 파악하라"
"기대와 다른 결과도 기록하면 더 나은 학습이 된다"
"측정 → 분석 → 판단"
```

---

## 다음 단계

```
Step 9. 마무리 & 회고
  → 전체 Step 최종 Lighthouse 측정
  → Step 1~8 성능 변화 종합 정리
  → 시리즈 마무리
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
| 8 | 카테고리 재방문 시 네트워크 요청 | gcTime 내 캐시 동작 중 | staleTime으로 refetch 방지 |
