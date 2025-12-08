"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function About() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section
        style={{
          padding: "6rem 2rem",
          textAlign: "center",
          background: "linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-8%",
            right: "-8%",
            width: "450px",
            height: "450px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            animation: "float 9s infinite ease-in-out",
          }}
        />

        <h1 style={{ fontSize: "3rem", fontWeight: 800, animation: "fadeInUp 0.6s ease-out" }}>
          About Us
        </h1>
        <p
          style={{
            maxWidth: "650px",
            margin: "1rem auto 0",
            fontSize: "1.2rem",
            color: "#475569",
            animation: "fadeInUp 0.6s ease-out 0.2s both",
          }}
        >
          Making grooming easier, smarter, and more convenient for everyone.
        </p>
      </section>

      {/* About Story */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "auto",
            display: "flex",
            gap: "3rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "300px", animation: "fadeInUp 0.6s ease-out" }}>
            <h2 className="section-title">Our Story</h2>
            <p style={storyText}>
              BookMyBarber was created to solve a simple problem — finding a great barber
              shouldn’t be difficult. We realized people were tired of long queues,
              unpredictable schedules, and the challenge of discovering quality barbers
              nearby.
            </p>
            <p style={storyText}>
              Today, BookMyBarber connects thousands of clients with talented professionals
              while helping barbers grow their businesses digitally.
            </p>
          </div>

          <div style={{ flex: 1, minWidth: "300px", animation: "fadeInUp 0.6s ease-out 0.2s both" }}>
            <Image
              src="/images/hero-image.jpg"
              alt="Our Mission"
              width={600}
              height={400}
              style={{
                borderRadius: "16px",
                objectFit: "cover",
                width: "100%",
                height: "100%",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              }}
            />
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "-5%",
            left: "5%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
            animation: "float 10s infinite ease-in-out alternate",
          }}
        />

        <h2 className="section-title" style={{ textAlign: "center", marginBottom: "3rem" }}>
          Our Mission & Values
        </h2>

        <div
          style={{
            maxWidth: "1100px",
            margin: "auto",
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            {
              icon: "fa-bullseye",
              title: "Our Mission",
              text: "To make grooming accessible, seamless, and modern for both clients and barbers.",
            },
            {
              icon: "fa-heart",
              title: "Customer First",
              text: "We focus on creating a smooth and delightful experience for every user.",
            },
            {
              icon: "fa-rocket",
              title: "Innovation",
              text: "We constantly improve our platform to deliver better tools and features.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="value-card"
              style={{
                background: "#fff",
                padding: "2rem",
                borderRadius: "16px",
                width: "320px",
                textAlign: "center",
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                animation: `fadeInUp 0.6s ease-out ${0.1 * (i + 1)}s both`,
              }}
            >
              <i className={`fas ${item.icon}`} style={{ fontSize: "2.5rem", color: "#6366f1", marginBottom: "1rem" }}></i>
              <h3 style={{ marginBottom: "0.5rem" }}>{item.title}</h3>
              <p style={{ color: "#475569", lineHeight: 1.7 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}

const storyText = {
  color: "#475569",
  lineHeight: "1.75",
  marginBottom: "1rem",
};