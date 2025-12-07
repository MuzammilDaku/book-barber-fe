'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useUserStore } from '@/store/user';
import toast from 'react-hot-toast';

// Rating Stars Component
function RatingStars({ booking, onRate }: { booking: any; onRate: (rating: number) => void }) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const currentRating = booking.rating || 0;
  const displayRating = hoveredRating || currentRating;
  const isInteractive = booking.status === 'completed' && !booking.rating;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const isFilled = i <= displayRating;
        if (isInteractive) {
          return (
            <button
              key={i}
              onClick={() => onRate(i)}
              onMouseEnter={() => setHoveredRating(i)}
              onMouseLeave={() => setHoveredRating(0)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                fontSize: '1.5rem',
                color: isFilled ? '#FFD700' : '#ddd',
                transition: 'all 0.2s',
              }}
            >
              <i className={isFilled ? 'fas fa-star' : 'far fa-star'}></i>
            </button>
          );
        } else {
          return (
            <span
              key={i}
              style={{
                color: isFilled ? '#FFD700' : '#ddd',
                fontSize: '1.2rem',
              }}
            >
              <i className={isFilled ? 'fas fa-star' : 'far fa-star'}></i>
            </span>
          );
        }
      })}
      {currentRating > 0 && (
        <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: 'var(--secondary-color)' }}>
          ({currentRating.toFixed(1)})
        </span>
      )}
    </div>
  );
}

export default function MyAppointmentsPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const { data: session } = authClient.useSession();

  // Fetch bookings for the logged-in customer
  const bookings = useQuery(
    api.functions.bookings.queries.getBookingsByCustomer,
    user?._id && user.userType === 'customer' ? { customerId: user._id } : "skip"
  );

  const updateBookingStatus = useMutation(api.functions.bookings.mutations.updateBookingStatus);
  const updateBookingRating = useMutation(api.functions.bookings.mutations.updateBookingRating);


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { bg: string; color: string }> = {
      pending: { bg: '#FFF3CD', color: '#856404' },
      confirmed: { bg: '#D1ECF1', color: '#0C5460' },
      completed: { bg: '#D4EDDA', color: '#155724' },
      cancelled: { bg: '#F8D7DA', color: '#721C24' },
    };
    const style = statusStyles[status] || statusStyles.pending;
    
    return (
      <span
        style={{
          padding: '0.25rem 0.75rem',
          backgroundColor: style.bg,
          color: style.color,
          borderRadius: '4px',
          fontSize: '0.875rem',
          fontWeight: '500',
          textTransform: 'capitalize',
        }}
      >
        {status}
      </span>
    );
  };

  const handleCancelBooking = async (bookingId: any) => {
    if (!confirm('Are you sure you want to cancel this booking? It will be permanently removed.')) {
      return;
    }

    try {
      await updateBookingStatus({
        bookingId,
        status: 'cancelled',
      });
      toast.success('Booking cancelled and removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking');
    }
  };

  const handleRateBooking = async (bookingId: any, rating: number) => {
    try {
      await updateBookingRating({
        bookingId,
        rating,
      });
      toast.success('Thank you for your rating!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating');
    }
  };


  // Sort bookings: upcoming first, then by date
  const sortedBookings = bookings
    ? [...bookings].sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
        const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
        const now = new Date();
        
        const aIsUpcoming = dateA >= now;
        const bIsUpcoming = dateB >= now;
        
        if (aIsUpcoming !== bIsUpcoming) {
          return aIsUpcoming ? -1 : 1;
        }
        
        return dateA.getTime() - dateB.getTime();
      })
    : [];

  const upcomingBookings = sortedBookings.filter(
    (booking) => new Date(`${booking.appointmentDate}T${booking.appointmentTime}`) >= new Date()
  );
  const pastBookings = sortedBookings.filter(
    (booking) => new Date(`${booking.appointmentDate}T${booking.appointmentTime}`) < new Date()
  );

  return (
    <>
      <Header />
      
      <section className="booking-section">
        <div className="container">
          <h2 className="section-title">My Appointments</h2>
          
          {bookings === undefined ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>You don't have any appointments yet.</p>
              <button 
                className="btn btn-primary" 
                onClick={() => router.push('/barbers')}
                style={{ marginTop: '1rem' }}
              >
                Book an Appointment
              </button>
            </div>
          ) : (
            <>
              {/* Upcoming Appointments */}
              {upcomingBookings.length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                    Upcoming Appointments ({upcomingBookings.length})
                  </h3>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking._id}
                        style={{
                          padding: '1.5rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          backgroundColor: 'var(--white)',
                          boxShadow: 'var(--shadow)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                              {booking.shop?.name || 'Barber Shop'}
                            </h4>
                            <p style={{ color: 'var(--light-text)', marginBottom: '0.25rem' }}>
                              <i className="fas fa-map-marker-alt"></i> {booking.shop?.address || 'N/A'}
                            </p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{ marginBottom: '0.5rem' }}>
                            <strong>Date:</strong> {formatDate(booking.appointmentDate)}
                          </p>
                          <p style={{ marginBottom: '0.5rem' }}>
                            <strong>Time:</strong> {formatTime(booking.appointmentTime)}
                          </p>
                          <p>
                            <strong>Duration:</strong> {booking.totalDuration} minutes
                          </p>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <strong>Services:</strong>
                          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                            {booking.services.map((service, idx) => (
                              <li key={idx}>
                                {service.name} - Rs. {service.price} ({service.duration} min)
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <strong>Total: Rs. {booking.totalPrice}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {booking.status === 'completed' && (
                              <div>
                                {booking.rating ? (
                                  <div>
                                    <p style={{ margin: 0, marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--secondary-color)' }}>
                                      Your Rating:
                                    </p>
                                    <RatingStars booking={booking} onRate={(rating) => handleRateBooking(booking._id, rating)} />
                                  </div>
                                ) : (
                                  <div>
                                    <p style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                      Rate this appointment:
                                    </p>
                                    <RatingStars booking={booking} onRate={(rating) => handleRateBooking(booking._id, rating)} />
                                  </div>
                                )}
                              </div>
                            )}
                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                              <button
                                className="btn btn-outline"
                                onClick={() => handleCancelBooking(booking._id)}
                                style={{ color: '#dc3545', borderColor: '#dc3545' }}
                              >
                                Cancel Booking
                              </button>
                            )}
                          </div>
                        </div>

                        {booking.notes && (
                          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--light-bg)', borderRadius: '4px' }}>
                            <strong>Notes:</strong> {booking.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Appointments */}
              {pastBookings.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                    Past Appointments ({pastBookings.length})
                  </h3>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {pastBookings.map((booking) => (
                      <div
                        key={booking._id}
                        style={{
                          padding: '1.5rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          backgroundColor: 'var(--white)',
                          boxShadow: 'var(--shadow)',
                          opacity: 0.8,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                              {booking.shop?.name || 'Barber Shop'}
                            </h4>
                            <p style={{ color: 'var(--light-text)', marginBottom: '0.25rem' }}>
                              <i className="fas fa-map-marker-alt"></i> {booking.shop?.address || 'N/A'}
                            </p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{ marginBottom: '0.5rem' }}>
                            <strong>Date:</strong> {formatDate(booking.appointmentDate)}
                          </p>
                          <p style={{ marginBottom: '0.5rem' }}>
                            <strong>Time:</strong> {formatTime(booking.appointmentTime)}
                          </p>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <strong>Services:</strong>
                          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                            {booking.services.map((service, idx) => (
                              <li key={idx}>
                                {service.name} - Rs. {service.price}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                          <div>
                            <strong>Total: Rs. {booking.totalPrice}</strong>
                          </div>
                          {booking.status === 'completed' && (
                            <div>
                              {booking.rating ? (
                                <div>
                                  <p style={{ margin: 0, marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--secondary-color)' }}>
                                    Your Rating:
                                  </p>
                                  <RatingStars booking={booking} onRate={(rating) => handleRateBooking(booking._id, rating)} />
                                </div>
                              ) : (
                                <div>
                                  <p style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                    Rate this appointment:
                                  </p>
                                  <RatingStars booking={booking} onRate={(rating) => handleRateBooking(booking._id, rating)} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

