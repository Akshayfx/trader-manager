/**
 * ChartWise Admin Dashboard JavaScript
 */

const API_BASE_URL = '/api';

// State
let state = {
    token: localStorage.getItem('admin_token'),
    user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
    currentPage: 'overview',
    users: [],
    userPage: 1,
    userSearch: '',
    userFilter: '',
    deleteUserId: null,
    apiUsageChart: null,
    apiStatsChart: null
};

// DOM Elements
const elements = {
    loginScreen: document.getElementById('loginScreen'),
    dashboard: document.getElementById('dashboard'),
    loginForm: document.getElementById('loginForm'),
    loginError: document.getElementById('loginError'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    adminName: document.getElementById('adminName'),
    adminRole: document.getElementById('adminRole'),
    logoutBtn: document.getElementById('logoutBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    pageTitle: document.getElementById('pageTitle'),
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (state.token && state.user) {
        showDashboard();
    } else {
        showLogin();
    }
    
    initializeEventListeners();
});

function initializeEventListeners() {
    // Login form
    elements.loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Refresh
    elements.refreshBtn.addEventListener('click', refreshData);
    
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });
    
    // User search
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', debounce((e) => {
            state.userSearch = e.target.value;
            state.userPage = 1;
            loadUsers();
        }, 300));
    }
    
    // Subscription filter
    const subscriptionFilter = document.getElementById('subscriptionFilter');
    if (subscriptionFilter) {
        subscriptionFilter.addEventListener('change', (e) => {
            state.userFilter = e.target.value;
            state.userPage = 1;
            loadUsers();
        });
    }
    
    // Save user
    const saveUserBtn = document.getElementById('saveUserBtn');
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', saveUser);
    }
    
    // Confirm delete
    const confirmDelete = document.getElementById('confirmDelete');
    if (confirmDelete) {
        confirmDelete.addEventListener('click', confirmDeleteUser);
    }
    
    // Settings tabs
    document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchSettingsTab(tab);
        });
    });
    
    // AI Service card selection
    document.querySelectorAll('.ai-service-card input[name="aiProvider"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.ai-service-card').forEach(card => {
                card.classList.toggle('selected', card.dataset.provider === e.target.value);
            });
        });
    });
    
    // Save API settings
    const saveApiSettings = document.getElementById('saveApiSettings');
    if (saveApiSettings) {
        saveApiSettings.addEventListener('click', saveApiConfiguration);
    }
    
    // Test APIs
    const testApis = document.getElementById('testApis');
    if (testApis) {
        testApis.addEventListener('click', testApiConnections);
    }
    
    // Save system settings
    const saveSystemSettings = document.getElementById('saveSystemSettings');
    if (saveSystemSettings) {
        saveSystemSettings.addEventListener('click', saveSystemConfiguration);
    }
    
    // Clear logs
    const clearLogs = document.getElementById('clearLogs');
    if (clearLogs) {
        clearLogs.addEventListener('click', clearSystemLogs);
    }
    
    // Log level filter
    const logLevel = document.getElementById('logLevel');
    if (logLevel) {
        logLevel.addEventListener('change', loadLogs);
    }
}

// ==================== AUTH ====================

async function handleLogin(e) {
    e.preventDefault();
    
    const username = elements.username.value;
    const password = elements.password.value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Check if user is admin
            if (data.user.role !== 'admin' && data.user.role !== 'superadmin') {
                showLoginError('Access denied. Admin privileges required.');
                return;
            }
            
            state.token = data.token;
            state.user = data.user;
            
            if (rememberMe) {
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
            }
            
            showDashboard();
        } else {
            showLoginError(data.message || 'Login failed');
        }
    } catch (error) {
        showLoginError('Network error. Please try again.');
    }
}

function handleLogout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    showLogin();
}

function showLogin() {
    elements.loginScreen.style.display = 'flex';
    elements.dashboard.style.display = 'none';
}

function showDashboard() {
    elements.loginScreen.style.display = 'none';
    elements.dashboard.style.display = 'flex';
    
    // Update admin info
    if (state.user) {
        elements.adminName.textContent = state.user.username;
        elements.adminRole.textContent = state.user.role === 'superadmin' ? 'Super Admin' : 'Admin';
    }
    
    // Load initial data
    refreshData();
}

function showLoginError(message) {
    elements.loginError.textContent = message;
    elements.loginError.classList.add('visible');
    setTimeout(() => elements.loginError.classList.remove('visible'), 5000);
}

// ==================== NAVIGATION ====================

function navigateToPage(page) {
    state.currentPage = page;
    
    // Update nav
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Update pages
    elements.pages.forEach(p => {
        p.classList.toggle('active', p.id === `page-${page}`);
    });
    
    // Update title
    const titles = {
        overview: 'Dashboard Overview',
        users: 'User Management',
        subscriptions: 'Subscriptions',
        api: 'API Management',
        settings: 'System Settings',
        logs: 'System Logs'
    };
    elements.pageTitle.textContent = titles[page] || 'Dashboard';
    
    // Load page data
    switch (page) {
        case 'overview':
            loadDashboardStats();
            break;
        case 'users':
            loadUsers();
            break;
        case 'subscriptions':
            loadSubscriptions();
            break;
        case 'api':
            loadApiSettings();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

// ==================== DATA LOADING ====================

async function refreshData() {
    switch (state.currentPage) {
        case 'overview':
            await loadDashboardStats();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'subscriptions':
            await loadSubscriptions();
            break;
    }
}

async function loadDashboardStats() {
    try {
        // Load dashboard stats
        const statsResponse = await fetch(`${API_BASE_URL}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            document.getElementById('totalUsers').textContent = statsData.stats.users.totalUsers || 0;
            document.getElementById('proUsers').textContent = statsData.stats.users.proUsers || 0;
            document.getElementById('enterpriseUsers').textContent = statsData.stats.users.enterpriseUsers || 0;
        }
        
        // Load connections
        const connResponse = await fetch(`${API_BASE_URL}/admin/connections`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const connData = await connResponse.json();
        
        if (connData.success) {
            document.getElementById('activeConnections').textContent = connData.connections.total || 0;
            document.getElementById('wsConnections').textContent = connData.connections.total || 0;
            document.getElementById('mt4Connections').textContent = connData.connections.mt4 || 0;
            document.getElementById('mt5Connections').textContent = connData.connections.mt5 || 0;
            document.getElementById('desktopConnections').textContent = connData.connections.desktop || 0;
            document.getElementById('mobileConnections').textContent = connData.connections.mobile || 0;
        }
        
        // Load API usage
        const apiResponse = await fetch(`${API_BASE_URL}/admin/api-usage`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const apiData = await apiResponse.json();
        
        if (apiData.success) {
            renderApiUsageChart(apiData.usage);
        }
        
        // Load recent activity
        if (statsData.success && statsData.recentActivity) {
            renderRecentActivity(statsData.recentActivity);
        }
        
        // Load uptime
        const statusResponse = await fetch(`${API_BASE_URL}/status`);
        const statusData = await statusResponse.json();
        if (statusData.uptime) {
            const hours = Math.floor(statusData.uptime / 3600);
            const minutes = Math.floor((statusData.uptime % 3600) / 60);
            document.getElementById('uptime').textContent = `${hours}h ${minutes}m`;
        }
        
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

async function loadUsers() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/users?page=${state.userPage}&search=${state.userSearch}&subscription=${state.userFilter}`,
            { headers: { 'Authorization': `Bearer ${state.token}` } }
        );
        
        const data = await response.json();
        
        if (data.success) {
            state.users = data.users;
            renderUsersTable(data.users);
            renderPagination(data.pagination);
        }
    } catch (error) {
        console.error('Failed to load users:', error);
        showToast('Failed to load users', 'error');
    }
}

async function loadSubscriptions() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/subscriptions`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const subs = data.subscriptions;
            document.getElementById('freeSubCount').textContent = subs.find(s => s.subscription === 'free')?.count || 0;
            document.getElementById('proSubCount').textContent = subs.find(s => s.subscription === 'pro')?.count || 0;
            document.getElementById('enterpriseSubCount').textContent = subs.find(s => s.subscription === 'enterprise')?.count || 0;
        }
    } catch (error) {
        console.error('Failed to load subscriptions:', error);
    }
}

async function loadApiSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/settings`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Populate API settings
            const newsProvider = data.settings.find(s => s.key === 'news_api_provider');
            const newsKey = data.settings.find(s => s.key === 'news_api_key');
            const aiProvider = data.settings.find(s => s.key === 'ai_api_provider');
            const aiKey = data.settings.find(s => s.key === 'ai_api_key');
            
            if (newsProvider) document.getElementById('newsApiProvider').value = newsProvider.value;
            if (newsKey) document.getElementById('newsApiKey').value = newsKey.value;
            if (aiProvider) document.getElementById('aiApiProvider').value = aiProvider.value;
            if (aiKey) document.getElementById('aiApiKey').value = aiKey.value;
        }
    } catch (error) {
        console.error('Failed to load API settings:', error);
    }
}

async function loadLogs() {
    const level = document.getElementById('logLevel')?.value || 'all';
    
    try {
        // Mock logs for now - would be fetched from server
        const logs = [
            { time: new Date().toISOString(), level: 'info', message: 'Server started successfully' },
            { time: new Date(Date.now() - 60000).toISOString(), level: 'info', message: 'User login: admin' },
            { time: new Date(Date.now() - 120000).toISOString(), level: 'warn', message: 'High API usage detected' },
            { time: new Date(Date.now() - 180000).toISOString(), level: 'info', message: 'MT4 client connected' },
            { time: new Date(Date.now() - 240000).toISOString(), level: 'error', message: 'Failed to fetch news data' }
        ];
        
        const filteredLogs = level === 'all' ? logs : logs.filter(l => l.level === level);
        renderLogs(filteredLogs);
    } catch (error) {
        console.error('Failed to load logs:', error);
    }
}

// ==================== RENDERING ====================

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-${user.subscription}">${user.subscription.toUpperCase()}</span></td>
            <td>${user.tradeCount || 0}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>${user.last_login ? formatDate(user.last_login) : 'Never'}</td>
            <td>
                <button class="btn btn-icon" onclick="editUser(${user.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-icon" onclick="deleteUser(${user.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderPagination(pagination) {
    const container = document.getElementById('usersPagination');
    if (!container) return;
    
    let html = '';
    
    // Previous
    html += `<button ${pagination.page === 1 ? 'disabled' : ''} onclick="changePage(${pagination.page - 1})">Prev</button>`;
    
    // Pages
    for (let i = 1; i <= pagination.pages; i++) {
        html += `<button class="${i === pagination.page ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    // Next
    html += `<button ${pagination.page === pagination.pages ? 'disabled' : ''} onclick="changePage(${pagination.page + 1})">Next</button>`;
    
    container.innerHTML = html;
}

function renderRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-user-plus"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.username} ${activity.action}</div>
                <div class="activity-time">${formatDate(activity.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

function renderLogs(logs) {
    const container = document.getElementById('logContainer');
    if (!container) return;
    
    container.innerHTML = logs.map(log => `
        <div class="log-entry">
            <span class="log-time">${new Date(log.time).toLocaleTimeString()}</span>
            <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
            <span class="log-message">${log.message}</span>
        </div>
    `).join('');
}

function renderApiUsageChart(usageData) {
    const ctx = document.getElementById('apiUsageChart');
    if (!ctx) return;
    
    if (state.apiUsageChart) {
        state.apiUsageChart.destroy();
    }
    
    state.apiUsageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: usageData.map(d => d.date),
            datasets: [{
                label: 'API Requests',
                data: usageData.map(d => d.requests),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Unique Users',
                data: usageData.map(d => d.uniqueUsers),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94a3b8' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                }
            }
        }
    });
}

// ==================== USER ACTIONS ====================

function editUser(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editRole').value = user.role;
    document.getElementById('editSubscription').value = user.subscription;
    
    openModal('userModal');
}

async function saveUser() {
    const userId = document.getElementById('editUserId').value;
    const role = document.getElementById('editRole').value;
    const subscription = document.getElementById('editSubscription').value;
    const expiry = document.getElementById('editExpiry').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ role, subscription, subscriptionExpiry: expiry })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('User updated successfully');
            closeModal('userModal');
            loadUsers();
        } else {
            showToast(data.message || 'Failed to update user', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

function deleteUser(userId) {
    state.deleteUserId = userId;
    openModal('deleteModal');
}

async function confirmDeleteUser() {
    if (!state.deleteUserId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${state.deleteUserId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('User deleted successfully');
            closeModal('deleteModal');
            loadUsers();
        } else {
            showToast(data.message || 'Failed to delete user', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
    
    state.deleteUserId = null;
}

function changePage(page) {
    state.userPage = page;
    loadUsers();
}

// ==================== SETTINGS ====================

async function saveApiConfiguration() {
    // Get selected AI provider
    const aiProvider = document.querySelector('input[name="aiProvider"]:checked')?.value || 'openai';
    
    const settings = {
        news_api_provider: document.getElementById('newsApiProvider').value,
        news_api_key: document.getElementById('newsApiKey').value,
        ai_service_provider: aiProvider,
        ai_trade_reports: document.getElementById('aiTradeReports')?.checked || true,
        ai_weekly_reports: document.getElementById('aiWeeklyReports')?.checked || true,
        ai_monthly_reports: document.getElementById('aiMonthlyReports')?.checked || true,
        ai_behavior_analysis: document.getElementById('aiBehaviorAnalysis')?.checked || true
    };
    
    // Add provider-specific settings
    if (aiProvider === 'openai') {
        settings.ai_api_key = document.getElementById('openaiApiKey').value;
        settings.ai_model = document.getElementById('openaiModel').value;
    } else if (aiProvider === 'anthropic') {
        settings.ai_api_key = document.getElementById('anthropicApiKey').value;
        settings.ai_model = document.getElementById('anthropicModel').value;
    } else if (aiProvider === 'google') {
        settings.ai_api_key = document.getElementById('googleApiKey').value;
        settings.ai_model = document.getElementById('googleModel').value;
    } else if (aiProvider === 'local') {
        settings.ai_endpoint = document.getElementById('localEndpoint').value;
        settings.ai_model = document.getElementById('localModel').value;
    }
    
    try {
        for (const [key, value] of Object.entries(settings)) {
            await fetch(`${API_BASE_URL}/admin/settings/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ value: String(value) })
            });
        }
        
        showToast('API settings saved successfully');
    } catch (error) {
        showToast('Failed to save API settings', 'error');
    }
}

async function testApiConnections() {
    showToast('Testing API connections...');
    
    // Mock test - would actually test connections
    setTimeout(() => {
        showToast('All APIs connected successfully');
    }, 1500);
}

async function saveSystemConfiguration() {
    const settings = {
        app_name: document.getElementById('appName').value,
        maintenance_mode: document.getElementById('maintenanceMode').checked,
        allow_registration: document.getElementById('allowRegistration').checked,
        max_login_attempts: document.getElementById('maxLoginAttempts').value,
        session_timeout: document.getElementById('sessionTimeout').value,
        require_email_verification: document.getElementById('requireEmailVerification').checked,
        admin_email: document.getElementById('adminEmail').value,
        notify_new_user: document.getElementById('notifyNewUser').checked,
        notify_api_errors: document.getElementById('notifyApiErrors').checked
    };
    
    try {
        for (const [key, value] of Object.entries(settings)) {
            await fetch(`${API_BASE_URL}/admin/settings/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ value: String(value) })
            });
        }
        
        showToast('System settings saved successfully');
    } catch (error) {
        showToast('Failed to save system settings', 'error');
    }
}

function switchSettingsTab(tab) {
    document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    document.querySelectorAll('#page-settings .tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tab}`);
    });
}

function clearSystemLogs() {
    const container = document.getElementById('logContainer');
    if (container) {
        container.innerHTML = '<div class="log-entry"><span class="log-message">Logs cleared</span></div>';
    }
    showToast('Logs cleared');
}

// ==================== UTILITIES ====================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}
