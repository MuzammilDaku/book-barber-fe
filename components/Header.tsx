'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useUserStore } from '@/store/user';

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useUserStore();
  const { isPending: isAuthLoading } = authClient.useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header className={isScrolled ? 'scrolled' : ''}>
      <nav className="navbar">
        <Link href="/" className="logo">
          <Image src="/images/logo.png" alt="BookMyBarber Logo" width={40} height={40} />
          <h1>BookMyBarber</h1>
        </Link>
        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <li><Link href="/" className={isActive('/') ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Home</Link></li>
          <li><Link href="/barbers" className={isActive('/barbers') ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Find Barbers</Link></li>
          <li><Link href="/services" className={isActive('/services') ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Services</Link></li>
          <li><Link href="/about" className={isActive('/about') ? 'active                         ' : ''} onClick={() => setIsMenuOpen(false)}>About Us</Link></li>
          <li><Link href="/contact" className={isActive('/contact') ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Contact</Link></li>
        </ul>
        <div className="auth-buttons">
          {isAuthLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-color)' }}>
              <i className="fas fa-spinner fa-spin"></i>
              <span>Loading...</span>
            </div>
          ) : user ? (
            user.userType === 'barber' ? (
              <Link href="/barber/dashboard" className={`btn btn-primary ${isActive('/barber/dashboard') ? 'active' : ''}`}>
                <i className="fas fa-tachometer-alt"></i> Dashboard
              </Link>
            ) : user.userType === 'customer' ? (
              <Link href="/my-appointments" className={`btn btn-primary ${isActive('/my-appointments') ? 'active' : ''}`}>
                <i className="fas fa-calendar-check"></i> My Appointments
              </Link>
            ) : null
          ) : (
            <>
              <Link href="/login" className={`btn btn-outline ${isActive('/login') ? 'active' : ''}`}>Login</Link>
              <Link href="/register" className={`btn btn-primary ${isActive('/register') ? 'active' : ''}`}>Register</Link>
            </>
          )}
        </div>
        <div 
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </nav>
    </header>
  );
}

