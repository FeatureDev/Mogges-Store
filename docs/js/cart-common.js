// Common cart functionality for all pages
// Database-backed cart with localStorage fallback

import { API_BASE_URL } from './config.js';

function getToken() {
    return localStorage.getItem('token');
}

function isLoggedIn() {
    return !!getToken();
}

function getLocalCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveLocalCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart count in navigation
export function updateCartCount() {
    var cart = getLocalCart();
    var totalItems = cart.reduce(function(sum, item) { return sum + item.quantity; }, 0);

    var countElements = document.querySelectorAll('.cart-count');
    countElements.forEach(function(el) {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

// Sync localStorage cart to DB after login
export async function syncCartToDb() {
    if (!isLoggedIn()) return;

    var localCart = getLocalCart();
    var token = getToken();

    try {
        if (localCart.length > 0) {
            var resp = await fetch(API_BASE_URL + '/api/cart/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ items: localCart })
            });

            if (resp.ok) {
                var dbCart = await resp.json();
                saveLocalCart(dbCart);
                updateCartCount();
                return;
            }
        }

        var resp2 = await fetch(API_BASE_URL + '/api/cart', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (resp2.ok) {
            var dbCart2 = await resp2.json();
            saveLocalCart(dbCart2);
            updateCartCount();
        }
    } catch (err) {
        console.error('Cart sync error:', err);
    }
}

// Load cart from DB
export async function loadCartFromDb() {
    if (!isLoggedIn()) return;

    try {
        var resp = await fetch(API_BASE_URL + '/api/cart', {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        if (resp.ok) {
            var dbCart = await resp.json();
            saveLocalCart(dbCart);
            updateCartCount();
        }
    } catch (err) {
        console.error('Load cart error:', err);
    }
}

// Add product to cart
export async function addToCart(product) {
    if (!product || !product.id) {
        console.error('Invalid product');
        return false;
    }

    var cart = getLocalCart();
    var existingItem = cart.find(function(item) { return item.id === product.id; });
    var newQuantity;

    if (existingItem) {
        existingItem.quantity++;
        newQuantity = existingItem.quantity;
    } else {
        newQuantity = 1;
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category || '',
            quantity: 1
        });
    }

    saveLocalCart(cart);
    updateCartCount();

    if (isLoggedIn()) {
        try {
            await fetch(API_BASE_URL + '/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getToken()
                },
                body: JSON.stringify({ productId: product.id, quantity: newQuantity })
            });
        } catch (err) {
            console.error('Cart API error:', err);
        }
    }

    return true;
}

// Get cart items
export function getCart() {
    return getLocalCart();
}

// Clear cart
export async function clearCart() {
    localStorage.removeItem('cart');
    updateCartCount();

    if (isLoggedIn()) {
        try {
            await fetch(API_BASE_URL + '/api/cart', {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + getToken() }
            });
        } catch (err) {
            console.error('Clear cart error:', err);
        }
    }
}

// Remove item from cart
export async function removeFromCart(productId) {
    var cart = getLocalCart();
    var updatedCart = cart.filter(function(item) { return item.id !== productId; });
    saveLocalCart(updatedCart);
    updateCartCount();

    if (isLoggedIn()) {
        try {
            await fetch(API_BASE_URL + '/api/cart/' + productId, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + getToken() }
            });
        } catch (err) {
            console.error('Remove cart item error:', err);
        }
    }
}

// Update item quantity
export async function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
        await removeFromCart(productId);
        return;
    }

    var cart = getLocalCart();
    var item = cart.find(function(i) { return i.id === productId; });

    if (item) {
        item.quantity = quantity;
        saveLocalCart(cart);
        updateCartCount();

        if (isLoggedIn()) {
            try {
                await fetch(API_BASE_URL + '/api/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + getToken()
                    },
                    body: JSON.stringify({ productId: productId, quantity: quantity })
                });
            } catch (err) {
                console.error('Update quantity error:', err);
            }
        }
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    if (isLoggedIn()) {
        loadCartFromDb();
    }
});

// Listen for storage changes (when cart is updated in another tab)
window.addEventListener('storage', function(e) {
    if (e.key === 'cart') {
        updateCartCount();
    }
});
