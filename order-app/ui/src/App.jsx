import { useState, useEffect } from 'react'
import Header from './components/Header'
import MenuCard from './components/MenuCard'
import Cart from './components/Cart'
import AdminDashboard from './components/AdminDashboard'
import InventoryStatus from './components/InventoryStatus'
import OrderStatus from './components/OrderStatus'
import './App.css'

// 환경 변수에서 API URL 가져오기 (빌드 타임에 주입됨)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

function App() {
  const [currentPage, setCurrentPage] = useState('order')
  const [cartItems, setCartItems] = useState([])
  const [orders, setOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [menuData, setMenuData] = useState([])
  const [loading, setLoading] = useState(true)

  // 메뉴 데이터 로드
  useEffect(() => {
    fetchMenus()
    fetchInventory()
    fetchOrders()
  }, [])

  // 주문 목록 주기적으로 갱신 (관리자 화면)
  useEffect(() => {
    if (currentPage === 'admin') {
      const interval = setInterval(() => {
        fetchOrders()
        fetchInventory()
      }, 3000) // 3초마다 갱신
      return () => clearInterval(interval)
    }
  }, [currentPage])

  const fetchMenus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/menus`)
      if (!response.ok) {
        throw new Error('서버 응답 오류')
      }
      const data = await response.json()
      setMenuData(data.menus || [])
    } catch (error) {
      console.error('메뉴 로드 오류:', error)
      // 서버 연결 실패 시 기본 메뉴 데이터 사용
      setMenuData([
        {
          id: 1,
          name: '아메리카노(ICE)',
          price: 4000,
          description: '시원하고 깔끔한 아이스 아메리카노',
          image: '/1.png',
          options: [
            { id: 1, name: '샷 추가', price: 500 },
            { id: 2, name: '시럽 추가', price: 0 }
          ]
        },
        {
          id: 2,
          name: '아메리카노(HOT)',
          price: 4000,
          description: '따뜻하고 진한 핫 아메리카노',
          image: '/2.png',
          options: [
            { id: 3, name: '샷 추가', price: 500 },
            { id: 4, name: '시럽 추가', price: 0 }
          ]
        },
        {
          id: 3,
          name: '카페라떼',
          price: 5000,
          description: '부드러운 우유와 에스프레소의 조화',
          image: '/3.png',
          options: [
            { id: 5, name: '샷 추가', price: 500 },
            { id: 6, name: '시럽 추가', price: 0 }
          ]
        },
        {
          id: 4,
          name: '카푸치노',
          price: 5000,
          description: '에스프레소와 스팀 우유, 우유 거품의 완벽한 조합',
          image: '/4.png',
          options: [
            { id: 7, name: '샷 추가', price: 500 },
            { id: 8, name: '시럽 추가', price: 0 }
          ]
        },
        {
          id: 5,
          name: '카라멜 마키아토',
          price: 5500,
          description: '달콤한 카라멜 시럽이 들어간 특별한 커피',
          image: '/5.png',
          options: [
            { id: 9, name: '샷 추가', price: 500 },
            { id: 10, name: '시럽 추가', price: 0 }
          ]
        },
        {
          id: 6,
          name: '바닐라 라떼',
          price: 5500,
          description: '부드러운 바닐라 향이 가득한 라떼',
          image: '/6.png',
          options: [
            { id: 11, name: '샷 추가', price: 500 },
            { id: 12, name: '시럽 추가', price: 0 }
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/menus/stock`)
      if (!response.ok) {
        throw new Error('서버 응답 오류')
      }
      const data = await response.json()
      setInventory(data.inventory || [])
    } catch (error) {
      console.error('재고 로드 오류:', error)
      // 서버 연결 실패 시 기본 재고 데이터 사용
      setInventory([
        { menuId: 1, menuName: '아메리카노(ICE)', stock: 10 },
        { menuId: 2, menuName: '아메리카노(HOT)', stock: 10 },
        { menuId: 3, menuName: '카페라떼', stock: 10 },
        { menuId: 4, menuName: '카푸치노', stock: 10 },
        { menuId: 5, menuName: '카라멜 마키아토', stock: 10 },
        { menuId: 6, menuName: '바닐라 라떼', stock: 10 }
      ])
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`)
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('주문 목록 로드 오류:', error)
    }
  }

  const generateCartItemId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  // 가용 재고 계산 (현재 재고 - 주문 접수/제조 중인 주문 수량)
  const getAvailableStock = (menuId) => {
    // 재고 데이터가 아직 로드되지 않았으면 기본값 반환 (무한대)
    if (inventory.length === 0) {
      return 999 // 재고 데이터 로딩 중에는 주문 가능하도록 큰 값 반환
    }
    
    const stockItem = inventory.find(inv => inv.menuId === menuId)
    // 재고 정보가 없으면 기본값 반환
    if (!stockItem) {
      return 999 // 메뉴에 대한 재고 정보가 없으면 주문 가능하도록
    }
    
    const orderedQuantity = orders
      .filter(order => order.status === 'received' || order.status === 'preparing')
      .reduce((total, order) => {
        if (!order.items || !Array.isArray(order.items)) return total
        const itemQuantity = order.items
          .filter(item => item.menuId === menuId)
          .reduce((sum, item) => sum + item.quantity, 0)
        return total + itemQuantity
      }, 0)
    
    return Math.max(0, stockItem.stock - orderedQuantity)
  }

  const findCartItem = (menuId, selectedOptions) => {
    return cartItems.find(item => {
      if (item.menuId !== menuId) return false
      if (item.selectedOptions.length !== selectedOptions.length) return false
      
      const itemOptions = item.selectedOptions.map(opt => opt.name).sort()
      const newOptions = selectedOptions.map(opt => opt.name).sort()
      
      return JSON.stringify(itemOptions) === JSON.stringify(newOptions)
    })
  }

  const handleAddToCart = (item) => {
    const availableStock = getAvailableStock(item.menuId)
    
    // 장바구니에 이미 있는 수량 계산
    const cartQuantity = cartItems
      .filter(cartItem => cartItem.menuId === item.menuId)
      .reduce((sum, cartItem) => sum + cartItem.quantity, 0)
    
    // 가용 재고 확인
    if (cartQuantity >= availableStock) {
      alert(`재고가 부족합니다.\n가용 재고: ${availableStock}개`)
      return
    }
    
    const existingItem = findCartItem(item.menuId, item.selectedOptions)
    
    if (existingItem) {
      // 동일한 메뉴와 옵션 조합이 있으면 수량 증가
      const newQuantity = existingItem.quantity + 1
      
      // 가용 재고 재확인
      if (cartQuantity >= availableStock) {
        alert(`재고가 부족합니다.\n가용 재고: ${availableStock}개`)
        return
      }
      
      const optionsPrice = item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
      const newTotalPrice = (item.basePrice + optionsPrice) * newQuantity
      
      setCartItems(prev => prev.map(cartItem => 
        cartItem.cartItemId === existingItem.cartItemId
          ? { ...cartItem, quantity: newQuantity, totalPrice: newTotalPrice }
          : cartItem
      ))
    } else {
      // 새로운 아이템 추가
      const optionsPrice = item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
      const totalPrice = (item.basePrice + optionsPrice) * item.quantity
      
      setCartItems(prev => [...prev, {
        cartItemId: generateCartItemId(),
        menuId: item.menuId,
        menuName: item.menuName,
        basePrice: item.basePrice,
        selectedOptions: item.selectedOptions,
        quantity: item.quantity,
        totalPrice: totalPrice
      }])
    }
  }

  const handleUpdateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId)
      return
    }
    
    setCartItems(prev => {
      const targetItem = prev.find(item => item.cartItemId === cartItemId)
      if (!targetItem) return prev
      
      const availableStock = getAvailableStock(targetItem.menuId)
      
      // 장바구니에 있는 다른 아이템들의 수량 계산 (현재 아이템 제외)
      const otherItemsQuantity = prev
        .filter(item => item.menuId === targetItem.menuId && item.cartItemId !== cartItemId)
        .reduce((sum, item) => sum + item.quantity, 0)
      
      // 가용 재고 확인
      if (otherItemsQuantity + newQuantity > availableStock) {
        alert(`재고가 부족합니다.\n가용 재고: ${availableStock}개\n현재 장바구니: ${otherItemsQuantity}개`)
        return prev
      }
      
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const optionsPrice = item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
          const newTotalPrice = (item.basePrice + optionsPrice) * newQuantity
          return { ...item, quantity: newQuantity, totalPrice: newTotalPrice }
        }
        return item
      })
    })
  }

  const handleRemoveItem = (cartItemId) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId))
  }

  const handleOrder = async () => {
    if (cartItems.length === 0) return
    
    const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const orderData = {
      items: cartItems.map(item => ({
        menuId: item.menuId,
        menuName: item.menuName,
        options: item.selectedOptions.map(opt => opt.name),
        quantity: item.quantity,
        price: item.totalPrice / item.quantity
      })),
      totalAmount: totalAmount
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || '주문 처리 중 오류가 발생했습니다.')
      }

      alert(`주문이 완료되었습니다!\n총 금액: ${totalAmount.toLocaleString()}원`)
      
      // 장바구니 초기화
      setCartItems([])
      
      // 주문 목록 및 재고 갱신
      await fetchOrders()
      await fetchInventory()
    } catch (error) {
      console.error('주문 오류:', error)
      alert(error.message || '주문 처리 중 오류가 발생했습니다.')
    }
  }

  const handleUpdateStock = async (menuId, newStock) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menus/${menuId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock: newStock })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || '재고 업데이트 중 오류가 발생했습니다.')
      }

      // 재고 목록 갱신
      await fetchInventory()
    } catch (error) {
      console.error('재고 업데이트 오류:', error)
      alert(error.message || '재고 업데이트 중 오류가 발생했습니다.')
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || '주문 상태 변경 중 오류가 발생했습니다.')
      }

      // 주문 목록 및 재고 갱신
      await fetchOrders()
      await fetchInventory()
    } catch (error) {
      console.error('주문 상태 변경 오류:', error)
      alert(error.message || '주문 상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleNavigate = (page) => {
    setCurrentPage(page)
  }

  return (
    <div className="App">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="main-content">
        {currentPage === 'order' && (
          <>
            <div className="menu-section">
              <h1 className="section-title">메뉴</h1>
              <div className="menu-grid">
                {loading ? (
                  <p>메뉴를 불러오는 중...</p>
                ) : menuData.length === 0 ? (
                  <p>메뉴가 없습니다.</p>
                ) : (
                  menuData.map(menu => {
                    const availableStock = getAvailableStock(menu.id)
                    const isOutOfStock = availableStock === 0
                    return (
                      <MenuCard 
                        key={menu.id} 
                        menu={menu} 
                        onAddToCart={handleAddToCart}
                        isOutOfStock={isOutOfStock}
                      />
                    )
                  })
                )}
              </div>
            </div>
            <Cart 
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onOrder={handleOrder}
            />
          </>
        )}
        {currentPage === 'admin' && (
          <>
            <AdminDashboard orders={orders} />
            <InventoryStatus 
              inventory={inventory}
              onUpdateStock={handleUpdateStock}
              orders={orders}
            />
            <OrderStatus 
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App
