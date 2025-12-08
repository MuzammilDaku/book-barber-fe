"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useUserStore } from "@/store/user";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { user, setUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "shops" | "bookings" | "earnings">("overview");

  // Fetch user data
  const currentUser = useQuery(
    api.functions.users.queries.getUser,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Fetch admin stats
  const stats = useQuery(api.functions.admin.queries.getAdminStats);
  const allUsers = useQuery(api.functions.admin.queries.getAllUsers);
  const allShops = useQuery(api.functions.admin.queries.getAllShops);
  const allBookings = useQuery(api.functions.admin.queries.getAllBookings);

  useEffect(() => {
    if (currentUser && currentUser.userType !== "admin") {
      toast.error("Access denied. Admin access required.");
      router.push("/");
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.userType !== "admin") {
    return (
      <>
        <Header />
        <div className="container" style={{ padding: "4rem 1rem", textAlign: "center" }}>
          <h1>Access Denied</h1>
          <p>This page is only accessible to administrators.</p>
        </div>
        <Footer />
      </>
    );
  }

  const formatCurrency = (amount: number) => {
    // Format as USD without any conversion - amounts are already in USD
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Header />
      <div className="container" style={{ padding: "2rem 1rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ color: "var(--primary-color)", marginBottom: "0.5rem" }}>
            <i className="fas fa-tachometer-alt"></i> Admin Dashboard
          </h1>
          <p style={{ color: "var(--secondary-color)" }}>
            Welcome, {currentUser.fullName}. Manage your platform from here.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "2px solid var(--border-color)" }}>
          {[
            { id: "overview", label: "Overview", icon: "fa-chart-line" },
            { id: "users", label: "Users", icon: "fa-users" },
            { id: "shops", label: "Shops", icon: "fa-store" },
            { id: "bookings", label: "Bookings", icon: "fa-calendar-check" },
            { id: "earnings", label: "Earnings", icon: "fa-dollar-sign" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "0.75rem 1.5rem",
                border: "none",
                background: "transparent",
                borderBottom: activeTab === tab.id ? "3px solid var(--accent-color)" : "3px solid transparent",
                color: activeTab === tab.id ? "var(--accent-color)" : "var(--secondary-color)",
                fontWeight: activeTab === tab.id ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            {stats ? (
              <>
                {/* Stats Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                  <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ color: "var(--secondary-color)", margin: 0, fontSize: "0.9rem" }}>Total Users</p>
                        <h2 style={{ margin: "0.5rem 0 0 0", color: "var(--primary-color)" }}>{stats.users.total}</h2>
                      </div>
                      <div style={{ fontSize: "2.5rem", color: "var(--accent-color)", opacity: 0.3 }}>
                        <i className="fas fa-users"></i>
                      </div>
                    </div>
                    <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--secondary-color)" }}>Customers: {stats.users.customers}</span>
                      <span style={{ color: "var(--secondary-color)" }}>Barbers: {stats.users.barbers}</span>
                    </div>
                  </div>

                  <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ color: "var(--secondary-color)", margin: 0, fontSize: "0.9rem" }}>Total Shops</p>
                        <h2 style={{ margin: "0.5rem 0 0 0", color: "var(--primary-color)" }}>{stats.shops.total}</h2>
                      </div>
                      <div style={{ fontSize: "2.5rem", color: "var(--accent-color)", opacity: 0.3 }}>
                        <i className="fas fa-store"></i>
                      </div>
                    </div>
                    <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--success-color)" }}>Active: {stats.shops.active}</span>
                      <span style={{ color: "var(--secondary-color)" }}>Deployed: {stats.shops.deployed}</span>
                    </div>
                  </div>

                  <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ color: "var(--secondary-color)", margin: 0, fontSize: "0.9rem" }}>Total Bookings</p>
                        <h2 style={{ margin: "0.5rem 0 0 0", color: "var(--primary-color)" }}>{stats.bookings.total}</h2>
                      </div>
                      <div style={{ fontSize: "2.5rem", color: "var(--accent-color)", opacity: 0.3 }}>
                        <i className="fas fa-calendar-check"></i>
                      </div>
                    </div>
                    <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--success-color)" }}>Completed: {stats.bookings.byStatus.completed}</span>
                      <span style={{ color: "var(--warning-color)" }}>Pending: {stats.bookings.byStatus.pending}</span>
                    </div>
                  </div>

                  <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "1.5rem", borderRadius: "12px", boxShadow: "var(--shadow)", color: "white" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>Monthly Subscription Revenue</p>
                        <h2 style={{ margin: "0.5rem 0 0 0" }}>{formatCurrency(stats.subscriptions.monthlyRevenue)}</h2>
                      </div>
                      <div style={{ fontSize: "2.5rem", opacity: 0.3 }}>
                        <i className="fas fa-dollar-sign"></i>
                      </div>
                    </div>
                    <div style={{ marginTop: "1rem", fontSize: "0.85rem", opacity: 0.9 }}>
                      {stats.subscriptions.active} active subscriptions
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>

                  <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
                    <h3 style={{ marginTop: 0, color: "var(--primary-color)" }}>Subscriptions</h3>
                    <div style={{ marginTop: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span>Active Subscriptions:</span>
                        <strong>{stats.subscriptions.active}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span>Starter Plans:</span>
                        <strong>{stats.subscriptions.starter}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span>Pro Plans:</span>
                        <strong>{stats.subscriptions.pro}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                        <span>Monthly Revenue:</span>
                        <strong style={{ color: "var(--success-color)" }}>{formatCurrency(stats.subscriptions.monthlyRevenue)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--accent-color)" }}></i>
                <p>Loading statistics...</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            {allUsers ? (
              <div style={{ background: "white", borderRadius: "12px", boxShadow: "var(--shadow)", overflow: "hidden" }}>
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
                  <h3 style={{ margin: 0, color: "var(--primary-color)" }}>All Users ({allUsers.length})</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--light-bg)" }}>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Name</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Email</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Phone</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Type</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user) => (
                        <tr key={user._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "1rem" }}>{user.fullName}</td>
                          <td style={{ padding: "1rem" }}>{user.email}</td>
                          <td style={{ padding: "1rem" }}>{user.phone}</td>
                          <td style={{ padding: "1rem" }}>
                            <span
                              style={{
                                padding: "0.25rem 0.75rem",
                                borderRadius: "12px",
                                fontSize: "0.85rem",
                                background:
                                  user.userType === "admin"
                                    ? "#fee2e2"
                                    : user.userType === "barber"
                                    ? "#dbeafe"
                                    : "#dcfce7",
                                color:
                                  user.userType === "admin"
                                    ? "#dc2626"
                                    : user.userType === "barber"
                                    ? "#2563eb"
                                    : "#16a34a",
                              }}
                            >
                              {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                            </span>
                          </td>
                          <td style={{ padding: "1rem" }}>{new Date(user._creationTime).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--accent-color)" }}></i>
                <p>Loading users...</p>
              </div>
            )}
          </div>
        )}

        {/* Shops Tab */}
        {activeTab === "shops" && (
          <div>
            {allShops ? (
              <div style={{ background: "white", borderRadius: "12px", boxShadow: "var(--shadow)", overflow: "hidden" }}>
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
                  <h3 style={{ margin: 0, color: "var(--primary-color)" }}>All Shops ({allShops.length})</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--light-bg)" }}>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Shop Name</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Owner</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Status</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Subscription</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Bookings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allShops.map((shop) => (
                        <tr key={shop._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "1rem" }}>{shop.name || "N/A"}</td>
                          <td style={{ padding: "1rem" }}>{shop.user?.fullName || "N/A"}</td>
                          <td style={{ padding: "1rem" }}>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              {shop.deployed && (
                                <span style={{ padding: "0.25rem 0.75rem", borderRadius: "12px", fontSize: "0.85rem", background: "#dcfce7", color: "#16a34a" }}>
                                  Deployed
                                </span>
                              )}
                              {shop.onboardingComplete && (
                                <span style={{ padding: "0.25rem 0.75rem", borderRadius: "12px", fontSize: "0.85rem", background: "#dbeafe", color: "#2563eb" }}>
                                  Complete
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            {shop.subscription ? (
                              <span
                                style={{
                                  padding: "0.25rem 0.75rem",
                                  borderRadius: "12px",
                                  fontSize: "0.85rem",
                                  background: shop.subscription.status === "active" ? "#dcfce7" : "#fee2e2",
                                  color: shop.subscription.status === "active" ? "#16a34a" : "#dc2626",
                                }}
                              >
                                {shop.subscription.planType.toUpperCase()} - {shop.subscription.status}
                              </span>
                            ) : (
                              <span style={{ color: "var(--secondary-color)" }}>No subscription</span>
                            )}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <span>{shop.completedBookings || 0} / {shop.totalBookings || 0}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--accent-color)" }}></i>
                <p>Loading shops...</p>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div>
            {allBookings ? (
              <div style={{ background: "white", borderRadius: "12px", boxShadow: "var(--shadow)", overflow: "hidden" }}>
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
                  <h3 style={{ margin: 0, color: "var(--primary-color)" }}>All Bookings ({allBookings.length})</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--light-bg)" }}>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Customer</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Shop</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Date & Time</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Amount</th>
                        <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allBookings.map((booking) => (
                        <tr key={booking._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "1rem" }}>{booking.customer?.fullName || "N/A"}</td>
                          <td style={{ padding: "1rem" }}>{booking.shop?.name || "N/A"}</td>
                          <td style={{ padding: "1rem" }}>
                            {formatDate(booking.appointmentDate)} at {booking.appointmentTime}
                          </td>
                          <td style={{ padding: "1rem" }}>{formatCurrency(booking.totalPrice)}</td>
                          <td style={{ padding: "1rem" }}>
                            <span
                              style={{
                                padding: "0.25rem 0.75rem",
                                borderRadius: "12px",
                                fontSize: "0.85rem",
                                background:
                                  booking.status === "completed"
                                    ? "#dcfce7"
                                    : booking.status === "confirmed"
                                    ? "#dbeafe"
                                    : booking.status === "pending"
                                    ? "#fef3c7"
                                    : "#fee2e2",
                                color:
                                  booking.status === "completed"
                                    ? "#16a34a"
                                    : booking.status === "confirmed"
                                    ? "#2563eb"
                                    : booking.status === "pending"
                                    ? "#d97706"
                                    : "#dc2626",
                              }}
                            >
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--accent-color)" }}></i>
                <p>Loading bookings...</p>
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === "earnings" && (
          <div>
            {stats ? (
              <div style={{ display: "grid", gap: "1.5rem" }}>

                <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
                  <h3 style={{ marginTop: 0, color: "var(--primary-color)" }}>Subscription Revenue</h3>
                  <div style={{ marginTop: "1.5rem" }}>
                    <p style={{ fontSize: "1.5rem", margin: 0 }}>
                      <strong style={{ color: "var(--accent-color)" }}>{formatCurrency(stats.subscriptions.monthlyRevenue)}</strong>
                      <span style={{ color: "var(--secondary-color)", fontSize: "1rem", marginLeft: "0.5rem" }}> /month</span>
                    </p>
                    <div style={{ marginTop: "1rem", display: "flex", gap: "2rem" }}>
                      <div>
                        <span style={{ color: "var(--secondary-color)" }}>Starter Plans: </span>
                        <strong>{stats.subscriptions.starter}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--secondary-color)" }}>Pro Plans: </span>
                        <strong>{stats.subscriptions.pro}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--accent-color)" }}></i>
                <p>Loading earnings...</p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

