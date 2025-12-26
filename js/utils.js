// Utility functions for the Egg Shop application

// LocalStorage helpers
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format currency
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toFixed(2);
}

// Format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format date for input (YYYY-MM-DD)
function formatDateForInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
    return formatDateForInput(new Date());
}

// Generate QR code for UPI payment
function generateQRCode(upiId, amount, containerId) {
    // UPI payment URL format: upi://pay?pa=<UPI_ID>&am=<AMOUNT>&cu=INR
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${amount}&cu=INR`;
    
    // Get container
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Use QRCode.js library (loaded via CDN)
    if (typeof QRCode !== 'undefined') {
        // Create canvas element
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        QRCode.toCanvas(canvas, upiUrl, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, function (error) {
            if (error) {
                console.error('QR Code generation error:', error);
                container.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <p><strong>UPI ID:</strong> ${upiId}</p>
                        <p><strong>Amount:</strong> ${formatCurrency(amount)}</p>
                        <p style="font-size: 12px; color: #666;">Please scan with your UPI app</p>
                    </div>
                `;
            }
        });
    } else {
        // Fallback if QRCode library not loaded
        container.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <p><strong>UPI ID:</strong> ${upiId}</p>
                <p><strong>Amount:</strong> ${formatCurrency(amount)}</p>
                <p style="font-size: 12px; color: #666;">Please scan with your UPI app</p>
            </div>
        `;
    }
}

// Initialize default data if not exists
function initializeDefaultData() {
    // Initialize menu items if not exists
    if (!getFromStorage('menuItems')) {
        const defaultMenu = [
            {
                id: generateId(),
                name: 'White Eggs',
                price: 50,
                stock: 100,
                stockDate: getCurrentDate(),
                image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&h=500&fit=crop&q=80',
                category: 'eggs'
            },
            {
                id: generateId(),
                name: 'Country Eggs',
                price: 60,
                stock: 80,
                stockDate: getCurrentDate(),
                image: 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=500&h=500&fit=crop&q=80',
                category: 'eggs'
            },
            {
                id: generateId(),
                name: 'Quail Eggs',
                price: 80,
                stock: 50,
                stockDate: getCurrentDate(),
                image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=500&h=500&fit=crop&q=80',
                category: 'eggs'
            },
            {
                id: generateId(),
                name: 'Milk',
                price: 30,
                stock: 200,
                stockDate: getCurrentDate(),
                image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&h=500&fit=crop&q=80',
                category: 'dairy'
            },
            {
                id: generateId(),
                name: 'Refined Oil',
                price: 120,
                stock: 60,
                stockDate: getCurrentDate(),
                image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&h=500&fit=crop&q=80',
                category: 'grocery'
            },
            {
                id: generateId(),
                name: 'Bread',
                price: 25,
                stock: 120,
                stockDate: getCurrentDate(),
                image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=500&fit=crop&q=80',
                category: 'bakery'
            },
            {
                id: generateId(),
                name: 'Biscuit',
                price: 20,
                stock: 160,
                stockDate: getCurrentDate(),
                image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&h=500&fit=crop&q=80',
                category: 'bakery'
            }
        ];
        saveToStorage('menuItems', defaultMenu);
    }
    
    // Initialize cart if not exists
    if (!getFromStorage('cart')) {
        saveToStorage('cart', []);
    }
    
    // Initialize sales if not exists
    if (!getFromStorage('sales')) {
        saveToStorage('sales', []);
    }
    
    // Initialize UPI ID if not exists
    if (!getFromStorage('upiId')) {
        saveToStorage('upiId', 'your-upi-id@paytm'); // Default, should be changed in admin
    }
}

// Export CSV
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Handle arrays and objects
            if (Array.isArray(value)) {
                return JSON.stringify(value);
            } else if (typeof value === 'object') {
                return JSON.stringify(value);
            }
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csv += values.join(',') + '\n';
    });
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Print a single stored sale object (sale)
function printSale(sale) {
    if (!sale) { console.error('No sale provided to printSale'); return; }

    const html = `
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Bill - ${sale.id ? sale.id.substr(0,8).toUpperCase() : ''}</title>
            <style>
                body { font-family: Arial, sans-serif; padding:20px; max-width:520px; margin:0 auto; color:#222; }
                .header { text-align:center; border-bottom:2px solid #667eea; padding-bottom:8px; margin-bottom:12px; }
                .header h1 { margin:0; color:#333; }
                .items { margin-top:10px; }
                .item { display:flex; justify-content:space-between; gap:12px; padding:8px 0; border-bottom:1px dotted #ddd; }
                .totals { margin-top:12px; border-top:2px solid #667eea; padding-top:8px; }
                .totals .row { display:flex; justify-content:space-between; font-weight:700; padding:6px 0; }
                .meta { margin-top:8px; font-size:12px; color:#555; }
                @media print { body { margin:0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>K.A.N EGG MART</h1>
                <div style="font-size:12px; color:#444;">Date: ${formatDate(new Date(sale.date))}</div>
                <div style="font-size:12px; color:#444;">Bill: ${sale.id ? sale.id.substr(0,8).toUpperCase() : ''}</div>
            </div>

            <div class="items">
                ${sale.items.map(it => `
                    <div class="item">
                        <div style="flex:1">${it.name} <small style="color:#666;">x${it.quantity}</small></div>
                        <div style="min-width:90px; text-align:right">${formatCurrency(it.price * it.quantity)}</div>
                    </div>
                `).join('')}
            </div>

            <div class="totals">
                <div class="row"><span>Subtotal</span><span>${formatCurrency(sale.subtotal || sale.total)}</span></div>
                <div class="row"><span>Tax</span><span>${formatCurrency(sale.tax || 0)}</span></div>
                <div class="row" style="font-size:18px"><span>Total</span><span>${formatCurrency(sale.total)}</span></div>
            </div>

            <div class="meta">Payment: ${sale.paymentMethod || 'Unknown'}${sale.status ? ' • ' + sale.status : ''}</div>
            <div style="margin-top:14px; font-size:12px; color:#666; text-align:center;">Thank you for shopping!</div>
        </body>
        </html>
    `;

    const pw = window.open('', '_blank');
    if (!pw) { alert('Unable to open print window — please allow popups.'); return; }
    pw.document.write(html);
    pw.document.close();
    pw.focus();
    setTimeout(() => { try { pw.print(); } catch (e) { console.error('Print failed', e); } }, 300);
}

