import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Client } = pg

// PostgreSQL에 연결하여 데이터베이스 생성
async function createDatabase() {
  // postgres 데이터베이스에 연결 (기본 데이터베이스)
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // 기본 데이터베이스
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  })

  try {
    await client.connect()
    console.log('PostgreSQL에 연결되었습니다.')

    const dbName = process.env.DB_NAME || 'coffee_order_db'

    // 데이터베이스 존재 여부 확인
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `
    const dbExists = await client.query(checkDbQuery, [dbName])

    if (dbExists.rows.length > 0) {
      console.log(`데이터베이스 '${dbName}'가 이미 존재합니다.`)
    } else {
      // 데이터베이스 생성
      await client.query(`CREATE DATABASE ${dbName}`)
      console.log(`데이터베이스 '${dbName}'가 생성되었습니다.`)
    }
  } catch (error) {
    console.error('데이터베이스 생성 오류:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

createDatabase()
