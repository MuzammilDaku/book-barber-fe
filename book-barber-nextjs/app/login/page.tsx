'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const showError = (field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as keyof typeof newErrors];
      return newErrors;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    let isValid = true;

    if (!email || !email.includes('@')) {
      showError('email', 'Please enter a valid email address');
      isValid = false;
    } else {
      clearError('email');
    }

    if (!password || password.length < 6) {
      showError('password', 'Password must be at least 6 characters');
      isValid = false;
    } else {
      clearError('password');
    }

    if (isValid) {
      setIsLoading(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  };

  return (
    <>
      <Header />
      
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-form-container">
            <h2>Welcome Back</h2>
            <p>Log in to your BookMyBarber account</p>
            
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'error' : ''}
                  required
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'error' : ''}
                  required
                />
                {errors.password && <div className="error-message">{errors.password}</div>}
                <div className="forgot-password">
                  <a href="#">Forgot Password?</a>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            
            <div className="social-login">
              <p>Or login with</p>
              <div className="social-buttons">
                <button className="social-btn google">
                  <i className="fab fa-google"></i> Google
                </button>
                <button className="social-btn facebook">
                  <i className="fab fa-facebook-f"></i> Facebook
                </button>
              </div>
            </div>
            
            <div className="auth-switch">
              <p>Don't have an account? <Link href="/register">Sign Up</Link></p>
            </div>
          </div>
          <div className="auth-image">
            <Image src="/images/register-side.jpg" alt="Register Side Image" width={500} height={600} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

