import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import EventDetailPage from "./components/EventDetailPage";

export default function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/event/:id" element={<EventDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
