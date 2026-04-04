import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";

import EventBoard from "./pages/EventBoard";
import EventDetail from "./pages/EventDetail";

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function"
    ) {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }

    if (typeof localStorage !== "undefined" && localStorage.setItem) {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <BrowserRouter basename={import.meta.env.PROD ? "/du-event-board" : ""}>
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <Routes>
        <Route path="/" element={<EventBoard />} />
        <Route path="/event/:id" element={<EventDetail />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
