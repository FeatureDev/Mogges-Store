import { API_BASE_URL } from './config.js';

console.log('Admin dashboard loaded');

// Use API_BASE_URL from config.js
const API_URL = API_BASE_URL;

let products = [];
let editingProductId = null;
let availableImages = [];

// ==========================================
// SIDEBAR NAVIGATION
// ==========================================

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.dataset.page;

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            pages.forEach(p => p.classList.add('hidden'));
            const page = document.getElementById('page-' + targetPage);
            if (page) page.classList.remove('hidden');

            if (targetPage === 'products') loadProducts();
            if (targetPage === 'dashboard') loadDashboardStats();
            if (targetPage === 'users') loadUsers();
            if (targetPage === 'employees') loadEmployees();
        });
    });
}

// ==========================================
// DASHBOARD STATS
// ==========================================

async function loadDashboardStats() {
    try {
        var token = localStorage.getItem('token');
        var prodResp = await fetch(API_URL + '/api/products', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        var productsData = await prodResp.json();

        var totalRevenue = productsData.reduce(function(sum, p) { return sum + (p.price * p.stock); }, 0);
        document.getElementById('stat-revenue').textContent = Math.round(totalRevenue).toLocaleString('sv-SE') + ' kr';
        document.getElementById('stat-active').textContent = productsData.length;

        if (hasRole(currentUserRole, 'admin')) {
            var usersResp = await fetch(API_URL + '/api/users', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (usersResp.ok) {
                var usersData = await usersResp.json();
                var totalUsers = usersData.filter(function(u) { return u.role === 'user'; }).length;
                var totalEmployees = usersData.filter(function(u) { return u.role === 'employee'; }).length;
                document.getElementById('stat-users').textContent = totalUsers;
                document.getElementById('stat-employees').textContent = totalEmployees;
            }
        } else {
            document.getElementById('stat-users').textContent = '—';
            document.getElementById('stat-employees').textContent = '—';
        }

        document.getElementById('activity-list').innerHTML =
            '<li>Dashboard laddad</li>' +
            '<li>' + productsData.length + ' produkter i databasen</li>' +
            '<li>API: ' + API_URL + '</li>';
    } catch (error) {
        console.error('Dashboard stats error:', error);
    }
}

// ==========================================
// USERS PAGE
// ==========================================

async function loadUsers() {
    const container = document.getElementById('users-content');
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_URL + '/api/users', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) {
            container.innerHTML = '<div class="loading">Users endpoint not available</div>';
            return;
        }
        const users = await response.json();
        const isMaster = currentUserRole === 'master';
        const roleOptions = ['master', 'admin', 'employee', 'user'];

        let html = '<table class="users-table"><thead><tr>';
        html += '<th>ID</th><th>Email</th><th>Roll</th>';
        if (isMaster) html += '<th>Actions</th>';
        html += '</tr></thead><tbody>';

        users.forEach(function(u) {
            html += '<tr>';
            html += '<td>' + u.id + '</td>';
            html += '<td>' + u.email + '</td>';
            if (isMaster) {
                html += '<td><select class="role-select" data-user-id="' + u.id + '">';
                roleOptions.forEach(function(r) {
                    var selected = r === u.role ? ' selected' : '';
                    html += '<option value="' + r + '"' + selected + '>' + r + '</option>';
                });
                html += '</select></td>';
                html += '<td><button class="btn btn-danger btn-small delete-user-btn" data-user-id="' + u.id + '">Ta bort</button></td>';
            } else {
                html += '<td><span class="role-badge role-' + u.role + '">' + u.role + '</span></td>';
            }
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        if (isMaster) {
            container.querySelectorAll('.role-select').forEach(function(sel) {
                sel.addEventListener('change', async function() {
                    var userId = this.dataset.userId;
                    var newRole = this.value;
                    var t = localStorage.getItem('token');
                    var resp = await fetch(API_URL + '/api/admin/update-role', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
                        body: JSON.stringify({ userId: Number(userId), newRole: newRole })
                    });
                    if (resp.ok) {
                        var msg = document.createElement('div');
                        msg.className = 'success-toast';
                        msg.textContent = 'Roll uppdaterad!';
                        document.body.appendChild(msg);
                        setTimeout(function() { msg.remove(); }, 2000);
                    } else {
                        var err = await resp.json();
                        alert(err.error || 'Kunde inte uppdatera roll');
                        loadUsers();
                    }
                });
            });

            container.querySelectorAll('.delete-user-btn').forEach(function(btn) {
                btn.addEventListener('click', async function() {
                    var userId = this.dataset.userId;
                    if (!confirm('Ta bort denna user?')) return;
                    var t = localStorage.getItem('token');
                    var resp = await fetch(API_URL + '/api/admin/delete-user/' + userId, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + t }
                    });
                    if (resp.ok) loadUsers();
                    else alert('Kunde inte ta bort user');
                });
            });
        }
    } catch (error) {
        container.innerHTML = '<div class="loading">Kunde inte ladda users</div>';
    }
}

// ==========================================
// EMPLOYEES PAGE
// ==========================================

async function loadEmployees() {
    var container = document.getElementById('employees-content');
    try {
        var token = localStorage.getItem('token');
        var response = await fetch(API_URL + '/api/users', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) {
            container.innerHTML = '<div class="loading">Kunde inte ladda anstallda</div>';
            return;
        }
        var allUsers = await response.json();
        var employees = allUsers.filter(function(u) { return u.role === 'employee'; });

        if (employees.length === 0) {
            container.innerHTML = '<div class="loading">Inga anstallda hittades</div>';
            return;
        }

        var html = '<table class="users-table"><thead><tr>';
        html += '<th>ID</th><th>Email</th><th>Roll</th>';
        html += '</tr></thead><tbody>';

        employees.forEach(function(e) {
            html += '<tr>';
            html += '<td>' + e.id + '</td>';
            html += '<td>' + e.email + '</td>';
            html += '<td><span class="role-badge role-employee">employee</span></td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="loading">Kunde inte ladda anstallda</div>';
    }
}

// Create image picker modal dynamically
function createImagePickerModal() {
    const modal = document.createElement('div');
    modal.id = 'image-picker-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h2>Valj Bild</h2>
                <span class="close" id="close-image-picker">&times;</span>
            </div>
            <div class="image-gallery" id="image-gallery">
                <div class="loading">Laddar bilder...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close button
    document.getElementById('close-image-picker').addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'image-picker-modal') {
            modal.classList.remove('show');
        }
    });
}

// Load available images
async function loadImages() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/images`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            console.warn('Images endpoint not available:', response.status);
            return [];
        }
        availableImages = await response.json();
        return availableImages;
    } catch (error) {
        console.error('Error loading images:', error);
        return [];
    }
}

// Display image gallery
function displayImageGallery() {
    const gallery = document.getElementById('image-gallery');
    
    if (availableImages.length === 0) {
        gallery.innerHTML = '<div class="loading">Inga bilder hittades</div>';
        return;
    }
    
    gallery.innerHTML = availableImages.map(img => `
        <div class="image-item" data-path="${img.path}">
            <img src="../${img.path}" alt="${img.name}" onerror="this.src='../picture/1.jpg'">
            <div class="image-name">${img.name}</div>
        </div>
    `).join('');
    
    // Add click handlers to images
    document.querySelectorAll('.image-item').forEach(item => {
        item.addEventListener('click', () => {
            const imagePath = item.dataset.path;
            selectImage(imagePath);
        });
    });
}

// Select an image
function selectImage(imagePath) {
    document.getElementById('product-image').value = imagePath;
    
    // Show preview
    const preview = document.getElementById('current-image-preview');
    const img = document.getElementById('current-image');
    if (preview && img) {
        img.src = '../' + imagePath;
        preview.style.display = 'block';
    }
    
    // Close image picker modal
    document.getElementById('image-picker-modal').classList.remove('show');
}



// Predefined product names per category (professional Swedish names)
const productNamesByCategory = {
    'Dam Mode': [
        'Elegant Aftonkl�nning',
        'Klassisk Blus',
        'Modern Kavaj',
        'Sommarkl�nning',
        'Vinterkappa',
        'Businesskjol',
        'Stickad Tr�ja',
        'Bomullsskjorta',
        'Festkl�nning',
        'L�ng Cardigan'
    ],
    'Herr Mode': [
        'Kostymbyxa',
        'Businessskjorta',
        'Kavaj',
        'Polotr�ja',
        'Stickad Tr�ja',
        'Chinos',
        'Jeans',
        'Vinterjacka',
        'Hoodie',
        'Skjorta Premium'
    ],
    'Accessoarer': [
        'L�derv�ska',
        'Pl�nbok',
        'B�lte',
        'Halsduk',
        'M�ssa',
        'Handskar',
        'Solglas�gon',
        'Armband',
        'Halsband',
        '�rh�ngen'
    ],
    'Skor': [
        'L�derskor',
        'Sneakers',
        'St�vlar',
        'Sandaletter',
        'Loafers',
        'Pumps',
        'Boots',
        'Tr�ningsskor',
        'Vardagsskor',
        'Festskor'
    ]
};

// Update product name dropdown based on selected category
function updateProductNameOptions(selectedCategory) {
    const productNameSelect = document.getElementById('product-name');
    const names = productNamesByCategory[selectedCategory] || [];
    
    if (!selectedCategory) {
        productNameSelect.innerHTML = '<option value="">Valj kategori forst...</option>';
        productNameSelect.disabled = true;
        return;
    }
    
    productNameSelect.disabled = false;
    productNameSelect.innerHTML = '<option value="">Valj produktnamn...</option>' +
        names.map(name => `<option value="${name}">${name}</option>`).join('');
}

// Category change listener
document.getElementById('product-category').addEventListener('change', (e) => {
    updateProductNameOptions(e.target.value);
});

// ==========================================
// ROLE PERMISSIONS
// ==========================================

const ROLE_LEVELS = { 'master': 1, 'admin': 2, 'employee': 3, 'user': 4 };
let currentUserRole = 'user';
let currentPermissions = {};

function hasRole(role, required) {
    return (ROLE_LEVELS[role] || 99) <= (ROLE_LEVELS[required] || 0);
}

function applyRolePermissions() {
    const canManageProducts = hasRole(currentUserRole, 'admin');
    const canManageUsers = hasRole(currentUserRole, 'admin');
    const canManageSystem = hasRole(currentUserRole, 'master');

    const addBtn = document.getElementById('add-product-btn');
    if (addBtn) addBtn.style.display = canManageProducts ? '' : 'none';

    const navUsers = document.querySelector('[data-page="users"]');
    if (navUsers) navUsers.style.display = canManageUsers ? '' : 'none';

    const navEmployees = document.querySelector('[data-page="employees"]');
    if (navEmployees) navEmployees.style.display = canManageUsers ? '' : 'none';

    const navSystem = document.querySelector('[data-page="system"]');
    if (navSystem) navSystem.style.display = canManageSystem ? '' : 'none';

    document.querySelectorAll('.btn-danger, .btn-secondary').forEach(btn => {
        if (btn.textContent.includes('Ta bort') || btn.textContent.includes('Redigera')) {
            btn.style.display = canManageProducts ? '' : 'none';
        }
    });
}

// Check authentication
async function checkAuth() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return false;
        }

        const response = await fetch(API_URL + '/api/check-auth', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        const data = await response.json();

        const allowedRoles = ['master', 'admin', 'employee'];
        if (!data.authenticated || !allowedRoles.includes(data.user.role)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
            return false;
        }

        currentUserRole = data.user.role;
        currentPermissions = data.permissions || {};
        document.getElementById('user-email').textContent = data.user.email + ' (' + data.user.role + ')';
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Load products
async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch products');

        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-grid').innerHTML = `
            <div class="loading">Kunde inte ladda produkter</div>
        `;
    }
}

// Display products
function displayProducts() {
    const grid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        grid.innerHTML = '<div class="loading">Inga produkter hittades</div>';
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="../${product.image}" alt="${product.name}" class="product-card-image" onerror="this.src='../picture/1.jpg'">
            <div class="product-card-name">${product.name}</div>
            <div class="product-card-description">${product.description || 'Ingen beskrivning'}</div>
            <div class="product-card-info">
                <div class="product-card-price">${product.price} kr</div>
                <div class="product-card-stock">Lager: ${product.stock}</div>
            </div>
            <div class="product-card-info">
                <div class="product-card-stock">${product.category || 'Ingen kategori'}</div>
            </div>
            <div class="product-card-actions">
                <button class="btn btn-secondary btn-small" onclick="window.editProduct(${product.id})">Redigera</button>
                <button class="btn btn-danger btn-small" onclick="window.deleteProduct(${product.id})">Ta bort</button>
            </div>
        </div>
    `).join('');
}

// Open modal for adding product
document.getElementById('add-product-btn').addEventListener('click', () => {
    editingProductId = null;
    document.getElementById('modal-title').textContent = 'Lagg till produkt';
    document.getElementById('product-form').reset();
    
    // Reset category dropdown and name dropdown
    document.getElementById('product-category').value = '';
    document.getElementById('product-name').innerHTML = '<option value="">Valj kategori forst...</option>';
    document.getElementById('product-name').disabled = true;
    
    document.getElementById('product-modal').classList.add('show');
});

// Edit product
window.editProduct = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    editingProductId = id;
    document.getElementById('modal-title').textContent = 'Redigera produkt';
    document.getElementById('product-id').value = product.id;
    
    // Set category first to populate name options
    document.getElementById('product-category').value = product.category || 'Dam Mode';
    updateProductNameOptions(product.category || 'Dam Mode');
    
    // Set name (either from predefined list or custom)
    const productNameSelect = document.getElementById('product-name');
    const nameExists = Array.from(productNameSelect.options).some(opt => opt.value === product.name);
    
    if (nameExists) {
        productNameSelect.value = product.name;
    } else {
        // Add custom name as option if not in predefined list
        const customOption = document.createElement('option');
        customOption.value = product.name;
        customOption.textContent = product.name + ' (anpassat)';
        productNameSelect.appendChild(customOption);
        productNameSelect.value = product.name;
    }
    
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-image').value = product.image;
    
    // Show image preview
    const preview = document.getElementById('current-image-preview');
    const img = document.getElementById('current-image');
    if (preview && img && product.image) {
        img.src = '../' + product.image;
        preview.style.display = 'block';
    }
    
    document.getElementById('product-modal').classList.add('show');
}

// Delete product
window.deleteProduct = async function(id) {
    if (!confirm('Ar du saker pa att du vill ta bort denna produkt?')) return;
    
    // Find the product card and add deleting animation
    const productCards = document.querySelectorAll('.product-card');
    let productCard = null;
    productCards.forEach(card => {
        const editBtn = card.querySelector('button[onclick*="editProduct"]');
        if (editBtn && editBtn.onclick.toString().includes(`(${id})`)) {
            productCard = card;
        }
    });
    
    // Add fade-out animation
    if (productCard) {
        productCard.style.opacity = '0.5';
        productCard.style.pointerEvents = 'none';
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Restore card if failed
            if (productCard) {
                productCard.style.opacity = '1';
                productCard.style.pointerEvents = 'auto';
            }
            throw new Error(data.error || 'Failed to delete product');
        }
        
        console.log('? Product deleted');
        
        // Remove from products array
        products = products.filter(p => p.id !== id);
        
        // Animate removal
        if (productCard) {
            productCard.style.transform = 'scale(0)';
            productCard.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                displayProducts();
            }, 300);
        } else {
            displayProducts();
        }
        
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Kunde inte ta bort produkt: ' + error.message);
    }
}

// Save product (add or edit)
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        category: document.getElementById('product-category').value,
        image: document.getElementById('product-image').value || 'picture/1.jpg'
    };
    
    try {
        const url = editingProductId ? `${API_URL}/api/products/${editingProductId}` : `${API_URL}/api/products`;
        const method = editingProductId ? 'PUT' : 'POST';
        
        
        const token = localStorage.getItem('token');
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to save product');
        }
        
        console.log('? Product saved');
        
        // Update products array immediately
        if (editingProductId) {
            // Update existing product
            const index = products.findIndex(p => p.id === editingProductId);
            if (index !== -1) {
                products[index] = { ...products[index], ...formData };
            }
        } else {
            // Add new product with ID from response
            products.push({ id: data.id, ...formData });
        }
        
        // Close modal and update display
        document.getElementById('product-modal').classList.remove('show');
        const preview = document.getElementById('current-image-preview');
        if (preview) preview.style.display = 'none';
        
        // Update display immediately
        displayProducts();
        
        // Show success message briefly
        const successMsg = document.createElement('div');
        successMsg.className = 'success-toast';
        successMsg.textContent = editingProductId ? '? Produkt uppdaterad!' : '? Produkt skapad!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 2000);
        
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Kunde inte spara produkt: ' + error.message);
    }
});

// Close modal
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('product-modal').classList.remove('show');
    // Hide image preview
    const preview = document.getElementById('current-image-preview');
    if (preview) preview.style.display = 'none';
});

document.getElementById('cancel-btn').addEventListener('click', () => {
    document.getElementById('product-modal').classList.remove('show');
    // Hide image preview
    const preview = document.getElementById('current-image-preview');
    if (preview) preview.style.display = 'none';
});

// Click outside modal to close
document.getElementById('product-modal').addEventListener('click', (e) => {
    if (e.target.id === 'product-modal') {
        document.getElementById('product-modal').classList.remove('show');
    }
});

// Initialize
(async () => {
    const isAuth = await checkAuth();
    if (isAuth) {
        setupNavigation();
        applyRolePermissions();
        loadDashboardStats();
        loadProducts();
        await loadImages();
        createImagePickerModal();

        // Setup browse images button
        const productModal = document.getElementById('product-modal');
        if (!document.getElementById('browse-images-btn')) {
            const imageInput = document.getElementById('product-image');
            imageInput.readOnly = true;

            const browseBtn = document.createElement('button');
            browseBtn.type = 'button';
            browseBtn.className = 'btn btn-secondary';
            browseBtn.id = 'browse-images-btn';
            browseBtn.textContent = 'Valj Bild';
            browseBtn.style.marginTop = '8px';

            imageInput.parentElement.insertBefore(browseBtn, imageInput.nextSibling);

            const previewDiv = document.createElement('div');
            previewDiv.id = 'current-image-preview';
            previewDiv.style.cssText = 'margin-top: 10px; display: none;';
            previewDiv.innerHTML = '<img id="current-image" src="" alt="Preview" style="max-width: 200px; max-height: 200px; border: 2px solid #e5e7eb; border-radius: 8px;">';
            browseBtn.parentElement.appendChild(previewDiv);
        }

        document.getElementById('browse-images-btn').addEventListener('click', async () => {
            await loadImages();
            displayImageGallery();
            document.getElementById('image-picker-modal').classList.add('show');
        });
    }
})();

console.log('Admin dashboard initialized');
