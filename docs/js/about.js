'use strict';

// Update cart count on page load
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const countElements = document.querySelectorAll('.cart-count');
    countElements.forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    console.log('About-sidan är laddad!');
});

