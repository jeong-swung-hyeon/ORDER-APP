import pool from '../config/database.js'

// 데이터베이스 연결 테스트
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()')
    console.log('✅ 데이터베이스 연결 성공!')
    console.log('현재 시간:', result.rows[0].now)
    process.exit(0)
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error.message)
    console.error('오류 상세:', error)
    process.exit(1)
  }
}

testConnection()
