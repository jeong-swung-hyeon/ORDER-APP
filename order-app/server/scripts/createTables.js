import pool from '../config/database.js'

// 데이터베이스 테이블 생성
async function createTables() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Menus 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS menus (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        image VARCHAR(255),
        stock INTEGER NOT NULL DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Menus 테이블 생성 완료')

    // Options 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS options (
        id SERIAL PRIMARY KEY,
        menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        price INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Options 테이블 생성 완료')

    // Orders 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        total_amount INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'received',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (status IN ('pending', 'received', 'preparing', 'completed', 'cancelled'))
      )
    `)
    console.log('✅ Orders 테이블 생성 완료')

    // Order_Items 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        menu_id INTEGER NOT NULL REFERENCES menus(id),
        menu_name VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        options JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Order_Items 테이블 생성 완료')

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date DESC)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)
    `)
    console.log('✅ 인덱스 생성 완료')

    await client.query('COMMIT')
    console.log('\n✅ 모든 테이블이 성공적으로 생성되었습니다!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 테이블 생성 오류:', error.message)
    throw error
  } finally {
    client.release()
  }
}

// 초기 데이터 삽입
async function insertInitialData() {
  const client = await pool.connect()

  try {
    // 메뉴 데이터 확인
    const menuCheck = await client.query('SELECT COUNT(*) FROM menus')
    
    if (parseInt(menuCheck.rows[0].count) === 0) {
      console.log('\n초기 메뉴 데이터를 삽입합니다...')

      // 메뉴 삽입
      const menuResult = await client.query(`
        INSERT INTO menus (id, name, description, price, image, stock) VALUES
        (1, '아메리카노(ICE)', '시원하고 깔끔한 아이스 아메리카노', 4000, '/1.png', 10),
        (2, '아메리카노(HOT)', '따뜻하고 진한 핫 아메리카노', 4000, '/2.png', 10),
        (3, '카페라떼', '부드러운 우유와 에스프레소의 조화', 5000, '/3.png', 10),
        (4, '카푸치노', '에스프레소와 스팀 우유, 우유 거품의 완벽한 조합', 5000, '/4.png', 10),
        (5, '카라멜 마키아토', '달콤한 카라멜 시럽이 들어간 특별한 커피', 5500, '/5.png', 10),
        (6, '바닐라 라떼', '부드러운 바닐라 향이 가득한 라떼', 5500, '/6.png', 10)
        ON CONFLICT (id) DO NOTHING
        RETURNING id, name
      `)
      console.log('✅ 메뉴 데이터 삽입 완료')

      // 옵션 삽입 (모든 메뉴에 동일한 옵션 적용)
      const optionResult = await client.query(`
        INSERT INTO options (menu_id, name, price) VALUES
        (1, '샷 추가', 500), (1, '시럽 추가', 0),
        (2, '샷 추가', 500), (2, '시럽 추가', 0),
        (3, '샷 추가', 500), (3, '시럽 추가', 0),
        (4, '샷 추가', 500), (4, '시럽 추가', 0),
        (5, '샷 추가', 500), (5, '시럽 추가', 0),
        (6, '샷 추가', 500), (6, '시럽 추가', 0)
        ON CONFLICT DO NOTHING
      `)
      console.log('✅ 옵션 데이터 삽입 완료')
    } else {
      console.log('초기 데이터가 이미 존재합니다.')
    }
  } catch (error) {
    console.error('❌ 초기 데이터 삽입 오류:', error.message)
    throw error
  } finally {
    client.release()
  }
}

// 메인 실행
async function main() {
  try {
    await createTables()
    await insertInitialData()
    console.log('\n✅ 데이터베이스 설정이 완료되었습니다!')
    process.exit(0)
  } catch (error) {
    console.error('오류 발생:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
