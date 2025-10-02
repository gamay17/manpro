import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import UserLayout from "../layout/UserLayout"; // ⬅️ import layout baru
import LandingPage from "../pages/LandingPage";
import RegisterPage from "../pages/RegisterPage";
import HomePage from "../pages/HomePage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import LoginPage from "../pages/LoginPage";
import ProjectPage from "../pages/ProjectPage";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page tanpa layout */}
        <Route path="/" element={<LandingPage />} />

        {/* Halaman dengan UserLayout */}
        <Route element={<UserLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/projects" element={<ProjectPage />} />
        </Route>

        {/* Login langsung */}
        <Route path="/login" element={<LoginPage />} />

        {/* Auth Layout untuk register & forgot password */}
        <Route element={<AuthLayout />}>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
