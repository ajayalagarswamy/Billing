// Admin menu management (CRUD operations)

let editingItemId = null;

// Load menu items for admin
function loadMenuItems() {
    const menuItems = getFromStorage('menuItems') || [];
    const itemsContainer = document.getElementById('menu-items-list');
    
    if (!itemsContainer) return;
    
    if (menuItems.length === 0) {
        itemsContainer.innerHTML = '<p class="no-items">No menu items. Add your first item below.</p>';
        return;
    }
    
    itemsContainer.innerHTML = menuItems.map(item => `
        <div class="admin-item-card">
            <div class="admin-item-image">
                <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2212%22 dy=%2210.5%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3E${encodeURIComponent(item.name)}%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="admin-item-details">
                <h3>${item.name}</h3>
                <div class="price-edit-container">
                    <label style="font-size: 12px; color: #666; margin-bottom: 5px; display: block;">Price:</label>
                    <div class="price-input-group">
                        <span class="currency-symbol">₹</span>
                        <input type="number" 
                               class="quick-price-input" 
                               value="${item.price}" 
                               min="0" 
                               step="0.01"
                               data-item-id="${item.id}"
                               onchange="updateItemPrice('${item.id}', this.value)"
                               style="width: 100px; padding: 8px 10px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    </div>
                </div>
                <p style="margin-top: 8px; font-size: 13px; color: #666;">Category: ${item.category || 'N/A'}</p>
                <div style="margin-top:8px;">
                    <label style="font-size:12px; color:#666; display:block; margin-bottom:6px;">Stock (units)</label>
                    <input type="number" min="0" value="${item.stock || 0}" style="width:100px; padding:8px; border-radius:8px; border:1px solid #e2e8f0;" onchange="updateItemStock('${item.id}', this.value)">
                    <div style="font-size:12px; color:#888; margin-top:6px;">Last updated: ${item.stockDate || 'N/A'}</div>
                </div>
            </div>
            <div class="admin-item-actions">
                <button class="btn-edit" onclick="editMenuItem('${item.id}')">Edit Full</button>
                <button class="btn-delete" onclick="deleteMenuItem('${item.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Update stock value for an item (owner action)
function updateItemStock(itemId, newStock) {
    const stockVal = parseInt(newStock, 10);
    if (isNaN(stockVal) || stockVal < 0) {
        alert('Please enter a valid stock number');
        loadMenuItems();
        return;
    }
    const menuItems = getFromStorage('menuItems') || [];
    const idx = menuItems.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    menuItems[idx].stock = stockVal;
    menuItems[idx].stockDate = getCurrentDate();
    saveToStorage('menuItems', menuItems);
    showNotification('Stock updated');
    loadMenuItems();
}

// Add new menu item
function addMenuItem(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const name = formData.get('name')?.trim();
    const price = parseFloat(formData.get('price'));
    const category = formData.get('category')?.trim() || 'other';
    const imageInput = form.querySelector('#item-image');
    
    // Validation
    if (!name || name.length === 0) {
        alert('Please enter item name');
        return;
    }
    
    if (!price || price <= 0 || isNaN(price)) {
        alert('Please enter a valid price');
        return;
    }
    
    // Handle image
    let imageUrl = formData.get('image-url')?.trim();
    
    if (imageInput && imageInput.files && imageInput.files[0]) {
        // Convert image to base64
        const file = imageInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imageUrl = e.target.result;
            saveMenuItem(name, price, category, imageUrl);
        };
        
        reader.readAsDataURL(file);
    } else {
        // Use URL or default image
        if (!imageUrl) {
            imageUrl = 'images/default-item.jpg';
        }
        saveMenuItem(name, price, category, imageUrl);
    }
}

// Save menu item (add or update)
function saveMenuItem(name, price, category, imageUrl) {
    const menuItems = getFromStorage('menuItems') || [];
    
    if (editingItemId) {
        // Update existing item
        const itemIndex = menuItems.findIndex(i => i.id === editingItemId);
        if (itemIndex !== -1) {
            menuItems[itemIndex] = ensureStockFieldsOnSave({
                ...menuItems[itemIndex],
                name,
                price,
                category,
                image: imageUrl
            });
            saveToStorage('menuItems', menuItems);
            showNotification('Item updated successfully');
        }
        editingItemId = null;
    } else {
        // Add new item
        const newItem = {
            id: generateId(),
            name,
            price,
            category,
            image: imageUrl
        };
        menuItems.push(ensureStockFieldsOnSave(newItem));
        saveToStorage('menuItems', menuItems);
        showNotification('Item added successfully');
    }
    
    // Reset form
    resetForm();
    loadMenuItems();
}

// Edit menu item
function editMenuItem(itemId) {
    const menuItems = getFromStorage('menuItems') || [];
    const item = menuItems.find(i => i.id === itemId);
    
    if (!item) {
        alert('Item not found');
        return;
    }
    
    editingItemId = itemId;
    
    // Populate form
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-category').value = item.category || 'other';
    document.getElementById('image-url').value = item.image.startsWith('data:') ? '' : item.image;
    
    // Change form button text
    const submitBtn = document.querySelector('#menu-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Update Item';
    }
    
    // Scroll to form
    document.getElementById('menu-form').scrollIntoView({ behavior: 'smooth' });
}

// Quick price update
function updateItemPrice(itemId, newPrice) {
    const price = parseFloat(newPrice);
    
    if (isNaN(price) || price < 0) {
        alert('Please enter a valid price');
        loadMenuItems(); // Reload to reset input
        return;
    }
    
    const menuItems = getFromStorage('menuItems') || [];
    const itemIndex = menuItems.findIndex(i => i.id === itemId);
    
    if (itemIndex !== -1) {
        menuItems[itemIndex].price = price;
        saveToStorage('menuItems', menuItems);
        showNotification(`Price updated to ${formatCurrency(price)}`);
        
        // Update cart if item is in cart
        const cart = getFromStorage('cart') || [];
        const cartItem = cart.find(c => c.itemId === itemId);
        if (cartItem) {
            cartItem.price = price;
            saveToStorage('cart', cart);
        }
    }
}

// Delete menu item
function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    const menuItems = getFromStorage('menuItems') || [];
    const filteredItems = menuItems.filter(i => i.id !== itemId);
    
    saveToStorage('menuItems', filteredItems);
    loadMenuItems();
    showNotification('Item deleted successfully');
    
    // Also remove from cart if present
    const cart = getFromStorage('cart') || [];
    const filteredCart = cart.filter(c => c.itemId !== itemId);
    saveToStorage('cart', filteredCart);
}

// When saving/updating menu item, ensure stock fields are preserved or defaulted
function ensureStockFieldsOnSave(item) {
    if (typeof item.stock === 'undefined') item.stock = 0;
    if (!item.stockDate) item.stockDate = getCurrentDate();
    return item;
}

// Reset form
function resetForm() {
    const form = document.getElementById('menu-form');
    if (form) {
        form.reset();
        editingItemId = null;
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Add Item';
        }
        
        const imageInput = form.querySelector('#item-image');
        if (imageInput) {
            imageInput.value = '';
        }
    }
}

// Manage UPI ID
function saveUPIId() {
    const upiInput = document.getElementById('upi-id-input');
    if (!upiInput) return;
    
    const upiId = upiInput.value.trim();
    if (!upiId) {
        alert('Please enter UPI ID');
        return;
    }
    
    saveToStorage('upiId', upiId);
    showNotification('UPI ID saved successfully');
}

// Load UPI ID
function loadUPIId() {
    const upiId = getFromStorage('upiId') || 'your-upi-id@paytm';
    const upiInput = document.getElementById('upi-id-input');
    if (upiInput) {
        upiInput.value = upiId;
    }
    
    // Load QR code if exists
    loadQRCodePreview();
}

// Handle QR code upload
function handleQRCodeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const qrCodeData = e.target.result;
        saveToStorage('staticQRCode', qrCodeData);
        showQRCodePreview(qrCodeData);
        showNotification('QR Code uploaded successfully');
    };
    
    reader.readAsDataURL(file);
}

// Show QR code preview
function showQRCodePreview(imageData) {
    const previewDiv = document.getElementById('qr-code-preview');
    const previewImg = document.getElementById('qr-code-preview-img');
    
    if (previewDiv && previewImg) {
        previewImg.src = imageData;
        previewDiv.style.display = 'block';
    }
}

// Load QR code preview
function loadQRCodePreview() {
    const qrCodeData = getFromStorage('staticQRCode');
    if (qrCodeData) {
        showQRCodePreview(qrCodeData);
    }
}

// Remove QR code
function removeQRCode() {
    if (confirm('Are you sure you want to remove the static QR code?')) {
        localStorage.removeItem('staticQRCode');
        const previewDiv = document.getElementById('qr-code-preview');
        const uploadInput = document.getElementById('qr-code-upload');
        
        if (previewDiv) previewDiv.style.display = 'none';
        if (uploadInput) uploadInput.value = '';
        
        showNotification('QR Code removed');
    }
}

// Initialize admin page
document.addEventListener('DOMContentLoaded', function() {
    initializeDefaultData();
    loadMenuItems();
    loadUPIId();
    
    const form = document.getElementById('menu-form');
    if (form) {
        form.addEventListener('submit', addMenuItem);
    }
});

