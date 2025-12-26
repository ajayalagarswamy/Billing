// Cart management and billing functionality

let currentBill = null;
let currentPaymentMode = 'UPI';

// Load and display cart
function loadCart() {
    const cart = getFromStorage('cart') || [];
    const cartContainer = document.getElementById('cart-items');
    const emptyCartMsg = document.getElementById('empty-cart-msg');
    const cartContent = document.getElementById('cart-content');
    const billSection = document.getElementById('bill-section');
    
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        if (emptyCartMsg) emptyCartMsg.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        if (billSection) billSection.style.display = 'none';
        return;
    }
    
    if (emptyCartMsg) emptyCartMsg.style.display = 'none';
    if (cartContent) cartContent.style.display = 'block';
    if (billSection) billSection.style.display = 'block';
    
    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="item-price">${formatCurrency(item.price)} each</p>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button class="qty-btn decrease" onclick="updateQuantity('${item.itemId}', -1)" title="Decrease quantity">−</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity('${item.itemId}', 1)" title="Increase quantity">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart('${item.itemId}')">🗑️ Remove</button>
            </div>
            <div class="cart-item-total">
                <strong>${formatCurrency(item.price * item.quantity)}</strong>
            </div>
        </div>
    `).join('');
    
    calculateTotal();
}

// Update item quantity
function updateQuantity(itemId, change) {
    const cart = getFromStorage('cart') || [];
    const item = cart.find(c => c.itemId === itemId);
    
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(itemId);
    } else {
        saveToStorage('cart', cart);
        loadCart();
        updateCartCount();
    }
}

// Remove item from cart
function removeFromCart(itemId) {
    const cart = getFromStorage('cart') || [];
    const filteredCart = cart.filter(c => c.itemId !== itemId);
    
    saveToStorage('cart', filteredCart);
    loadCart();
    updateCartCount();
}

// Clear entire cart
function clearCart() {
    if (confirm('Are you sure you want to clear the cart?')) {
        saveToStorage('cart', []);
        loadCart();
        updateCartCount();
        showNotification('Cart cleared');
    }
}

// Calculate total
function calculateTotal() {
    const cart = getFromStorage('cart') || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // You can add tax here if needed
    const tax = 0;
    const total = subtotal + tax;
    
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (taxEl) taxEl.textContent = formatCurrency(tax);
    if (totalEl) totalEl.textContent = formatCurrency(total);
    
    return { subtotal, tax, total };
}

// Process payment
function processPayment() {
    const cart = getFromStorage('cart') || [];
    
    if (cart.length === 0) {
        alert('Cart is empty');
        return;
    }
    
    const totals = calculateTotal();
    const upiId = getFromStorage('upiId') || 'your-upi-id@paytm';
    
    // Create bill
    currentBill = {
        id: generateId(),
        date: getCurrentDate(),
        items: cart.map(item => ({ ...item })),
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: currentPaymentMode || 'UPI'
    };
    
    // Show payment modal
    showPaymentModal(upiId, totals.total);
}

// Show payment modal with QR code
function showPaymentModal(upiId, amount) {
    const modal = document.getElementById('payment-modal');
    if (!modal) return;

    // Default to UPI each time modal opens
    currentPaymentMode = 'UPI';
    const upiRadio = document.querySelector('input[name="payment-mode"][value="UPI"]');
    if (upiRadio) upiRadio.checked = true;
    setPaymentMode('UPI', upiId, amount);
    
    // Update modal content
    const amountEl = document.getElementById('payment-amount');
    if (amountEl) amountEl.textContent = formatCurrency(amount);
    
    // Show modal
    modal.style.display = 'flex';
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.style.display = 'none';
}

// Set payment mode (UPI or Cash)
function setPaymentMode(mode, upiId, amount) {
    currentPaymentMode = mode;
    const effectiveAmount = amount !== undefined ? amount : (currentBill ? currentBill.total : 0);
    const effectiveUpi = upiId || getFromStorage('upiId') || 'your-upi-id@paytm';
    const qrContainer = document.getElementById('qr-code-container');
    const upiInfo = document.getElementById('upi-info');
    const qrHint = document.getElementById('qr-hint');
    const cashHint = document.getElementById('cash-hint');
    const upiIdText = document.getElementById('payment-upi-id');
    const staticQRCode = getFromStorage('staticQRCode');
    
    if (mode === 'Cash') {
        if (qrContainer) qrContainer.innerHTML = '';
        if (upiInfo) upiInfo.style.display = 'none';
        if (qrHint) qrHint.style.display = 'none';
        if (cashHint) cashHint.style.display = 'block';
    } else {
        if (upiInfo) upiInfo.style.display = 'block';
        if (qrHint) qrHint.style.display = 'block';
        if (cashHint) cashHint.style.display = 'none';
        if (qrContainer) {
            if (staticQRCode) {
                qrContainer.innerHTML = `<img src="${staticQRCode}" alt="Payment QR Code" style="max-width: 100%; border-radius: 10px; border: 2px solid #e2e8f0;">`;
                // show amount under QR
                const amtHtml = `<div class="qr-amount" style="text-align:center; margin-top:8px; font-weight:700; color:#2d3748">Amount: ${formatCurrency(effectiveAmount || 0)}</div>`;
                qrContainer.insertAdjacentHTML('beforeend', amtHtml);
            } else {
                generateQRCode(effectiveUpi, effectiveAmount || 0, 'qr-code-container');
                // append visible amount text under qr
                const amtHtml = `<div class="qr-amount" style="text-align:center; margin-top:8px; font-weight:700; color:#2d3748">Amount: ${formatCurrency(effectiveAmount || 0)}</div>`;
                // small timeout to ensure QR canvas exists
                setTimeout(()=>{
                    const c = document.getElementById('qr-code-container');
                    if (c) c.insertAdjacentHTML('beforeend', amtHtml);
                }, 80);
            }
        }
        if (upiIdText) {
            if (staticQRCode) {
                upiIdText.textContent = effectiveUpi + ' (Static QR Code)';
            } else {
                upiIdText.textContent = effectiveUpi;
            }
        }
    }
}

// Confirm payment
function confirmPayment() {
    if (!currentBill) return;

    // Ensure payment method stored
    currentBill.paymentMethod = currentPaymentMode || 'UPI';
    currentBill.status = 'paid';

    // Save sale to localStorage
    const sales = getFromStorage('sales') || [];
    const savedSale = { ...currentBill };
    sales.push(savedSale);
    saveToStorage('sales', sales);

    // Deduct stock quantities for sold items
    try {
        const menuItems = getFromStorage('menuItems') || [];
        savedSale.items.forEach(soldItem => {
            const miIdx = menuItems.findIndex(m => m.id === soldItem.itemId);
            if (miIdx !== -1 && typeof menuItems[miIdx].stock === 'number') {
                menuItems[miIdx].stock = Math.max(0, (menuItems[miIdx].stock || 0) - (soldItem.quantity || 0));
                menuItems[miIdx].stockDate = getCurrentDate();
            }
        });
        saveToStorage('menuItems', menuItems);
    } catch (e) { console.error('Stock update failed', e); }
    // refresh menu so stock status (Out of stock) shows immediately
    try { if (typeof loadMenu === 'function') loadMenu(); } catch (e) { /* ignore */ }

    // Update header badge
    setLastPaymentBadge('Paid', savedSale.paymentMethod || '');

    // If payment was cash, show payment status and print receipt automatically
    if ((savedSale.paymentMethod || '').toLowerCase() === 'cash') {
        const status = document.getElementById('payment-status');
        if (status) status.style.display = 'flex';
        try { printSale(savedSale); } catch (e) { console.error('printSale error', e); }
    }

    // Close modal
    closePaymentModal();

    // Show success modal with print option
    try { showPaymentSuccess(savedSale); } catch (e) { console.error(e); }

    // Clear cart and refresh
    saveToStorage('cart', []);
    loadCart();
    updateCartCount();

    // Notification
    showNotification('Payment confirmed! Sale recorded.');

    // Reset bill
    currentBill = null;
}

// ----------------- Payment status badge & success modal helpers -----------------
function setLastPaymentBadge(status, method) {
    // status: 'Paid' | 'Declined' | other
    const el = document.getElementById('last-payment-badge');
    if (!el) return;
    if (!status) { el.style.display = 'none'; el.textContent = ''; return; }
    const color = (status.toLowerCase() === 'paid') ? '#2e7d32' : (status.toLowerCase() === 'declined' ? '#d9534f' : '#6b7280');
    el.style.display = 'inline-block';
    el.style.color = color;
    el.textContent = `${status}${method ? ' • ' + method : ''}`;
}

function showPaymentSuccess(sale) {
    const modal = document.getElementById('payment-success-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    const printBtn = document.getElementById('print-success-bill');
    if (printBtn) {
        printBtn.onclick = function() {
            try { printSale(sale); } catch (e) { console.error(e); }
            // auto-close after print
            setTimeout(()=> { modal.style.display = 'none'; }, 600);
        }
    }
}

// Cancel payment (record as declined) - also update header badge
function cancelPayment() {
    if (!currentBill) { closePaymentModal(); return; }
    currentBill.status = 'declined';
    const sales = getFromStorage('sales') || [];
    const saved = { ...currentBill };
    sales.push(saved);
    saveToStorage('sales', sales);

    // update UI
    setLastPaymentBadge('Declined', saved.paymentMethod || '');
    closePaymentModal();
    saveToStorage('cart', []);
    loadCart();
    updateCartCount();
    showNotification('Payment cancelled and recorded as declined.');
    currentBill = null;
}

// Print bill
function printBill() {
    const cart = getFromStorage('cart') || [];
    
    if (cart.length === 0) {
        alert('Cart is empty');
        return;
    }
    
    const totals = calculateTotal();
    const printWindow = window.open('', '_blank');
    
    const billHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bill - K.A.N EGG MART</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    max-width: 400px;
                    margin: 0 auto;
                }
                .bill-header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .bill-header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .bill-header p {
                    margin: 5px 0;
                    font-size: 12px;
                }
                .bill-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px dotted #ccc;
                }
                .bill-item-name {
                    flex: 1;
                }
                .bill-item-qty {
                    margin: 0 10px;
                }
                .bill-totals {
                    margin-top: 20px;
                    border-top: 2px solid #000;
                    padding-top: 10px;
                }
                .bill-total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 0;
                }
                .bill-total-row.final {
                    font-weight: bold;
                    font-size: 18px;
                }
                .bill-footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="bill-header">
                <h1>K.A.N EGG MART</h1>
                <p>Date: ${formatDate(new Date())}</p>
                <p>Bill No: ${generateId().substr(0, 8).toUpperCase()}</p>
            </div>
            
            <div class="bill-items">
                ${cart.map(item => `
                    <div class="bill-item">
                        <span class="bill-item-name">${item.name}</span>
                        <span class="bill-item-qty">${item.quantity} x ${formatCurrency(item.price)}</span>
                        <span>${formatCurrency(item.price * item.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="bill-totals">
                <div class="bill-total-row">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(totals.subtotal)}</span>
                </div>
                <div class="bill-total-row">
                    <span>Tax:</span>
                    <span>${formatCurrency(totals.tax)}</span>
                </div>
                <div class="bill-total-row final">
                    <span>Total:</span>
                    <span>${formatCurrency(totals.total)}</span>
                </div>
            </div>
            
            <div class="bill-footer">
                <p>Thank you for your purchase!</p>
                <p>Visit us again</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(billHtml);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
    initializeDefaultData();
    loadCart();
    updateCartCount();
});

