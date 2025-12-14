// ========================================
// NIGHTFALL STAR - MAIN SCRIPT
// Versión consolidada y optimizada
// ========================================

console.log('🌙 NIGHTFALL STAR - Initializing...');

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Safe localStorage operations
function safeGetCart() {
    try {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Error reading cart:', error);
        localStorage.removeItem('cart');
        return [];
    }
}

function safeSaveCart(cart) {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        return true;
    } catch (error) {
        console.error('Error saving cart:', error);
        return false;
    }
}

// ========================================
// MOBILE MENU
// ========================================
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');

    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
        });
    }
}

// ========================================
// HERO LOGO ANIMATION
// ========================================
function initHeroLogoAnimation() {
    const heroLogo = document.querySelector('.hero-logo');

    if (heroLogo) {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.perspective = '1000px';
        }
        
        heroLogo.style.animation = 'rotateLoop 4s linear infinite';
        heroLogo.style.cursor = 'pointer';
        
        // Crear animación CSS solo una vez
        if (!document.querySelector('style#hero-animation')) {
            const style = document.createElement('style');
            style.id = 'hero-animation';
            style.textContent = `
                @keyframes rotateLoop {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// ========================================
// ADD TO CART FUNCTIONALITY
// ========================================
function initAddToCart() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productTitle = productCard.querySelector('.product-title').textContent;
            const productPrice = productCard.querySelector('.product-price').textContent;
            const productImage = productCard.querySelector('.product-image img').src;
            
            const product = {
                id: Date.now(),
                title: productTitle,
                price: productPrice,
                image: productImage,
                quantity: 1,
                size: 'M',
                color: 'Black'
            };
            
            let cart = safeGetCart();
            
            const existingProductIndex = cart.findIndex(item => item.title === product.title);
            
            if (existingProductIndex > -1) {
                cart[existingProductIndex].quantity += 1;
            } else {
                cart.push(product);
            }
            
            if (safeSaveCart(cart)) {
                // Visual feedback
                const originalText = this.textContent;
                this.textContent = '✓ ADDED!';
                this.style.backgroundColor = '#22c55e';
                this.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    window.location.href = 'cart.html';
                }, 600);
            } else {
                alert('Error adding to cart. Please try again.');
            }
        });
    });
}

// ========================================
// CART PAGE
// ========================================
function loadCart() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const emptyCartSection = document.querySelector('.empty-cart');
    const cartContent = document.querySelector('.cart-content');
    
    if (!cartItemsContainer) return;
    
    let cart = safeGetCart();
    
    if (cart.length === 0) {
        if (emptyCartSection) emptyCartSection.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        return;
    }
    
    if (emptyCartSection) emptyCartSection.style.display = 'none';
    if (cartContent) cartContent.style.display = 'grid';
    
    cartItemsContainer.innerHTML = '';
    
    cart.forEach((product, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${product.image}" alt="${product.title}">
            </div>
            <div class="cart-item-details">
                <h3>${product.title}</h3>
                <p>Size: ${product.size}</p>
                <p>Color: ${product.color}</p>
            </div>
            <div class="cart-item-quantity">
                <label>Quantity</label>
                <input type="number" value="${product.quantity}" min="1" max="99" data-index="${index}">
            </div>
            <div class="cart-item-price">${product.price}</div>
            <button class="remove-btn" data-index="${index}">×</button>
        `;
        cartItemsContainer.appendChild(cartItem);
    });
    
    updateCartTotals();
    attachCartEventListeners();
}

function attachCartEventListeners() {
    // Quantity change
    document.querySelectorAll('.cart-item-quantity input').forEach(input => {
        input.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            const newQuantity = parseInt(this.value);
            
            if (newQuantity < 1) {
                this.value = 1;
                return;
            }
            
            let cart = safeGetCart();
            cart[index].quantity = newQuantity;
            safeSaveCart(cart);
            updateCartTotals();
        });
    });
    
    // Remove button
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            let cart = safeGetCart();
            cart.splice(index, 1);
            safeSaveCart(cart);
            loadCart();
        });
    });
}

function updateCartTotals() {
    let cart = safeGetCart();
    let subtotal = 0;
    
    cart.forEach(product => {
        const price = parseFloat(product.price.replace('$', '').replace(',', ''));
        subtotal += price * product.quantity;
    });
    
    const tax = subtotal * 0.10;
    const shipping = subtotal > 100 ? 0 : 10;
    const total = subtotal + tax + shipping;
    
    const subtotalEl = document.querySelector('.summary-row:nth-child(1) span:last-child');
    const taxEl = document.querySelector('.summary-row:nth-child(2) span:last-child');
    const shippingEl = document.querySelector('.summary-row:nth-child(3) span:last-child');
    const totalEl = document.querySelector('.summary-row.total span:last-child');
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

// ========================================
// PROMO CODE
// ========================================
function initPromoCode() {
    const promoForm = document.querySelector('.promo-form');
    if (!promoForm) return;
    
    promoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const promoInput = this.querySelector('input');
        const promoCode = promoInput.value.toUpperCase();
        
        const validCodes = {
            'WELCOME10': 10,
            'SAVE20': 20,
            'VIP30': 30
        };
        
        if (validCodes[promoCode]) {
            alert(`✓ Promo code applied! ${validCodes[promoCode]}% discount`);
            promoInput.value = '';
        } else {
            alert('❌ Invalid promo code');
        }
    });
}

// ========================================
// CHECKOUT REDIRECT
// ========================================
function initCheckoutButton() {
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (!checkoutBtn) return;
    
    checkoutBtn.addEventListener('click', function() {
        let cart = safeGetCart();
        
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        window.location.href = 'checkout.html';
    });
}

// ========================================
// CONTACT FORM
// ========================================
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const successMessage = document.getElementById('contactSuccessMessage');
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'SENDING...';
        submitBtn.disabled = true;
        
        setTimeout(function() {
            if (successMessage) successMessage.style.display = 'block';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            contactForm.reset();
            
            setTimeout(function() {
                if (successMessage) successMessage.style.display = 'none';
            }, 5000);
        }, 1500);
    });
}

// ========================================
// FAQ ACCORDION - CONSOLIDADO
// ========================================
function initFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answerId = this.getAttribute('aria-controls');
            const answer = answerId ? document.getElementById(answerId) : this.nextElementSibling;
            const icon = this.querySelector('.faq-icon');
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            // Toggle current item
            this.setAttribute('aria-expanded', !isExpanded);
            if (answer) {
                answer.hidden = isExpanded;
            }
            if (icon) {
                icon.textContent = isExpanded ? '+' : '−';
            }
        });
    });
}

// ========================================
// SHIPPING CALCULATOR
// ========================================
function initShippingCalculator() {
    const calculatorForm = document.getElementById('calculator-form');
    if (!calculatorForm) return;
    
    calculatorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const country = document.getElementById('country').value;
        const method = document.getElementById('shipping-method').value;
        const orderTotal = parseFloat(document.getElementById('order-total').value);
        
        if (!country || !method || !orderTotal) {
            alert('Please fill in all fields');
            return;
        }
        
        const countryNames = {
            'us': 'United States',
            'ca': 'Canada',
            'mx': 'Mexico',
            'uk': 'United Kingdom',
            'de': 'Germany',
            'fr': 'France',
            'es': 'Spain',
            'it': 'Italy',
            'au': 'Australia',
            'jp': 'Japan',
            'do': 'Dominican Republic'
        };
        
        const isInternational = country !== 'us';
        let shippingCost = 0;
        
        if (method === 'standard') {
            shippingCost = isInternational ? 15.99 : 5.99;
        } else if (method === 'express') {
            shippingCost = isInternational ? 35.99 : 19.99;
        } else if (method === 'overnight') {
            shippingCost = isInternational ? 59.99 : 39.99;
        }
        
        if (orderTotal >= 100 && method === 'standard') {
            shippingCost = 0;
        }
        
        const deliveryTimes = {
            'standard': isInternational ? '7-14 business days' : '5-7 business days',
            'express': isInternational ? '5-7 business days' : '2-3 business days',
            'overnight': isInternational ? 'Not available' : '1 business day'
        };
        
        const methodNames = {
            'standard': 'Standard',
            'express': 'Express',
            'overnight': 'Overnight'
        };
        
        document.getElementById('result-method').textContent = methodNames[method];
        document.getElementById('result-country').textContent = countryNames[country];
        document.getElementById('result-delivery').textContent = deliveryTimes[method];
        document.getElementById('result-cost').textContent = shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`;
        
        const resultSection = document.getElementById('shipping-result');
        resultSection.hidden = false;
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

// ========================================
// ORDER TRACKING
// ========================================
function initOrderTracking() {
    const trackingForm = document.getElementById('tracking-form');
    if (!trackingForm) return;
    
    trackingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const trackingNumber = document.getElementById('tracking-number').value.trim();
        
        if (!trackingNumber) {
            alert('Please enter a tracking number');
            return;
        }
        
        alert(`Tracking order: ${trackingNumber}\n\nThis feature requires backend integration.`);
    });
}

// ========================================
// FORGOT PASSWORD - CONSOLIDADO
// ========================================
function initForgotPassword() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (!forgotPasswordForm) return;
    
    const emailInput = document.getElementById('email');
    const submitBtn = forgotPasswordForm.querySelector('.submit-btn');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function showError(input, message) {
        const errorEl = document.getElementById(`${input.id}-error`);
        if (errorEl) {
            errorEl.textContent = message;
            input.classList.add('invalid');
            input.classList.remove('valid');
        }
    }
    
    function clearError(input) {
        const errorEl = document.getElementById(`${input.id}-error`);
        if (errorEl) {
            errorEl.textContent = '';
            input.classList.remove('invalid');
            input.classList.add('valid');
        }
    }
    
    function hideMessages() {
        if (successMessage) successMessage.hidden = true;
        if (errorMessage) errorMessage.hidden = true;
    }
    
    // Real-time validation
    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        if (!email) {
            showError(this, 'Email is required');
        } else if (!validateEmail(email)) {
            showError(this, 'Please enter a valid email address');
        } else {
            clearError(this);
        }
    });
    
    emailInput.addEventListener('input', function() {
        if (this.value.trim() && validateEmail(this.value.trim())) {
            clearError(this);
        }
    });
    
    // Form submission
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideMessages();
        
        const email = emailInput.value.trim();
        
        if (!email) {
            showError(emailInput, 'Email is required');
            emailInput.focus();
            return;
        }
        
        if (!validateEmail(email)) {
            showError(emailInput, 'Please enter a valid email address');
            emailInput.focus();
            return;
        }
        
        // Loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        if (btnText) btnText.hidden = true;
        if (btnLoading) btnLoading.hidden = false;
        
        // Simulate API call
        setTimeout(function() {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            if (btnText) btnText.hidden = false;
            if (btnLoading) btnLoading.hidden = true;
            
            if (successMessage) {
                successMessage.hidden = false;
                emailInput.value = '';
                emailInput.classList.remove('valid');
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 1500);
    });
}

// ========================================
// SMOOTH SCROLL
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========================================
// SCROLL ANIMATIONS
// ========================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.product-card, .collection-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}

// ========================================
// MAIN INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Initializing NIGHTFALL STAR...');
    
    // Initialize all modules
    initMobileMenu();
    initHeroLogoAnimation();
    initAddToCart();
    initPromoCode();
    initCheckoutButton();
    initContactForm();
    initFAQ();
    initShippingCalculator();
    initOrderTracking();
    initForgotPassword();
    initSmoothScroll();
    initScrollAnimations();
    
    // Page-specific initialization
    if (document.querySelector('.cart-section')) {
        console.log('📦 Loading cart page...');
        loadCart();
    }
    
    console.log('✓ NIGHTFALL STAR initialized successfully');
});
// Sistema de cambio de imágenes con flechas - CORREGIDO
document.addEventListener('DOMContentLoaded', function() {
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach((card) => {
        const imgFront = card.querySelector('.product-img-front');
        const imgBack = card.querySelector('.product-img-back');
        const leftArrow = card.querySelector('.arrow-left');
        const rightArrow = card.querySelector('.arrow-right');
        const dots = card.querySelectorAll('.indicator-dot');
        
        let currentView = 0; // 0 = front, 1 = back

        function updateView(newView) {
            currentView = newView;
            
            if (currentView === 0) {
                // Mostrar frente
                imgBack.classList.remove('active');
                imgFront.classList.remove('hidden');
            } else {
                // Mostrar trasera
                imgBack.classList.add('active');
                imgFront.classList.add('hidden');
            }

            // Actualizar dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentView);
            });
        }

        // Prevenir que las flechas interfieran con otros elementos
        leftArrow.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const newView = currentView === 0 ? 1 : 0;
            updateView(newView);
        });

        rightArrow.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const newView = currentView === 0 ? 1 : 0;
            updateView(newView);
        });

        // También permitir clic en los dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                updateView(index);
            });
        });
    });
});