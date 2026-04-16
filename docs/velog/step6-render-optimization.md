# Next.js 15 성능 최적화 — React.memo, useCallback으로 불필요한 리렌더 방지

> 카테고리 필터 하나 클릭했을 뿐인데 상품 카드 전체가 다시 그려지고 있었다. React DevTools Profiler로 측정하고, memo + useCallback으로 해결한 기록입니다.

---

## 들어가며

이전 글에서 `next/image`의 `priority`, `placeholder="blur"` 옵션으로 이미지 로딩을 최적화했습니다.

이번 글에서는 **클라이언트 렌더링 최적화**를 다룹니다. Lighthouse로 측정하는 네트워크 지표가 아니라, 브라우저가 이미 받은 React 컴포넌트를 **얼마나 쓸데없이 다시 그리는가**의 문제입니다.

```
현재 상태:
- 카테고리 버튼 클릭 → selectedCategory 상태 변경
- ProductList 전체 재렌더 발생
- ProductCard 20개가 전부 다시 그려짐 ❌
- 바뀐 카테고리 버튼 2개만 그리면 충분한데
```

---

## 공부할 개념

### React의 렌더링 조건

React는 다음 중 하나가 바뀌면 컴포넌트를 다시 렌더링합니다.

- **state** 변경
- **props** 변경
- **부모 컴포넌트** 재렌더

문제는 세 번째입니다. **부모가 재렌더되면 자식은 props가 안 바뀌어도 기본적으로 함께 재렌더됩니다.**

```
selectedCategory 변경
  → ProductList 재렌더 (state 변경 → 정상)
  → ProductCard × N 재렌더 (product props 미변경인데도 → 낭비)
  → CategoryButton × 6 재렌더 (isSelected 바뀐 건 2개뿐인데 전부 → 낭비)
```

### 1. `React.memo`

컴포넌트를 `memo`로 감싸면, **이전 props와 현재 props를 얕은 비교(Shallow Comparison)** 해서 같으면 재렌더를 건너뜁니다.

```tsx
import { memo } from 'react';

// memo 없음: 부모 재렌더 시 항상 재렌더
export function ProductCard({ product, onClick }) { ... }

// memo 있음: product, onClick 참조가 같으면 재렌더 스킵
export const ProductCard = memo(function ProductCard({ product, onClick }) { ... });
```

**주의:** 얕은 비교라서 객체/함수는 참조가 같아야 합니다. `product`가 같은 데이터라도 매 렌더마다 새 객체면 memo가 의미 없어요.

### 2. `useCallback`

함수는 컴포넌트가 렌더될 때마다 새로 생성됩니다. `useCallback`은 **의존성 배열이 바뀔 때만 새 함수를 만들고**, 그 외에는 이전 함수 참조를 재사용합니다.

```tsx
// 매 렌더마다 새 함수 생성 → memo 무력화
<ProductCard onClick={() => onProductClick?.(product)} />

// useCallback으로 안정적인 참조 유지
const handleProductClick = useCallback((product) => {
  onProductClick?.(product);
}, [onProductClick]); // onProductClick이 바뀔 때만 새 함수
```

### 3. 왜 memo + useCallback을 함께 써야 하는가

```
memo만 쓰면:
  → props 얕은 비교 수행
  → onClick prop이 매 렌더마다 새 함수 참조
  → 비교 결과 "다름" → 재렌더 발생 → memo 무의미

useCallback만 쓰면:
  → 함수 참조는 안정적
  → 하지만 memo가 없으면 얕은 비교 자체를 안 함
  → 부모 재렌더 시 그냥 재렌더 발생

memo + useCallback:
  → 함수 참조 안정 (useCallback) + 비교 후 스킵 (memo) → ✅
```

### 4. `useMemo`

값(value)을 메모이제이션합니다. `useCallback`이 함수용이라면, `useMemo`는 계산 비용이 큰 값에 씁니다.

```tsx
// categories 배열: 매 렌더마다 새 배열 생성
const categories = ['전자기기', '가구', '의류', '도서', '기타'];

// useMemo: 첫 렌더에만 생성, 이후 동일 참조
const categories = useMemo(
  () => ['전자기기', '가구', '의류', '도서', '기타'],
  []
);
```

이번 Step에서는 `categories`가 단순한 상수 배열이라 `useMemo`를 굳이 쓸 필요는 없습니다. 파일 밖으로 빼는 게 더 명확한 해결책이에요.

---

## 성능 측정: React DevTools Profiler

### 설치

Chrome 웹스토어에서 **"React Developer Tools"** 설치 → 개발 서버(`npm run dev`) 실행 시 DevTools에 **Components**, **Profiler** 탭이 생깁니다.

> **주의:** `next build && next start`로 빌드된 prod 서버에서는 Profiler가 제한됩니다. 반드시 개발 서버(`npm run dev`)에서 측정하세요.

### 측정 방법 (Before)

최적화 전 상태를 먼저 기록합니다.

1. `http://localhost:3000/marketplace` 접속
2. DevTools → **Profiler** 탭
3. ⚙️ (Settings) → **"Highlight updates when components render"** 체크 → 화면에서 재렌더 컴포넌트가 초록색으로 깜빡입니다.
4. **⏺ Record** 클릭
5. 카테고리 버튼 하나 클릭 (예: "전자기기")
6. **⏹ Stop** 클릭

### Profiler 결과 읽기

```
Flamegraph (불꽃 그래프):
  - 회색: 재렌더되지 않음 (memo로 스킵)
  - 색상(노랑~빨강): 재렌더됨, 색이 진할수록 오래 걸림

Ranked Chart:
  - 렌더 시간이 긴 컴포넌트 순서로 나열
  - 최적화 대상 우선순위 파악에 유용
```

**Before 예상 결과:**

```
ProductList       ████ (state 변경 → 정상)
  CategoryButton  ██ × 6개 (전부 재렌더)
  ProductCard     ██ × 20개 (전부 재렌더)
```

**After 예상 결과:**

```
ProductList       ████ (state 변경 → 정상)
  CategoryButton  ██ × 2개만 (isSelected 바뀐 것만)
  CategoryButton  회색 × 4개 (스킵)
  ProductCard     회색 × 20개 (전부 스킵)
```

---

## 구현

### Before: 문제 코드

```tsx
// ProductList.tsx (최적화 전)
export function ProductList({ onProductClick, initialProducts }) {
  const [selectedCategory, setSelectedCategory] = useState('');

  return (
    <div>
      {/* 카테고리 버튼: 인라인 함수로 매번 새 참조 생성 */}
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setSelectedCategory(category)} // ← 매 렌더마다 새 함수
        >
          {category}
        </button>
      ))}

      {/* ProductCard: 인라인 함수 + memo 없음 */}
      {products.map((product, index) => (
        <ProductCard
          key={product._id}
          product={product}
          onClick={() => onProductClick?.(product)} // ← 매 렌더마다 새 함수
        />
      ))}
    </div>
  );
}

// ProductCard.tsx (최적화 전)
export function ProductCard({ product, onClick }) { // memo 없음
  return <div onClick={() => onClick?.(product)}>...</div>;
}
```

### After: ProductCard.tsx

```tsx
'use client';

import { memo, useCallback } from 'react';
import Image from 'next/image';
import { Product } from '@/features/marketplace/types/product';

export const ProductCard = memo(function ProductCard({ product, index = 0, onClick }) {
  // onClick, product가 바뀔 때만 새 함수 생성
  const handleClick = useCallback(() => {
    onClick?.(product);
  }, [onClick, product]);

  return (
    <div onClick={handleClick} className="border rounded-lg overflow-hidden ...">
      ...
    </div>
  );
});
```

**포인트:**
- `memo`: props 얕은 비교 후 같으면 재렌더 스킵
- `useCallback`: `onClick`, `product`가 바뀔 때만 새 `handleClick` 생성 → `memo`가 유효하게 동작

### After: ProductList.tsx — CategoryButton 분리

카테고리 버튼도 같은 이유로 분리 + 메모이제이션합니다.

```tsx
'use client';

import { memo, useCallback, useState } from 'react';

// 별도 컴포넌트로 분리 + memo
const CategoryButton = memo(function CategoryButton({ label, isSelected, onSelect }) {
  const handleClick = useCallback(() => {
    onSelect(label);
  }, [onSelect, label]); // label은 변하지 않으므로 사실상 onSelect가 key

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-2 rounded-full transition-colors ${
        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {label}
    </button>
  );
});

export function ProductList({ onProductClick, initialProducts }) {
  const [selectedCategory, setSelectedCategory] = useState('');

  // 빈 의존성 배열: 컴포넌트 생애 동안 동일한 참조 유지
  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  // onProductClick이 바뀔 때만 새 함수
  const handleProductClick = useCallback((product) => {
    onProductClick?.(product);
  }, [onProductClick]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <CategoryButton
          label="전체"
          isSelected={selectedCategory === ''}
          onSelect={handleCategorySelect} // 안정적인 참조 → CategoryButton memo 유효
        />
        {categories.map((category) => (
          <CategoryButton
            key={category}
            label={category}
            isSelected={selectedCategory === category}
            onSelect={handleCategorySelect}
          />
        ))}
      </div>

      {products.map((product, index) => (
        <ProductCard
          key={product._id}
          index={index}
          product={product}
          onClick={handleProductClick} // 안정적인 참조 → ProductCard memo 유효
        />
      ))}
    </div>
  );
}
```

### 왜 `handleCategorySelect`의 deps가 빈 배열인가

```tsx
const handleCategorySelect = useCallback((category: string) => {
  setSelectedCategory(category);
}, []); // deps: []
```

`setSelectedCategory`는 React가 보장하는 **stable reference**입니다. `useState`의 setter는 컴포넌트 생애 동안 절대 바뀌지 않아요. 그래서 deps에 넣지 않아도 됩니다. `[]`이면 이 함수는 마운트 이후 절대 재생성되지 않습니다.

이 덕분에 `CategoryButton`에 전달되는 `onSelect` prop이 항상 동일한 참조를 유지하고, `memo`가 제대로 동작합니다.

---

## 동작 확인

### "Highlight updates" 시각 확인

1. DevTools → Profiler → ⚙️ → **"Highlight updates when components render"** 체크
2. 카테고리 버튼 클릭

**Before:** 화면 전체가 초록 테두리로 깜빡임 (ProductCard 전부)

**After:** 카테고리 버튼 영역만 깜빡임 (상품 카드 영역은 조용함)

### Profiler Flamegraph 비교

**Before — 카테고리 순차 클릭 (전체→전자기기→가구→의류→도서→기타→전체):**

```
ProductList (1ms of 5.8ms)   ← 초록, 재렌더
  ProductListSkeleton        ← 카테고리 전환 시 로딩 표시
  ProductCard × 전체         ← 전부 초록, 전체 재렌더
  렌더 시간: 5~32ms (commit별 상이)
```

**After — 동일 조작:**

```
ProductList                  ← 흰색/연한색, 빠름
  CategoryButton             ← 작은 막대 몇 개만 (isSelected 바뀐 것만)
  ProductCard × 전체         ← 전부 흰색 = 스킵 ✅
```

| 항목 | Before | After |
|---|---|---|
| ProductCard 재렌더 수 | ~20개 전부 | 0개 ✅ |
| CategoryButton 재렌더 수 | 6개 전부 | 2개만 ✅ |
| 카테고리 클릭 렌더 시간 | 5~32ms | 거의 없음 ✅ |

---

## 언제 memo / useCallback을 쓰면 안 되는가

최적화는 항상 트레이드오프입니다.

| 상황 | 이유 |
|---|---|
| 자식 컴포넌트가 매우 단순할 때 | memo의 얕은 비교 비용 > 재렌더 비용일 수 있음 |
| props가 매 렌더마다 실제로 바뀔 때 | memo를 써도 항상 재렌더 → 비교 비용만 추가 |
| 의존성 배열이 너무 자주 바뀔 때 | useCallback이 매번 새 함수 생성 → 오히려 손해 |

**결론:** Profiler로 실제 재렌더가 병목임을 확인한 후에 적용하세요. 측정 없는 최적화는 복잡성만 높입니다.

---

## 핵심 정리

| 개념 | 설명 |
|---|---|
| `React.memo` | props 얕은 비교, 같으면 재렌더 스킵 |
| `useCallback` | 함수 참조 안정화. deps 배열이 바뀔 때만 새 함수 생성 |
| `useMemo` | 값 메모이제이션. 계산 비용이 클 때 사용 |
| Shallow Comparison | 객체/함수는 참조(주소)로 비교. 내용이 같아도 다른 참조면 "다름" |
| stable reference | `useState` setter 등 React가 보장하는 불변 참조. deps에 생략 가능 |

```
이번 Step의 핵심 교훈:
"memo + useCallback은 세트다. 하나만 쓰면 효과가 반감된다"
"최적화 전에 Profiler로 병목을 먼저 확인하라"
"측정 → 적용 → 재측정 → 비교"
```

---

## 다음 단계

```
Step 7. 번들 분석 (Bundle Analyzer)
  → next/bundle-analyzer로 번들 구성 시각화
  → 무거운 라이브러리 파악 및 dynamic import 적용
  → First Load JS 추가 감소 시도
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
