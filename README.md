# 통합 커머스 플랫폼

중고거래, 구독 커머스, 소셜 커머스를 한 곳에서 제공하는 통합 플랫폼

## 프로젝트 구조

```
commerce-platform/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── features/           # 기능별 페이지/컴포넌트
│   │   │   ├── home/           # 홈 페이지
│   │   │   ├── marketplace/    # 중고거래
│   │   │   ├── subscription/   # 구독 커머스
│   │   │   └── social/         # 소셜 커머스
│   │   └── shared/             # 공통 모듈
│   │       ├── components/     # 공통 컴포넌트
│   │       ├── hooks/          # 커스텀 훅
│   │       ├── types/          # 타입 정의
│   │       ├── utils/          # 유틸리티
│   │       └── api/            # API 클라이언트
│   └── ...
│
└── backend/                     # NestJS + MongoDB
    ├── src/
    │   ├── modules/            # 도메인별 모듈
    │   │   ├── marketplace/    # 중고거래
    │   │   ├── subscription/   # 구독 커머스
    │   │   └── social-commerce/# 소셜 커머스
    │   ├── auth/               # 인증/인가
    │   └── ...
    └── ...
```

## 기술 스택

### Frontend
- **프레임워크**: React 18
- **언어**: TypeScript 5+
- **빌드 도구**: Vite
- **라우팅**: React Router v6
- **상태 관리**:
  - Zustand (클라이언트 상태)
  - TanStack Query (서버 상태)
- **HTTP 클라이언트**: Axios
- **스타일링**: Tailwind CSS

### Backend
- **프레임워크**: NestJS
- **언어**: TypeScript 5+
- **데이터베이스**: MongoDB + Mongoose
- **인증**: JWT (passport-jwt)
- **API 문서**: Swagger
- **유효성 검사**: class-validator, class-transformer

## 시작하기

### 사전 요구사항
- Node.js 18+
- npm
- MongoDB (로컬 또는 MongoDB Atlas)

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd commerce-platform
```

### 2. Frontend 설정

```bash
# frontend 폴더로 이동
cd frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev
```

Frontend는 http://localhost:5173 에서 실행됩니다.

### 3. Backend 설정

```bash
# backend 폴더로 이동
cd backend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어 MongoDB URI 및 JWT_SECRET 설정

# 개발 서버 실행
npm run dev
```

Backend는 http://localhost:3000 에서 실행됩니다.

## 환경변수 설정

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3000
```

### Backend (.env)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/commerce
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## API 문서

Backend 서버 실행 후 Swagger 문서를 확인할 수 있습니다:

**Swagger UI**: http://localhost:3000/api/docs

## 주요 기능 (개발 예정)

### 1. 중고거래
- [ ] 상품 등록/조회/수정/삭제
- [ ] 상품 검색 및 필터링
- [ ] 카테고리별 조회
- [ ] 실시간 채팅
- [ ] 위치 기반 검색

### 2. 구독 커머스
- [ ] 구독 플랜 관리
- [ ] 정기 결제 연동
- [ ] 구독 주기 설정
- [ ] 배송 관리

### 3. 소셜 커머스
- [ ] 소셜 피드
- [ ] 라이브 커머스
- [ ] 인플루언서 추천
- [ ] 좋아요 및 댓글
- [ ] 공유 기능

### 공통 기능
- [ ] 회원가입/로그인 (JWT)
- [ ] 사용자 프로필
- [ ] 결제 연동
- [ ] 알림 시스템

## 스크립트

### Frontend
```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # 린트 체크
npm run format   # 코드 포맷팅
```

### Backend
```bash
npm run dev          # 개발 서버 실행 (watch 모드)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
npm run start:prod   # 빌드된 앱 실행
npm run lint         # 린트 체크
npm run format       # 코드 포맷팅
npm run test         # 테스트 실행
```

## 라우팅 구조

### Frontend Routes
- `/` - 홈 페이지
- `/marketplace` - 중고거래
- `/subscription` - 구독 커머스
- `/social` - 소셜 커머스

### Backend API Endpoints
- `GET /` - 헬스 체크
- `GET /health` - 서버 상태 확인
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `GET /marketplace/products` - 중고 상품 목록
- `GET /subscription/plans` - 구독 플랜 목록
- `GET /social-commerce/feed` - 소셜 피드

## 개발 가이드

### 코드 스타일
- ESLint + Prettier 사용
- TypeScript strict 모드
- 함수형 컴포넌트 사용 (React)
- 모든 컴포넌트에 주석으로 역할과 기능 설명

### Git 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드
chore: 빌드 업무, 패키지 매니저 수정
```

## 문제 해결

### MongoDB 연결 오류
- MongoDB가 실행 중인지 확인
- `.env` 파일의 `MONGODB_URI` 확인
- MongoDB Atlas 사용 시 IP 화이트리스트 확인

### CORS 오류
- Backend `.env`의 `FRONTEND_URL` 확인
- Frontend `.env`의 `VITE_API_BASE_URL` 확인

### 포트 충돌
- Frontend: `vite.config.ts`에서 포트 변경
- Backend: `.env`의 `PORT` 변경

## 라이선스

MIT

## 기여

Pull Request를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
