'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useUserStore } from '@/store/user';
import toast from 'react-hot-toast';

export default function BarbersPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const { data: session } = authClient.useSession();
  const [viewType, setViewType] = useState<'grid' | 'map'>('grid');
  const [filters, setFilters] = useState({
    location: '',
    service: '',
    rating: '',
    availability: ''
  });
  const [sortBy, setSortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
  };

  // Fetch barbers from database with filters and pagination
  const barbersData = useQuery(api.functions.barbers.queries.listBarbers, {
    searchQuery: searchQuery || undefined,
    location: filters.location || undefined,
    service: filters.service || undefined,
    rating: filters.rating ? parseFloat(filters.rating) : undefined,
    availability: filters.availability || undefined,
    sortBy: sortBy,
    page: currentPage,
    pageSize: 12,
  });

  console.log(barbersData);

  const barbers = barbersData?.barbers || [];
  const totalPages = barbersData?.totalPages || 0;
  const total = barbersData?.total || 0;

  // Helper function to render stars
  const renderStars = (rating: number, totalRatings: number = 0) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="stars">
        {Array.from({ length: fullStars }).map((_, i) => (
          <i key={i} className="fas fa-star" style={{ color: '#FFD700' }}></i>
        ))}
        {hasHalfStar && <i className="fas fa-star-half-alt" style={{ color: '#FFD700' }}></i>}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <i key={i} className="far fa-star" style={{ color: '#ddd' }}></i>
        ))}
        {totalRatings > 0 && (
          <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--secondary-color)' }}>
            ({totalRatings} {totalRatings === 1 ? 'review' : 'reviews'})
          </span>
        )}
      </div>
    );
  };

  // Get minimum price from active services
  const getMinPrice = (services: Array<{ price: number; isActive: boolean }>) => {
    const activeServices = services.filter(s => s.isActive);
    if (activeServices.length === 0) return 0;
    return Math.min(...activeServices.map(s => s.price));
  };

  // Handle book now click
  const handleBookNow = (barberId: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!session || !user) {
      toast.error('Please login to book an appointment');
      router.push('/login');
      return;
    }

    // Check if user is a barber
    if (user.userType === 'barber') {
      toast.error('Barbers cannot book appointments');
      return;
    }

    // Redirect to booking page with barber ID
    router.push(`/booking?barber=${barberId}`);
  };

  const initMap = () => {
    console.log('Map initialized');
  };

  return (
    <>
      <Header />
      
      {/* Search Section */}
      <section className="search-section">
        <div className="container">
          <h2>Find the Perfect Barber Near You</h2>
          <div className="search-container">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by name, location, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn btn-primary" onClick={handleSearch}>Search</button>
            </div>
            <div className="filter-options">
              <div className="filter">
                <label htmlFor="location">Location</label>
                <select
                  id="location"
                  name="location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                >
                  <option value="">All Locations</option>
                  <option value="islamabad">Islamabad</option>
                  <option value="rawalpindi">Rawalpindi</option>
                  <option value="lahore">Lahore</option>
                  <option value="karachi">Karachi</option>
                  <option value="multan">Multan</option>

                </select>
              </div>
              <div className="filter">
                <label htmlFor="service">Service</label>
                <select
                  id="service"
                  name="service"
                  value={filters.service}
                  onChange={(e) => handleFilterChange('service', e.target.value)}
                >
                  <option value="">All Services</option>
                  <option value="haircut">Haircut</option>
                  <option value="beard-trim">Beard Trim</option>
                  <option value="shave">Shave</option>
                  <option value="facial">Facial</option>
                </select>
              </div>
              <div className="filter">
                <label htmlFor="rating">Rating</label>
                <select
                  id="rating"
                  name="rating"
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>
              <div className="filter">
                <label htmlFor="availability">Availability</label>
                <select
                  id="availability"
                  name="availability"
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                >
                  <option value="">Any Time</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="weekend">This Weekend</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map View */}
      <section className="map-view">
        <div className="container">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewType === 'grid' ? 'active' : ''}`}
              onClick={() => setViewType('grid')}
            >
              <i className="fas fa-th-large"></i> Grid View
            </button>
            <button
              className={`view-btn ${viewType === 'map' ? 'active' : ''}`}
              onClick={() => {
                setViewType('map');
                initMap();
              }}
            >
              <i className="fas fa-map-marked-alt"></i> Map View
            </button>
          </div>
          <div className="map-container" style={{ display: viewType === 'map' ? 'block' : 'none' }}>
            <div id="barber-map" style={{ height: '400px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p>Map View (Google Maps Integration)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Barbers Listing */}
      <section className="barbers-listing">
        <div className="container">
          <div className="result-info">
            <h3>{total} Barber{total !== 1 ? 's' : ''} Found</h3>
            <div className="sort-by">
              <label htmlFor="sort">Sort by:</label>
              <select
                id="sort"
                name="sort"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="rating">Top Rated</option>
                <option value="distance">Nearest</option>
                <option value="price-low">Price (Low to High)</option>
                <option value="price-high">Price (High to Low)</option>
              </select>
            </div>
          </div>
          <div className="barbers-grid" style={{ display: viewType === 'grid' ? 'grid' : 'none' }}>
            {barbers.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                <p>No barbers found. Try adjusting your filters.</p>
              </div>
            ) : (
              barbers.map((barber) => {
                const activeServices = barber.services.filter(s => s.isActive);
                const displayedServices = activeServices.slice(0, 3);
                const remainingServices = activeServices.length - 3;
                const minPrice = getMinPrice(barber.services);
                const rating = (barber as any).averageRating || 0;
                const totalRatings = (barber as any).totalRatings || 0;

                return (
                  <div key={barber._id} className="barber-card">
                    {barber.experience > 500 && (
                      <div className="barber-badge featured">Featured</div>
                    )}
                    {barber.experience < 100 && (
                      <div className="barber-badge new">New</div>
                    )}
                    <div className="barber-image">
                      <Image
                        src={barber.image || "/images/image1.jpg"}
                        alt={barber.name}
                        width={350}
                        height={200}
                      />
                    </div>
                    <div className="barber-info">
                      <div className="barber-header">
                        <h3>{barber.name}</h3>
                        <div className="barber-rating">
                          {rating > 0 ? (
                            <>
                              <span>{rating.toFixed(1)}</span>
                              {renderStars(rating, totalRatings)}
                            </>
                          ) : (
                            <>
                              <span>No ratings yet</span>
                              {renderStars(0, 0)}
                            </>
                          )}
                        </div>
                      </div>
                      <p className="barber-location">
                        <i className="fas fa-map-marker-alt"></i> {barber.address}
                      </p>
                      <div className="barber-services">
                        {displayedServices.map((service, idx) => (
                          <span key={idx}>{service.name}</span>
                        ))}
                        {remainingServices > 0 && (
                          <span>+{remainingServices} more</span>
                        )}
                      </div>
                      <div className="barber-footer">
                        <div className="price-range">
                          <span>Starting from</span>
                          <strong>Rs. {minPrice}</strong>
                        </div>
                        <button 
                          onClick={(e) => handleBookNow(barber._id, e)}
                          className="btn btn-primary"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
                style={{ 
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <i className="fas fa-chevron-left"></i> Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn next"
                style={{ 
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

