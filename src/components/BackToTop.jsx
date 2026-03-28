import { useState, useEffect } from "react";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      style={{
        position: "fixed",
        bottom: "30px",
        right: "30px",
        zIndex: 1000,
        width: "45px",
        height: "45px",
        borderRadius: "50%",
        backgroundColor: "var(--accent-primary, #dc2626)",
        color: "#ffffff",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(6px)",
        transition:
          "opacity 0.4s ease, transform 0.4s ease, box-shadow 0.3s ease",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        pointerEvents: isVisible ? "auto" : "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px) scale(1.05)";
        e.currentTarget.style.boxShadow =
          "0 10px 25px rgba(0, 0, 0, 0.35), inset 0 1px 6px rgba(255,255,255,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.3)";
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  );
};

export default BackToTop;
