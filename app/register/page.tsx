"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "convex/react";
import toast from "react-hot-toast";
import { api } from "@/convex/_generated/api";

export default function RegisterPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<"customer" | "barber">("customer");
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const createUser = useMutation(api.functions.users.mutations.createUser);

  const showError = (field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let isValid = true;

    if (!formData.fullname) {
      showError("fullname", "Please enter your full name");
      isValid = false;
    } else {
      clearError("fullname");
    }

    if (!formData.email || !formData.email.includes("@")) {
      showError("email", "Please enter a valid email address");
      isValid = false;
    } else {
      clearError("email");
    }

    if (!formData.phone) {
      showError("phone", "Please enter your phone number");
      isValid = false;
    } else {
      clearError("phone");
    }

    if (!formData.password || formData.password.length < 6) {
      showError("password", "Password must be at least 6 characters");
      isValid = false;
    } else {
      clearError("password");
    }

    if (formData.password !== formData.confirmPassword) {
      showError("confirmPassword", "Passwords do not match");
      isValid = false;
    } else {
      clearError("confirmPassword");
    }

    if (isValid) {
      setIsLoading(true);
      try {
        // First, sign up with email using Better Auth
        const signupResult = await authClient.signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.fullname,
        });

        if (signupResult.error) {
          toast.error(signupResult.error.message || "Signup failed");
          showError("email", signupResult.error.message || "Signup failed");
          setIsLoading(false);
          return;
        }

        // If signup successful, create user record in users table
        try {
          await createUser({
            fullName: formData.fullname,
            email: formData.email,
            phone: formData.phone,
            userType: userType,
          });

          toast.success("Account created successfully!");
          router.push("/");
        } catch (userError: any) {
          toast.error(userError.message || "Failed to create user profile");
          showError(
            "email",
            userError.message || "Failed to create user profile"
          );
          setIsLoading(false);
        }
      } catch (error: any) {
        toast.error(error.message || "An error occurred during signup");
        showError("email", error.message || "An error occurred during signup");
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <Header />

      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-form-container">
            <h2>Create Your Account</h2>
            <p>Join BookMyBarber to discover the best barbers near you</p>

            <div className="user-type-toggle">
              <button
                type="button"
                className={`user-type-btn ${
                  userType === "customer" ? "active" : ""
                }`}
                onClick={() => setUserType("customer")}
              >
                Customer
              </button>
              <button
                type="button"
                className={`user-type-btn ${
                  userType === "barber" ? "active" : ""
                }`}
                onClick={() => setUserType("barber")}
              >
                Barber
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullname">Full Name</label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  placeholder="Enter your full name"
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                  className={errors.fullname ? "error" : ""}
                  required
                />
                {errors.fullname && (
                  <div className="error-message">{errors.fullname}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={errors.email ? "error" : ""}
                  required
                />
                {errors.email && (
                  <div className="error-message">{errors.email}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={errors.phone ? "error" : ""}
                  required
                />
                {errors.phone && (
                  <div className="error-message">{errors.phone}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={errors.password ? "error" : ""}
                  required
                />
                {errors.password && (
                  <div className="error-message">{errors.password}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="confirm-password"
                  name="confirm-password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={errors.confirmPassword ? "error" : ""}
                  required
                />
                {errors.confirmPassword && (
                  <div className="error-message">{errors.confirmPassword}</div>
                )}
              </div>

              <div className="form-group checkbox">
                <input type="checkbox" id="terms" name="terms" required />
                <label htmlFor="terms">
                  I agree to the <a href="#">Terms of Service</a> and{" "}
                  <a href="#">Privacy Policy</a>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="auth-switch">
              <p>
                Already have an account? <Link href="/login">Login</Link>
              </p>
            </div>
          </div>
          <div className="auth-image">
            <Image
              src="/images/register-side.jpg"
              alt="Register"
              width={500}
              height={600}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
