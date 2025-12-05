import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer>
      <div className="footer-container">
        <div className="footer-column">
          <div className="footer-logo">
            <Image src="/images/logo.png" alt="BookMyBarber Logo" width={30} height={30} />
            <h2>BookMyBarber</h2>
          </div>
          <p>Your one-stop solution for all barber needs.</p>
          <div className="social-icons">
            <a href="#"><i className="fab fa-facebook"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-linkedin"></i></a>
          </div>
        </div>
        <div className="footer-column">
          <h3>Quick Links</h3>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/barbers">Find Barbers</Link></li>
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="footer-column">
          <h3>Support</h3>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">FAQs</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <h3>Contact Us</h3>
          <p><i className="fas fa-phone"></i> +92 300 1234567</p>
          <p><i className="fas fa-envelope"></i> info@bookmybarber.com</p>
          <p><i className="fas fa-map-marker-alt"></i> NUML, Islamabad</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2023 BookMyBarber. All rights reserved.</p>
      </div>
    </footer>
  );
}

