import { useState } from 'react'
import './InventoryStatus.css'

function InventoryStatus({ inventory, onUpdateStock, orders = [] }) {
  const [inputValues, setInputValues] = useState({})

  // 주문 수량 계산 (주문 접수, 제조 중 상태인 주문만 포함)
  const calculateOrderedQuantity = (menuId) => {
    return orders
      .filter(order => order.status === 'received' || order.status === 'preparing')
      .reduce((total, order) => {
        const itemQuantity = order.items
          .filter(item => item.menuId === menuId)
          .reduce((sum, item) => sum + item.quantity, 0)
        return total + itemQuantity
      }, 0)
  }

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: '품절', class: 'out-of-stock' }
    if (stock < 5) return { text: '주의', class: 'warning' }
    return { text: '정상', class: 'normal' }
  }

  const handleStockChange = (menuId, change) => {
    const currentStock = inventory.find(inv => inv.menuId === menuId)?.stock || 0
    const newStock = Math.max(0, currentStock + change)
    onUpdateStock(menuId, newStock)
  }

  const getAvailableStock = (menuId) => {
    const item = inventory.find(inv => inv.menuId === menuId)
    if (!item) return 0
    const orderedQuantity = calculateOrderedQuantity(menuId)
    return Math.max(0, item.stock - orderedQuantity)
  }

  const getActualStock = (menuId) => {
    const item = inventory.find(inv => inv.menuId === menuId)
    return item ? item.stock : 0
  }

  const handleDirectInput = (menuId) => {
    const value = inputValues[menuId]
    if (value !== undefined && value !== '') {
      const numValue = parseInt(value)
      if (!isNaN(numValue) && numValue >= 0) {
        onUpdateStock(menuId, numValue)
        setInputValues(prev => ({ ...prev, [menuId]: '' }))
      }
    }
  }

  return (
    <div className="inventory-status">
      <h2 className="section-title">관리자 화면의 재고현황</h2>
      <div className="inventory-grid">
        {inventory.map(item => {
          const orderedQuantity = calculateOrderedQuantity(item.menuId)
          const availableStock = Math.max(0, item.stock - orderedQuantity)
          const status = getStockStatus(availableStock)
          return (
            <div key={item.menuId} className="inventory-card">
              <div className="inventory-menu-name">{item.menuName}</div>
              <div className="inventory-stock-info">
                <span className="inventory-stock">{availableStock}개</span>
                <span className={`inventory-status-badge ${status.class}`}>
                  {status.text}
                </span>
              </div>
              <div className="inventory-controls">
                <div className="stock-buttons">
                  <button 
                    className="stock-button"
                    onClick={() => handleStockChange(item.menuId, -10)}
                    disabled={getActualStock(item.menuId) === 0}
                  >
                    -10
                  </button>
                  <button 
                    className="stock-button"
                    onClick={() => handleStockChange(item.menuId, -1)}
                    disabled={getActualStock(item.menuId) === 0}
                  >
                    -
                  </button>
                  <button 
                    className="stock-button"
                    onClick={() => handleStockChange(item.menuId, 1)}
                  >
                    +
                  </button>
                  <button 
                    className="stock-button"
                    onClick={() => handleStockChange(item.menuId, 10)}
                  >
                    +10
                  </button>
                </div>
                <div className="direct-input">
                  <input
                    type="number"
                    min="0"
                    placeholder="직접 입력"
                    value={inputValues[item.menuId] || ''}
                    onChange={(e) => setInputValues(prev => ({ ...prev, [item.menuId]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleDirectInput(item.menuId)}
                  />
                  <button 
                    className="confirm-button"
                    onClick={() => handleDirectInput(item.menuId)}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InventoryStatus
