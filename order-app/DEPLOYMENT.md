# Render.com 배포 가이드

## 배포 순서

Render.com에 배포하는 순서는 다음과 같습니다:

1. **PostgreSQL 데이터베이스 생성**
2. **백엔드 서버 배포**
3. **프론트엔드 배포**

---

## 1단계: PostgreSQL 데이터베이스 생성

### 1.1 Render.com에서 PostgreSQL 생성
1. Render.com 대시보드에 로그인
2. **"New +"** 버튼 클릭
3. **"PostgreSQL"** 선택
4. 다음 정보 입력:
   - **Name**: `coffee-order-db` (원하는 이름)
   - **Database**: `coffee_order_db` (또는 원하는 이름)
   - **User**: 자동 생성됨
   - **Region**: 가장 가까운 지역 선택
   - **PostgreSQL Version**: 최신 버전 선택
   - **Plan**: Free tier 선택 (또는 유료 플랜)
5. **"Create Database"** 클릭

### 1.2 데이터베이스 연결 정보 확인
- 데이터베이스 생성 후 **"Connections"** 탭에서 다음 정보 확인:
  - **Internal Database URL**: 백엔드 서버에서 사용
  - **External Database URL**: 로컬 개발용 (선택사항)

### 1.3 데이터베이스 초기화
- 백엔드 서버 배포 후 자동으로 테이블이 생성되도록 설정 (아래 참조)

---

## 2단계: 백엔드 서버 배포

### 2.1 GitHub 저장소 준비
1. 프로젝트를 GitHub에 푸시 (아직 안 했다면)
2. `server` 폴더의 내용을 확인

### 2.2 Render.com에서 Web Service 생성
1. Render.com 대시보드에서 **"New +"** 클릭
2. **"Web Service"** 선택
3. GitHub 저장소 연결
4. 다음 설정 입력:
   - **Name**: `coffee-order-backend` (원하는 이름)
   - **Region**: 데이터베이스와 같은 지역 선택
   - **Branch**: `main` (또는 기본 브랜치)
   - **Root Directory**: `server` (중요!)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

### 2.3 환경 변수 설정
**"Environment"** 섹션에서 다음 환경 변수 추가:

**방법 1: DATABASE_URL 사용 (권장)**
- PostgreSQL 서비스의 **"Connections"** 탭에서 **Internal Database URL** 복사
- 다음 환경 변수 추가:
```
DATABASE_URL=<Internal Database URL>
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-service.onrender.com
```

**방법 2: 개별 환경 변수 사용**
- Internal Database URL을 파싱하여 개별 변수로 설정:
```
DB_HOST=<데이터베이스 호스트>
DB_PORT=5432
DB_NAME=<데이터베이스 이름>
DB_USER=<데이터베이스 사용자>
DB_PASSWORD=<데이터베이스 비밀번호>
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-service.onrender.com
```

**참고**: 코드는 DATABASE_URL을 우선적으로 사용하도록 설정되어 있습니다.

### 2.4 데이터베이스 초기화 스크립트 추가
- 배포 후 자동으로 테이블을 생성하도록 `server.js`에 초기화 로직 추가 (아래 참조)

### 2.5 배포 확인
- 배포가 완료되면 **"Logs"** 탭에서 로그 확인
- 서버가 정상적으로 시작되었는지 확인

---

## 3단계: 프론트엔드 배포

### 3.1 Render.com에서 Static Site 생성
1. Render.com 대시보드에서 **"New +"** 클릭
2. **"Static Site"** 선택
3. GitHub 저장소 연결
4. 다음 설정 입력:
   - **Name**: `coffee-order-frontend` (원하는 이름)
   - **Branch**: `main` (또는 기본 브랜치)
   - **Root Directory**: `ui` (중요!)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 3.2 환경 변수 설정
프론트엔드는 빌드 타임에 환경 변수를 주입해야 합니다.

**Render.com의 "Environment" 섹션에서 다음 환경 변수 추가:**
```
VITE_API_BASE_URL=https://your-backend-service.onrender.com/api
```

**중요**: 
- Vite는 `VITE_` 접두사가 붙은 환경 변수만 클라이언트 코드에 주입합니다.
- 백엔드 서비스의 실제 URL로 변경해야 합니다.
- 예: `https://coffee-order-backend.onrender.com/api`

### 3.3 API URL 업데이트
- 프론트엔드 코드에서 백엔드 API URL을 환경 변수로 변경 (아래 참조)

### 3.4 배포 확인
- 배포가 완료되면 프론트엔드 URL로 접속하여 테스트

---

## 추가 설정 및 주의사항

### CORS 설정
- 백엔드 서버의 CORS 설정이 프론트엔드 도메인을 허용하도록 확인

### 데이터베이스 SSL 연결
- Render.com의 PostgreSQL은 SSL 연결을 요구할 수 있음
- `database.js`에서 SSL 옵션 추가 필요할 수 있음

### 환경 변수 관리
- 민감한 정보는 Render.com의 환경 변수로 관리
- `.env` 파일은 GitHub에 푸시하지 않음

### 무료 플랜 제한사항
- Render.com 무료 플랜은 15분간 비활성화 시 서비스가 sleep 상태로 전환됨
- 첫 요청 시 약간의 지연이 발생할 수 있음

---

## 배포 후 확인 사항

1. ✅ 데이터베이스 연결 확인
2. ✅ 백엔드 API 엔드포인트 테스트
3. ✅ 프론트엔드에서 백엔드 API 호출 확인
4. ✅ 주문 생성 및 재고 차감 테스트
5. ✅ 관리자 화면 기능 테스트

---

## 문제 해결

### 데이터베이스 연결 오류
- 환경 변수가 올바르게 설정되었는지 확인
- Internal Database URL 사용 확인
- SSL 연결 설정 확인

### CORS 오류
- 백엔드 CORS 설정에서 프론트엔드 URL 허용 확인

### 빌드 오류
- 로그에서 구체적인 오류 메시지 확인
- 의존성 설치 문제 확인
- Node.js 버전 확인
