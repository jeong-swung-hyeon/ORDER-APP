import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeDatabase } from './scripts/initializeDatabase.js'

// 환경 변수 로드
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// CORS 설정 - 프로덕션 환경에서는 특정 도메인만 허용
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // 프로덕션에서는 프론트엔드 URL로 변경
  credentials: true
}
app.use(cors(corsOptions))

// 미들웨어 설정
app.use(express.json()) // JSON 요청 본문 파싱
app.use(express.urlencoded({ extended: true })) // URL 인코딩된 요청 본문 파싱

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: '커피 주문 앱 백엔드 서버',
    version: '1.0.0',
    status: 'running'
  })
})

// API 라우트
import menuRoutes from './routes/menuRoutes.js'
import orderRoutes from './routes/orderRoutes.js'

app.use('/api/menus', menuRoutes)
app.use('/api/orders', orderRoutes)

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: '요청한 리소스를 찾을 수 없습니다.'
  })
})

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: '서버 오류가 발생했습니다.'
  })
})

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 초기화 (테이블 생성 및 초기 데이터 삽입)
    await initializeDatabase()
    
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`)
      console.log(`http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('서버 시작 실패:', error)
    process.exit(1)
  }
}

startServer()
