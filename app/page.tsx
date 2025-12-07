"use client";
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="hero custom-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite',
          zIndex: 1,
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 10s ease-in-out infinite reverse',
          zIndex: 1,
        }} />
        
        <div className="hero-image-row" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ 
            position: 'relative',
            width: '33.333%',
            height: '100%',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Image 
              src="/images/hero-image.jpg" 
              alt="Professional Barber Service" 
              width={500} 
              height={350} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} 
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '30%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
            }} />
          </div>
          <div style={{ 
            position: 'relative',
            width: '33.333%',
            height: '100%',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Image 
              src="/images/hero2.jpg" 
              alt="Expert Hair Styling" 
              width={500} 
              height={350} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} 
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '30%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
            }} />
          </div>
          <div style={{ 
            position: 'relative',
            width: '33.333%',
            height: '100%',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Image 
              src="/images/hero3.jpg" 
              alt="Premium Grooming Experience" 
              width={500} 
              height={350} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} 
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '30%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
            }} />
          </div>
        </div>
        <div className="custom-hero-content" style={{ zIndex: 3 }}>
          <div style={{ 
            animation: 'fadeInUp 0.8s ease-out',
            marginBottom: '1rem',
          }}>
            <h1>Your Perfect Haircut Is Just A Click Away</h1>
          </div>
          <div style={{ 
            animation: 'fadeInUp 0.8s ease-out 0.2s both',
            marginBottom: '2rem',
          }}>
            <p>Book with top barbers near you and get styled your way.</p>
          </div>
          <div className="hero-buttons" style={{ 
            animation: 'fadeInUp 0.8s ease-out 0.4s both',
          }}>
            <Link href="/barbers" className="btn hero-btn">
              <i className="fas fa-calendar-check" style={{ marginRight: '0.5rem' }}></i>
              Book Now
            </Link>
            <Link href="/barbers" className="btn hero-btn-outline">
              <i className="fas fa-search" style={{ marginRight: '0.5rem' }}></i>
              Browse Barbers
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite',
        }} />
        <h2 className="section-title" style={{ animation: 'fadeInUp 0.6s ease-out' }}>Why Choose BookMyBarber?</h2>
        <div className="features-container">
          <div className="feature-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
            <div className="feature-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <h3>Easy Booking</h3>
            <p>Schedule appointments anytime, anywhere with our intuitive booking system.</p>
          </div>
          <div className="feature-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
            <div className="feature-icon">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <h3>Find Nearby Barbers</h3>
            <p>Discover skilled barbers in your neighborhood with our location-based search.</p>
          </div>
          <div className="feature-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
            <div className="feature-icon">
              <i className="fas fa-star"></i>
            </div>
            <h3>Verified Reviews</h3>
            <p>Read authentic reviews and make informed decisions about your next barber.</p>
          </div>
          <div className="feature-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
            <div className="feature-icon">
              <i className="fas fa-clock"></i>
            </div>
            <h3>Save Time</h3>
            <p>No more waiting in lines. Book your slot and arrive just in time.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" style={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '3%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse',
        }} />
        <h2 className="section-title" style={{ animation: 'fadeInUp 0.6s ease-out' }}>How It Works</h2>
        <div className="steps-container">
          <div className="step-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
            <div className="step-number">1</div>
            <h3>Create an Account</h3>
            <p>Sign up and set your preferences to personalize your experience.</p>
          </div>
          <div className="step-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
            <div className="step-number">2</div>
            <h3>Find a Barber</h3>
            <p>Browse barbers based on location, reviews, and specialties.</p>
          </div>
          <div className="step-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
            <div className="step-number">3</div>
            <h3>Book Appointment</h3>
            <p>Select your preferred time slot and services.</p>
          </div>
          <div className="step-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
            <div className="step-number">4</div>
            <h3>Get Your Haircut</h3>
            <p>Visit the barber at your scheduled time and enjoy your service.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials" style={{ 
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '5%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 7s ease-in-out infinite',
        }} />
        <h2 className="section-title" style={{ animation: 'fadeInUp 0.6s ease-out' }}>What Our Users Say</h2>
        <div className="testimonial-container">
          <div className="testimonial-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
            <div className="testimonial-image" style={{
              position: 'relative',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                position: 'absolute',
                inset: '-4px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                zIndex: -1,
                opacity: 0.3,
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <Image src="/images/user1.jpg" alt="Sarah Ali" width={80} height={80} style={{
                borderRadius: '50%',
                border: '3px solid #ffffff',
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
              }} />
            </div>
            <div className="testimonial-content">
              <p style={{ 
                fontSize: '1.1rem',
                lineHeight: '1.8',
                marginBottom: '1.5rem',
                color: '#475569',
                fontStyle: 'italic',
              }}>"I love how easy it is to find and book quality barbers. It fits right into my schedule!"</p>
              <h4 style={{ 
                fontSize: '1.2rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#0f172a',
              }}>Sarah Ali</h4>
              <span className="user-role" style={{ 
                display: 'block',
                marginBottom: '1rem',
                color: '#64748b',
                fontSize: '0.95rem',
              }}>Marketing Executive</span>
              <div className="rating" style={{ fontSize: '1.1rem' }}>
                <i className="fas fa-star" style={{ color: '#fbbf24' }}></i>
                <i className="fas fa-star" style={{ color: '#fbbf24' }}></i>
                <i className="fas fa-star" style={{ color: '#fbbf24' }}></i>
                <i className="fas fa-star" style={{ color: '#fbbf24' }}></i>
                <i className="fas fa-star-half-alt" style={{ color: '#fbbf24' }}></i>
              </div>
            </div>
          </div>

          <div className="testimonial-card" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
            <div className="testimonial-image" style={{
              position: 'relative',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                position: 'absolute',
                inset: '-4px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '50%',
                zIndex: -1,
                opacity: 0.3,
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <Image src="/images/user2.jpg" alt="Omar Khan" width={80} height={80} style={{
                borderRadius: '50%',
                border: '3px solid #ffffff',
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
              }} />
            </div>
            <div className="testimonial-content">
              <p style={{ 
                fontSize: '1.1rem',
                lineHeight: '1.8',
                marginBottom: '1.5rem',
                color: '#475569',
                fontStyle: 'italic',
              }}>"BookMyBarber really helped me grow my client base. It's like having a digital manager."</p>
              <h4 style={{ 
                fontSize: '1.2rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#0f172a',
              }}>Omar Khan</h4>
              <span className="user-role" style={{ 
                display: 'block',
                marginBottom: '1rem',
                color: '#64748b',
                fontSize: '0.95rem',
              }}>Professional Barber</span>
              <div className="rating" style={{ fontSize: '1.1rem' }}>
                <i className="fas fa-star" style={{ color: '#fbbf24' }}></i>
                <i className="fas fa-star" style={{ color: '#fbbf24' }}></i>
                <i className="fas fa-star" style={{ color: '#fbbf24' }}></i>
                <i className="fas fa-star" style={{ color: '#fbbf24' }}></i>
                <i className="fas fa-star" style={{ color: '#fbbf24' }}></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content" style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ animation: 'fadeInUp 0.6s ease-out' }}>Ready for a Fresh Look?</h2>
          <p style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>Join thousands of satisfied customers and find your perfect barber today.</p>
          <Link 
            href="/register" 
            className="btn btn-primary"
            style={{ 
              animation: 'fadeInUp 0.6s ease-out 0.4s both',
              fontSize: '1.2rem',
              padding: '16px 40px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '1rem',
            }}
          >
            <i className="fas fa-rocket"></i>
            Get Started
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
