// Menu display and cart functionality

// Load and display menu items
function loadMenu() {
    const menuItems = getFromStorage('menuItems') || [];
    const menuContainer = document.getElementById('menu-container');
    
    if (!menuContainer) return;
    
    if (menuItems.length === 0) {
        menuContainer.innerHTML = '<p class="no-items">No menu items available. Add items from Admin page.</p>';
        return;
    }
    
    menuContainer.innerHTML = menuItems.map(item => {
        const cart = getFromStorage('cart') || [];
        const cartItem = cart.find(c => c.itemId === item.id);
        const currentQuantity = cartItem ? cartItem.quantity : 0;
        
        const availableStock = typeof item.stock === 'number' ? item.stock : Infinity;
        const outOfStock = availableStock <= 0;

        return `
        <div class="menu-item-card">
            <div class="item-image" onclick="addToCart('${item.id}')">
                <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2214%22 dy=%2210.5%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3E${encodeURIComponent(item.name)}%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <p class="item-price">${formatCurrency(item.price)}</p>
                <div style="font-size:13px; color:${outOfStock ? '#d9534f' : '#666'}; font-weight:600;">${outOfStock ? 'Out of stock' : 'Stock: ' + availableStock}</div>
                ${currentQuantity > 0 ? `
                    <div class="menu-quantity-controls">
                        <button class="menu-qty-btn decrease" onclick="event.stopPropagation(); updateMenuQuantity('${item.id}', -1)">−</button>
                        <span class="menu-quantity">${currentQuantity}</span>
                        <button class="menu-qty-btn" onclick="event.stopPropagation(); updateMenuQuantity('${item.id}', 1)">+</button>
                    </div>
                ` : `
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${item.id}')" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'Out of Stock' : 'Add to Cart'}</button>
                `}
            </div>
        </div>
    `;
    }).join('');
}

// Add item to cart
function addToCart(itemId) {
    const menuItems = getFromStorage('menuItems') || [];
    const cart = getFromStorage('cart') || [];
    
    const item = menuItems.find(i => i.id === itemId);
    if (!item) {
        alert('Item not found');
        return;
    }
    // check stock before adding
    if (typeof item.stock === 'number' && item.stock <= 0) {
        alert('Item is out of stock');
        return;
    }
    
    // Check if item already in cart
    const existingItem = cart.find(c => c.itemId === itemId);
    
    if (existingItem) {
        // Increment quantity
        existingItem.quantity += 1;
    } else {
        // Add new item to cart
        cart.push({
            itemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }
    
    saveToStorage('cart', cart);
    updateCartCount();
    loadMenu(); // Reload menu to show quantity controls and stock state
    
    // Show feedback
    showNotification(`${item.name} added to cart!`);
}

// Update quantity from menu page
function updateMenuQuantity(itemId, change) {
    const cart = getFromStorage('cart') || [];
    const item = cart.find(c => c.itemId === itemId);
    const menuItems = getFromStorage('menuItems') || [];
    const menuItem = menuItems.find(m => m.id === itemId);
    const availableStock = (menuItem && typeof menuItem.stock === 'number') ? menuItem.stock : Infinity;
    
    if (!item && change > 0) {
        // If item not in cart and increasing, add it (only if enough stock)
        if (availableStock <= 0) { alert('Item is out of stock'); return; }
        addToCart(itemId);
        return;
    }
    
    if (!item) return;
    
    item.quantity += change;

    // Respect stock limits
    if (menuItem && typeof menuItem.stock === 'number' && item.quantity > menuItem.stock) {
        item.quantity = menuItem.stock;
        showNotification('Reached available stock limit');
    }
    
    if (item.quantity <= 0) {
        // Remove from cart
        const filteredCart = cart.filter(c => c.itemId !== itemId);
        saveToStorage('cart', filteredCart);
        showNotification('Item removed from cart');
    } else {
        saveToStorage('cart', cart);
        showNotification(`Quantity updated to ${item.quantity}`);
    }
    
    updateCartCount();
    loadMenu(); // Reload menu to update quantity display
}

// Update cart count and total in header
function updateCartCount() {
    const cart = getFromStorage('cart') || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update cart count
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'inline-block' : 'none';
    });
    
    // Update cart total
    const cartTotalElements = document.querySelectorAll('.cart-total');
    cartTotalElements.forEach(el => {
        el.textContent = formatCurrency(totalAmount);
        el.style.display = totalAmount > 0 ? 'inline-block' : 'none';
    });
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide and remove after 2 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Initialize menu page
document.addEventListener('DOMContentLoaded', function() {
    initializeDefaultData();
    loadMenu();
    updateCartCount();
});

