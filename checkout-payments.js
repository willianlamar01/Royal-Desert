// ========================================
// CHECKOUT PAYMENTS INTEGRATION
// Stripe, PayPal, Shop Pay
// NIGHTFALL STAR - VERSIÓN MEJORADA
// ========================================

console.log('💳 Loading checkout payments...');

// ========================================
// CONFIGURATION
// ========================================

// ⚠️ REPLACE WITH YOUR REAL KEYS BEFORE GOING LIVE
const STRIPE_PUBLIC_KEY = 'pk_test_51QWlVkRoYnxGLTAh0Yx5hD4jqBqGj9E9mWgPQ9wdIcYHOaZ0'; // Get from: https://dashboard.stripe.com/apikeys
const PAYPAL_CLIENT_ID = 'EEwUVygTQHbIFUswb1e4O1G-ddT37NOO1chhT94ittskBqylTGbP7JJQVP6-qQl-OJj7-dq-hSuUj4S5';

// ========================================
// GLOBAL VARIABLES
// ========================================
let stripe = null;
let cardElement = null;
let paypalButtonRendered = false;

// ========================================
// UTILITY FUNCTIONS
// ========================================
function safeGetCart() {
    try {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('❌ Error reading cart:', error);
        return [];
    }
}

function calculateSubtotal() {
    const cart = safeGetCart();
    return cart.reduce((total, product) => {
        const price = parseFloat(product.price.replace('$', '').replace(',', ''));
        return total + (price * product.quantity);
    }, 0);
}

function getShippingCost() {
    const shippingRadio = document.querySelector('input[name="shipping"]:checked');
    if (!shippingRadio) return 10;
    
    const method = shippingRadio.value;
    const costs = { 'standard': 10, 'express': 25, 'overnight': 45 };
    return costs[method] || 10;
}

function calculateTotal() {
    const subtotal = calculateSubtotal();
    const shipping = getShippingCost();
    const tax = subtotal * 0.10;
    return subtotal + shipping + tax;
}

// ========================================
// MESSAGE FUNCTIONS
// ========================================
function showMessage(message, type = 'info') {
    const icons = { success: '✓', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const icon = icons[type] || icons.info;
    
    // Try to use card-errors div first
    const errorDiv = document.getElementById('card-errors');
    if (errorDiv && type === 'error') {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }, 5000);
    } else {
        alert(`${icon} ${message}`);
    }
}

function showSuccessMessage(message) { showMessage(message, 'success'); }
function showErrorMessage(message) { showMessage(message, 'error'); }
function showInfoMessage(message) { showMessage(message, 'info'); }

// ========================================
// STRIPE INITIALIZATION
// ========================================
function initializeStripe() {
    try {
        console.log('🔄 Initializing Stripe...');
        
        if (typeof Stripe === 'undefined') {
            console.error('❌ Stripe SDK not loaded');
            showErrorMessage('Payment system not available. Please refresh the page.');
            return false;
        }
        
        // Si ya está inicializado, no hacerlo de nuevo
        if (stripe && cardElement) {
            console.log('ℹ️ Stripe already initialized');
            return true;
        }
        
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        const elements = stripe.elements();
        
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#000',
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    '::placeholder': { color: '#999' }
                },
                invalid: {
                    color: '#ef4444',
                    iconColor: '#ef4444'
                }
            },
            hidePostalCode: true
        });
        
        const cardElementContainer = document.getElementById('card-element');
        if (!cardElementContainer) {
            console.error('❌ Card element container not found');
            return false;
        }
        
        cardElement.mount('#card-element');
        
        // Real-time error handling
        cardElement.on('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (displayError) {
                displayError.textContent = event.error ? event.error.message : '';
                displayError.style.display = event.error ? 'block' : 'none';
            }
        });
        
        console.log('✅ Stripe initialized successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Error initializing Stripe:', error);
        showErrorMessage('Error loading payment system');
        return false;
    }
}

// ========================================
// PAYPAL INITIALIZATION - ✅ MEJORADO
// ========================================
function initializePayPal() {
    if (paypalButtonRendered) {
        console.log('ℹ️ PayPal already rendered');
        return;
    }
    
    try {
        console.log('🔄 Initializing PayPal...');
        
        if (typeof paypal === 'undefined') {
            console.error('❌ PayPal SDK not loaded');
            const container = document.getElementById('paypal-button-container');
            if (container) {
                container.innerHTML = `
                    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; text-align: center;">
                        <p style="margin: 0; color: #856404;">⚠️ PayPal SDK failed to load</p>
                        <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #856404;">Please refresh the page or check your internet connection</p>
                    </div>
                `;
            }
            return;
        }
        
        const container = document.getElementById('paypal-button-container');
        if (!container) {
            console.error('❌ PayPal container not found');
            return;
        }
        
        // Validar que haya items en el carrito
        const cart = safeGetCart();
        if (cart.length === 0) {
            container.innerHTML = `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; text-align: center;">
                    <p style="margin: 0; color: #721c24;">⚠️ Your cart is empty</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.9rem;">
                        <a href="index.html#shop" style="color: #721c24; text-decoration: underline;">Go to shop</a>
                    </p>
                </div>
            `;
            return;
        }
        
        // Limpiar contenedor
        container.innerHTML = '';
        
        const totalAmount = calculateTotal();
        const subtotal = calculateSubtotal();
        const shipping = getShippingCost();
        const tax = subtotal * 0.10;
        
        console.log('💰 PayPal order amounts:', {
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            tax: tax.toFixed(2),
            total: totalAmount.toFixed(2)
        });
        
        paypal.Buttons({
            style: {
                shape: 'rect',
                color: 'gold',
                layout: 'vertical',
                label: 'paypal',
                height: 45,
                tagline: false
            },
            
            // Crear la orden de PayPal
            createOrder: function(data, actions) {
                console.log('💰 Creating PayPal order...');
                
                // Validar formulario antes de crear orden
                if (!validateCheckoutForm()) {
                    showErrorMessage('Please fill in all required shipping information');
                    return Promise.reject(new Error('Form validation failed'));
                }
                
                const cart = safeGetCart();
                
                // Crear items para PayPal
                const items = cart.map(item => {
                    const price = parseFloat(item.price.replace('$', '').replace(',', ''));
                    return {
                        name: item.title || 'Product',
                        description: `Size: ${item.size || 'M'}, Color: ${item.color || 'Black'}`,
                        unit_amount: {
                            currency_code: 'USD',
                            value: price.toFixed(2)
                        },
                        quantity: item.quantity.toString(),
                        category: 'PHYSICAL_GOODS'
                    };
                });
                
                return actions.order.create({
                    purchase_units: [{
                        description: 'NIGHTFALL STAR - Fashion Purchase',
                        amount: {
                            currency_code: 'USD',
                            value: totalAmount.toFixed(2),
                            breakdown: {
                                item_total: {
                                    currency_code: 'USD',
                                    value: subtotal.toFixed(2)
                                },
                                shipping: {
                                    currency_code: 'USD',
                                    value: shipping.toFixed(2)
                                },
                                tax_total: {
                                    currency_code: 'USD',
                                    value: tax.toFixed(2)
                                }
                            }
                        },
                        items: items,
                        shipping: {
                            name: {
                                full_name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`
                            },
                            address: {
                                address_line_1: document.getElementById('address').value,
                                address_line_2: document.getElementById('apartment')?.value || '',
                                admin_area_2: document.getElementById('city').value,
                                admin_area_1: document.getElementById('state').value,
                                postal_code: document.getElementById('zipCode').value,
                                country_code: document.getElementById('country').value
                            }
                        }
                    }],
                    application_context: {
                        brand_name: 'NIGHTFALL STAR',
                        shipping_preference: 'SET_PROVIDED_ADDRESS'
                    }
                });
            },
            
            // Cuando el usuario aprueba el pago
            onApprove: function(data, actions) {
                console.log('✅ Payment approved, capturing funds...');
                
                // Mostrar loading en la página
                const container = document.getElementById('paypal-button-container');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 20px;">
                            <div style="display: inline-block; border: 3px solid #f3f3f3; border-top: 3px solid #0070ba; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                            <p style="margin-top: 10px; color: #666;">Processing payment...</p>
                        </div>
                    `;
                }
                
                return actions.order.capture().then(function(details) {
                    console.log('✅ Payment captured successfully!');
                    console.log('Transaction details:', details);
                    
                    const payerName = details.payer.name.given_name;
                    const transactionId = details.id;
                    
                    // Completar la orden
                    completeOrder('paypal', transactionId, details);
                });
            },
            
            // Si hay un error
            onError: function(err) {
                console.error('❌ PayPal Error:', err);
                
                const container = document.getElementById('paypal-button-container');
                if (container) {
                    container.innerHTML = `
                        <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; text-align: center;">
                            <p style="margin: 0; color: #721c24;">❌ Payment failed</p>
                            <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #721c24;">Please try again or use another payment method</p>
                        </div>
                    `;
                }
                
                showErrorMessage('PayPal payment failed. Please try again.');
                
                // Re-renderizar el botón después de 3 segundos
                setTimeout(() => {
                    paypalButtonRendered = false;
                    initializePayPal();
                }, 3000);
            },
            
            // Si el usuario cancela
            onCancel: function(data) {
                console.log('ℹ️ PayPal payment cancelled by user');
                showInfoMessage('Payment cancelled. You can try again when ready.');
            }
            
        }).render('#paypal-button-container').then(() => {
            console.log('✅ PayPal button rendered successfully');
            paypalButtonRendered = true;
        }).catch(err => {
            console.error('❌ Error rendering PayPal button:', err);
            const container = document.getElementById('paypal-button-container');
            if (container) {
                container.innerHTML = `
                    <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; text-align: center;">
                        <p style="margin: 0; color: #721c24;">❌ Could not load PayPal button</p>
                        <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #721c24;">Please refresh the page</p>
                    </div>
                `;
            }
        });
        
    } catch (error) {
        console.error('❌ Error initializing PayPal:', error);
        showErrorMessage('Error loading PayPal. Please refresh the page.');
    }
}

// ========================================
// LOAD CHECKOUT ITEMS
// ========================================
function loadCheckoutItems() {
    console.log('🔄 Loading checkout items...');
    
    const cart = safeGetCart();
    const checkoutItemsContainer = document.getElementById('checkout-items');
    
    if (!checkoutItemsContainer) {
        console.error('❌ Checkout items container not found');
        return;
    }
    
    if (cart.length === 0) {
        checkoutItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <p style="font-size: 1.2rem; margin-bottom: 1rem;">🛒 Your cart is empty</p>
                <a href="index.html#shop" style="color: #000; text-decoration: underline; font-weight: 600;">Continue Shopping</a>
            </div>
        `;
        console.warn('⚠️ Cart is empty');
        return;
    }
    
    checkoutItemsContainer.innerHTML = '';
    
    cart.forEach(product => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'summary-item';
        itemDiv.innerHTML = `
            <div class="summary-item-image">
                <img src="${product.image || 'imagen/placeholder.jpg'}" 
                     alt="${product.title}" 
                     onerror="this.src='imagen/placeholder.jpg'">
                <span class="item-quantity">${product.quantity}</span>
            </div>
            <div class="summary-item-details">
                <h4>${product.title}</h4>
                <p>Size: ${product.size || 'M'} • Color: ${product.color || 'Black'}</p>
            </div>
            <div class="summary-item-price">${product.price}</div>
        `;
        checkoutItemsContainer.appendChild(itemDiv);
    });
    
    console.log(`✅ Loaded ${cart.length} items`);
    updateCheckoutTotals();
}

// ========================================
// UPDATE CHECKOUT TOTALS
// ========================================
function updateCheckoutTotals() {
    const subtotal = calculateSubtotal();
    const shipping = getShippingCost();
    const tax = subtotal * 0.10;
    const total = subtotal + shipping + tax;
    
    const elements = {
        subtotal: document.getElementById('checkout-subtotal'),
        shipping: document.getElementById('checkout-shipping'),
        tax: document.getElementById('checkout-tax'),
        total: document.getElementById('checkout-total')
    };
    
    if (elements.subtotal) elements.subtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (elements.shipping) elements.shipping.textContent = `$${shipping.toFixed(2)}`;
    if (elements.tax) elements.tax.textContent = `$${tax.toFixed(2)}`;
    if (elements.total) elements.total.textContent = `$${total.toFixed(2)}`;
    
    // Si PayPal está renderizado y el total cambió, re-inicializar
    if (paypalButtonRendered) {
        console.log('ℹ️ Total updated, re-initializing PayPal...');
        paypalButtonRendered = false;
        const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked');
        if (selectedPayment && selectedPayment.value === 'paypal') {
            initializePayPal();
        }
    }
}

// ========================================
// PROCESS STRIPE PAYMENT
// ========================================
async function processStripePayment() {
    console.log('🔄 Processing Stripe payment...');
    
    const button = document.getElementById('place-order-btn');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('button-spinner');
    
    // Show loading
    button.disabled = true;
    if (buttonText) buttonText.textContent = 'PROCESSING...';
    if (spinner) spinner.style.display = 'inline-block';
    
    try {
        // Get billing details
        const billingDetails = {
            name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: {
                line1: document.getElementById('address').value,
                line2: document.getElementById('apartment')?.value || '',
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                postal_code: document.getElementById('zipCode').value,
                country: document.getElementById('country').value
            }
        };
        
        // Create payment method
        const result = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: billingDetails
        });
        
        if (result.error) {
            console.error('❌ Stripe error:', result.error);
            showErrorMessage(result.error.message);
            resetButton(button, buttonText, spinner);
        } else {
            console.log('✅ Payment method created:', result.paymentMethod.id);
            showSuccessMessage('Payment successful!');
            completeOrder('stripe', result.paymentMethod.id);
        }
        
    } catch (error) {
        console.error('❌ Payment error:', error);
        showErrorMessage('Payment failed. Please try again.');
        resetButton(button, buttonText, spinner);
    }
}

// ========================================
// COMPLETE ORDER - ✅ MEJORADO
// ========================================
function completeOrder(paymentMethod, transactionId, paymentDetails = null) {
    console.log('✅ Completing order...');
    
    const orderData = {
        orderId: 'NS-' + Date.now(),
        customer: {
            email: document.getElementById('email').value,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            phone: document.getElementById('phone').value
        },
        shipping: {
            address: document.getElementById('address').value,
            apartment: document.getElementById('apartment')?.value || '',
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zipCode').value,
            country: document.getElementById('country').value,
            method: document.querySelector('input[name="shipping"]:checked').value
        },
        payment: {
            method: paymentMethod,
            transactionId: transactionId,
            amount: calculateTotal(),
            subtotal: calculateSubtotal(),
            shipping: getShippingCost(),
            tax: calculateSubtotal() * 0.10,
            details: paymentDetails
        },
        items: safeGetCart(),
        date: new Date().toISOString()
    };
    
    console.log('📦 Order completed:', orderData);
    
    // Guardar orden en localStorage (opcional, para historial)
    try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));
    } catch (e) {
        console.error('Could not save order to history:', e);
    }
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Actualizar contador del carrito
    updateCartCount();
    
    // Show confirmation and redirect
    setTimeout(() => {
        const paymentMethodName = paymentMethod === 'paypal' ? 'PayPal' : 'Credit Card';
        alert(`✅ Order Placed Successfully!\n\nOrder ID: ${orderData.orderId}\nPayment: ${paymentMethodName}\nTotal: $${orderData.payment.amount.toFixed(2)}\n\nA confirmation email has been sent to:\n${orderData.customer.email}\n\nThank you for shopping with NIGHTFALL STAR!`);
        window.location.href = 'index.html';
    }, 1000);
}

// ========================================
// HELPER FUNCTIONS
// ========================================
function resetButton(button, buttonText, spinner) {
    button.disabled = false;
    if (buttonText) buttonText.textContent = 'PLACE ORDER';
    if (spinner) spinner.style.display = 'none';
}

function validateCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return false;
    
    // Validar campos requeridos
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'country', 'phone'];
    
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            showErrorMessage(`Please fill in: ${fieldId.replace(/([A-Z])/g, ' $1').trim()}`);
            field?.focus();
            return false;
        }
    }
    
    // Validar email
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showErrorMessage('Please enter a valid email address');
        document.getElementById('email').focus();
        return false;
    }
    
    // Validar método de envío
    const shippingRadio = document.querySelector('input[name="shipping"]:checked');
    if (!shippingRadio) {
        showErrorMessage('Please select a shipping method');
        return false;
    }
    
    // Validar método de pago
    const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
    if (!paymentRadio) {
        showErrorMessage('Please select a payment method');
        return false;
    }
    
    return true;
}

function updateCartCount() {
    const cart = safeGetCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartCountElements = document.querySelectorAll('#cart-count, #cart-count-mobile');
    cartCountElements.forEach(el => {
        if (el) el.textContent = totalItems;
    });
}

// ========================================
// EVENT HANDLERS
// ========================================
function handlePaymentMethodChange(method) {
    console.log('💳 Payment method changed to:', method);
    
    // Ocultar todas las secciones de pago
    document.querySelectorAll('.payment-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Ocultar/mostrar botón de Place Order
    const placeOrderBtn = document.getElementById('place-order-btn');
    
    if (method === 'stripe') {
        const section = document.getElementById('stripe-payment-section');
        if (section) {
            section.classList.add('active');
            section.style.display = 'block';
        }
        if (placeOrderBtn) {
            placeOrderBtn.style.display = 'block';
            placeOrderBtn.querySelector('#button-text').textContent = 'PLACE ORDER';
        }
        if (!stripe) initializeStripe();
        
    } else if (method === 'paypal') {
        const section = document.getElementById('paypal-payment-section');
        if (section) {
            section.classList.add('active');
            section.style.display = 'block';
        }
        if (placeOrderBtn) placeOrderBtn.style.display = 'none';
        initializePayPal();
        
    } else if (method === 'shopify') {
        const section = document.getElementById('shopify-payment-section');
        if (section) {
            section.classList.add('active');
            section.style.display = 'block';
        }
        if (placeOrderBtn) placeOrderBtn.style.display = 'none';
    }
}

async function handlePlaceOrder(e) {
    e.preventDefault();
    
    if (!validateCheckoutForm()) return;
    
    const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
    const method = paymentRadio.value;
    
    if (method === 'stripe') {
        await processStripePayment();
    } else if (method === 'paypal') {
        showInfoMessage('Please click the PayPal button above to complete your payment');
    } else if (method === 'shopify') {
        showInfoMessage('Shop Pay requires Shopify integration');
    }
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌙 NIGHTFALL STAR - Initializing checkout...');
    
    // Check if we're on checkout page
    if (!document.getElementById('checkout-form')) {
        console.log('ℹ️ Not on checkout page, skipping initialization');
        return;
    }
    
    // Load checkout items
    loadCheckoutItems();
    
    // Payment method change listeners
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            handlePaymentMethodChange(this.value);
        });
    });
    
    // Shipping method change listeners
    const shippingRadios = document.querySelectorAll('input[name="shipping"]');
    shippingRadios.forEach(radio => {
        radio.addEventListener('change', updateCheckoutTotals);
    });
    
    // Place order button
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', handlePlaceOrder);
    }
    
    // Initialize Stripe by default
    setTimeout(() => {
        initializeStripe();
    }, 500);
    
    // Update cart count on page load
    updateCartCount();
    
    console.log('✅ Checkout initialized successfully');
    console.log('📊 Current cart:', safeGetCart().length, 'items');
    console.log('💰 Total amount:', '$' + calculateTotal().toFixed(2));
});

// Agregar CSS para el spinner de loading de PayPal
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);