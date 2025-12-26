// Sales report functionality

// Helpers to get period ranges
function getPeriodRange(periodType, referenceDate = new Date()) {
    const start = new Date(referenceDate);
    const end = new Date(referenceDate);
    
    switch (periodType) {
        case 'daily':
            // start and end already set to same day
            break;
        case 'weekly': {
            const day = start.getDay(); // 0-6
            const diffToMonday = (day + 6) % 7; // make Monday start
            start.setDate(start.getDate() - diffToMonday);
            end.setDate(start.getDate() + 6);
            break;
        }
        case 'monthly':
            start.setDate(1);
            end.setMonth(start.getMonth() + 1, 0);
            break;
        case 'annual':
            start.setMonth(0, 1);
            end.setMonth(11, 31);
            break;
        default:
            break;
    }
    // Normalize times
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function getPreviousPeriod(range) {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const diff = end.getTime() - start.getTime() + 1;
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diff + 1);
    return { start: prevStart, end: prevEnd };
}

// Load sales report
function loadSalesReport() {
    const sales = getFromStorage('sales') || [];
    const periodTypeEl = document.getElementById('period-type');
    const dateEl = document.getElementById('report-date');
    const monthEl = document.getElementById('report-month');
    const yearEl = document.getElementById('report-year');
    const startEl = document.getElementById('report-start');
    const endEl = document.getElementById('report-end');
    
    if (!periodTypeEl) return;
    const periodType = periodTypeEl.value;
    
    // Determine reference date based on period selection
    let referenceDate = new Date();
    if (periodType === 'daily' || periodType === 'weekly') {
        if (dateEl && dateEl.value) referenceDate = new Date(dateEl.value);
    } else if (periodType === 'monthly') {
        if (monthEl && monthEl.value) referenceDate = new Date(monthEl.value + '-01');
    } else if (periodType === 'annual') {
        if (yearEl && yearEl.value) referenceDate = new Date(parseInt(yearEl.value), 0, 1);
    } else if (periodType === 'custom') {
        // read explicit start and end date
        let s = startEl && startEl.value ? new Date(startEl.value) : null;
        let e = endEl && endEl.value ? new Date(endEl.value) : null;
        if (!s || !e) {
            // fallback to last 7 days
            e = new Date();
            s = new Date();
            s.setDate(e.getDate() - 6);
        }
        // normalize times
        s.setHours(0,0,0,0);
        e.setHours(23,59,59,999);
        const range = { start: s, end: e };
        const previousRange = getPreviousPeriod(range);

        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= range.start && saleDate <= range.end;
        });
        const previousSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= previousRange.start && saleDate <= previousRange.end;
        });
        displaySalesReport(filteredSales, previousSales, periodType, range);
        return;
    }
    
    const range = getPeriodRange(periodType, referenceDate);
    const previousRange = getPreviousPeriod(range);
    
    // Filter sales by date range
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= range.start && saleDate <= range.end;
    });
    
    const previousSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= previousRange.start && saleDate <= previousRange.end;
    });
    
    displaySalesReport(filteredSales, previousSales, periodType, range);
}

// Display sales report
function displaySalesReport(sales, prevSales, periodType, range) {
    const reportContainer = document.getElementById('sales-report-content');
    if (!reportContainer) return;
    // store current report range globally so action buttons can access it
    window.currentReportRange = range;
    
    if (sales.length === 0) {
        reportContainer.innerHTML = `
            <div class="no-sales">
                <p>No sales found for the selected period.</p>
            </div>
        `;
        return;
    }
    
    // Calculate statistics
    const stats = calculateStats(sales);
    const prevStats = calculateStats(prevSales);
    
    const comparison = calculateComparison(stats, prevStats);
    
    // Generate report HTML
    const reportHtml = `
        <div class="sales-summary">
            <div class="summary-card">
                <h3>Total Sales</h3>
                <p class="summary-value">${formatCurrency(stats.totalSales)}</p>
                ${renderDelta(comparison.totalSalesDelta)}
            </div>
            <div class="summary-card">
                <h3>Total Transactions</h3>
                <p class="summary-value">${stats.totalTransactions}</p>
                ${renderDelta(comparison.totalTransactionsDelta, true)}
            </div>
            <div class="summary-card">
                <h3>Average Order Value</h3>
                <p class="summary-value">${formatCurrency(stats.averageOrderValue)}</p>
                ${renderDelta(comparison.aovDelta)}
            </div>
        </div>
        
        <div class="sales-summary">
            <div class="summary-card">
                <h3>Collections</h3>
                <p class="summary-value">${formatCurrency(stats.totalSales)}</p>
            </div>
            <div class="summary-card">
                <h3>Payment Modes</h3>
                ${renderPaymentBreakdown(stats.paymentBreakdown)}
            </div>
            <div class="summary-card">
                <h3>Items Sold</h3>
                <p class="summary-value">${stats.totalItemsSold}</p>
            </div>
        </div>
        
        <div class="sales-by-item">
            <h3>Sales by Item</h3>
            <table class="sales-table">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Quantity Sold</th>
                        <th>Revenue</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(stats.itemsSold).map(([name, data]) => `
                        <tr>
                            <td>${name}</td>
                            <td>${data.quantity}</td>
                            <td>${formatCurrency(data.revenue)}</td>
                            <td><button class="btn-small" onclick="printItemSales('${encodeURIComponent(name)}')">Print Bills</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="daily-breakdown">
            <h3>${periodType === 'daily' ? 'Hourly' : 'Daily'} Breakdown</h3>
            <table class="sales-table">
                <thead>
                    <tr>
                        <th>${periodType === 'daily' ? 'Time' : 'Date'}</th>
                        <th>Transactions</th>
                        <th>Total Sales</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(stats.dailyBreakdown).map(([date, data]) => `
                        <tr>
                            <td>${periodType === 'daily' ? date : formatDate(date)}</td>
                            <td>${data.count}</td>
                            <td>${formatCurrency(data.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="sales-summary">
            <div class="summary-card">
                <h3>Period vs Previous</h3>
                <p class="summary-value">${formatCurrency(stats.totalSales)} vs ${formatCurrency(prevStats.totalSales || 0)}</p>
                ${renderDelta(comparison.totalSalesDelta)}
            </div>
            <div class="summary-card">
                <h3>Transactions vs Previous</h3>
                <p class="summary-value">${stats.totalTransactions} vs ${prevStats.totalTransactions || 0}</p>
                ${renderDelta(comparison.totalTransactionsDelta, true)}
            </div>
            <div class="summary-card">
                <h3>AOV vs Previous</h3>
                <p class="summary-value">${formatCurrency(stats.averageOrderValue)} vs ${formatCurrency(prevStats.averageOrderValue || 0)}</p>
                ${renderDelta(comparison.aovDelta)}
            </div>
        </div>
        
        <div class="report-actions">
            <button class="btn-export" onclick="exportSalesReportRange()">Export to CSV</button>
        </div>
    `;
    
    reportContainer.innerHTML = reportHtml;

    // Render bill history (individual bills for this period)
    renderBillHistory(sales);
}

// Calculate statistics
function calculateStats(sales) {
    const stats = {
        totalSales: 0,
        totalTransactions: sales.length,
        itemsSold: {},
        dailyBreakdown: {},
        paymentBreakdown: {},
        totalItemsSold: 0,
        averageOrderValue: 0
    };
    
    sales.forEach(sale => {
        stats.totalSales += sale.total;
        // Payment breakdown
        const method = sale.paymentMethod || 'Unknown';
        if (!stats.paymentBreakdown[method]) {
            stats.paymentBreakdown[method] = { total: 0, count: 0 };
        }
        stats.paymentBreakdown[method].total += sale.total;
        stats.paymentBreakdown[method].count += 1;
        
        // Items sold
        sale.items.forEach(item => {
            stats.totalItemsSold += item.quantity;
            if (!stats.itemsSold[item.name]) {
                stats.itemsSold[item.name] = {
                    quantity: 0,
                    revenue: 0
                };
            }
            stats.itemsSold[item.name].quantity += item.quantity;
            stats.itemsSold[item.name].revenue += item.price * item.quantity;
        });
        
        // Daily/period breakdown (use sale.date key)
        if (!stats.dailyBreakdown[sale.date]) {
            stats.dailyBreakdown[sale.date] = {
                count: 0,
                total: 0
            };
        }
        stats.dailyBreakdown[sale.date].count += 1;
        stats.dailyBreakdown[sale.date].total += sale.total;
    });
    
    stats.averageOrderValue = stats.totalTransactions > 0 
        ? stats.totalSales / stats.totalTransactions 
        : 0;
    
    return stats;
}

// Render delta comparison
function renderDelta(delta, isCount = false) {
    if (!delta || (!delta.diff && delta.diff !== 0)) return '';
    const sign = delta.diff > 0 ? '+' : delta.diff < 0 ? '−' : '';
    const color = delta.diff > 0 ? '#28a745' : delta.diff < 0 ? '#ff4757' : '#6c757d';
    const value = isCount ? Math.abs(delta.diff) : formatCurrency(Math.abs(delta.diff));
    const pct = delta.percent ? ` (${delta.percent}%)` : '';
    return `<p style="color:${color}; font-weight:600; margin-top:6px;">${sign}${value}${pct}</p>`;
}

function renderPaymentBreakdown(paymentBreakdown) {
    const entries = Object.entries(paymentBreakdown);
    if (entries.length === 0) return '<p style="margin:0;color:#666;">No data</p>';
    return `
        <ul style="list-style:none; padding:0; margin:0; text-align:left;">
            ${entries.map(([method, data]) => `
                <li style="margin:4px 0; display:flex; justify-content:space-between; gap:10px;">
                    <span>${method}</span>
                    <span>${formatCurrency(data.total)} (${data.count} txns)</span>
                </li>
            `).join('')}
        </ul>
    `;
}

function calculateComparison(current, previous) {
    const delta = (cur, prev) => {
        const diff = cur - (prev || 0);
        const percent = prev ? ((diff / prev) * 100).toFixed(1) : null;
        return { diff, percent };
    };
    
    return {
        totalSalesDelta: delta(current.totalSales, previous.totalSales),
        totalTransactionsDelta: delta(current.totalTransactions, previous.totalTransactions),
        aovDelta: delta(current.averageOrderValue, previous.averageOrderValue)
    };
}

// Export sales report to CSV for current range
function exportSalesReportRange() {
    const sales = getFromStorage('sales') || [];
    const periodTypeEl = document.getElementById('period-type');
    const dateEl = document.getElementById('report-date');
    const monthEl = document.getElementById('report-month');
    const yearEl = document.getElementById('report-year');
    if (!periodTypeEl) return;
    const periodType = periodTypeEl.value;
    
    let referenceDate = new Date();
    if (periodType === 'daily' || periodType === 'weekly') {
        if (dateEl && dateEl.value) referenceDate = new Date(dateEl.value);
    } else if (periodType === 'monthly') {
        if (monthEl && monthEl.value) referenceDate = new Date(monthEl.value + '-01');
    } else if (periodType === 'annual') {
        if (yearEl && yearEl.value) referenceDate = new Date(parseInt(yearEl.value), 0, 1);
    }
    
    const range = getPeriodRange(periodType, referenceDate);
    
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= range.start && saleDate <= range.end;
    });
    
    if (filteredSales.length === 0) {
        alert('No sales data to export');
        return;
    }
    
    const csvData = [];
    filteredSales.forEach(sale => {
        sale.items.forEach(item => {
            csvData.push({
                Date: sale.date,
                'Item Name': item.name,
                Quantity: item.quantity,
                'Unit Price': item.price,
                'Total Price': item.price * item.quantity,
                'Sale Total': sale.total,
                'Payment Method': sale.paymentMethod
            });
        });
    });
    
    const filename = `sales-report-${periodType}-${formatDate(range.start)}.csv`;
    exportToCSV(csvData, filename);
}

// Initialize selectors
function initializeDateSelectors() {
    const periodTypeEl = document.getElementById('period-type');
    const dateEl = document.getElementById('report-date');
    const monthEl = document.getElementById('report-month');
    const yearEl = document.getElementById('report-year');
    
    if (!periodTypeEl) return;
    
    const now = new Date();
    // Set defaults
    if (dateEl) dateEl.value = formatDateForInput(now);
    if (monthEl) {
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        monthEl.value = monthStr;
    }
    if (yearEl) {
        yearEl.innerHTML = '';
        for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            yearEl.appendChild(option);
        }
        yearEl.value = now.getFullYear();
    }
    
    function toggleFilters() {
        const period = periodTypeEl.value;
        const dateGroup = document.getElementById('filter-date');
        const monthGroup = document.getElementById('filter-month');
        const yearGroup = document.getElementById('filter-year');
        const customGroup = document.getElementById('filter-custom');
        
        if (dateGroup) dateGroup.style.display = (period === 'daily' || period === 'weekly') ? 'block' : 'none';
        if (monthGroup) monthGroup.style.display = (period === 'monthly') ? 'block' : 'none';
        if (yearGroup) yearGroup.style.display = (period === 'annual' || period === 'monthly') ? 'block' : 'none';
        if (customGroup) customGroup.style.display = (period === 'custom') ? 'block' : 'none';
    }
    
    periodTypeEl.addEventListener('change', () => {
        toggleFilters();
        loadSalesReport();
    });
    if (dateEl) dateEl.addEventListener('change', loadSalesReport);
    if (monthEl) monthEl.addEventListener('change', loadSalesReport);
    if (yearEl) yearEl.addEventListener('change', loadSalesReport);
    const startEl = document.getElementById('report-start');
    const endEl = document.getElementById('report-end');
    if (startEl) startEl.addEventListener('change', loadSalesReport);
    if (endEl) endEl.addEventListener('change', loadSalesReport);
    
    toggleFilters();
}

// Initialize sales report page
document.addEventListener('DOMContentLoaded', function() {
    initializeDefaultData();
    initializeDateSelectors();
    loadSalesReport();
});

// Print bills for all sales that include a specific item within the current report range
function printItemSales(encodedName) {
    const itemName = decodeURIComponent(encodedName);
    const sales = getFromStorage('sales') || [];
    const range = window.currentReportRange || { start: new Date(0), end: new Date() };

    // Filter sales within range that include this item
    const matched = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        if (saleDate < new Date(range.start) || saleDate > new Date(range.end)) return false;
        return sale.items && sale.items.some(it => it.name === itemName);
    });

    if (!matched || matched.length === 0) {
        alert('No sales found for "' + itemName + '" in this period.');
        return;
    }

    // Render modal list of matched transactions
    const modal = document.getElementById('sales-item-modal');
    const list = document.getElementById('sales-item-list');
    if (!modal || !list) {
        // fallback: print all
        alert('Modal not available — printing all matching bills.');
        matched.forEach(s => printSale(s));
        return;
    }

    // keep matched set globally so Print All can use it
    window._salesItemMatched = matched;

    list.innerHTML = '';
    matched.forEach(sale => {
        const row = document.createElement('div');
        row.className = 'sales-item-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '10px';
        row.style.borderBottom = '1px solid #eef2ff';

        const left = document.createElement('div');
        left.style.flex = '1';
        left.innerHTML = `<div style="font-weight:700; color:#2d3748">Bill: ${sale.id ? sale.id.substr(0,8).toUpperCase() : ''}</div>\n                          <div style="font-size:12px; color:#666">${formatDate(new Date(sale.date))} • ${sale.items.length} items</div>`;

        const right = document.createElement('div');
        right.style.display = 'flex';
        right.style.gap = '8px';
        right.style.alignItems = 'center';

        const meta = document.createElement('div');
        meta.style.textAlign = 'right';
        meta.style.marginRight = '8px';
        meta.innerHTML = `<div style="font-weight:700; color:#667eea">${formatCurrency(sale.total)}</div>\n                          <div style="font-size:12px; color:#666">${sale.paymentMethod || 'Unknown'}${sale.status ? ' • ' + sale.status : ''}</div>`;

        const printBtn = document.createElement('button');
        printBtn.className = 'btn btn-primary';
        printBtn.style.padding = '8px 12px';
        printBtn.style.fontSize = '13px';
        printBtn.textContent = 'Print';
        printBtn.onclick = () => { printSaleById(sale.id); };

        right.appendChild(meta);
        right.appendChild(printBtn);

        row.appendChild(left);
        row.appendChild(right);
        list.appendChild(row);
    });

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
}

function closeSalesItemModal() {
    const modal = document.getElementById('sales-item-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

function printSaleById(saleId) {
    const sales = getFromStorage('sales') || [];
    const sale = sales.find(s => s.id === saleId);
    if (!sale) { alert('Sale not found'); return; }
    printSale(sale);
}

// Render Bill History table for the current period
function renderBillHistory(sales) {
    const container = document.getElementById('bill-history-container');
    if (!container) return;

    if (!sales || sales.length === 0) {
        container.innerHTML = `<div style="color:white; opacity:0.9;">No bills in this period.</div>`;
        return;
    }

    const rows = sales.map(sale => {
        const shortId = sale.id ? sale.id.substr(0,8).toUpperCase() : '';
        const itemsCount = sale.items ? sale.items.reduce((a,b)=>a+(b.quantity||0),0) : 0;
        const payment = sale.paymentMethod || 'Unknown';
        const status = sale.status || '';
        return `
            <tr>
                <td>${shortId}</td>
                <td>${formatDate(new Date(sale.date))}</td>
                <td style="text-align:center">${itemsCount}</td>
                <td style="text-align:right">${formatCurrency(sale.total)}</td>
                <td style="text-align:center">${payment}${status ? ' • ' + status : ''}</td>
                <td style="text-align:right">
                    <button class="btn btn-secondary" onclick="viewBill('${sale.id}')">View</button>
                    <button class="btn btn-primary" style="margin-left:8px;" onclick="printSaleById('${sale.id}')">Print</button>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="bill-history-table-wrap">
            <table class="sales-table bill-history-table">
                <thead>
                    <tr>
                        <th>Bill</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th style="text-align:right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// View a single bill in modal
function viewBill(saleId) {
    const sales = getFromStorage('sales') || [];
    const sale = sales.find(s => s.id === saleId);
    if (!sale) { alert('Sale not found'); return; }

    const body = document.getElementById('bill-view-body');
    if (!body) return;

    body.innerHTML = `
        <div style="padding:8px 0;">
            <div style="font-weight:700; color:#2d3748">Bill: ${sale.id ? sale.id.substr(0,8).toUpperCase() : ''}</div>
            <div style="font-size:13px; color:#666">Date: ${formatDate(new Date(sale.date))} • Payment: ${sale.paymentMethod || 'Unknown'} ${sale.status ? ' • ' + sale.status : ''}</div>
        </div>
        <div style="margin-top:8px;">
            ${sale.items.map(it => `
                <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed #e9eefc;">
                    <div style="flex:1">${it.name} <small style="color:#666">x${it.quantity}</small></div>
                    <div style="min-width:90px; text-align:right">${formatCurrency(it.price * it.quantity)}</div>
                </div>
            `).join('')}
        </div>
        <div style="margin-top:12px; border-top:2px solid #667eea; padding-top:8px;">
            <div style="display:flex; justify-content:space-between; font-weight:700;">
                <div>Total</div>
                <div>${formatCurrency(sale.total)}</div>
            </div>
        </div>
    `;

    const printBtn = document.getElementById('bill-view-print');
    if (printBtn) {
        printBtn.onclick = function() { printSale(sale); };
    }

    const modal = document.getElementById('bill-view-modal');
    if (modal) { modal.style.display = 'flex'; modal.setAttribute('aria-hidden','false'); }
}

function closeBillModal() {
    const modal = document.getElementById('bill-view-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden','true');
}

// Print all matched sales currently shown in the modal in a single print job
function printAllMatched() {
    const matched = window._salesItemMatched || [];
    if (!matched || matched.length === 0) {
        alert('No sales to print.');
        return;
    }

    const receiptsHtml = matched.map(sale => {
        return `
            <div class="receipt">
                <div style="text-align:center; border-bottom:1px solid #667eea; padding-bottom:10px; margin-bottom:10px;">
                    <h2 style="margin:0; color:#2d3748">K.A.N EGG MART</h2>
                    <div style="font-size:12px; color:#444">Date: ${formatDate(new Date(sale.date))}</div>
                    <div style="font-size:12px; color:#444">Bill No: ${sale.id ? sale.id.substr(0,8).toUpperCase() : ''}</div>
                </div>
                <div>
                    ${sale.items.map(it => `
                        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dotted #ddd;">
                            <div style="flex:1">${it.name} <small style="color:#666;">x${it.quantity}</small></div>
                            <div style="min-width:80px; text-align:right">${formatCurrency(it.price * it.quantity)}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top:10px; border-top:2px solid #667eea; padding-top:8px;">
                    <div style="display:flex; justify-content:space-between; font-weight:700;">
                        <div>Total</div>
                        <div>${formatCurrency(sale.total)}</div>
                    </div>
                    <div style="font-size:12px; color:#444; margin-top:6px;">Payment: ${sale.paymentMethod || 'Unknown'}${sale.status ? ' • ' + sale.status : ''}</div>
                </div>
                <div style="margin-top:12px; font-size:12px; text-align:center; color:#666;">Thank you for shopping!</div>
            </div>
            <div style="height:18px; page-break-after: always;"></div>
        `;
    }).join('\n');

    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Unable to open print window — allow popups.'); return; }

    const html = `
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8" />
            <title>Print Bills</title>
            <style>
                body { font-family: Arial, sans-serif; padding:20px; max-width:680px; margin:0 auto; color:#222; }
                .receipt { margin-bottom: 20px; }
                @media print { body { margin:0; } }
            </style>
        </head>
        <body>
            ${receiptsHtml}
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { try { printWindow.print(); } catch (e) { console.error(e); } }, 400);
}

