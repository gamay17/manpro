import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import UserLayout from "../layout/UserLayout";
import ProjectLayout from "../layout/ProjectLayout"; // Layout untuk halaman proyek detail

import LandingPage from "../pages/LandingPage";
import RegisterPage from "../pages/auth/RegisterPage";
import HomePage from "../pages/users/HomePage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import LoginPage from "../pages/auth/LoginPage";
import ProjectPage from "../pages/users/ProjectPage";
import SettingPage from "../pages/users/SettingPage";
import DashboardPage from "../pages/ProjectDetail/DashboardPage";
import TaskPage from "../pages/ProjectDetail/TaskPage";
import BoardPage from "../pages/ProjectDetail/BoardPage";
import MyTaskPage from "../pages/ProjectDetail/MyTaskPage";


import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== Public Routes ===== */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthLayout />}>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        {/* ===== Protected Routes (harus login) ===== */}
        <Route
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/projects" element={<ProjectPage />} />
          <Route path="/settings" element={<SettingPage />} />
        </Route>

        {/* ===== Layout khusus proyek (ProjectLayout) ===== */}
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectLayout />
            </ProtectedRoute>
          }
        >
          {/* Halaman utama proyek (overview) */}
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TaskPage />} />
          <Route path="Board" element={<BoardPage/>}/>
          <Route path="mytask" element={<MyTaskPage/>}/>
          {/* nanti bisa tambahkan sub-page lain, misalnya */}
          {/* <Route path="members" element={<ProjectMembersPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
