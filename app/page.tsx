import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="hero custom-hero">
        <div className="hero-image-row">
          <Image src="/images/hero-image.jpg" alt="Image 1" width={500} height={350} style={{ width: '33.333%', height: '100%', objectFit: 'cover' }} />
          <Image src="/images/hero2.jpg" alt="Image 2" width={500} height={350} style={{ width: '33.333%', height: '100%', objectFit: 'cover' }} />
          <Image src="/images/hero3.jpg" alt="Image 3" width={500} height={350} style={{ width: '33.333%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="custom-hero-content">
          <h1>Your Perfect Haircut Is Just A Click Away</h1>
          <p>Book with top barbers near you and get styled your way.</p>
          <div className="hero-buttons">
            <Link href="/barbers" className="btn hero-btn">Book Now</Link>
            <Link href="/barbers" className="btn hero-btn-outline">Browse Barbers</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Why Choose BookMyBarber?</h2>
        <div className="features-container">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <h3>Easy Booking</h3>
            <p>Schedule appointments anytime, anywhere with our intuitive booking system.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <h3>Find Nearby Barbers</h3>
            <p>Discover skilled barbers in your neighborhood with our location-based search.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-star"></i>
            </div>
            <h3>Verified Reviews</h3>
            <p>Read authentic reviews and make informed decisions about your next barber.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-clock"></i>
            </div>
            <h3>Save Time</h3>
            <p>No more waiting in lines. Book your slot and arrive just in time.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create an Account</h3>
            <p>Sign up and set your preferences to personalize your experience.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Find a Barber</h3>
            <p>Browse barbers based on location, reviews, and specialties.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Book Appointment</h3>
            <p>Select your preferred time slot and services.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Get Your Haircut</h3>
            <p>Visit the barber at your scheduled time and enjoy your service.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <h2 className="section-title">What Our Users Say</h2>
        <div className="testimonial-container">
          <div className="testimonial-card">
            <div className="testimonial-image">
              <Image src="/images/user1.jpg" alt="Sarah Ali" width={80} height={80} />
            </div>
            <div className="testimonial-content">
              <p>"I love how easy it is to find and book quality barbers. It fits right into my schedule!"</p>
              <h4>Sarah Ali</h4>
              <span className="user-role">Marketing Executive</span>
              <div className="rating">
                <i className="fas fa-star"></i><i className="fas fa-star"></i>
                <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star-half-alt"></i>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-image">
              <Image src="/images/user2.jpg" alt="Omar Khan" width={80} height={80} />
            </div>
            <div className="testimonial-content">
              <p>"BookMyBarber really helped me grow my client base. It's like having a digital manager."</p>
              <h4>Omar Khan</h4>
              <span className="user-role">Professional Barber</span>
              <div className="rating">
                <i className="fas fa-star"></i><i className="fas fa-star"></i>
                <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready for a Fresh Look?</h2>
          <p>Join thousands of satisfied customers and find your perfect barber today.</p>
          <Link href="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
