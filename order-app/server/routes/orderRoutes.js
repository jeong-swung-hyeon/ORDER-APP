import express from 'express'
import pool from '../config/database.js'

const router = express.Router()

// POST /api/orders - 주문 생성
router.post('/', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { items, totalAmount } = req.body

    // 유효성 검증
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: '주문 항목이 필요합니다.'
      })
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: '총 금액이 올바르지 않습니다.'
      })
    }

    await client.query('BEGIN')

    // 재고 확인 및 차감
    for (const item of items) {
      const stockCheck = await client.query(
        'SELECT stock FROM menus WHERE id = $1',
        [item.menuId]
      )

      if (stockCheck.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({ 
          error: 'Bad Request',
          message: `메뉴 ID ${item.menuId}를 찾을 수 없습니다.`
        })
      }

      const currentStock = stockCheck.rows[0].stock
      
      // 주문 접수/제조 중인 주문의 수량 계산
      const orderedQuantity = await client.query(`
        SELECT COALESCE(SUM(oi.quantity), 0) as ordered
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.menu_id = $1 
        AND o.status IN ('received', 'preparing')
      `, [item.menuId])

      const availableStock = currentStock - parseInt(orderedQuantity.rows[0].ordered)

      if (item.quantity > availableStock) {
        await client.query('ROLLBACK')
        return res.status(400).json({ 
          error: 'Bad Request',
          message: `재고가 부족합니다. (메뉴: ${item.menuName}, 가용 재고: ${availableStock}개)`
        })
      }

      // 재고 차감
      await client.query(
        'UPDATE menus SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [item.quantity, item.menuId]
      )
    }

    // 주문 생성
    const orderResult = await client.query(`
      INSERT INTO orders (order_date, total_amount, status)
      VALUES (CURRENT_TIMESTAMP, $1, 'received')
      RETURNING id, order_date, total_amount, status
    `, [totalAmount])

    const orderId = orderResult.rows[0].id

    // 주문 아이템 생성
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price, options)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `, [
        orderId,
        item.menuId,
        item.menuName,
        item.quantity,
        item.price,
        JSON.stringify(item.options || [])
      ])
    }

    await client.query('COMMIT')

    res.status(201).json({
      success: true,
      orderId: orderId,
      message: '주문이 완료되었습니다.'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('주문 생성 오류:', error)
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '주문을 처리하는 중 오류가 발생했습니다.'
    })
  } finally {
    client.release()
  }
})

// GET /api/orders - 주문 목록 조회
router.get('/', async (req, res) => {
  try {
    const { status } = req.query

    let query = `
      SELECT 
        o.id,
        o.order_date,
        o.total_amount,
        o.status
      FROM orders o
    `
    const params = []

    if (status) {
      query += ' WHERE o.status = $1'
      params.push(status)
    }

    query += ' ORDER BY o.order_date DESC'

    const ordersResult = await pool.query(query, params)
    const orders = ordersResult.rows

    // 각 주문의 아이템 조회
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const itemsResult = await pool.query(`
          SELECT 
            menu_id as "menuId",
            menu_name as "menuName",
            options,
            quantity,
            unit_price as price
          FROM order_items
          WHERE order_id = $1
        `, [order.id])

        return {
          id: order.id,
          orderDate: order.order_date.toISOString(),
          totalAmount: order.total_amount,
          status: order.status,
          items: itemsResult.rows.map(item => ({
            menuId: item.menuId,
            menuName: item.menuName,
            options: item.options || [],
            quantity: item.quantity,
            price: item.price
          }))
        }
      })
    )

    res.json({ orders: ordersWithItems })
  } catch (error) {
    console.error('주문 목록 조회 오류:', error)
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '주문 목록을 불러오는 중 오류가 발생했습니다.'
    })
  }
})

// GET /api/orders/:orderId - 주문 상세 조회
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params

    const orderResult = await pool.query(
      'SELECT id, order_date, total_amount, status FROM orders WHERE id = $1',
      [orderId]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: '주문을 찾을 수 없습니다.'
      })
    }

    const order = orderResult.rows[0]

    const itemsResult = await pool.query(`
      SELECT 
        menu_id as "menuId",
        menu_name as "menuName",
        options,
        quantity,
        unit_price as price
      FROM order_items
      WHERE order_id = $1
    `, [orderId])

    res.json({
      id: order.id,
      orderDate: order.order_date.toISOString(),
      totalAmount: order.total_amount,
      status: order.status,
      items: itemsResult.rows.map(item => ({
        menuId: item.menuId,
        menuName: item.menuName,
        options: item.options || [],
        quantity: item.quantity,
        price: item.price
      }))
    })
  } catch (error) {
    console.error('주문 상세 조회 오류:', error)
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '주문을 불러오는 중 오류가 발생했습니다.'
    })
  }
})

// PATCH /api/orders/:orderId/status - 주문 상태 변경
router.patch('/:orderId/status', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { orderId } = req.params
    const { status } = req.body

    // 유효성 검증
    const validStatuses = ['received', 'preparing', 'completed', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: '올바른 주문 상태를 입력해주세요.'
      })
    }

    // 주문 조회
    const orderResult = await client.query(
      'SELECT id, status FROM orders WHERE id = $1',
      [orderId]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: '주문을 찾을 수 없습니다.'
      })
    }

    const currentStatus = orderResult.rows[0].status

    // 상태 변경 유효성 검증
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: '완료되거나 취소된 주문은 상태를 변경할 수 없습니다.'
      })
    }

    if (status === 'cancelled' && (currentStatus !== 'received' && currentStatus !== 'preparing')) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: '주문 취소는 주문 접수 또는 제조 중 상태에서만 가능합니다.'
      })
    }

    await client.query('BEGIN')

    // 상태 업데이트
    await client.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, orderId]
    )

    // 주문 취소 시 재고 복구
    if (status === 'cancelled') {
      const itemsResult = await client.query(`
        SELECT menu_id, quantity
        FROM order_items
        WHERE order_id = $1
      `, [orderId])

      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE menus SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.quantity, item.menu_id]
        )
      }
    }

    await client.query('COMMIT')

    res.json({
      success: true,
      orderId: parseInt(orderId),
      status: status,
      message: '주문 상태가 변경되었습니다.'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('주문 상태 변경 오류:', error)
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '주문 상태를 변경하는 중 오류가 발생했습니다.'
    })
  } finally {
    client.release()
  }
})

export default router
