"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function Contact() {
  return (
    <>
      <Header />

      {/* Contact Hero */}
      <section
        className="contact-hero"
        style={{
          padding: "6rem 2rem",
          background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "-5%",
            width: "400px",
            height: "400px",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "float 8s ease-in-out infinite",
          }}
        />

        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 800,
            animation: "fadeInUp 0.6s ease-out",
          }}
        >
          Contact Us
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            marginTop: "1rem",
            maxWidth: "650px",
            margin: "auto",
            animation: "fadeInUp 0.6s ease-out 0.2s both",
            color: "#475569",
          }}
        >
          Have questions or need help? We're here to assist you anytime.
        </p>
      </section>

      {/* Contact Section */}
      <section
        className="contact-section"
        style={{
          padding: "5rem 2rem",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "-5%",
            left: "5%",
            width: "450px",
            height: "450px",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "float 9s ease-in-out infinite reverse",
          }}
        />

        <div className="contact-container" style={{ maxWidth: "1100px", margin: "auto", display: "flex", gap: "3rem", flexWrap: "wrap" }}>
          {/* Left: Contact Info */}
          <div
            className="contact-info"
            style={{
              flex: "1",
              minWidth: "300px",
              animation: "fadeInUp 0.6s ease-out",
            }}
          >
            <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Get In Touch</h2>

            <p style={{ color: "#475569", marginBottom: "2rem" }}>
              We'd love to hear from you. Reach out using any of the methods below.
            </p>

            <div className="info-card" style={infoCardStyle}>
              <i className="fas fa-phone" style={iconStyle}></i>
              <div>
                <h4 style={infoTitle}>Phone</h4>
                <p style={infoText}>+1 (555) 123-4567</p>
              </div>
            </div>

            <div className="info-card" style={infoCardStyle}>
              <i className="fas fa-envelope" style={iconStyle}></i>
              <div>
                <h4 style={infoTitle}>Email</h4>
                <p style={infoText}>support@bookmybarber.com</p>
              </div>
            </div>

            <div className="info-card" style={infoCardStyle}>
              <i className="fas fa-map-marker-alt" style={iconStyle}></i>
              <div>
                <h4 style={infoTitle}>Office</h4>
                <p style={infoText}>Downtown, Dubai UAE</p>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div
            className="contact-form"
            style={{
              flex: "1",
              minWidth: "300px",
              animation: "fadeInUp 0.6s ease-out 0.2s both",
              background: "#ffffff",
              padding: "2rem",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            }}
          >
            <h2 style={{ marginBottom: "1.5rem" }}>Send Us a Message</h2>

            <form style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <input type="text" placeholder="Your Name" style={inputStyle} />
              <input type="email" placeholder="Your Email" style={inputStyle} />
              <textarea placeholder="Your Message" rows={5} style={inputStyle} />
              <button
                className="btn btn-primary"
                style={{
                  padding: "14px 30px",
                  fontSize: "1.1rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <i className="fas fa-paper-plane"></i>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

/* Styles Matching Your UI */
const inputStyle = {
  padding: "14px 18px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "1rem",
  outline: "none",
};

const infoCardStyle = {
  display: "flex",
  alignItems: "center",
  background: "#fff",
  padding: "1rem 1.2rem",
  marginBottom: "1rem",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  gap: "1rem",
};

const iconStyle = {
  fontSize: "1.6rem",
  color: "#6366f1",
};

const infoTitle = { marginBottom: "0.2rem", fontWeight: 600 };
const infoText = { color: "#475569" };