import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import TechnicianProfile from "./pages/TechnicianProfile";
import BookingConfirmation from "./pages/BookingConfirmation";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import BuyerBookings from "./pages/BuyerBookings";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Search />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/search" element={<Search />} />
      <Route path="/technicians/:id" element={<TechnicianProfile />} />
      <Route path="/bookings/:id/confirmation" element={<BookingConfirmation />} />
      <Route path="/bookings" element={<BuyerBookings />} />
      <Route path="/technician/*" element={<TechnicianDashboard />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
