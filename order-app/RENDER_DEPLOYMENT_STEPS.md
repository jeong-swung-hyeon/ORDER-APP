# Render.com 배포 단계별 가이드

## 📋 배포 순서 요약

1. **PostgreSQL 데이터베이스 생성**
2. **백엔드 서버 배포**
3. **프론트엔드 배포**

---

## 1️⃣ PostgreSQL 데이터베이스 생성

### Step 1: 데이터베이스 생성
1. Render.com 대시보드 → **"New +"** → **"PostgreSQL"**
2. 설정:
   - **Name**: `coffee-order-db`
   - **Database**: `coffee_order_db`
   - **Region**: 가장 가까운 지역 선택
   - **Plan**: Free tier 선택
3. **"Create Database"** 클릭

### Step 2: 연결 정보 확인
- 데이터베이스 생성 후 **"Connections"** 탭 확인
- **Internal Database URL** 복사 (나중에 사용)

---

## 2️⃣ 백엔드 서버 배포

### Step 1: Web Service 생성
1. Render.com 대시보드 → **"New +"** → **"Web Service"**
2. GitHub 저장소 연결
3. 설정 입력:
   ```
   Name: coffee-order-backend
   Region: [데이터베이스와 같은 지역]
   Branch: main
   Root Directory: server
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

### Step 2: 환경 변수 설정
**"Environment"** 섹션에서 다음 변수 추가:

```
DATABASE_URL=<PostgreSQL의 Internal Database URL>
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-service.onrender.com
```

**참고**: `FRONTEND_URL`은 프론트엔드 배포 후 실제 URL로 업데이트 필요

### Step 3: 배포 확인
- 배포 완료 후 **"Logs"** 탭에서 확인:
  - ✅ "데이터베이스 초기화가 완료되었습니다!"
  - ✅ "서버가 포트 10000에서 실행 중입니다."
- 서비스 URL 확인 (예: `https://coffee-order-backend.onrender.com`)

### Step 4: API 테스트
브라우저에서 다음 URL 접속:
```
https://your-backend-service.onrender.com/api/menus
```
메뉴 목록이 JSON으로 반환되면 성공!

---

## 3️⃣ 프론트엔드 배포

### Step 1: Static Site 생성
1. Render.com 대시보드 → **"New +"** → **"Static Site"**
2. GitHub 저장소 연결
3. 설정 입력:
   ```
   Name: coffee-order-frontend
   Branch: main
   Root Directory: ui
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

### Step 2: 환경 변수 설정
**"Environment"** 섹션에서 다음 변수 추가:

```
VITE_API_BASE_URL=https://your-backend-service.onrender.com/api
```

**중요**: `your-backend-service`를 실제 백엔드 서비스 이름으로 변경!

### Step 3: 배포 확인
- 배포 완료 후 프론트엔드 URL 접속
- 브라우저 개발자 도구(F12) → Network 탭에서 API 호출 확인
- 메뉴가 정상적으로 표시되는지 확인

---

## 🔧 배포 후 확인 사항

### ✅ 데이터베이스
- [ ] 데이터베이스 연결 성공
- [ ] 테이블 자동 생성 확인
- [ ] 초기 메뉴 데이터 삽입 확인

### ✅ 백엔드
- [ ] 서버 정상 시작
- [ ] API 엔드포인트 동작 확인
  - `GET /api/menus` - 메뉴 목록
  - `GET /api/menus/stock` - 재고 조회
  - `POST /api/orders` - 주문 생성
  - `GET /api/orders` - 주문 목록

### ✅ 프론트엔드
- [ ] 페이지 정상 로드
- [ ] 메뉴 카드 표시
- [ ] 장바구니 기능
- [ ] 주문 생성 기능
- [ ] 관리자 화면 접근

---

## 🐛 문제 해결

### 데이터베이스 연결 오류
- **증상**: "데이터베이스 연결 오류" 로그
- **해결**: 
  - `DATABASE_URL` 환경 변수 확인
  - Internal Database URL 사용 확인
  - 데이터베이스가 같은 지역에 있는지 확인

### CORS 오류
- **증상**: 브라우저 콘솔에 CORS 에러
- **해결**:
  - 백엔드의 `FRONTEND_URL` 환경 변수 확인
  - 프론트엔드 URL이 정확한지 확인

### 빌드 실패
- **증상**: 배포 로그에 빌드 오류
- **해결**:
  - `Root Directory`가 올바른지 확인 (`server` 또는 `ui`)
  - `Build Command` 확인
  - 로그에서 구체적인 오류 메시지 확인

### API 호출 실패
- **증상**: 프론트엔드에서 API 호출 실패
- **해결**:
  - `VITE_API_BASE_URL` 환경 변수 확인
  - 백엔드 서비스가 실행 중인지 확인
  - 브라우저 개발자 도구에서 네트워크 요청 확인

---

## 📝 참고사항

### 무료 플랜 제한
- Render.com 무료 플랜은 15분간 비활성화 시 sleep 상태
- 첫 요청 시 약간의 지연 발생 가능 (약 30초~1분)
- 프로덕션 환경에서는 유료 플랜 권장

### 환경 변수 관리
- 민감한 정보는 Render.com의 환경 변수로 관리
- `.env` 파일은 GitHub에 푸시하지 않음
- 환경 변수 변경 시 자동 재배포됨

### 데이터베이스 백업
- 무료 플랜은 자동 백업 없음
- 중요한 데이터는 주기적으로 백업 권장

---

## 🎉 배포 완료!

모든 단계를 완료했다면:
1. 프론트엔드 URL로 접속
2. 메뉴 선택 및 주문 테스트
3. 관리자 화면에서 주문 확인
4. 재고 관리 기능 테스트

축하합니다! 🎊
