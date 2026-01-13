import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// 환경 변수 로드
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 미들웨어 설정
app.use(cors()) // 프런트엔드와의 통신을 위한 CORS 설정
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
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`)
  console.log(`http://localhost:${PORT}`)
})
