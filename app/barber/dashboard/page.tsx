"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BarberOnboarding from "@/components/BarberOnboarding";
import toast from "react-hot-toast";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const PREDEFINED_SERVICES = [
  { name: "Haircut", description: "Professional haircut service", defaultPrice: 500, defaultDuration: 30 },
  { name: "Beard Trim", description: "Beard trimming and shaping", defaultPrice: 300, defaultDuration: 20 },
  { name: "Shave", description: "Traditional wet shave", defaultPrice: 400, defaultDuration: 25 },
  { name: "Haircut + Beard", description: "Combined haircut and beard trim", defaultPrice: 700, defaultDuration: 45 },
  { name: "Facial", description: "Face cleaning and treatment", defaultPrice: 600, defaultDuration: 40 },
  { name: "Hair Wash", description: "Professional hair washing", defaultPrice: 200, defaultDuration: 15 },
  { name: "Hair Styling", description: "Hair styling and blow dry", defaultPrice: 500, defaultDuration: 30 },
  { name: "Hair Color", description: "Hair coloring service", defaultPrice: 1500, defaultDuration: 90 },
];

export default function BarberDashboard() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = useQuery(
    api.functions.users.queries.getUser,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  const shop = useQuery(
    api.functions.barbers.queries.getShop,
    user?._id ? { userId: user._id } : "skip"
  );

  const services = useQuery(
    api.functions.barbers.queries.getServices,
    user?._id ? { userId: user._id } : "skip"
  );

  const openingHours = useQuery(
    api.functions.barbers.queries.getOpeningHours,
    user?._id ? { userId: user._id } : "skip"
  );

  // Fetch bookings for the barber's shop
  const bookings = useQuery(
    api.functions.bookings.queries.getBookingsByShop,
    shop?._id ? { shopId: shop._id } : "skip"
  );

  const [activeTab, setActiveTab] = useState<"overview" | "services" | "hours" | "shop">("overview");
  const [showAddService, setShowAddService] = useState(false);
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 30,
  });

  const [hoursForm, setHoursForm] = useState<Record<number, {
    openingTime: string;
    closingTime: string;
    isClosed: boolean;
  }>>({});

  const [shopForm, setShopForm] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
    experience: 0,
    image: "",
  });

  const addService = useMutation(api.functions.barbers.mutations.addService);
  const updateService = useMutation(api.functions.barbers.mutations.updateService);
  const deleteService = useMutation(api.functions.barbers.mutations.deleteService);
  const setAllOpeningHours = useMutation(api.functions.barbers.mutations.setAllOpeningHours);
  const updateShop = useMutation(api.functions.barbers.mutations.updateShop);

  // Initialize forms from fetched data
  useEffect(() => {
    if (openingHours !== undefined) {
      const hours: Record<number, { openingTime: string; closingTime: string; isClosed: boolean }> = {};
      
      DAYS_OF_WEEK.forEach((day) => {
        const existingHour = openingHours.find((h) => h.dayOfWeek === day.value);
        hours[day.value] = existingHour
          ? {
              openingTime: existingHour.openingTime,
              closingTime: existingHour.closingTime,
              isClosed: existingHour.isClosed,
            }
          : {
              openingTime: "09:00",
              closingTime: "18:00",
              isClosed: false,
            };
      });

      setHoursForm(hours);
    }
  }, [openingHours]);

  useEffect(() => {
    if (shop) {
      setShopForm({
        name: shop.name || "",
        address: shop.address || "",
        phone: shop.phone || "",
        description: shop.description || "",
        experience: shop.experience || 0,
        image: shop.image || "",
      });
    }
  }, [shop]);

  const handleOnboardingComplete = () => {
    // Refetch shop data to get updated onboarding status
    window.location.reload();
  };

  const handleAddPredefinedService = async (predefined: typeof PREDEFINED_SERVICES[0]) => {
    if (!user?._id) return;

    try {
      await addService({
        userId: user._id,
        name: predefined.name,
        description: predefined.description,
        price: predefined.defaultPrice,
        duration: predefined.defaultDuration,
      });
      toast.success(`${predefined.name} added successfully!`);
    } catch (error) {
      toast.error("Failed to add service");
      console.error(error);
    }
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    try {
      if (editingServiceIndex !== null) {
        await updateService({
          userId: user._id,
          serviceIndex: editingServiceIndex,
          ...serviceForm,
        });
        toast.success("Service updated successfully!");
      } else {
        await addService({
          userId: user._id,
          ...serviceForm,
        });
        toast.success("Service added successfully!");
      }
      setShowAddService(false);
      setEditingServiceIndex(null);
      setServiceForm({ name: "", description: "", price: 0, duration: 30 });
    } catch (error) {
      toast.error("Failed to save service");
      console.error(error);
    }
  };

  const handleEditService = (service: NonNullable<typeof services>[number]) => {
    if (service._index === undefined) return;
    setEditingServiceIndex(service._index);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      price: service.price,
      duration: service.duration,
    });
    setShowAddService(true);
  };

  const handleDeleteService = async (serviceIndex: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    if (!user?._id) return;

    try {
      await deleteService({ userId: user._id, serviceIndex });
      toast.success("Service deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete service");
      console.error(error);
    }
  };

  const handleSaveHours = async () => {
    if (!user?._id) return;

    try {
      const hoursArray = DAYS_OF_WEEK.map((day) => ({
        dayOfWeek: day.value,
        ...hoursForm[day.value],
      }));

      await setAllOpeningHours({
        userId: user._id,
        hours: hoursArray,
      });
      toast.success("Opening hours saved successfully!");
    } catch (error) {
      toast.error("Failed to save opening hours");
      console.error(error);
    }
  };

  const handleHoursChange = (day: number, field: string, value: string | boolean) => {
    setHoursForm((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    try {
      await updateShop({
        userId: user._id,
        ...shopForm,
        experience: Number(shopForm.experience) || 0,
      });
      toast.success("Shop details updated successfully!");
    } catch (error) {
      toast.error("Failed to update shop details");
      console.error(error);
    }
  };

  if (!user || user.userType !== "barber") {
    return (
      <>
        <Header />
        <div className="container" style={{ padding: "4rem 1rem", textAlign: "center" }}>
          <h1>Access Denied</h1>
          <p>This page is only accessible to barbers.</p>
        </div>
        <Footer />
      </>
    );
  }

  // Show onboarding if not complete
  if (shop && !shop.onboardingComplete) {
    return (
      <>
        <Header />
        <BarberOnboarding userId={user._id} onComplete={handleOnboardingComplete} />
        <Footer />
      </>
    );
  }

  // Main Dashboard
  return (
    <>
      <Header />
      <div className="container" style={{ padding: "2rem 1rem", maxWidth: "1400px" }}>
        {/* Welcome Header */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)",
            borderRadius: "12px",
            padding: "3rem 2rem",
            marginBottom: "2rem",
            color: "white",
          }}
        >
          <h1 style={{ margin: 0, marginBottom: "0.5rem", fontSize: "2.5rem" }}>
            Welcome back, {user.fullName}! 👋
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "1.1rem" }}>
            {shop?.name || "Your Barber Shop"} • {services?.length || 0} Services • Manage your business
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ backgroundColor: "var(--white)", padding: "1.5rem", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", backgroundColor: "#E3F2FD", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-list-alt" style={{ fontSize: "1.5rem", color: "#2196F3" }}></i>
              </div>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--primary-color)" }}>
                  {services?.length || 0}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--secondary-color)" }}>Active Services</div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--white)", padding: "1.5rem", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", backgroundColor: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-clock" style={{ fontSize: "1.5rem", color: "#4CAF50" }}></i>
              </div>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--primary-color)" }}>
                  {openingHours?.filter((h) => !h.isClosed).length || 0}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--secondary-color)" }}>Working Days</div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--white)", padding: "1.5rem", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", backgroundColor: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-star" style={{ fontSize: "1.5rem", color: "#FF9800" }}></i>
              </div>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--primary-color)" }}>
                  {shop?.experience || 0}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--secondary-color)" }}>Years Experience</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "2px solid var(--border-color)",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { id: "overview", label: "Overview", icon: "fas fa-home" },
            { id: "services", label: "Services", icon: "fas fa-cut" },
            { id: "hours", label: "Opening Hours", icon: "fas fa-clock" },
            { id: "shop", label: "Shop Details", icon: "fas fa-store" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "1rem 1.5rem",
                border: "none",
                background: "transparent",
                borderBottom: activeTab === tab.id ? "3px solid var(--accent-color)" : "3px solid transparent",
                color: activeTab === tab.id ? "var(--accent-color)" : "var(--secondary-color)",
                fontWeight: activeTab === tab.id ? "600" : "400",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            {/* Upcoming Appointments */}
            <div style={{ backgroundColor: "var(--white)", padding: "2rem", borderRadius: "12px", boxShadow: "var(--shadow)", marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.5rem" }}>Upcoming Appointments</h3>
                <button
                  onClick={() => router.push("/barber/appointments")}
                  className="btn btn-primary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                >
                  <i className="fas fa-calendar-alt" style={{ marginRight: "0.5rem" }}></i>
                  View All Appointments
                </button>
              </div>
              {bookings === undefined ? (
                <p style={{ color: "var(--secondary-color)" }}>Loading...</p>
              ) : bookings.length === 0 ? (
                <p style={{ color: "var(--secondary-color)" }}>No appointments yet.</p>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {bookings
                    .filter((booking) => {
                      const appointmentDateTime = new Date(`${booking.appointmentDate}T${booking.appointmentTime}`);
                      return appointmentDateTime >= new Date() && booking.status !== 'cancelled' && booking.status !== 'completed';
                    })
                    .sort((a, b) => {
                      const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
                      const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
                      return dateA.getTime() - dateB.getTime();
                    })
                    .slice(0, 5)
                    .map((booking) => {
                      const appointmentDate = new Date(`${booking.appointmentDate}T${booking.appointmentTime}`);
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

                      return (
                        <div
                          key={booking._id}
                          style={{
                            padding: "1.5rem",
                            border: "1px solid var(--border-color)",
                            borderRadius: "8px",
                            backgroundColor: "var(--light-bg)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                            <div>
                              <h4 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                                {booking.customer?.fullName || 'Customer'}
                              </h4>
                              <p style={{ color: "var(--secondary-color)", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                                <i className="fas fa-phone"></i> {booking.customer?.phone || 'N/A'}
                              </p>
                              <p style={{ color: "var(--secondary-color)", fontSize: "0.9rem" }}>
                                <i className="fas fa-envelope"></i> {booking.customer?.email || 'N/A'}
                              </p>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div style={{ marginBottom: "1rem" }}>
                            <p style={{ marginBottom: "0.5rem" }}>
                              <strong>Date:</strong> {appointmentDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            <p style={{ marginBottom: "0.5rem" }}>
                              <strong>Time:</strong> {formatTime(booking.appointmentTime)} ({booking.totalDuration} min)
                            </p>
                            <p>
                              <strong>Services:</strong> {booking.services.map(s => s.name).join(', ')}
                            </p>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong>Total: Rs. {booking.totalPrice}</strong>
                            {booking.notes && (
                              <span style={{ fontSize: "0.875rem", color: "var(--secondary-color)" }}>
                                <i className="fas fa-sticky-note"></i> Has notes
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
              <div style={{ backgroundColor: "var(--white)", padding: "2rem", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
                <h3 style={{ marginBottom: "1rem" }}>Recent Services</h3>
                {services && services.length > 0 ? (
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {services.slice(0, 3).map((service, index) => (
                      <div
                        key={service._index ?? index}
                        style={{
                          padding: "1rem",
                          border: "1px solid var(--border-color)",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "600" }}>{service.name}</div>
                          <div style={{ fontSize: "0.9rem", color: "var(--secondary-color)" }}>
                            Rs. {service.price} • {service.duration} min
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            backgroundColor: service.isActive ? "#E8F5E9" : "var(--light-bg)",
                            color: service.isActive ? "#4CAF50" : "var(--secondary-color)",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                          }}
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--secondary-color)" }}>No services added yet.</p>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab("services")}
                  style={{ marginTop: "1rem", width: "100%" }}
                >
                  Manage Services
                </button>
              </div>

              <div style={{ backgroundColor: "var(--white)", padding: "2rem", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
                <h3 style={{ marginBottom: "1rem" }}>Opening Hours</h3>
                {openingHours && openingHours.length > 0 ? (
                  <div style={{ display: "grid", gap: "0.5rem" }}>
                    {openingHours.slice(0, 3).map((hour, index) => {
                      const day = DAYS_OF_WEEK.find((d) => d.value === hour.dayOfWeek);
                      return (
                        <div key={index} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                          <span style={{ fontWeight: "500" }}>{day?.label}</span>
                          <span style={{ color: "var(--secondary-color)" }}>
                            {hour.isClosed ? "Closed" : `${hour.openingTime} - ${hour.closingTime}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "var(--secondary-color)", fontSize: "0.9rem" }}>No hours set.</p>
                )}
                <button
                  className="btn btn-outline"
                  onClick={() => setActiveTab("hours")}
                  style={{ marginTop: "1rem", width: "100%" }}
                >
                  Edit Hours
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === "services" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2>Your Services</h2>
              <button
                onClick={() => {
                  setShowAddService(true);
                  setEditingServiceIndex(null);
                  setServiceForm({ name: "", description: "", price: 0, duration: 30 });
                }}
                className="btn btn-primary"
                style={{ padding: "0.75rem 1.5rem" }}
              >
                <i className="fas fa-plus"></i> Add Custom Service
              </button>
            </div>

            {/* Predefined Services */}
            {!showAddService && (
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>Quick Add Services</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {PREDEFINED_SERVICES.map((service) => {
                    const exists = services?.some((s) => s.name === service.name);
                    return (
                      <div
                        key={service.name}
                        style={{
                          padding: "1rem",
                          border: "1px solid var(--border-color)",
                          borderRadius: "8px",
                          backgroundColor: exists ? "var(--light-bg)" : "var(--white)",
                        }}
                      >
                        <h4 style={{ marginBottom: "0.5rem" }}>{service.name}</h4>
                        <p style={{ fontSize: "0.875rem", color: "var(--light-text)", marginBottom: "0.5rem" }}>
                          {service.description}
                        </p>
                        <p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                          Rs. {service.defaultPrice} • {service.defaultDuration} min
                        </p>
                        {exists ? (
                          <button className="btn btn-outline" disabled style={{ width: "100%" }}>
                            Already Added
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleAddPredefinedService(service)}
                            style={{ width: "100%" }}
                          >
                            Add Service
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add/Edit Service Form */}
            {showAddService && (
              <div
                style={{
                  padding: "2rem",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  backgroundColor: "var(--white)",
                  marginBottom: "2rem",
                }}
              >
                <h3 style={{ marginBottom: "1.5rem" }}>{editingServiceIndex !== null ? "Edit Service" : "Add Custom Service"}</h3>
                <form onSubmit={handleSubmitService}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Service Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        fontSize: "1rem",
                      }}
                      placeholder="e.g., Premium Haircut"
                    />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Description
                    </label>
                    <textarea
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        fontSize: "1rem",
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                      placeholder="Service description..."
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Price (Rs.) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                          fontSize: "1rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={serviceForm.duration}
                        onChange={(e) => setServiceForm({ ...serviceForm, duration: Number(e.target.value) })}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                          fontSize: "1rem",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button type="submit" className="btn btn-primary">
                      {editingServiceIndex !== null ? "Update Service" : "Add Service"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setShowAddService(false);
                        setEditingServiceIndex(null);
                        setServiceForm({ name: "", description: "", price: 0, duration: 30 });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Services List */}
            <div>
              <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>Your Services ({services?.length || 0})</h3>
              {services && services.length > 0 ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {services.map((service, index) => (
                    <div
                      key={service._index ?? index}
                      style={{
                        padding: "1.5rem",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        backgroundColor: "var(--white)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxShadow: "var(--shadow)",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                          <h4 style={{ margin: 0 }}>{service.name}</h4>
                          {!service.isActive && (
                            <span
                              style={{
                                padding: "0.25rem 0.75rem",
                                backgroundColor: "var(--light-bg)",
                                color: "var(--secondary-color)",
                                borderRadius: "4px",
                                fontSize: "0.875rem",
                              }}
                            >
                              Inactive
                            </span>
                          )}
                        </div>
                        {service.description && (
                          <p style={{ color: "var(--light-text)", marginBottom: "0.5rem" }}>{service.description}</p>
                        )}
                        <div style={{ display: "flex", gap: "2rem", color: "var(--secondary-color)" }}>
                          <span>
                            <strong>Rs. {service.price}</strong>
                          </span>
                          <span>{service.duration} minutes</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleEditService(service)}
                          style={{ padding: "0.5rem 1rem" }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleDeleteService(service._index ?? index)}
                          style={{ padding: "0.5rem 1rem", color: "var(--danger-color)" }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ padding: "2rem", textAlign: "center", color: "var(--light-text)" }}>
                  No services added yet. Add predefined services or create custom ones above.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Opening Hours Tab */}
        {activeTab === "hours" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2>Opening Hours</h2>
              <button className="btn btn-primary" onClick={handleSaveHours} style={{ padding: "0.75rem 1.5rem" }}>
                <i className="fas fa-save"></i> Save Hours
              </button>
            </div>

            <div
              style={{
                padding: "2rem",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                backgroundColor: "var(--white)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div style={{ display: "grid", gap: "1rem" }}>
                {DAYS_OF_WEEK.map((day) => {
                  const dayHours = hoursForm[day.value];
                  if (!dayHours) return null;

                  return (
                    <div
                      key={day.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        padding: "1rem",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ minWidth: "120px", fontWeight: "500" }}>{day.label}</div>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={dayHours.isClosed}
                          onChange={(e) => handleHoursChange(day.value, "isClosed", e.target.checked)}
                          style={{ width: "18px", height: "18px", cursor: "pointer" }}
                        />
                        <span>Closed</span>
                      </label>
                      {!dayHours.isClosed && (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <label style={{ fontSize: "0.875rem", color: "var(--secondary-color)" }}>Open:</label>
                            <input
                              type="time"
                              value={dayHours.openingTime}
                              onChange={(e) => handleHoursChange(day.value, "openingTime", e.target.value)}
                              style={{
                                padding: "0.5rem",
                                border: "1px solid var(--border-color)",
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <label style={{ fontSize: "0.875rem", color: "var(--secondary-color)" }}>Close:</label>
                            <input
                              type="time"
                              value={dayHours.closingTime}
                              onChange={(e) => handleHoursChange(day.value, "closingTime", e.target.value)}
                              style={{
                                padding: "0.5rem",
                                border: "1px solid var(--border-color)",
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Shop Details Tab */}
        {activeTab === "shop" && (
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <h2>Shop Details</h2>
              <p style={{ color: "var(--secondary-color)" }}>Update your shop information</p>
            </div>

            <div
              style={{
                padding: "2rem",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                backgroundColor: "var(--white)",
                boxShadow: "var(--shadow)",
              }}
            >
              <form onSubmit={handleSaveShop}>
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Shop Name <span style={{ color: "var(--danger-color)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={shopForm.name}
                      onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        fontSize: "1rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Address <span style={{ color: "var(--danger-color)" }}>*</span>
                    </label>
                    <textarea
                      required
                      value={shopForm.address}
                      onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        fontSize: "1rem",
                        minHeight: "100px",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Phone Number</label>
                      <input
                        type="tel"
                        value={shopForm.phone}
                        onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                          fontSize: "1rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={shopForm.experience}
                        onChange={(e) => setShopForm({ ...shopForm, experience: Number(e.target.value) || 0 })}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                          fontSize: "1rem",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Description</label>
                    <textarea
                      value={shopForm.description}
                      onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        fontSize: "1rem",
                        minHeight: "120px",
                        resize: "vertical",
                      }}
                      placeholder="Tell customers about your shop..."
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Shop Image URL</label>
                    <input
                      type="url"
                      value={shopForm.image}
                      onChange={(e) => setShopForm({ ...shopForm, image: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        fontSize: "1rem",
                      }}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 2rem" }}>
                      <i className="fas fa-save"></i> Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
