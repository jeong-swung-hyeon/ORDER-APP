import './OrderStatus.css'

function OrderStatus({ orders, onUpdateOrderStatus }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}월 ${day}일 ${hours}:${minutes}`
  }

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}시간 전`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}일 전`
  }

  const formatOrderItems = (items) => {
    return items.map(item => {
      const optionsText = item.options && item.options.length > 0 
        ? ` / 옵션: ${item.options.join(', ')}`
        : ''
      return `${item.menuName} x ${item.quantity}${optionsText}`
    }).join(', ')
  }

  const getActionButtonText = (status) => {
    switch (status) {
      case 'pending':
        return '주문 접수'
      case 'received':
        return '제조 시작'
      case 'preparing':
        return '제조 완료'
      case 'completed':
        return '완료'
      default:
        return ''
    }
  }

  const handleStatusChange = (orderId, currentStatus) => {
    let newStatus
    switch (currentStatus) {
      case 'pending':
        newStatus = 'received'
        break
      case 'received':
        newStatus = 'preparing'
        break
      case 'preparing':
        newStatus = 'completed'
        break
      default:
        return
    }
    onUpdateOrderStatus(orderId, newStatus)
  }

  const handleCancel = (orderId) => {
    if (window.confirm('주문을 취소하시겠습니까?')) {
      onUpdateOrderStatus(orderId, 'cancelled')
    }
  }

  const sortedOrders = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))

  return (
    <div className="order-status">
      <h2 className="section-title">주문 현황</h2>
      <div className="order-list">
        {sortedOrders.length === 0 ? (
          <p className="empty-orders">주문이 없습니다.</p>
        ) : (
          sortedOrders.map(order => (
            <div key={order.id} className="order-item">
              <div className="order-info">
                <div className="order-time">
                  {formatDate(order.orderDate)} ({getRelativeTime(order.orderDate)})
                </div>
                <div className="order-details">
                  {formatOrderItems(order.items)}
                </div>
                <div className="order-amount">
                  {order.totalAmount.toLocaleString()}원
                </div>
              </div>
              <div className="order-actions">
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <button
                    className="status-button"
                    onClick={() => handleStatusChange(order.id, order.status)}
                  >
                    {getActionButtonText(order.status)}
                  </button>
                )}
                {order.status === 'completed' && (
                  <span className="completed-badge">완료</span>
                )}
                {order.status === 'cancelled' && (
                  <span className="cancelled-badge">취소됨</span>
                )}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <button
                    className="cancel-button"
                    onClick={() => handleCancel(order.id)}
                  >
                    주문 취소
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default OrderStatus
