import pool from '../config/database.js'

// 데이터베이스 초기화 함수 (테이블 생성 및 초기 데이터 삽입)
export async function initializeDatabase() {
  const client = await pool.connect()
  
  try {
    console.log('데이터베이스 초기화를 시작합니다...')
    
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
    console.log('✅ Menus 테이블 확인 완료')

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
    console.log('✅ Options 테이블 확인 완료')

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
    console.log('✅ Orders 테이블 확인 완료')

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
    console.log('✅ Order_Items 테이블 확인 완료')

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
    console.log('✅ 인덱스 확인 완료')

    // 초기 데이터 삽입 (이미 존재하는 경우 스킵)
    const menuCheck = await client.query('SELECT COUNT(*) as count FROM menus')
    
    if (parseInt(menuCheck.rows[0].count) === 0) {
      console.log('초기 메뉴 데이터를 삽입합니다...')
      
      const initialMenus = [
        { name: '아메리카노(ICE)', price: 4000, description: '시원하고 깔끔한 아이스 아메리카노', image: '/1.png', stock: 10 },
        { name: '아메리카노(HOT)', price: 4000, description: '따뜻하고 진한 핫 아메리카노', image: '/2.png', stock: 10 },
        { name: '카페라떼', price: 5000, description: '부드러운 우유와 에스프레소의 조화', image: '/3.png', stock: 10 },
        { name: '카푸치노', price: 5000, description: '에스프레소와 스팀 우유, 우유 거품의 완벽한 조합', image: '/4.png', stock: 10 },
        { name: '카라멜 마키아토', price: 5500, description: '달콤한 카라멜 시럽이 들어간 특별한 커피', image: '/5.png', stock: 10 },
        { name: '바닐라 라떼', price: 5500, description: '부드러운 바닐라 향이 가득한 라떼', image: '/6.png', stock: 10 }
      ]

      for (const menu of initialMenus) {
        const menuResult = await client.query(
          'INSERT INTO menus (name, description, price, image, stock) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [menu.name, menu.description, menu.price, menu.image, menu.stock]
        )
        
        const menuId = menuResult.rows[0].id
        
        // 각 메뉴에 기본 옵션 추가
        await client.query(
          'INSERT INTO options (menu_id, name, price) VALUES ($1, $2, $3), ($4, $5, $6)',
          [menuId, '샷 추가', 500, menuId, '시럽 추가', 0]
        )
      }
      
      console.log('✅ 초기 메뉴 데이터 삽입 완료')
    } else {
      console.log('메뉴 데이터가 이미 존재합니다. 초기 데이터 삽입을 건너뜁니다.')
    }

    await client.query('COMMIT')
    console.log('✅ 데이터베이스 초기화가 완료되었습니다!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 데이터베이스 초기화 오류:', error)
    throw error
  } finally {
    client.release()
  }
}
