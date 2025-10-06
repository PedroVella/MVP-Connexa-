// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Global variables
let currentUser = null;
let authToken = null;
let courses = [];

// DOM Elements
const screens = {
    welcome: document.getElementById('welcomeScreen'),
    login: document.getElementById('loginScreen'),
    register: document.getElementById('registerScreen'),
    profile: document.getElementById('profileScreen')
};

const buttons = {
    login: document.getElementById('loginBtn'),
    register: document.getElementById('registerBtn'),
    profile: document.getElementById('profileBtn'),
    logout: document.getElementById('logoutBtn')
};

const forms = {
    login: document.getElementById('loginForm'),
    register: document.getElementById('registerForm')
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadCourses();
});

// App initialization
function initializeApp() {
    // Check for stored auth token
    authToken = localStorage.getItem('authToken');
    
    if (authToken) {
        // Verify token and load user profile
        loadUserProfile();
    } else {
        showWelcome();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation buttons
    buttons.login.addEventListener('click', showLogin);
    buttons.register.addEventListener('click', showRegister);
    buttons.profile.addEventListener('click', showProfile);
    buttons.logout.addEventListener('click', logout);

    // Hero buttons (main screen)
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    const heroRegisterBtn = document.getElementById('heroRegisterBtn');
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');

    if (heroLoginBtn) {
        heroLoginBtn.addEventListener('click', showLogin);
    }
    
    if (heroRegisterBtn) {
        heroRegisterBtn.addEventListener('click', showRegister);
    }

    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', logout);
    }

    // Form navigation links
    const loginToRegisterLink = document.getElementById('loginToRegisterLink');
    const registerToLoginLink = document.getElementById('registerToLoginLink');

    if (loginToRegisterLink) {
        loginToRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegister();
        });
    }

    if (registerToLoginLink) {
        registerToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLogin();
        });
    }

    // Form submissions
    forms.login.addEventListener('submit', handleLogin);
    forms.register.addEventListener('submit', handleRegister);
}

// Screen navigation
function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });

    // Show selected screen
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    }

    // Update navigation
    updateNavigation();
}

function showWelcome() {
    showScreen('welcome');
}

function showLogin() {
    showScreen('login');
    forms.login.reset();
}

function showRegister() {
    showScreen('register');
    forms.register.reset();
}

function showProfile() {
    showScreen('profile');
    loadUserProfile();
}

// Navigation state management
function updateNavigation() {
    if (authToken && currentUser) {
        // User is logged in
        buttons.login.classList.add('hidden');
        buttons.register.classList.add('hidden');
        buttons.profile.classList.remove('hidden');
        buttons.logout.classList.remove('hidden');
    } else {
        // User is not logged in
        buttons.login.classList.remove('hidden');
        buttons.register.classList.remove('hidden');
        buttons.profile.classList.add('hidden');
        buttons.logout.classList.add('hidden');
    }
}

// API Calls
async function apiCall(endpoint, options = {}) {
    try {
        showLoading(true);
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro na requisição');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    } finally {
        showLoading(false);
    }
}

// Load courses for registration form
async function loadCourses() {
    try {
        const response = await apiCall('/users/courses');
        courses = response.data.courses;
        
        const courseSelect = document.getElementById('course');
        courseSelect.innerHTML = '<option value="">Selecione seu curso</option>';
        
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            courseSelect.appendChild(option);
        });
    } catch (error) {
        showToast('Erro ao carregar cursos: ' + error.message, 'error');
    }
}

// Authentication handlers
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(forms.login);
    const loginData = {
        institutional_email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    try {
        const response = await apiCall('/users/login', {
            method: 'POST',
            body: JSON.stringify(loginData)
        });

        // Store auth token
        authToken = response.data.token;
        localStorage.setItem('authToken', authToken);
        
        // Store user data
        currentUser = response.data.user;
        
        showToast('Login realizado com sucesso!', 'success');
        showProfile();
        
    } catch (error) {
        showToast('Erro no login: ' + error.message, 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const registerData = {
        full_name: document.getElementById('fullName').value,
        institutional_email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        course_id: parseInt(document.getElementById('course').value),
        current_semester: parseInt(document.getElementById('semester').value)
    };

    try {
        const response = await apiCall('/users/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });

        showToast('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
        showLogin();
        
        // Pre-fill login form
        document.getElementById('loginEmail').value = registerData.institutional_email;
        
    } catch (error) {
        showToast('Erro no cadastro: ' + error.message, 'error');
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await apiCall('/users/profile');
        currentUser = response.data.user;
        
        displayUserProfile();
        updateNavigation();
        
    } catch (error) {
        console.error('Error loading profile:', error);
        
        // Token might be invalid, clear it
        authToken = null;
        localStorage.removeItem('authToken');
        currentUser = null;
        
        showToast('Sessão expirada. Faça login novamente.', 'warning');
        showWelcome();
    }
}

// Display user profile data
function displayUserProfile() {
    const profileData = document.getElementById('profileData');
    
    if (!currentUser) {
        profileData.innerHTML = '<p>Erro ao carregar dados do perfil.</p>';
        return;
    }

    const courseName = currentUser.course_name || 'Não informado';
    const createdDate = new Date(currentUser.created_at).toLocaleDateString('pt-BR');

    profileData.innerHTML = `
        <div class="profile-item">
            <span class="label">Nome:</span>
            <span class="value">${currentUser.full_name}</span>
        </div>
        <div class="profile-item">
            <span class="label">Email:</span>
            <span class="value">${currentUser.institutional_email}</span>
        </div>
        <div class="profile-item">
            <span class="label">Curso:</span>
            <span class="value">${courseName}</span>
        </div>
        <div class="profile-item">
            <span class="label">Semestre:</span>
            <span class="value">${currentUser.current_semester}º semestre</span>
        </div>
        <div class="profile-item">
            <span class="label">Membro desde:</span>
            <span class="value">${createdDate}</span>
        </div>
    `;
}

// Refresh auth token
async function refreshToken() {
    try {
        const response = await apiCall('/users/refresh-token', {
            method: 'POST'
        });

        authToken = response.data.token;
        localStorage.setItem('authToken', authToken);
        
        showToast('Token renovado com sucesso!', 'success');
        
    } catch (error) {
        showToast('Erro ao renovar token: ' + error.message, 'error');
    }
}

// Logout
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    showToast('Logout realizado com sucesso!', 'success');
    showWelcome();
}

// UI Helpers
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');
    
    // Set message
    messageEl.textContent = message;
    
    // Set type and icon
    toast.className = `toast ${type}`;
    
    switch (type) {
        case 'success':
            icon.className = 'toast-icon fas fa-check-circle';
            break;
        case 'error':
            icon.className = 'toast-icon fas fa-exclamation-circle';
            break;
        case 'warning':
            icon.className = 'toast-icon fas fa-exclamation-triangle';
            break;
        default:
            icon.className = 'toast-icon fas fa-info-circle';
    }
    
    // Show toast
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide toast after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 5000);
}

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
}

// Add real-time form validation
document.getElementById('registerPassword').addEventListener('input', function() {
    const password = this.value;
    const isValid = validatePassword(password);
    
    if (password.length > 0) {
        if (isValid) {
            this.style.borderColor = '#28a745';
        } else {
            this.style.borderColor = '#dc3545';
        }
    } else {
        this.style.borderColor = '#e1e5e9';
    }
});

document.getElementById('registerEmail').addEventListener('blur', function() {
    const email = this.value;
    const isValid = validateEmail(email) && (email.endsWith('.edu.br') || email.endsWith('.edu'));
    
    if (email.length > 0) {
        if (isValid) {
            this.style.borderColor = '#28a745';
        } else {
            this.style.borderColor = '#dc3545';
        }
    }
});

// Error handling for network issues
window.addEventListener('online', () => {
    showToast('Conexão restaurada!', 'success');
});

window.addEventListener('offline', () => {
    showToast('Conexão perdida. Verifique sua internet.', 'warning');
});