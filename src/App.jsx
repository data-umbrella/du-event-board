import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";

import AboutUs from "./components/AboutUs";
import Sponsors from "./components/Sponsors";
import BackToTop from "./components/BackToTop";

import EventBoard from "./pages/EventBoard";
import EventDetail from "./pages/EventDetail";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.body.classList.toggle("light-theme", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <BrowserRouter basename={import.meta.env.PROD ? "/du-event-board" : ""}>
      <ScrollToTop />

      <Header theme={theme} onToggleTheme={toggleTheme} />

      <Routes>
        <Route path="/" element={<EventBoard />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="*" element={<EventBoard />} />
      </Routes>

      <Footer />
      <BackToTop />
    </BrowserRouter>
  );
}
