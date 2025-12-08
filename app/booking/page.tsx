'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useUserStore } from '@/store/user';
import toast from 'react-hot-toast';

interface Service {
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
  _index: number;
}

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const barberShopId = searchParams.get('barber');
  
  const { user } = useUserStore();
  const { data: session } = authClient.useSession();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServiceIndices, setSelectedServiceIndices] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Fetch shop details
  const shopId = barberShopId as any;
  const shopData = useQuery(
    api.functions.barbers.queries.getShopById,
    shopId ? { shopId: shopId as any } : "skip"
  );

  // Fetch services - we need userId for this, so get it from shopData
  const servicesData = useQuery(
    api.functions.barbers.queries.getServices,
    shopData?.userId ? { userId: shopData.userId } : "skip"
  );

  // Fetch opening hours
  const openingHoursData = useQuery(
    api.functions.barbers.queries.getOpeningHours,
    shopData?.userId ? { userId: shopData.userId } : "skip"
  );

  // Fetch shop's subscription to determine booking limits
  const shopSubscription = useQuery(
    api.functions.subscriptions.queries.getSubscription,
    shopData?.userId ? { userId: shopData.userId } : "skip"
  );

  const createBooking = useMutation(api.functions.bookings.mutations.createBooking);

  // Redirect if no barber selected or not authenticated as customer
  useEffect(() => {
    if (!barberShopId) {
      toast.error('No barber selected');
      router.push('/barbers');
      return;
    }

    if (session && user && user.userType !== 'customer') {
      toast.error('Only customers can make bookings');
      router.push('/barbers');
      return;
    }

    if (!session || !user) {
      toast.error('Please login to make a booking');
      router.push('/login');
      return;
    }
  }, [barberShopId, session, user, router]);

  // Get active services
  const activeServices: Service[] = (servicesData || []).filter(s => s.isActive);

  const toggleService = (serviceIndex: number) => {
    setSelectedServiceIndices(prev =>
      prev.includes(serviceIndex)
        ? prev.filter(idx => idx !== serviceIndex)
        : [...prev, serviceIndex]
    );
  };

  const getSelectedServicesData = (): Service[] => {
    return activeServices.filter((_, idx) => selectedServiceIndices.includes(idx));
  };

  // Calculate total duration of selected services
  const totalServiceDuration = getSelectedServicesData().reduce((sum, s) => sum + s.duration, 0);

  // Fetch available time slots when date is selected
  const timeSlotsData = useQuery(
    api.functions.bookings.queries.getAvailableTimeSlots,
    shopData && selectedDate
      ? { 
          shopId: shopData._id, 
          date: selectedDate,
          serviceDuration: totalServiceDuration > 0 ? totalServiceDuration : undefined
        }
      : "skip"
  );

  const availableTimeSlots = timeSlotsData?.available || [];
  const bookedTimeSlots = timeSlotsData?.booked || [];

  const calculateTotal = () => {
    return getSelectedServicesData().reduce((sum, s) => sum + s.price, 0);
  };

  const calculateDuration = () => {
    return getSelectedServicesData().reduce((sum, s) => sum + s.duration, 0);
  };

  const navigateToStep = (step: number) => {
    if (step === 2 && selectedServiceIndices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    if (step === 3 && (!selectedDate || !selectedTime)) {
      toast.error('Please select date and time');
      return;
    }
    setCurrentStep(step);
  };

  // Generate available dates based on subscription limits
  const getAvailableDates = () => {
    const dates: string[] = [];
    // Get today's date in Pakistan timezone (PKT = UTC+5)
    const now = new Date();
    // Convert to Pakistan time (UTC+5)
    const pakistanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const year = pakistanTime.getFullYear();
    const month = pakistanTime.getMonth();
    const day = pakistanTime.getDate();
    const today = new Date(year, month, day);
    
    // Get today's date string in YYYY-MM-DD format
    const todayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Determine max days based on subscription
    let maxDays = 7; // Default for no subscription
    if (shopSubscription && shopSubscription.status === "active") {
      maxDays = shopSubscription.planType === "starter" ? 7 : 30;
    }
    
    // Start from today (i = 0) and go forward
    for (let i = 0; i < maxDays; i++) {
      // Calculate date in Pakistan timezone
      const date = new Date(year, month, day + i);
      const dateYear = date.getFullYear();
      const dateMonth = date.getMonth();
      const dateDay = date.getDate();
      const dateString = `${dateYear}-${String(dateMonth + 1).padStart(2, '0')}-${String(dateDay).padStart(2, '0')}`;
      
      // Ensure we don't add past dates (compare as strings)
      if (dateString < todayString) {
        continue; // Skip past dates
      }
      
      // Check if shop is open on this day
      if (openingHoursData && openingHoursData.length > 0) {
        const dayOfWeek = date.getDay();
        const dayHours = openingHoursData.find(h => h.dayOfWeek === dayOfWeek);
        
        // Only add if shop is open (not closed) on this day
        // Skip if dayHours doesn't exist, or if isClosed is true
        if (!dayHours) {
          continue; // Skip if no opening hours for this day
        }
        if (dayHours.isClosed === true) {
          continue; // Skip if shop is closed on this day
        }
        // Only add if shop is open
        dates.push(dateString);
      } else {
        // If no opening hours set, allow all dates (but still check for past dates)
        dates.push(dateString);
      }
    }
    
    return dates;
  };

  const formatDate = (dateString: string) => {
    // Parse date in Pakistan timezone
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayOfWeek = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    
    // Get today's date in Pakistan timezone
    const now = new Date();
    const pakistanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const todayYear = pakistanTime.getFullYear();
    const todayMonth = pakistanTime.getMonth();
    const todayDay = pakistanTime.getDate();
    const todayString = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    
    // Get tomorrow's date in Pakistan timezone
    const tomorrow = new Date(pakistanTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowYear = tomorrow.getFullYear();
    const tomorrowMonth = tomorrow.getMonth();
    const tomorrowDay = tomorrow.getDate();
    const tomorrowString = `${tomorrowYear}-${String(tomorrowMonth + 1).padStart(2, '0')}-${String(tomorrowDay).padStart(2, '0')}`;
    
    if (dateString === todayString) {
      return `Today, ${monthName} ${dayNum}`;
    }
    if (dateString === tomorrowString) {
      return `Tomorrow, ${monthName} ${dayNum}`;
    }
    return `${dayOfWeek}, ${monthName} ${dayNum}`;
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimeRange = (timeString: string, duration: number) => {
    const [startHours, startMinutes] = timeString.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = startTotalMinutes + duration;
    
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMins = endTotalMinutes % 60;
    
    const startHour = startHours % 12 || 12;
    const startAmpm = startHours >= 12 ? 'PM' : 'AM';
    const endHour = endHours % 12 || 12;
    const endAmpm = endHours >= 12 ? 'PM' : 'AM';
    
    return `${startHour}:${String(startMinutes).padStart(2, '0')} ${startAmpm} - ${endHour}:${String(endMins).padStart(2, '0')} ${endAmpm}`;
  };

  const handleConfirmBooking = async () => {
    if (!shopData || !user) {
      toast.error('Missing required information');
      return;
    }

    try {
      const selectedServices = getSelectedServicesData();
      
      await createBooking({
        customerId: user._id,
        shopId: shopData._id,
        services: selectedServices.map(s => ({
          name: s.name,
          price: s.price,
          duration: s.duration,
        })),
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        notes: notes || undefined,
      });

      toast.success('Booking confirmed successfully!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking');
    }
  };

  const availableDates = getAvailableDates();
  const shop = shopData;

  if (!shop || !servicesData || !openingHoursData) {
    return (
      <>
        <Header />
        <section className="booking-section">
          <div className="container">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading...</p>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
                <Image 
                  src={shop.image || "/images/image1.jpg"} 
                  alt={shop.name} 
                  width={80} 
                  height={80} 
                />
                <div>
                  <h3>{shop.name}</h3>
                  <p className="barber-location">
                    <i className="fas fa-map-marker-alt"></i> {shop.address}
                  </p>
                </div>
              </div>
              
              <div className="barber-info-card">
                <h4>Working Hours</h4>
                <ul className="working-hours">
                  {openingHoursData.map((hours, idx) => (
                    <li key={idx}>
                      <span>{dayNames[hours.dayOfWeek]}:</span>
                      <span>
                        {hours.isClosed 
                          ? 'Closed' 
                          : `${hours.openingTime} - ${hours.closingTime}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {shop.phone && (
                <div className="barber-info-card">
                  <h4>Contact Details</h4>
                  <ul className="contact-details">
                    <li><i className="fas fa-phone"></i> {shop.phone}</li>
                  </ul>
                </div>
              )}
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
                  <span>Confirm</span>
                </div>
              </div>
              
              <div className="booking-form-content">
                {/* Step 1: Services */}
                {currentStep === 1 && (
                  <div className="booking-step-content active" id="step1">
                    <h3>Select Services</h3>
                    {activeServices.length === 0 ? (
                      <p>No services available</p>
                    ) : (
                      <>
                        <div className="services-list">
                          {activeServices.map((service, idx) => (
                            <div key={idx} className="service-item">
                              <div className="service-info">
                                <div className="checkbox-wrapper">
                                  <input
                                    type="checkbox"
                                    id={`service-${idx}`}
                                    name="services"
                                    checked={selectedServiceIndices.includes(idx)}
                                    onChange={() => toggleService(idx)}
                                  />
                                  <label htmlFor={`service-${idx}`}>{service.name}</label>
                                </div>
                                {service.description && <p>{service.description}</p>}
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
                              getSelectedServicesData().map((service, idx) => (
                                <div key={idx} className="summary-item">
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
                      </>
                    )}
                    
                    <div className="step-buttons">
                      <button
                        className="btn btn-primary next-step"
                        onClick={() => navigateToStep(2)}
                        disabled={selectedServiceIndices.length === 0}
                      >
                        Next: Choose Date & Time
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Step 2: Date & Time */}
                {currentStep === 2 && (
                  <div className="booking-step-content active" id="step2">
                    <h3>Select Date & Time</h3>
                    
                    <div style={{ marginBottom: '2rem' }}>
                      <label htmlFor="appointment-date" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Select Date
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                        {availableDates.map((date) => (
                          <button
                            key={date}
                            type="button"
                            onClick={() => {
                              setSelectedDate(date);
                              setSelectedTime(''); // Reset time when date changes
                            }}
                            className={selectedDate === date ? 'btn btn-primary' : 'btn btn-outline'}
                            style={{ padding: '0.75rem', fontSize: '0.875rem' }}
                          >
                            {formatDate(date)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedDate && (
                      <div>
                        <label htmlFor="appointment-time" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Select Time {totalServiceDuration > 0 && `(${totalServiceDuration} min per slot)`}
                        </label>
                        {selectedServiceIndices.length === 0 ? (
                          <p style={{ color: 'var(--secondary-color)', fontStyle: 'italic', marginBottom: '1rem' }}>
                            Please select services first to see available time slots
                          </p>
                        ) : timeSlotsData === undefined ? (
                          <p style={{ color: 'var(--secondary-color)', fontStyle: 'italic' }}>
                            <i className="fas fa-spinner fa-spin"></i> Loading time slots...
                          </p>
                        ) : availableTimeSlots.length > 0 || bookedTimeSlots.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                            {/* Show available slots */}
                            {availableTimeSlots.map((time) => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setSelectedTime(time)}
                                className={selectedTime === time ? 'btn btn-primary' : 'btn btn-outline'}
                                style={{ 
                                  padding: '0.875rem 1rem',
                                  background: selectedTime === time ? undefined : 'white',
                                  borderColor: selectedTime === time ? undefined : '#e0e0e0',
                                  fontSize: '0.9rem',
                                  textAlign: 'center',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minHeight: '60px',
                                }}
                                title={`Available: ${formatTimeRange(time, totalServiceDuration)}`}
                              >
                                <span style={{ fontWeight: '600' }}>{formatTimeRange(time, totalServiceDuration)}</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>Available</span>
                              </button>
                            ))}
                            {/* Show booked slots in red */}
                            {bookedTimeSlots.map((time) => (
                              <button
                                key={time}
                                type="button"
                                disabled
                                style={{ 
                                  padding: '0.875rem 1rem',
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: '2px solid #fca5a5',
                                  cursor: 'not-allowed',
                                  opacity: 0.9,
                                  fontSize: '0.9rem',
                                  textAlign: 'center',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minHeight: '60px',
                                  fontWeight: '600',
                                }}
                                title={`Booked: ${formatTimeRange(time, totalServiceDuration)}`}
                              >
                                <span>{formatTimeRange(time, totalServiceDuration)}</span>
                                <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <i className="fas fa-lock" style={{ fontSize: '0.7rem' }}></i>
                                  Booked
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p>No available time slots for this date</p>
                        )}
                      </div>
                    )}

                    <div style={{ marginTop: '2rem' }}>
                      <label htmlFor="notes" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special requests or notes..."
                        rows={4}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '4px',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                    
                    <div className="step-buttons">
                      <button className="btn btn-outline" onClick={() => setCurrentStep(1)}>
                        Back
                      </button>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => navigateToStep(3)}
                        disabled={!selectedDate || !selectedTime}
                      >
                        Next: Confirm
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Confirmation */}
                {currentStep === 3 && (
                  <div className="booking-step-content active" id="step3">
                    <h3>Confirm Your Booking</h3>
                    
                    <div className="booking-confirmation">
                      <div className="confirmation-section">
                        <h4>Barber Details</h4>
                        <p><strong>Shop:</strong> {shop.name}</p>
                        <p><strong>Address:</strong> {shop.address}</p>
                      </div>

                      <div className="confirmation-section">
                        <h4>Services</h4>
                        {getSelectedServicesData().map((service, idx) => (
                          <div key={idx} style={{ marginBottom: '0.5rem' }}>
                            <span>{service.name}</span> - Rs. {service.price} ({service.duration} min)
                          </div>
                        ))}
                        <p><strong>Total:</strong> Rs. {calculateTotal()}</p>
                        <p><strong>Duration:</strong> {calculateDuration()} minutes</p>
                      </div>

                      <div className="confirmation-section">
                        <h4>Appointment</h4>
                        <p><strong>Date:</strong> {formatDate(selectedDate)}</p>
                        <p><strong>Time:</strong> {totalServiceDuration > 0 ? formatTimeRange(selectedTime, totalServiceDuration) : formatTime(selectedTime)}</p>
                        {notes && (
                          <p><strong>Notes:</strong> {notes}</p>
                        )}
                      </div>

                      <div className="confirmation-section">
                        <h4>Your Details</h4>
                        {user && (
                          <>
                            <p><strong>Name:</strong> {user.fullName}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Phone:</strong> {user.phone}</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="step-buttons">
                      <button className="btn btn-outline" onClick={() => setCurrentStep(2)}>
                        Back
                      </button>
                      <button className="btn btn-primary" onClick={handleConfirmBooking}>
                        Confirm Booking
                      </button>
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

export default function BookingPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <section className="booking-section">
          <div className="container">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading...</p>
            </div>
          </div>
        </section>
        <Footer />
      </>
    }>
      <BookingPageContent />
    </Suspense>
  );
}
