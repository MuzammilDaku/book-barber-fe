"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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

interface BarberOnboardingProps {
  userId: Id<"users">;
  onComplete: () => void;
}

export default function BarberOnboarding({ userId, onComplete }: BarberOnboardingProps) {
  const router = useRouter();
  
  // Check subscription status first
  const subscription = useQuery(
    api.functions.subscriptions.queries.getSubscription,
    { userId }
  );

  // Determine initial step based on subscription
  const isSubscribed = subscription && subscription.status === "active";
  const [currentStep, setCurrentStep] = useState(isSubscribed ? 1 : 0); // 0 = pricing, 1 = shop details
  const totalSteps = isSubscribed ? 4 : 5; // 5 if not subscribed (includes pricing), 4 if subscribed

  // Step 1: Shop Details (or Step 2 if pricing is first)
  const [shopDetails, setShopDetails] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
    experience: 0,
    image: "",
  });

  // Step 2: Services
  const [services, setServices] = useState<
    Array<{
      name: string;
      description: string;
      price: number;
      duration: number;
    }>
  >([]);
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);

  // Step 3: Opening Hours
  const [hours, setHours] = useState<Record<number, { openingTime: string; closingTime: string; isClosed: boolean }>>(
    {}
  );

  // Initialize hours
  useEffect(() => {
    const defaultHours: Record<number, { openingTime: string; closingTime: string; isClosed: boolean }> = {};
    DAYS_OF_WEEK.forEach((day) => {
      defaultHours[day.value] = {
        openingTime: "09:00",
        closingTime: "18:00",
        isClosed: day.value === 0, // Closed on Sunday by default
      };
    });
    setHours(defaultHours);
  }, []);

  const updateShop = useMutation(api.functions.barbers.mutations.updateShop);
  const addService = useMutation(api.functions.barbers.mutations.addService);
  const setAllOpeningHours = useMutation(api.functions.barbers.mutations.setAllOpeningHours);
  const completeOnboarding = useMutation(api.functions.barbers.mutations.completeOnboarding);
  const generateUploadUrl = useMutation(api.functions.storage.mutations.generateUploadUrl);
  const getStorageUrl = useMutation(api.functions.storage.mutations.getStorageUrl);

  // Fetch existing services to avoid duplicates
  const existingServices = useQuery(
    api.functions.barbers.queries.getServices,
    { userId }
  );
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Update step when subscription status changes
  useEffect(() => {
    if (subscription && subscription.status === "active" && currentStep === 0) {
      setCurrentStep(1); // Move to shop details after subscription
    }
  }, [subscription, currentStep]);

  const handleNext = async () => {
    if (currentStep === 0) {
      // Pricing step - check if subscribed
      if (!subscription || subscription.status !== "active") {
        toast.error("Please subscribe to a plan to continue");
        router.push("/pricing");
        return;
      }
      setCurrentStep(1); // Move to shop details
    } else if (currentStep === 1) {
      // Validate shop details
      if (!shopDetails.name || !shopDetails.address) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      // Validate and upload image
      if (!imageFile) {
        toast.error("Please upload a shop image");
        return;
      }

      setIsUploading(true);
      try {
        // Generate upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Upload file to Convex storage
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        
        const { storageId } = await uploadResult.json();
        
        if (!storageId) {
          throw new Error("Failed to upload image");
        }
        
        // Get the storage URL from Convex
        const imageUrl = await getStorageUrl({ storageId });
        
        if (!imageUrl) {
          throw new Error("Failed to get image URL");
        }
        
        // Update shop with image URL
        await updateShop({
          userId,
          ...shopDetails,
          experience: Number(shopDetails.experience) || 0,
          image: imageUrl,
        });
        
        setIsUploading(false);
        toast.success("Shop details saved successfully!");
        setCurrentStep(2);
      } catch (error) {
        setIsUploading(false);
        toast.error("Failed to upload image. Please try again.");
        console.error(error);
      }
    } else if (currentStep === 2) {
      // Validate services - at least one service required
      if (services.length === 0) {
        toast.error("Please add at least one service");
        return;
      }
      try {
        // Get existing service names to avoid duplicates
        const existingServiceNames = new Set((existingServices || []).map(s => s.name.toLowerCase()));
        
        // Filter out services that already exist
        const newServices = services.filter(service => 
          !existingServiceNames.has(service.name.toLowerCase())
        );

        if (newServices.length === 0) {
          // All services already exist, just proceed
          toast.success("Services already saved!");
          setCurrentStep(3);
          return;
        }

        // Add only new services
        for (const service of newServices) {
          await addService({
            userId,
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
          });
        }
        toast.success(`${newServices.length} service${newServices.length > 1 ? 's' : ''} saved successfully!`);
        setCurrentStep(3); // Move to opening hours
      } catch (error: any) {
        console.error("Error saving services:", error);
        toast.error(error?.message || "Failed to save services. Please try again.");
      }
    } else if (currentStep === 3) {
      // Validate hours
      try {
        const hoursArray = DAYS_OF_WEEK.map((day) => ({
          dayOfWeek: day.value,
          ...hours[day.value],
        }));
        await setAllOpeningHours({
          userId,
          hours: hoursArray,
        });
        toast.success("Opening hours saved successfully!");
        // Move to review (or pricing if not subscribed)
        if (isSubscribed) {
          setCurrentStep(4); // Review step (step 4 when subscribed, totalSteps = 4)
        } else {
          setCurrentStep(4); // Pricing step (step 4 when not subscribed, totalSteps = 5)
        }
      } catch (error) {
        toast.error("Failed to save opening hours");
        console.error(error);
      }
    } else if (currentStep === 4 && !isSubscribed) {
      // Pricing step (last step if not subscribed) - check if subscribed
      if (!subscription || subscription.status !== "active") {
        toast.error("Please subscribe to a plan to continue");
        router.push("/pricing");
        return;
      }
      // If subscription becomes active, move to review (step 5 when not subscribed, but we'll use step 4 for review when subscribed)
      // Actually, if subscribed, step 4 is already review, so we don't need to move
    }
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding({ userId });
      toast.success("Onboarding completed successfully!");
      onComplete();
    } catch (error) {
      toast.error("Failed to complete onboarding");
    }
  };

  const handleAddPredefinedService = (service: typeof PREDEFINED_SERVICES[0]) => {
    if (services.some((s) => s.name === service.name)) {
      toast.error("Service already added");
      return;
    }
    setServices([
      ...services,
      {
        name: service.name,
        description: service.description,
        price: service.defaultPrice,
        duration: service.defaultDuration,
      },
    ]);
    toast.success(`${service.name} added!`);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
    if (editingServiceIndex === index) {
      setEditingServiceIndex(null);
    } else if (editingServiceIndex !== null && editingServiceIndex > index) {
      setEditingServiceIndex(editingServiceIndex - 1);
    }
  };

  const handleEditService = (index: number) => {
    setEditingServiceIndex(index);
  };

  const handleUpdateService = (index: number, field: string, value: string | number) => {
    const updatedServices = [...services];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value,
    };
    setServices(updatedServices);
  };

  const handleSaveServiceEdit = (index: number) => {
    setEditingServiceIndex(null);
  };

  const handleAddCustomService = () => {
    const name = prompt("Enter service name:");
    if (!name) return;
    const price = prompt("Enter price (Rs.):");
    const duration = prompt("Enter duration (minutes):");
    if (price && duration) {
      setServices([
        ...services,
        {
          name,
          description: "",
          price: Number(price),
          duration: Number(duration),
        },
      ]);
      toast.success("Service added!");
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "800px", width: "100%", backgroundColor: "var(--white)", borderRadius: "12px", boxShadow: "var(--shadow)", padding: "3rem" }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            {[...Array(totalSteps)].map((_, index) => {
              const stepNumber = isSubscribed ? index + 1 : index; // Adjust for step 0
              const isCompleted = stepNumber <= currentStep;
              return (
                <div
                  key={index}
                  style={{
                    width: "100%",
                    height: "4px",
                    backgroundColor: isCompleted ? "var(--accent-color)" : "var(--border-color)",
                    marginRight: index < totalSteps - 1 ? "0.5rem" : "0",
                    borderRadius: "2px",
                    transition: "all 0.3s",
                  }}
                />
              );
            })}
          </div>
          <div style={{ textAlign: "center", fontSize: "1.2rem", fontWeight: "600", color: "var(--primary-color)" }}>
            Step {currentStep === 0 ? 1 : currentStep} of {totalSteps}
          </div>
        </div>

        {/* Step 0: Pricing (First step if not subscribed) */}
        {currentStep === 0 && (
          <div>
            <h2 style={{ marginBottom: "2rem", color: "var(--primary-color)", textAlign: "center" }}>
              <i className="fas fa-credit-card" style={{ color: "var(--accent-color)", fontSize: "3rem", display: "block", marginBottom: "1rem" }}></i>
              Subscribe to Get Started
            </h2>
            <div
              style={{
                padding: "2rem",
                backgroundColor: "var(--light-bg)",
                borderRadius: "12px",
                marginBottom: "2rem",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--primary-color)", fontWeight: "500" }}>
                A subscription is required to set up your shop and start receiving bookings.
              </p>
              <p style={{ fontSize: "1rem", marginBottom: "2rem", color: "var(--secondary-color)" }}>
                Subscribe now, then complete your shop details. You won't need to come back and enter details again!
              </p>
              {subscription && subscription.status === "active" ? (
                <div style={{ padding: "1.5rem", background: "var(--accent-gradient)", borderRadius: "10px", color: "white" }}>
                  <i className="fas fa-check-circle" style={{ fontSize: "3rem", marginBottom: "1rem" }}></i>
                  <h3 style={{ marginBottom: "0.5rem" }}>Active Subscription</h3>
                  <p>You're on the <strong>{subscription.planType === "starter" ? "Starter" : "Pro"}</strong> plan</p>
                  <p style={{ fontSize: "0.9rem", opacity: 0.9, marginTop: "0.5rem" }}>
                    Valid until {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div style={{ padding: "2rem" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push("/pricing")}
                    style={{ 
                      padding: "1.25rem 3rem", 
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      borderRadius: "12px",
                    }}
                  >
                    <i className="fas fa-arrow-right"></i> Choose Your Plan
                  </button>
                  <p style={{ fontSize: "0.9rem", color: "var(--secondary-color)", marginTop: "1rem" }}>
                    After subscribing, you'll return here to complete your shop setup
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Shop Details */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ marginBottom: "2rem", color: "var(--primary-color)" }}>Shop Information</h2>
            <div style={{ display: "grid", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Shop Name <span style={{ color: "var(--danger-color)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={shopDetails.name}
                  onChange={(e) => setShopDetails({ ...shopDetails, name: e.target.value })}
                  placeholder="e.g., Royal Cuts Barbershop"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Address <span style={{ color: "var(--danger-color)" }}>*</span>
                </label>
                <textarea
                  value={shopDetails.address}
                  onChange={(e) => setShopDetails({ ...shopDetails, address: e.target.value })}
                  placeholder="Full shop address"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    minHeight: "100px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Phone Number</label>
                <input
                  type="tel"
                  value={shopDetails.phone}
                  onChange={(e) => setShopDetails({ ...shopDetails, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Description</label>
                <textarea
                  value={shopDetails.description}
                  onChange={(e) => setShopDetails({ ...shopDetails, description: e.target.value })}
                  placeholder="Tell customers about your shop..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    minHeight: "100px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Experience (Years)</label>
                  <input
                    type="number"
                    value={shopDetails.experience}
                    onChange={(e) => setShopDetails({ ...shopDetails, experience: Number(e.target.value) || 0 })}
                    placeholder="5"
                    min="0"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                    Shop Image <span style={{ color: "var(--danger-color)" }}>*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      fontSize: "1rem",
                    }}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: "1rem" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "200px",
                          borderRadius: "8px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                  {!imageFile && (
                    <p style={{ fontSize: "0.85rem", color: "var(--secondary-color)", marginTop: "0.5rem" }}>
                      Please upload a shop image (Max 5MB)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Services */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ marginBottom: "1rem", color: "var(--primary-color)" }}>Add Services & Pricing</h2>
            <p style={{ marginBottom: "2rem", color: "var(--secondary-color)" }}>
              Add services you offer. You can add predefined services or create custom ones.
            </p>

            {/* Predefined Services */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Predefined Services</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "1rem",
                  marginBottom: "2rem",
                }}
              >
                {PREDEFINED_SERVICES.map((service) => {
                  const exists = services.some((s) => s.name === service.name);
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
                      <h4 style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>{service.name}</h4>
                      <p style={{ fontSize: "0.8rem", color: "var(--light-text)", marginBottom: "0.5rem" }}>
                        {service.description}
                      </p>
                      <p style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                        Rs. {service.defaultPrice} • {service.defaultDuration} min
                      </p>
                      {exists ? (
                        <button className="btn btn-outline" disabled style={{ width: "100%", fontSize: "0.85rem" }}>
                          Added
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAddPredefinedService(service)}
                          style={{ width: "100%", fontSize: "0.85rem" }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button className="btn btn-outline" onClick={handleAddCustomService} style={{ width: "100%" }}>
                <i className="fas fa-plus"></i> Add Custom Service
              </button>
            </div>

            {/* Selected Services */}
            {services.length > 0 && (
              <div>
                <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Your Services ({services.length})</h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {services.map((service, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "1.5rem",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        backgroundColor: "var(--white)",
                      }}
                    >
                      {editingServiceIndex === index ? (
                        <div style={{ display: "grid", gap: "1rem" }}>
                          <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>
                              Service Name
                            </label>
                            <input
                              type="text"
                              value={service.name}
                              onChange={(e) => handleUpdateService(index, "name", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "0.5rem",
                                border: "1px solid var(--border-color)",
                                borderRadius: "4px",
                                fontSize: "0.9rem",
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>
                              Description
                            </label>
                            <textarea
                              value={service.description || ""}
                              onChange={(e) => handleUpdateService(index, "description", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "0.5rem",
                                border: "1px solid var(--border-color)",
                                borderRadius: "4px",
                                fontSize: "0.9rem",
                                minHeight: "60px",
                                resize: "vertical",
                              }}
                            />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>
                                Price (Rs.)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={service.price}
                                onChange={(e) => handleUpdateService(index, "price", Number(e.target.value) || 0)}
                                style={{
                                  width: "100%",
                                  padding: "0.5rem",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "4px",
                                  fontSize: "0.9rem",
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>
                                Duration (min)
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={service.duration}
                                onChange={(e) => handleUpdateService(index, "duration", Number(e.target.value) || 1)}
                                style={{
                                  width: "100%",
                                  padding: "0.5rem",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "4px",
                                  fontSize: "0.9rem",
                                }}
                              />
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSaveServiceEdit(index)}
                              style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={() => setEditingServiceIndex(null)}
                              style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "1rem" }}>{service.name}</strong>
                            {service.description && (
                              <div style={{ fontSize: "0.85rem", color: "var(--secondary-color)", marginTop: "0.25rem" }}>
                                {service.description}
                              </div>
                            )}
                            <div style={{ fontSize: "0.95rem", color: "var(--primary-color)", marginTop: "0.5rem", fontWeight: "600" }}>
                              Rs. {service.price || 0} • {service.duration || 0} min
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleEditService(index)}
                              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleRemoveService(index)}
                              style={{ padding: "0.5rem 1rem", color: "var(--danger-color)", fontSize: "0.85rem" }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Opening Hours */}
        {currentStep === 3 && (
          <div>
            <h2 style={{ marginBottom: "2rem", color: "var(--primary-color)" }}>Opening Hours</h2>
            <p style={{ marginBottom: "2rem", color: "var(--secondary-color)" }}>
              Set your shop's opening hours for each day of the week.
            </p>

            <div style={{ display: "grid", gap: "1rem" }}>
              {DAYS_OF_WEEK.map((day) => {
                const dayHours = hours[day.value];
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
                        onChange={(e) =>
                          setHours({
                            ...hours,
                            [day.value]: { ...dayHours, isClosed: e.target.checked },
                          })
                        }
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <span>Closed</span>
                    </label>
                    {!dayHours.isClosed && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <label style={{ fontSize: "0.9rem", color: "var(--secondary-color)" }}>Open:</label>
                          <input
                            type="time"
                            value={dayHours.openingTime}
                            onChange={(e) =>
                              setHours({
                                ...hours,
                                [day.value]: { ...dayHours, openingTime: e.target.value },
                              })
                            }
                            style={{
                              padding: "0.5rem",
                              border: "1px solid var(--border-color)",
                              borderRadius: "4px",
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <label style={{ fontSize: "0.9rem", color: "var(--secondary-color)" }}>Close:</label>
                          <input
                            type="time"
                            value={dayHours.closingTime}
                            onChange={(e) =>
                              setHours({
                                ...hours,
                                [day.value]: { ...dayHours, closingTime: e.target.value },
                              })
                            }
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
        )}

        {/* Step 4: Pricing (Last step if not subscribed) */}
        {currentStep === 4 && !isSubscribed && (
          <div>
            <h2 style={{ marginBottom: "2rem", color: "var(--primary-color)", textAlign: "center" }}>
              <i className="fas fa-credit-card" style={{ color: "var(--accent-color)", fontSize: "3rem", display: "block", marginBottom: "1rem" }}></i>
              Complete Your Subscription
            </h2>
            <div
              style={{
                padding: "2rem",
                backgroundColor: "var(--light-bg)",
                borderRadius: "12px",
                marginBottom: "2rem",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "1.1rem", marginBottom: "2rem", color: "var(--primary-color)" }}>
                Almost done! Subscribe to complete your shop setup and start receiving bookings.
              </p>
              {subscription && subscription.status === "active" ? (
                <div style={{ padding: "1.5rem", background: "var(--accent-gradient)", borderRadius: "10px", color: "white" }}>
                  <i className="fas fa-check-circle" style={{ fontSize: "3rem", marginBottom: "1rem" }}></i>
                  <h3 style={{ marginBottom: "0.5rem" }}>Active Subscription</h3>
                  <p>You're on the <strong>{subscription.planType === "starter" ? "Starter" : "Pro"}</strong> plan</p>
                </div>
              ) : (
                <div style={{ padding: "2rem" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push("/pricing")}
                    style={{ 
                      padding: "1.25rem 3rem", 
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      borderRadius: "12px",
                    }}
                  >
                    <i className="fas fa-arrow-right"></i> Subscribe Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 or 4: Review */}
        {(currentStep === 3 || (currentStep === 4 && isSubscribed)) && (
          <div>
            <h2 style={{ marginBottom: "2rem", color: "var(--primary-color)", textAlign: "center" }}>
              <i className="fas fa-check-circle" style={{ color: "var(--accent-color)", fontSize: "3rem", display: "block", marginBottom: "1rem" }}></i>
              Almost There!
            </h2>
            <div
              style={{
                padding: "2rem",
                backgroundColor: "var(--light-bg)",
                borderRadius: "8px",
                marginBottom: "2rem",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
                Your barbershop profile is ready! Complete the setup to start receiving bookings.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "2rem", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <i className="fas fa-store" style={{ fontSize: "2rem", color: "var(--accent-color)", marginBottom: "0.5rem" }}></i>
                  <div style={{ fontWeight: "600" }}>Shop Details</div>
                  <div style={{ fontSize: "0.9rem", color: "var(--secondary-color)" }}>✓ Completed</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <i className="fas fa-list-alt" style={{ fontSize: "2rem", color: "var(--accent-color)", marginBottom: "0.5rem" }}></i>
                  <div style={{ fontWeight: "600" }}>{services.length} Services</div>
                  <div style={{ fontSize: "0.9rem", color: "var(--secondary-color)" }}>✓ Added</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <i className="fas fa-clock" style={{ fontSize: "2rem", color: "var(--accent-color)", marginBottom: "0.5rem" }}></i>
                  <div style={{ fontWeight: "600" }}>Opening Hours</div>
                  <div style={{ fontSize: "0.9rem", color: "var(--secondary-color)" }}>✓ Set</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <i className="fas fa-credit-card" style={{ fontSize: "2rem", color: "var(--accent-color)", marginBottom: "0.5rem" }}></i>
                  <div style={{ fontWeight: "600" }}>Subscription</div>
                  <div style={{ fontSize: "0.9rem", color: "var(--secondary-color)" }}>✓ Active</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3rem", gap: "1rem" }}>
          {currentStep > (isSubscribed ? 1 : 0) && (
            <button className="btn btn-outline" onClick={() => setCurrentStep(currentStep - 1)} style={{ padding: "0.75rem 2rem" }}>
              <i className="fas fa-arrow-left"></i> Previous
            </button>
          )}
          <div style={{ flex: 1 }} />
          {(currentStep < totalSteps - 1 || (currentStep === 4 && !isSubscribed)) ? (
            <button 
              className="btn btn-primary" 
              onClick={handleNext} 
              disabled={isUploading}
              style={{ padding: "0.75rem 2rem", opacity: isUploading ? 0.6 : 1, cursor: isUploading ? "not-allowed" : "pointer" }}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Uploading...
                </>
              ) : currentStep === 0 ? (
                <>
                  {subscription && subscription.status === "active" ? (
                    <>
                      Continue <i className="fas fa-arrow-right"></i>
                    </>
                  ) : (
                    <>
                      Subscribe to Continue <i className="fas fa-arrow-right"></i>
                    </>
                  )}
                </>
              ) : (
                <>
                  Next <i className="fas fa-arrow-right"></i>
                </>
              )}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleComplete} style={{ padding: "0.75rem 2rem" }}>
              <i className="fas fa-check"></i> Complete Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

