import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChooseProfile from "./pages/ChooseProfile";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import TechnicianProfile from "./pages/TechnicianProfile";
import BookingTunnel from "./pages/BookingTunnel";
import BookingConfirmation from "./pages/BookingConfirmation";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicianReportEditor from "./pages/TechnicianReportEditor";
import BookingReport from "./pages/BookingReport";
import BuyerBookings from "./pages/BuyerBookings";
import MyProjects from "./pages/MyProjects";
import Messages from "./pages/Messages";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/signup" element={<ChooseProfile />} />
      <Route path="/signup/acheteur" element={<Signup role="acheteur" />} />
      <Route path="/signup/pro" element={<Signup role="technicien" />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/search" element={<Search />} />
      <Route path="/technicians/:id" element={<TechnicianProfile />} />
      <Route path="/technicians/:id/book" element={<BookingTunnel />} />
      <Route path="/bookings/:id/confirmation" element={<BookingConfirmation />} />
      <Route path="/bookings/:bookingId/report" element={<BookingReport />} />
      <Route path="/projects" element={<MyProjects />} />
      <Route path="/bookings" element={<BuyerBookings />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/messages/:bookingId" element={<Messages />} />
      <Route path="/technician/bookings/:bookingId/report" element={<TechnicianReportEditor />} />
      <Route path="/technician/*" element={<TechnicianDashboard />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
