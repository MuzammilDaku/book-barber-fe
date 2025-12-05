document.addEventListener('DOMContentLoaded', function() {
    // Toggle between grid and map views
    const viewBtns = document.querySelectorAll('.view-btn');
    const gridView = document.querySelector('.barbers-grid');
    const mapView = document.querySelector('.map-container');
    
    if (viewBtns.length > 0) {
        viewBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                viewBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const viewType = this.getAttribute('data-view');
                if (viewType === 'map') {
                    gridView.style.display = 'none';
                    mapView.style.display = 'block';
                    initMap(); // Initialize map when map view is shown
                } else {
                    gridView.style.display = 'grid';
                    mapView.style.display = 'none';
                }
            });
        });
    }
    
    // Filter functionality
    const filterOptions = document.querySelectorAll('.filter select');
    
    if (filterOptions.length > 0) {
        filterOptions.forEach(filter => {
            filter.addEventListener('change', function() {
                applyFilters();
            });
        });
    }
    
    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');
    
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', function() {
            searchBarbers(searchInput.value);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBarbers(searchInput.value);
            }
        });
    }
    
    // Sort functionality
    const sortSelect = document.getElementById('sort');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortBarbers(this.value);
        });
    }
    
    // Functions for barber listing functionality
    function applyFilters() {
        const location = document.getElementById('location').value;
        const service = document.getElementById('service').value;
        const rating = document.getElementById('rating').value;
        const availability = document.getElementById('availability').value;
        
        // In a real application, this would make an API call with the filter parameters
        // For demo purposes, we'll just log the filter values
        console.log('Filters applied:', {
            location,
            service,
            rating,
            availability
        });
        
        // Simulate filtering with a loading indicator
        showLoadingIndicator();
        
        setTimeout(() => {
            hideLoadingIndicator();
            // Update results count (for demo)
            document.querySelector('.result-info h3').textContent = '5 Barbers Found';
        }, 1000);
    }
    
    function searchBarbers(query) {
        if (!query) return;
        
        // In a real application, this would make an API call with the search query
        console.log('Searching for:', query);
        
        // Simulate search with a loading indicator
        showLoadingIndicator();
        
        setTimeout(() => {
            hideLoadingIndicator();
            // Update results count (for demo)
            document.querySelector('.result-info h3').textContent = '3 Barbers Found';
        }, 1000);
    }
    
    function sortBarbers(sortBy) {
        // In a real application, this would reorder the barber cards based on the selected criteria
        console.log('Sorting by:', sortBy);
        
        // Simulate sorting with a loading indicator
        showLoadingIndicator();
        
        setTimeout(() => {
            hideLoadingIndicator();
            
            // For demo purposes, we'll just reverse the barber cards
            const barberCards = document.querySelectorAll('.barber-card');
            const barberGrid = document.querySelector('.barbers-grid');
            
            Array.from(barberCards)
                .reverse()
                .forEach(card => barberGrid.appendChild(card));
        }, 800);
    }
    
    function showLoadingIndicator() {
        // Check if loading indicator already exists
        if (document.querySelector('.loading-indicator')) return;
        
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        loadingIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            z-index: 9999;
        `;
        
        document.body.appendChild(loadingIndicator);
    }
    
    function hideLoadingIndicator() {
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
    
    // Map initialization (would integrate with Google Maps API in a real application)
    function initMap() {
        console.log('Map initialized');
        // In a real application, this would initialize a Google Map with barber locations
    }
});
