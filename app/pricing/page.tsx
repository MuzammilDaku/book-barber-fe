"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useUserStore } from "@/store/user";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import toast from "react-hot-toast";

interface StripePrice {
  priceId: string;
  amount: number;
  currency: string;
  interval: string;
}

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  const { data: session } = authClient.useSession();
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stripePrices, setStripePrices] = useState<{
    starter: StripePrice | null;
    pro: StripePrice | null;
  }>({ starter: null, pro: null });
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [hasShownToast, setHasShownToast] = useState(false);

  // Fetch prices from Stripe
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch("/api/stripe/prices");
        const data = await response.json();
        setStripePrices(data);
      } catch (error) {
        console.error("Error fetching prices:", error);
        // Set fallback values
        setStripePrices({
          starter: { priceId: "", amount: 10, currency: "usd", interval: "month" },
          pro: { priceId: "", amount: 25, currency: "usd", interval: "month" },
        });
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, []);

  // Handle Stripe redirect - only show toast once
  useEffect(() => {
    if (hasShownToast) return;
    
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success) {
      toast.success("Subscription activated successfully!");
      setHasShownToast(true);
      // Clean URL without redirect
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (canceled) {
      toast.error("Subscription was canceled");
      setHasShownToast(true);
      // Clean URL without redirect
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, hasShownToast]);

  const subscription = useQuery(
    api.functions.subscriptions.queries.getSubscription,
    user?._id ? { userId: user._id } : "skip"
  );

  const handleSubscribe = async (planType: "starter" | "pro") => {
    if (!session || !user) {
      toast.error("Please login to subscribe");
      router.push("/login");
      return;
    }

    if (user.userType !== "barber") {
      toast.error("Only barbers can subscribe to plans");
      return;
    }

    setIsLoading(true);
    setSelectedPlan(planType);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType,
          userId: user._id,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        setIsLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create checkout session");
      setIsLoading(false);
    }
  };

  const plans = [
    {
      name: "Starter",
      price: stripePrices.starter?.amount || 10,
      planType: "starter" as const,
      description: "Perfect for new barbers",
      features: [
        "Book appointments up to 1 week in advance",
        "100 appointments per month",
        "Basic shop management",
        "Customer booking management",
        "Service management",
        "Opening hours setup",
        "Email support",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: stripePrices.pro?.amount || 25,
      planType: "pro" as const,
      description: "For established barbers",
      features: [
        "Book appointments up to 1 month in advance",
        "500 appointments per month",
        "All Starter features",
        "Advanced analytics",
        "Priority customer support",
        "Featured listing in search",
        "Custom branding options",
      ],
      popular: true,
    },
  ];

  const isSubscribed = subscription && subscription.status === "active";
  const currentPlan = subscription?.planType;

  return (
    <>
      <Header />
      <section className="pricing-section" style={{ padding: "4rem 0", minHeight: "80vh" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "var(--primary-color)" }}>
              Choose Your Plan
            </h1>
            <p style={{ fontSize: "1.2rem", color: "var(--secondary-color)", maxWidth: "600px", margin: "0 auto" }}>
              Select the perfect plan for your barber shop. Upgrade or downgrade at any time.
            </p>
            {loadingPrices && (
              <div style={{ marginTop: "1rem", color: "var(--secondary-color)" }}>
                <i className="fas fa-spinner fa-spin"></i> Loading prices...
              </div>
            )}
          </div>

          {isSubscribed && (
            <div
              style={{
                background: "var(--accent-gradient)",
                color: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                marginBottom: "2rem",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(99, 102, 241, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <i className="fas fa-check-circle" style={{ fontSize: "1.5rem" }}></i>
                <h3 style={{ margin: 0, fontSize: "1.3rem" }}>
                  Active Subscription - <strong>{currentPlan === "starter" ? "Starter" : "Pro"}</strong> Plan
                </h3>
              </div>
              <p style={{ opacity: 0.95, fontSize: "0.95rem", margin: 0 }}>
                Your subscription is active until{" "}
                <strong>{new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}</strong>
              </p>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan === plan.planType && isSubscribed;
              const isDisabled = isLoading && selectedPlan !== plan.planType || (isSubscribed && !isCurrentPlan);

              return (
                <div
                  key={plan.planType}
                  style={{
                    background: isCurrentPlan
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)"
                      : plan.popular
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : isSubscribed && !isCurrentPlan
                      ? "var(--light-bg)"
                      : "white",
                    color: plan.popular && !isSubscribed ? "white" : "var(--text-color)",
                    borderRadius: "15px",
                    padding: "2.5rem",
                    boxShadow: isCurrentPlan
                      ? "0 10px 40px rgba(16, 185, 129, 0.2)"
                      : plan.popular
                      ? "0 10px 40px rgba(102, 126, 234, 0.3)"
                      : isSubscribed && !isCurrentPlan
                      ? "0 2px 10px rgba(0, 0, 0, 0.05)"
                      : "0 5px 20px rgba(0, 0, 0, 0.1)",
                    border: isCurrentPlan
                      ? "2px solid var(--success-color)"
                      : plan.popular
                      ? "none"
                      : isSubscribed && !isCurrentPlan
                      ? "2px solid var(--border-color)"
                      : "2px solid #e0e0e0",
                    position: "relative",
                    transform: plan.popular && !isSubscribed ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.3s ease",
                    opacity: isSubscribed && !isCurrentPlan ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!plan.popular && !isSubscribed) {
                      e.currentTarget.style.transform = "scale(1.02)";
                      e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!plan.popular && !isSubscribed) {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 5px 20px rgba(0, 0, 0, 0.1)";
                    }
                  }}
                >
                  {plan.popular && !isCurrentPlan && !isSubscribed && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-15px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#ffd700",
                        color: "#333",
                        padding: "0.5rem 1.5rem",
                        borderRadius: "20px",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
                      }}
                    >
                      MOST POPULAR
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-15px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--success-color)",
                        color: "white",
                        padding: "0.5rem 1.5rem",
                        borderRadius: "20px",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <i className="fas fa-check-circle"></i>
                      PLAN PURCHASED
                    </div>
                  )}
                  {isSubscribed && !isCurrentPlan && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-15px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--secondary-color)",
                        color: "white",
                        padding: "0.5rem 1.5rem",
                        borderRadius: "20px",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        opacity: 0.7,
                      }}
                    >
                      NOT AVAILABLE
                    </div>
                  )}

                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{plan.name}</h2>
                    <p style={{ opacity: plan.popular ? 0.9 : 0.7, marginBottom: "1.5rem" }}>
                      {plan.description}
                    </p>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "3rem", fontWeight: "bold" }}>
                        {loadingPrices ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          `$${plan.price}`
                        )}
                      </span>
                      <span style={{ opacity: plan.popular ? 0.9 : 0.7 }}>/month</span>
                    </div>
                  </div>

                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      marginBottom: "2rem",
                    }}
                  >
                    {plan.features.map((feature, index) => {
                      const isCurrentPlanFeature = isCurrentPlan;
                      const borderColor = plan.popular 
                        ? "rgba(255,255,255,0.1)" 
                        : isCurrentPlanFeature
                        ? "rgba(16, 185, 129, 0.2)"
                        : "var(--border-color)";
                      
                      return (
                        <li
                          key={index}
                          style={{
                            padding: "0.75rem 0",
                            borderBottom: index < plan.features.length - 1 ? `1px solid ${borderColor}` : "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <i
                            className="fas fa-check-circle"
                            style={{
                              color: isCurrentPlanFeature
                                ? "var(--success-color)"
                                : plan.popular 
                                ? "#ffd700" 
                                : "var(--accent-color)",
                              fontSize: "1.2rem",
                              flexShrink: 0,
                            }}
                          ></i>
                          <span style={{ 
                            color: isCurrentPlanFeature && !plan.popular ? "var(--primary-color)" : undefined,
                            fontWeight: isCurrentPlanFeature ? 500 : 400,
                          }}>{feature}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    onClick={() => {
                      if (!isSubscribed || !isCurrentPlan) {
                        handleSubscribe(plan.planType);
                      }
                    }}
                    disabled={isDisabled || isCurrentPlan || false}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      borderRadius: "10px",
                      border: isCurrentPlan ? "2px solid var(--success-color)" : "none",
                      cursor: isDisabled || isCurrentPlan ? "not-allowed" : "pointer",
                      background: isCurrentPlan
                        ? "var(--success-color)"
                        : isSubscribed && !isCurrentPlan
                        ? "var(--light-bg)"
                        : plan.popular
                        ? "white"
                        : "var(--accent-gradient)",
                      color: isCurrentPlan
                        ? "white"
                        : isSubscribed && !isCurrentPlan
                        ? "var(--secondary-color)"
                        : plan.popular
                        ? "var(--accent-color)"
                        : "white",
                      opacity: (isDisabled || (isSubscribed && !isCurrentPlan)) ? 0.6 : 1,
                      transition: "all 0.3s ease",
                      boxShadow: isCurrentPlan 
                        ? "0 4px 15px rgba(16, 185, 129, 0.3)"
                        : isSubscribed && !isCurrentPlan
                        ? "none"
                        : plan.popular
                        ? "0 4px 15px rgba(255, 255, 255, 0.2)"
                        : "0 4px 15px rgba(99, 102, 241, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled && !isCurrentPlan && !isSubscribed) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = plan.popular
                          ? "0 6px 20px rgba(255, 255, 255, 0.3)"
                          : "0 6px 20px rgba(99, 102, 241, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDisabled && !isCurrentPlan && !isSubscribed) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = plan.popular
                          ? "0 4px 15px rgba(255, 255, 255, 0.2)"
                          : "0 4px 15px rgba(99, 102, 241, 0.3)";
                      }
                    }}
                  >
                    {isCurrentPlan ? (
                      <>
                        <i className="fas fa-check-circle"></i> Plan Purchased
                      </>
                    ) : isSubscribed && !isCurrentPlan ? (
                      <>
                        <i className="fas fa-lock"></i> Already Subscribed
                      </>
                    ) : isLoading && selectedPlan === plan.planType ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Processing...
                      </>
                    ) : (
                      <>
                        Get Started <i className="fas fa-arrow-right"></i>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: "3rem", color: "var(--secondary-color)" }}>
            <p>
              <i className="fas fa-shield-alt"></i> Secure payment powered by Stripe
            </p>
            <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Cancel anytime. No hidden fees.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

