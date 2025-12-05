'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BarbersPage() {
  const [viewType, setViewType] = useState<'grid' | 'map'>('grid');
  const [filters, setFilters] = useState({
    location: '',
    service: '',
    rating: '',
    availability: ''
  });
  const [sortBy, setSortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
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
            <h3>12 Barbers Found</h3>
            <div className="sort-by">
              <label htmlFor="sort">Sort by:</label>
              <select
                id="sort"
                name="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">Top Rated</option>
                <option value="distance">Nearest</option>
                <option value="price-low">Price (Low to High)</option>
                <option value="price-high">Price (High to Low)</option>
              </select>
            </div>
          </div>
          <div className="barbers-grid" style={{ display: viewType === 'grid' ? 'grid' : 'none' }}>
            {/* Barber Card 1 */}
            <div className="barber-card">
              <div className="barber-badge featured">Featured</div>
              <div className="barber-image">
                <Image src="/images/image1.jpg" alt="Barber Shop" width={350} height={200} />
              </div>
              <div className="barber-info">
                <div className="barber-header">
                  <h3>Royal Cuts Barbershop</h3>
                  <div className="barber-rating">
                    <span>4.8</span>
                    <div className="stars">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star-half-alt"></i>
                    </div>
                    <span>(124 reviews)</span>
                  </div>
                </div>
                <p className="barber-location"><i className="fas fa-map-marker-alt"></i> F-8 Markaz, Islamabad</p>
                <div className="barber-services">
                  <span>Haircut</span>
                  <span>Beard Trim</span>
                  <span>Facial</span>
                  <span>+3 more</span>
                </div>
                <div className="barber-footer">
                  <div className="price-range">
                    <span>Starting from</span>
                    <strong>Rs. 500</strong>
                  </div>
                  <Link href="/booking" className="btn btn-primary">Book Now</Link>
                </div>
              </div>
            </div>

            {/* Barber Card 2 */}
            <div className="barber-card">
              <div className="barber-image">
                <Image src="/images/image1.jpg" alt="Barber Shop" width={350} height={200} />
              </div>
              <div className="barber-info">
                <div className="barber-header">
                  <h3>Classic Men's Parlor</h3>
                  <div className="barber-rating">
                    <span>4.5</span>
                    <div className="stars">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star-half-alt"></i>
                    </div>
                    <span>(98 reviews)</span>
                  </div>
                </div>
                <p className="barber-location"><i className="fas fa-map-marker-alt"></i> Blue Area, Islamabad</p>
                <div className="barber-services">
                  <span>Haircut</span>
                  <span>Beard Trim</span>
                  <span>Shave</span>
                  <span>+2 more</span>
                </div>
                <div className="barber-footer">
                  <div className="price-range">
                    <span>Starting from</span>
                    <strong>Rs. 600</strong>
                  </div>
                  <Link href="/booking" className="btn btn-primary">Book Now</Link>
                </div>
              </div>
            </div>

            {/* Barber Card 3 */}
            <div className="barber-card">
              <div className="barber-badge new">New</div>
              <div className="barber-image">
                <Image src="/images/image1.jpg" alt="Barber Shop" width={350} height={200} />
              </div>
              <div className="barber-info">
                <div className="barber-header">
                  <h3>Modern Cuts Studio</h3>
                  <div className="barber-rating">
                    <span>4.2</span>
                    <div className="stars">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="far fa-star"></i>
                    </div>
                    <span>(46 reviews)</span>
                  </div>
                </div>
                <p className="barber-location"><i className="fas fa-map-marker-alt"></i> DHA Phase 2, Islamabad</p>
                <div className="barber-services">
                  <span>Premium Haircut</span>
                  <span>Beard Styling</span>
                  <span>Hair Color</span>
                  <span>+4 more</span>
                </div>
                <div className="barber-footer">
                  <div className="price-range">
                    <span>Starting from</span>
                    <strong>Rs. 800</strong>
                  </div>
                  <Link href="/booking" className="btn btn-primary">Book Now</Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pagination */}
          <div className="pagination">
            <a href="#" className="active">1</a>
            <a href="#">2</a>
            <a href="#">3</a>
            <a href="#" className="next">Next <i className="fas fa-chevron-right"></i></a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

