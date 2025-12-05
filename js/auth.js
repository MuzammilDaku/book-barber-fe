document.addEventListener('DOMContentLoaded', function() {
    // Toggle between user types (customer/barber) on registration page
    const userTypeBtns = document.querySelectorAll('.user-type-btn');
    const barberFields = document.querySelector('.barber-fields');
    
    if (userTypeBtns.length > 0 && barberFields) {
        userTypeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                userTypeBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                if (this.getAttribute('data-type') === 'barber') {
                    barberFields.style.display = 'block';
                } else {
                    barberFields.style.display = 'none';
                }
            });
        });
    }
    
    // Form validation for login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            let isValid = true;
            
            // Simple validation
            if (!email || !email.includes('@')) {
                showError('email', 'Please enter a valid email address');
                isValid = false;
            } else {
                clearError('email');
            }
            
            if (!password || password.length < 6) {
                showError('password', 'Password must be at least 6 characters');
                isValid = false;
            } else {
                clearError('password');
            }
            
            if (isValid) {
                // Simulate login - in a real application, this would be an API call
                simulateLogin(email, password);
            }
        });
    }
    
    // Form validation for registration
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const terms = document.getElementById('terms').checked;
            let isValid = true;
            
            // Simple validation
            if (!fullname) {
                showError('fullname', 'Please enter your full name');
                isValid = false;
            } else {
                clearError('fullname');
            }
            
            if (!email || !email.includes('@')) {
                showError('email', 'Please enter a valid email address');
                isValid = false;
            } else {
                clearError('email');
            }
            
            if (!phone) {
                showError('phone', 'Please enter your phone number');
                isValid = false;
            } else {
                clearError('phone');
            }
            
            if (!password || password.length < 6) {
                showError('password', 'Password must be at least 6 characters');
                isValid = false;
            } else {
                clearError('password');
            }
            
            if (password !== confirmPassword) {
                showError('confirm-password', 'Passwords do not match');
                isValid = false;
            } else {
                clearError('confirm-password');
            }
            
            if (!terms) {
                showError('terms', 'You must agree to the Terms of Service');
                isValid = false;
            } else {
                clearError('terms');
            }
            
            // Check barber-specific fields if barber is selected
            const isBarber = document.querySelector('.user-type-btn[data-type="barber"]').classList.contains('active');
            if (isBarber) {
                const shopName = document.getElementById('shop-name').value;
                const shopAddress = document.getElementById('shop-address').value;
                
                if (!shopName) {
                    showError('shop-name', 'Please enter your shop name');
                    isValid = false;
                } else {
                    clearError('shop-name');
                }
                
                if (!shopAddress) {
                    showError('shop-address', 'Please enter your shop address');
                    isValid = false;
                } else {
                    clearError('shop-address');
                }
            }
            
            if (isValid) {
                // Simulate registration - in a real application, this would be an API call
                simulateRegistration(fullname, email, phone, password, isBarber);
            }
        });
    }
    
    // Helper functions for form validation
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        let errorElement = field.parentNode.querySelector('.error-message');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        field.classList.add('error');
    }
    
    function clearError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = field.parentNode.querySelector('.error-message');
        
        if (errorElement) {
            errorElement.remove();
        }
        
        field.classList.remove('error');
    }
    
    // Simulate backend functionality
    function simulateLogin(email, password) {
        // Show loading state
        document.querySelector('#loginForm .btn-primary').textContent = 'Logging in...';
        
        // Simulate API call with a timeout
        setTimeout(() => {
            // For demo purposes, we'll just redirect to index.html
            window.location.href = 'index.html';
        }, 1500);
    }
    
    function simulateRegistration(fullname, email, phone, password, isBarber) {
        // Show loading state
        document.querySelector('#registerForm .btn-primary').textContent = 'Creating Account...';
        
        // Simulate API call with a timeout
        setTimeout(() => {
            // For demo purposes, we'll just redirect to login.html
            window.location.href = 'login.html';
        }, 1500);
    }
});
