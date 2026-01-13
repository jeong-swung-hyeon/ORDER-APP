import './AdminDashboard.css'

function AdminDashboard({ orders }) {
  const stats = {
    totalOrders: orders.length,
    receivedOrders: orders.filter(o => o.status === 'received').length,
    preparingOrders: orders.filter(o => o.status === 'preparing').length,
    completedOrders: orders.filter(o => o.status === 'completed').length
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="dashboard-label">총 주문</div>
        <div className="dashboard-value">{stats.totalOrders}</div>
      </div>
      <div className="dashboard-card">
        <div className="dashboard-label">주문 접수</div>
        <div className="dashboard-value">{stats.receivedOrders}</div>
      </div>
      <div className="dashboard-card">
        <div className="dashboard-label">제조 중</div>
        <div className="dashboard-value">{stats.preparingOrders}</div>
      </div>
      <div className="dashboard-card">
        <div className="dashboard-label">제조 완료</div>
        <div className="dashboard-value">{stats.completedOrders}</div>
      </div>
    </div>
  )
}

export default AdminDashboard
