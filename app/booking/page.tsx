'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
}

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const services: Service[] = [
    { id: 'service1', name: 'Regular Haircut', price: 500, duration: 30, description: 'Classic haircut with scissors or clippers' },
    { id: 'service2', name: 'Beard Trim', price: 300, duration: 20, description: 'Beard shaping and styling' },
    { id: 'service3', name: 'Clean Shave', price: 350, duration: 25, description: 'Traditional straight razor shave' },
    { id: 'service4', name: 'Facial Treatment', price: 800, duration: 45, description: 'Deep cleansing facial with massage' },
    { id: 'service5', name: 'Hair Coloring', price: 1200, duration: 60, description: 'Professional hair color application' }
  ];

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getSelectedServicesData = () => {
    return services.filter(s => selectedServices.includes(s.id));
  };

  const calculateTotal = () => {
    return getSelectedServicesData().reduce((sum, s) => sum + s.price, 0);
  };

  const calculateDuration = () => {
    return getSelectedServicesData().reduce((sum, s) => sum + s.duration, 0);
  };

  const navigateToStep = (step: number) => {
    if (step === 2 && selectedServices.length === 0) {
      return;
    }
    setCurrentStep(step);
  };

  return (
    <>
      <Header />
      
      <section className="booking-section">
        <div className="container">
          <h2 className="section-title">Book Your Appointment</h2>
          
          <div className="booking-container">
            {/* Barber Information */}
            <div className="barber-details">
              <div className="barber-profile">
                <Image src="/images/image1.jpg" alt="Royal Cuts Barbershop" width={80} height={80} />
                <div>
                  <h3>Royal Cuts Barbershop</h3>
                  <div className="barber-rating">
                    <div className="stars">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star-half-alt"></i>
                    </div>
                    <span>4.8 (124 reviews)</span>
                  </div>
                  <p className="barber-location"><i className="fas fa-map-marker-alt"></i> F-8 Markaz, Islamabad</p>
                </div>
              </div>
              
              <div className="barber-info-card">
                <h4>Working Hours</h4>
                <ul className="working-hours">
                  <li><span>Monday - Friday:</span> <span>9:00 AM - 8:00 PM</span></li>
                  <li><span>Saturday:</span> <span>10:00 AM - 6:00 PM</span></li>
                  <li><span>Sunday:</span> <span>Closed</span></li>
                </ul>
              </div>
              
              <div className="barber-info-card">
                <h4>Contact Details</h4>
                <ul className="contact-details">
                  <li><i className="fas fa-phone"></i> +92 300 7654321</li>
                  <li><i className="fas fa-envelope"></i> royalcuts@example.com</li>
                  <li><i className="fas fa-globe"></i> <a href="#">www.royalcuts.com</a></li>
                </ul>
              </div>
            </div>
            
            {/* Booking Form */}
            <div className="booking-form-container">
              <div className="booking-steps">
                <div className={`booking-step ${currentStep >= 1 ? 'active' : ''}`}>
                  <div className="step-number">1</div>
                  <span>Services</span>
                </div>
                <div className={`booking-step ${currentStep >= 2 ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <span>Date & Time</span>
                </div>
                <div className={`booking-step ${currentStep >= 3 ? 'active' : ''}`}>
                  <div className="step-number">3</div>
                  <span>Your Details</span>
                </div>
                <div className={`booking-step ${currentStep >= 4 ? 'active' : ''}`}>
                  <div className="step-number">4</div>
                  <span>Confirm</span>
                </div>
              </div>
              
              <div className="booking-form-content">
                {/* Step 1: Services */}
                {currentStep === 1 && (
                  <div className="booking-step-content active" id="step1">
                    <h3>Select Services</h3>
                    <div className="services-list">
                      {services.map(service => (
                        <div key={service.id} className="service-item">
                          <div className="service-info">
                            <div className="checkbox-wrapper">
                              <input
                                type="checkbox"
                                id={service.id}
                                name="services"
                                value={service.id}
                                checked={selectedServices.includes(service.id)}
                                onChange={() => toggleService(service.id)}
                              />
                              <label htmlFor={service.id}>{service.name}</label>
                            </div>
                            <p>{service.description}</p>
                          </div>
                          <div className="service-price">
                            <span>Rs. {service.price}</span>
                            <span className="service-duration">{service.duration} min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="booking-summary">
                      <h4>Selected Services:</h4>
                      <div className="summary-items">
                        {getSelectedServicesData().length > 0 ? (
                          getSelectedServicesData().map(service => (
                            <div key={service.id} className="summary-item">
                              <div className="summary-service">
                                <span>{service.name}</span>
                                <span>{service.duration} min</span>
                              </div>
                              <div className="summary-price">Rs. {service.price}</div>
                            </div>
                          ))
                        ) : (
                          <p>No services selected</p>
                        )}
                      </div>
                      <div className="summary-total">
                        <span>Total:</span>
                        <span>Rs. {calculateTotal()}</span>
                      </div>
                      <div className="summary-duration">
                        <span>Estimated Duration:</span>
                        <span>{calculateDuration()} min</span>
                      </div>
                    </div>
                    
                    <div className="step-buttons">
                      <button
                        className="btn btn-primary next-step"
                        onClick={() => navigateToStep(2)}
                        disabled={selectedServices.length === 0}
                      >
                        Next: Choose Date & Time
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Additional steps would be implemented in a real application */}
                {currentStep === 2 && (
                  <div className="booking-step-content active" id="step2">
                    <h3>Date & Time Selection</h3>
                    <p>This step would contain date and time picker in a real application.</p>
                    <div className="step-buttons">
                      <button className="btn btn-outline" onClick={() => setCurrentStep(1)}>Back</button>
                      <button className="btn btn-primary" onClick={() => setCurrentStep(3)}>Next</button>
                    </div>
                  </div>
                )}
                
                {currentStep === 3 && (
                  <div className="booking-step-content active" id="step3">
                    <h3>Your Details</h3>
                    <p>This step would contain customer details form in a real application.</p>
                    <div className="step-buttons">
                      <button className="btn btn-outline" onClick={() => setCurrentStep(2)}>Back</button>
                      <button className="btn btn-primary" onClick={() => setCurrentStep(4)}>Next</button>
                    </div>
                  </div>
                )}
                
                {currentStep === 4 && (
                  <div className="booking-step-content active" id="step4">
                    <h3>Confirmation</h3>
                    <p>This step would contain booking confirmation in a real application.</p>
                    <div className="step-buttons">
                      <button className="btn btn-outline" onClick={() => setCurrentStep(3)}>Back</button>
                      <button className="btn btn-primary">Confirm Booking</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

