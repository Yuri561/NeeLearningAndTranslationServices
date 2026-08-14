import { Routes, Route } from "react-router-dom";
import Home from "./pages/home/home";
import Layout from "./layout/Layout";
import { About } from "./pages/about/About";
import NotFound from "./pages/not-found/NotFound";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import GoogleCallback from "./pages/auth/GoogleCallback";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AccountSecurity from "./pages/auth/AccountSecurity";
import TutorDashboard, {
  TutorAccount,
  TutorAvailability,
  TutorBookings,
  TutorFiles,
  TutorOverview,
  TutorServices,
} from "./pages/dashboard/TutorDashboard";
import AdminDashboard, {
  AdminAvailability,
  AdminBookings,
  AdminFiles,
  AdminOverview,
  AdminServices,
  AdminSettings,
  AdminTutors,
} from "./pages/dashboard/AdminDashboard";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import LearnerDashboard from "./pages/dashboard/LearnerDashboard";
import {
  LearnerAvailability,
  LearnerBooking,
  LearnerFiles,
  LearnerOverview,
  LearnerServices,
  LearnerSettings,
} from "./pages/dashboard/LearnerDashboardPages";
import { PayPalReturnPage } from "./pages/payment/PayPalReturnPage";
import { PayPalCancelPage } from "./pages/payment/PayPalCancelPage";

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />} >
          <Route index={true} element={<Home />} />
          <Route path="about" element={<About />} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="auth/google/callback" element={<GoogleCallback />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute allowedRole={["learner", "tutor"]} />}>
          <Route path="account/security" element={<AccountSecurity />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="learner" />}>
          <Route path="payment/paypal/return" element={<PayPalReturnPage />} />
          <Route path="payment/paypal/cancel" element={<PayPalCancelPage />} />
          <Route path="dashboard/learner" element={<LearnerDashboard />}>
            <Route index element={<LearnerOverview />} />
            <Route path="services" element={<LearnerServices />} />
            <Route path="bookings" element={<LearnerBooking />} />
            <Route path="bookings/upcoming" element={<LearnerBooking />} />
            <Route path="bookings/history" element={<LearnerBooking />} />
            <Route path="booking" element={<LearnerBooking />} />
            <Route path="availability" element={<LearnerAvailability />} />
            <Route path="availability/:tutorId" element={<LearnerAvailability />} />
            <Route path="files" element={<LearnerFiles />} />
            <Route path="translation" element={<LearnerFiles />} />
            <Route path="settings" element={<LearnerSettings />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRole="tutor" />}>
          <Route path="dashboard/tutor" element={<TutorDashboard />}>
            <Route index element={<TutorOverview />} />
            <Route path="services" element={<TutorServices />} />
            <Route path="availability" element={<TutorAvailability />} />
            <Route path="bookings" element={<TutorBookings />} />
            <Route path="files" element={<TutorFiles />} />
            <Route path="settings" element={<TutorAccount />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="dashboard/admin" element={<AdminDashboard />}>
            <Route index element={<AdminOverview />} />
            <Route path="tutors" element={<AdminTutors />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="availability" element={<AdminAvailability />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="files" element={<AdminFiles />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
