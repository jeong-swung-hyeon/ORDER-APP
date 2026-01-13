import './Cart.css'

function Cart({ cartItems, onUpdateQuantity, onRemoveItem, onOrder }) {
  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const handleQuantityChange = (cartItemId, change) => {
    const item = cartItems.find(item => item.cartItemId === cartItemId)
    if (item) {
      const newQuantity = item.quantity + change
      if (newQuantity <= 0) {
        onRemoveItem(cartItemId)
      } else {
        onUpdateQuantity(cartItemId, newQuantity)
      }
    }
  }

  const formatOptions = (options) => {
    if (!options || options.length === 0) return ''
    return ` (${options.map(opt => opt.name).join(', ')})`
  }

  return (
    <div className="cart">
      <h2 className="cart-title">장바구니</h2>
      <div className="cart-content">
        <div className="cart-items-section">
          {cartItems.length === 0 ? (
            <p className="empty-cart">장바구니가 비어있습니다.</p>
          ) : (
            cartItems.map(item => (
              <div key={item.cartItemId} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">
                    {item.menuName}{formatOptions(item.selectedOptions)} X {item.quantity}
                  </span>
                </div>
                <div className="cart-item-price-section">
                  <span className="cart-item-price">{item.totalPrice.toLocaleString()}원</span>
                  <div className="cart-item-controls">
                    <button 
                      className="quantity-button"
                      onClick={() => handleQuantityChange(item.cartItemId, -1)}
                    >
                      -
                    </button>
                    <button 
                      className="quantity-button"
                      onClick={() => handleQuantityChange(item.cartItemId, 1)}
                    >
                      +
                    </button>
                    <button 
                      className="remove-button"
                      onClick={() => onRemoveItem(item.cartItemId)}
                    >
                      X
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-summary-section">
          <div className="total-amount">
            총 금액 <strong>{calculateTotal().toLocaleString()}원</strong>
          </div>
          <button 
            className={`order-button ${cartItems.length === 0 ? 'disabled' : ''}`}
            onClick={onOrder}
            disabled={cartItems.length === 0}
          >
            주문하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
