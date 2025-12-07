'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import toast from 'react-hot-toast';

type AppointmentStatus = 'all' | 'pending' | 'confirmed' | 'completed';

export default function BarberAppointmentsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<AppointmentStatus>('all');

  // Get user
  const user = useQuery(
    api.functions.users.queries.getUser,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Get shop
  const shop = useQuery(
    api.functions.barbers.queries.getShop,
    user?._id ? { userId: user._id } : "skip"
  );

  // Fetch bookings for the barber's shop
  const bookings = useQuery(
    api.functions.bookings.queries.getBookingsByShop,
    shop?._id ? { shopId: shop._id } : "skip"
  );

  const updateBookingStatus = useMutation(api.functions.bookings.mutations.updateBookingStatus);

  // Redirect if not logged in or not a barber
  if (session && user && user.userType !== 'barber') {
    router.push('/');
    return null;
  }

  if (!session || !user) {
    router.push('/login');
    return null;
  }

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

  const handleStatusUpdate = async (bookingId: any, newStatus: 'confirmed' | 'completed' | 'cancelled') => {
    try {
      await updateBookingStatus({
        bookingId,
        status: newStatus,
      });
      
      const statusMessages = {
        confirmed: 'Appointment confirmed successfully!',
        completed: 'Appointment marked as completed!',
        cancelled: 'Appointment cancelled and removed!',
      };
      
      toast.success(statusMessages[newStatus]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update appointment status');
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings
    ? bookings.filter((booking) => {
        if (activeTab === 'all') return true;
        return booking.status === activeTab;
      })
    : [];

  // Sort bookings: upcoming first, then by date
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
    const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
    const now = new Date();
    
    const aIsUpcoming = dateA >= now;
    const bIsUpcoming = dateB >= now;
    
    if (aIsUpcoming !== bIsUpcoming) {
      return aIsUpcoming ? -1 : 1;
    }
    
    return dateA.getTime() - dateB.getTime();
  });

  const tabs: { id: AppointmentStatus; label: string; count?: number }[] = [
    { 
      id: 'all', 
      label: 'All',
      count: bookings?.length || 0
    },
    { 
      id: 'pending', 
      label: 'Pending',
      count: bookings?.filter(b => b.status === 'pending').length || 0
    },
    { 
      id: 'confirmed', 
      label: 'Confirmed',
      count: bookings?.filter(b => b.status === 'confirmed').length || 0
    },
    { 
      id: 'completed', 
      label: 'Completed',
      count: bookings?.filter(b => b.status === 'completed').length || 0
    },
  ];

  return (
    <>
      <Header />
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
            Appointments
          </h1>
          <p style={{ color: 'var(--secondary-color)', fontSize: '1.1rem' }}>
            Manage all your appointments and bookings
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid var(--border-color)',
            marginBottom: '2rem',
            flexWrap: 'wrap',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.id ? '3px solid var(--accent-color)' : '3px solid transparent',
                color: activeTab === tab.id ? 'var(--accent-color)' : 'var(--secondary-color)',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                position: 'relative',
              }}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  style={{
                    padding: '0.125rem 0.5rem',
                    backgroundColor: activeTab === tab.id ? 'var(--accent-color)' : 'var(--light-bg)',
                    color: activeTab === tab.id ? 'white' : 'var(--secondary-color)',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {bookings === undefined ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <p style={{ color: 'var(--secondary-color)' }}>Loading appointments...</p>
          </div>
        ) : sortedBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <i className="fas fa-calendar-times" style={{ fontSize: '4rem', color: 'var(--light-text)', marginBottom: '1rem' }}></i>
            <p style={{ color: 'var(--secondary-color)', fontSize: '1.1rem' }}>
              No appointments found for this filter.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {sortedBookings.map((booking) => {
              const appointmentDate = new Date(`${booking.appointmentDate}T${booking.appointmentTime}`);
              const isUpcoming = appointmentDate >= new Date();
              const isPast = appointmentDate < new Date();

              return (
                <div
                  key={booking._id}
                  style={{
                    padding: '2rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    backgroundColor: 'var(--white)',
                    boxShadow: 'var(--shadow)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                        {booking.customer?.fullName || 'Customer'}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--secondary-color)' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                          <i className="fas fa-phone" style={{ marginRight: '0.5rem' }}></i>
                          {booking.customer?.phone || 'N/A'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                          <i className="fas fa-envelope" style={{ marginRight: '0.5rem' }}></i>
                          {booking.customer?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Appointment Details */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: 'var(--light-bg)',
                    borderRadius: '8px',
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--secondary-color)', marginBottom: '0.25rem' }}>
                        <i className="fas fa-calendar" style={{ marginRight: '0.5rem' }}></i>
                        Date
                      </p>
                      <p style={{ margin: 0, fontWeight: '600' }}>
                        {formatDate(booking.appointmentDate)}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--secondary-color)', marginBottom: '0.25rem' }}>
                        <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>
                        Time
                      </p>
                      <p style={{ margin: 0, fontWeight: '600' }}>
                        {formatTime(booking.appointmentTime)} ({booking.totalDuration} min)
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--secondary-color)', marginBottom: '0.25rem' }}>
                        <i className="fas fa-rupee-sign" style={{ marginRight: '0.5rem' }}></i>
                        Total Price
                      </p>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem', color: 'var(--primary-color)' }}>
                        Rs. {booking.totalPrice}
                      </p>
                    </div>
                  </div>

                  {/* Services */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--secondary-color)' }}>
                      Services:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {booking.services.map((service, index) => (
                        <span
                          key={index}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--light-bg)',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {service.name} - Rs. {service.price}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div style={{ 
                      marginBottom: '1.5rem',
                      padding: '1rem',
                      backgroundColor: '#FFF9E6',
                      borderRadius: '8px',
                      borderLeft: '4px solid #FFC107',
                    }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        <i className="fas fa-sticky-note" style={{ marginRight: '0.5rem' }}></i>
                        Notes:
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--secondary-color)' }}>
                        {booking.notes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.75rem', 
                    flexWrap: 'wrap',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-color)',
                  }}>
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                          className="btn btn-primary"
                          style={{ 
                            padding: '0.75rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <i className="fas fa-check"></i>
                          Confirm Appointment
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this appointment?')) {
                              handleStatusUpdate(booking._id, 'cancelled');
                            }
                          }}
                          className="btn btn-outline"
                          style={{ 
                            padding: '0.75rem 1.5rem',
                            color: 'var(--danger-color)',
                            borderColor: 'var(--danger-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <i className="fas fa-times"></i>
                          Cancel
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && isPast && (
                      <button
                        onClick={() => handleStatusUpdate(booking._id, 'completed')}
                        className="btn btn-primary"
                        style={{ 
                          padding: '0.75rem 1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <i className="fas fa-check-circle"></i>
                        Mark as Completed
                      </button>
                    )}
                    {booking.status === 'confirmed' && isUpcoming && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this appointment?')) {
                            handleStatusUpdate(booking._id, 'cancelled');
                          }
                        }}
                        className="btn btn-outline"
                        style={{ 
                          padding: '0.75rem 1.5rem',
                          color: 'var(--danger-color)',
                          borderColor: 'var(--danger-color)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <i className="fas fa-times"></i>
                        Cancel Appointment
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <p style={{ 
                        margin: 0, 
                        color: 'var(--secondary-color)', 
                        fontSize: '0.875rem',
                        fontStyle: 'italic',
                      }}>
                        This appointment has been completed.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

