# 커피 주문 앱 - 백엔드 서버

Express.js를 사용한 백엔드 서버입니다.

## 설치

```bash
npm install
```

## 환경 변수 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# 서버 포트 설정
PORT=3001

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_order_db
DB_USER=postgres
DB_PASSWORD=your_password

# 환경 설정
NODE_ENV=development
```

## 개발 서버 실행

```bash
npm run dev
```

개발 서버는 `http://localhost:3001`에서 실행되며, 파일 변경 시 자동으로 재시작됩니다.

## 프로덕션 서버 실행

```bash
npm start
```

## API 엔드포인트

### 메뉴 관련
- `GET /api/menus` - 메뉴 목록 조회
- `GET /api/menus/stock` - 재고 조회
- `PATCH /api/menus/:menuId/stock` - 재고 업데이트

### 주문 관련
- `POST /api/orders` - 주문 생성
- `GET /api/orders` - 주문 목록 조회
- `GET /api/orders/:orderId` - 주문 상세 조회
- `PATCH /api/orders/:orderId/status` - 주문 상태 변경

## 데이터베이스

PostgreSQL을 사용합니다. 데이터베이스 설정은 `.env` 파일에서 관리합니다.

## 기술 스택

- Node.js
- Express.js
- PostgreSQL
- CORS
- dotenv
