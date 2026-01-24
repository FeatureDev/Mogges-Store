console.log('?? Checkout page loaded');

// Update cart count in nav
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => el.textContent = cartCount);
}

// Load order items from cart
function loadOrderItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const orderItemsContainer = document.getElementById('order-items');
    
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    orderItemsContainer.innerHTML = cart.map(item => `
        <div class="order-item">
            <img src="../${item.image}" alt="${item.name}" class="order-item-image">
            <div class="order-item-details">
                <div class="order-item-name">${item.name}</div>
                <div class="order-item-quantity">Antal: ${item.quantity}</div>
            </div>
            <div class="order-item-price">${(item.price * item.quantity).toFixed(0)} kr</div>
        </div>
    `).join('');
    
    calculateTotals(cart);
}

// Calculate all totals
function calculateTotals(cart) {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingCost = subtotal >= 500 ? 0 : 49; // Free shipping over 500 kr
    const vatRate = 0.25; // 25% VAT
    const subtotalBeforeVat = subtotal / (1 + vatRate);
    const vat = subtotal - subtotalBeforeVat;
    const total = subtotal + shippingCost;
    
    // Update UI
    document.getElementById('subtotal').textContent = `${subtotal.toFixed(0)} kr`;
    document.getElementById('shipping').textContent = shippingCost === 0 ? 'Gratis' : `${shippingCost} kr`;
    document.getElementById('vat').textContent = `${vat.toFixed(0)} kr`;
    document.getElementById('total').textContent = `${total.toFixed(0)} kr`;
    document.getElementById('payment-amount').textContent = `${total.toFixed(0)} kr`;
}

// Confirm payment
document.getElementById('confirm-payment')?.addEventListener('click', () => {
    // Show loading
    const qrLoader = document.getElementById('qr-loader');
    const qrCode = document.getElementById('qr-code');
    
    qrLoader.style.display = 'flex';
    qrCode.style.display = 'none';
    
    // Simulate payment processing
    setTimeout(() => {
        alert('Betalning bekraftad! \\n\\nDin order har skickats. \\nTack for ditt kop!');
        
        // Clear cart
        localStorage.removeItem('cart');
        
        // Redirect to home
        window.location.href = 'index.html';
    }, 2000);
});

// Initialize
updateCartCount();
loadOrderItems();

console.log('? Checkout initialized');
