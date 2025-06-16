// Global variables
let allTransactions = [];
let filteredTransactions = [];
let charts = {};

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('filterBtn').addEventListener('click', applyFilters);
    document.getElementById('resetBtn').addEventListener('click', resetFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    
    // Modal functionality
    const modal = document.getElementById('detailModal');
    const span = document.getElementsByClassName('close')[0];
    
    span.onclick = function() {
        modal.style.display = 'none';
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

async function loadData() {
    try {
        // Try to load from API first
        const response = await fetch('/api/transactions?limit=1000');
        if (response.ok) {
            allTransactions = await response.json();
        } else {
            // Fallback: load from JSON file
            const jsonResponse = await fetch('../processed_sms.json');
            allTransactions = await jsonResponse.json();
        }
        
        filteredTransactions = [...allTransactions];
        updateDashboard();
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback: create sample data for demonstration
        createSampleData();
    }
}

function createSampleData() {
    // Sample data for demonstration if JSON file is not accessible
    allTransactions = [
        {
            body: "You have received 2000 RWF from Jane Smith",
            readable_date: "10 May 2024 4:30:58 PM",
            category: "Incoming Money",
            amount: 2000,
            transaction_id: "76662021700",
            timestamp: 1715351458724
        },
        {
            body: "Your payment of 1,000 RWF to Jane Smith has been completed",
            readable_date: "10 May 2024 4:31:46 PM",
            category: "Payments to Code Holders",
            amount: 1000,
            transaction_id: "73214484437",
            timestamp: 1715351506754
        }
        // Add more sample data as needed
    ];
    filteredTransactions = [...allTransactions];
    updateDashboard();
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    
    filteredTransactions = allTransactions.filter(transaction => {
        // Search filter
        const matchesSearch = !searchTerm || 
            transaction.body.toLowerCase().includes(searchTerm) ||
            (transaction.transaction_id && transaction.transaction_id.includes(searchTerm));
        
        // Category filter
        const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
        
        // Date filter
        let matchesDate = true;
        if (dateFrom || dateTo) {
            const transactionDate = new Date(transaction.timestamp);
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                matchesDate = matchesDate && transactionDate >= fromDate;
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999); // End of day
                matchesDate = matchesDate && transactionDate <= toDate;
            }
        }
        
        return matchesSearch && matchesCategory && matchesDate;
    });
    
    updateDashboard();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    
    filteredTransactions = [...allTransactions];
    updateDashboard();
}

function updateDashboard() {
    updateStatistics();
    updateCharts();
    updateTransactionsTable();
}

function updateStatistics() {
    const totalTransactions = filteredTransactions.length;
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    document.getElementById('totalTransactions').textContent = totalTransactions.toLocaleString();
    document.getElementById('totalAmount').textContent = totalAmount.toLocaleString() + ' RWF';
    document.getElementById('avgAmount').textContent = Math.round(avgAmount).toLocaleString() + ' RWF';
}

function updateCharts() {
    updateVolumeChart();
    updateMonthlyChart();
    updateDistributionChart();
}

function updateVolumeChart() {
    const categoryData = {};
    filteredTransactions.forEach(transaction => {
        const category = transaction.category || 'Uncategorized';
        categoryData[category] = (categoryData[category] || 0) + 1;
    });
    
    const ctx = document.getElementById('volumeChart').getContext('2d');
    
    if (charts.volumeChart) {
        charts.volumeChart.destroy();
    }
    
    charts.volumeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                label: 'Number of Transactions',
                data: Object.values(categoryData),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                    '#ffecd2', '#fcb69f'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateMonthlyChart() {
    const monthlyData = {};
    filteredTransactions.forEach(transaction => {
        if (transaction.timestamp) {
            const date = new Date(transaction.timestamp);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (transaction.amount || 0);
        }
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    if (charts.monthlyChart) {
        charts.monthlyChart.destroy();
    }
    
    charts.monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Monthly Amount (RWF)',
                data: sortedMonths.map(month => monthlyData[month]),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateDistributionChart() {
    const incomingAmount = filteredTransactions
        .filter(t => t.category === 'Incoming Money')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const outgoingAmount = filteredTransactions
        .filter(t => t.category !== 'Incoming Money' && t.category !== 'Bank Deposits')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const depositsAmount = filteredTransactions
        .filter(t => t.category === 'Bank Deposits')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
    if (charts.distributionChart) {
        charts.distributionChart.destroy();
    }
    
    charts.distributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Incoming Money', 'Outgoing Payments', 'Bank Deposits'],
            datasets: [{
                data: [incomingAmount, outgoingAmount, depositsAmount],
                backgroundColor: ['#28a745', '#dc3545', '#ffc107']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateTransactionsTable() {
    const tbody = document.getElementById('transactionsBody');
    tbody.innerHTML = '';
    
    // Show only first 50 transactions for performance
    const displayTransactions = filteredTransactions.slice(0, 50);
    
    displayTransactions.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.readable_date || 'N/A'}</td>
            <td>${transaction.category || 'Uncategorized'}</td>
            <td>${transaction.amount ? transaction.amount.toLocaleString() : 'N/A'}</td>
            <td>${transaction.transaction_id || 'N/A'}</td>
            <td><button class="view-details" onclick="showTransactionDetails(${index})">View</button></td>
        `;
        tbody.appendChild(row);
    });
    
    if (filteredTransactions.length > 50) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" style="text-align: center; font-style: italic;">Showing first 50 of ${filteredTransactions.length} transactions</td>`;
        tbody.appendChild(row);
    }
}

function showTransactionDetails(index) {
    const transaction = filteredTransactions[index];
    const modal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <p><strong>Date:</strong> ${transaction.readable_date || 'N/A'}</p>
        <p><strong>Category:</strong> ${transaction.category || 'Uncategorized'}</p>
        <p><strong>Amount:</strong> ${transaction.amount ? transaction.amount.toLocaleString() + ' RWF' : 'N/A'}</p>
        <p><strong>Transaction ID:</strong> ${transaction.transaction_id || 'N/A'}</p>
        <p><strong>Full Message:</strong></p>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px;">
            ${transaction.body || 'N/A'}
        </div>
    `;
    
    modal.style.display = 'block';
}

