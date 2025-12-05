document.addEventListener('DOMContentLoaded', function() {
    // Service selection and booking summary functionality
    const serviceCheckboxes = document.querySelectorAll('.service-item input[type="checkbox"]');
    const summaryItems = document.querySelector('.summary-items');
    const summaryTotal = document.querySelector('.summary-total span:last-child');
    const summaryDuration = document.querySelector('.summary-duration span:last-child');
    const nextStepBtn = document.querySelector('.next-step');
    
    let selectedServices = [];
    let totalPrice = 0;
    let totalDuration = 0;
    
    if (serviceCheckboxes.length > 0) {
        serviceCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateBookingSummary();
            });
        });
    }
    
    // Update booking summary based on selected services
    function updateBookingSummary() {
        selectedServices = [];
        totalPrice = 0;
        totalDuration = 0;
        
        serviceCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const serviceItem = checkbox.closest('.service-item');
                const serviceName = serviceItem.querySelector('label').textContent;
                const servicePrice = parseInt(serviceItem.querySelector('.service-price span:first-child').textContent.replace('Rs. ', ''));
                const serviceDuration = parseInt(serviceItem.querySelector('.service-duration').textContent);
                
                selectedServices.push({
                    name: serviceName,
                    price: servicePrice,
                    duration: serviceDuration
                });
                
                totalPrice += servicePrice;
                totalDuration += serviceDuration;
            }
        });
        
        // Update summary display
        if (selectedServices.length > 0) {
            let summaryHTML = '';
            selectedServices.forEach(service => {
                summaryHTML += `
                    <div class="summary-item">
                        <div class="summary-service">
                            <span>${service.name}</span>
                            <span>${service.duration} min</span>
                        </div>
                        <div class="summary-price">Rs. ${service.price}</div>
                    </div>
                `;
            });
            
            summaryItems.innerHTML = summaryHTML;
            summaryTotal.textContent = `Rs. ${totalPrice}`;
            summaryDuration.textContent = `${totalDuration} min`;
            
            // Enable next button
            nextStepBtn.disabled = false;
        } else {
            summaryItems.innerHTML = '<p>No services selected</p>';
            summaryTotal.textContent = 'Rs. 0';
            summaryDuration.textContent = '0 min';
            
            // Disable next button
            nextStepBtn.disabled = true;
        }
    }
    
    // Booking steps navigation
    const bookingSteps = document.querySelectorAll('.booking-step');
    const bookingContents = document.querySelectorAll('.booking-step-content');
    
    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', function() {
            const nextStepId = this.getAttribute('data-next');
            navigateToStep(nextStepId);
        });
    }
    
    function navigateToStep(stepId) {
        // Find the index of the next step
        let nextIndex = 0;
        bookingContents.forEach((content, index) => {
            if (content.id === stepId) {
                nextIndex = index;
            }
        });
        
        // Hide all content and deactivate all steps
        bookingContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        bookingSteps.forEach((step, index) => {
            if (index <= nextIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Show the next step content
        bookingContents[nextIndex].classList.add('active');
        bookingContents[nextIndex].style.display = 'block';
        
        // Scroll to the top of the booking form
        document.querySelector('.booking-form-container').scrollIntoView({
            behavior: 'smooth'
        });
    }
    
    // Initialize summary
    updateBookingSummary();
});
