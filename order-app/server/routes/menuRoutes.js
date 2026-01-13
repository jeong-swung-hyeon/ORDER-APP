import express from 'express'
import pool from '../config/database.js'

const router = express.Router()

// GET /api/menus - 메뉴 목록 조회
router.get('/', async (req, res) => {
  try {
    // 메뉴와 옵션을 함께 조회
    const menusQuery = `
      SELECT 
        m.id,
        m.name,
        m.description,
        m.price,
        m.image,
        m.stock
      FROM menus m
      ORDER BY m.id
    `
    
    const menusResult = await pool.query(menusQuery)
    const menus = menusResult.rows

    // 각 메뉴의 옵션 조회
    const optionsQuery = `
      SELECT 
        id,
        menu_id,
        name,
        price
      FROM options
      ORDER BY menu_id, id
    `
    
    const optionsResult = await pool.query(optionsQuery)
    const options = optionsResult.rows

    // 메뉴에 옵션 추가
    const menusWithOptions = menus.map(menu => ({
      id: menu.id,
      name: menu.name,
      description: menu.description,
      price: menu.price,
      image: menu.image,
      stock: menu.stock,
      options: options
        .filter(opt => opt.menu_id === menu.id)
        .map(opt => ({
          id: opt.id,
          name: opt.name,
          price: opt.price
        }))
    }))

    res.json({ menus: menusWithOptions })
  } catch (error) {
    console.error('메뉴 조회 오류:', error)
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '메뉴를 불러오는 중 오류가 발생했습니다.'
    })
  }
})

// GET /api/menus/stock - 재고 조회
router.get('/stock', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        stock
      FROM menus
      ORDER BY id
    `
    
    const result = await pool.query(query)
    
    // 명시적으로 camelCase로 변환
    const inventory = result.rows.map(row => ({
      menuId: row.id,
      menuName: row.name,
      stock: row.stock
    }))
    
    res.json({ inventory })
  } catch (error) {
    console.error('재고 조회 오류:', error)
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '재고를 불러오는 중 오류가 발생했습니다.'
    })
  }
})

// PATCH /api/menus/:menuId/stock - 재고 업데이트
router.patch('/:menuId/stock', async (req, res) => {
  try {
    const { menuId } = req.params
    const { stock } = req.body

    // 유효성 검증
    if (stock === undefined || stock === null) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: '재고 수량을 입력해주세요.'
      })
    }

    const stockNum = parseInt(stock)
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: '재고 수량은 0 이상의 숫자여야 합니다.'
      })
    }

    // 메뉴 존재 확인
    const menuCheck = await pool.query('SELECT id FROM menus WHERE id = $1', [menuId])
    if (menuCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: '메뉴를 찾을 수 없습니다.'
      })
    }

    // 재고 업데이트
    const updateQuery = `
      UPDATE menus 
      SET stock = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, stock
    `
    
    const result = await pool.query(updateQuery, [stockNum, menuId])

    res.json({
      success: true,
      menuId: parseInt(menuId),
      stock: result.rows[0].stock,
      message: '재고가 업데이트되었습니다.'
    })
  } catch (error) {
    console.error('재고 업데이트 오류:', error)
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '재고를 업데이트하는 중 오류가 발생했습니다.'
    })
  }
})

export default router
