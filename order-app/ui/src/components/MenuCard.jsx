import { useState } from 'react'
import './MenuCard.css'

function MenuCard({ menu, onAddToCart, isOutOfStock = false }) {
  const [selectedOptions, setSelectedOptions] = useState([])
  const [imageError, setImageError] = useState(false)

  const handleOptionChange = (option) => {
    if (isOutOfStock) return
    setSelectedOptions(prev => {
      const isSelected = prev.find(opt => opt.name === option.name)
      if (isSelected) {
        return prev.filter(opt => opt.name !== option.name)
      } else {
        return [...prev, option]
      }
    })
  }

  const calculatePrice = () => {
    const optionsPrice = selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
    return menu.price + optionsPrice
  }

  const handleAddToCart = () => {
    if (isOutOfStock) return
    onAddToCart({
      menuId: menu.id,
      menuName: menu.name,
      basePrice: menu.price,
      selectedOptions: [...selectedOptions],
      quantity: 1
    })
    // 옵션 초기화
    setSelectedOptions([])
  }

  return (
    <div className="menu-card">
      <div className="menu-image">
        {menu.image && !imageError ? (
          <img 
            src={menu.image} 
            alt={menu.name}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="image-placeholder">이미지</div>
        )}
      </div>
      <div className="menu-info">
        <h3 className="menu-name">{menu.name}</h3>
        {isOutOfStock && <p className="out-of-stock-badge">품절</p>}
        <p className="menu-price">{calculatePrice().toLocaleString()}원</p>
        <p className="menu-description">{menu.description}</p>
        <div className="menu-options">
          {menu.options.map((option, index) => (
            <label key={index} className="option-label">
              <input
                type="checkbox"
                checked={selectedOptions.some(opt => opt.name === option.name)}
                onChange={() => handleOptionChange(option)}
                disabled={isOutOfStock}
              />
              <span>{option.name} {option.price > 0 ? `(+${option.price.toLocaleString()}원)` : '(+0원)'}</span>
            </label>
          ))}
        </div>
        <button 
          className={`add-to-cart-button ${isOutOfStock ? 'disabled' : ''}`} 
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? '품절' : '담기'}
        </button>
      </div>
    </div>
  )
}

export default MenuCard
