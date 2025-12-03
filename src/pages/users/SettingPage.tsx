// src/pages/settings/SettingPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import { AlertDialog } from "../../components/AlertDialog";
import { authService } from "../../service/auth.service";
import toast from "react-hot-toast";

const SettingPage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [newName, setNewName] = useState(user?.name || "");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [noChangeMessage, setNoChangeMessage] = useState("");

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <p className="text-base sm:text-lg text-slate-700 font-semibold">
          No user data available.
        </p>
      </div>
    );
  }

  const initial =
    (user.name && user.name.trim().charAt(0).toUpperCase()) || "U";

  const validateProfile = () => {
    if (!newName.trim()) {
      setError("Name cannot be empty.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError("Invalid email format.");
      return false;
    }
    setError("");
    return true;
  };

  const validatePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All password fields must be filled.");
      return false;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return false;
    }
    if (oldPassword === newPassword) {
      setError("New password cannot be the same as the old one.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSaveWithConfirm = async () => {
    if (!validateProfile()) return;

    const noChange = newName === user.name && newEmail === user.email;
    if (noChange) {
      setNoChangeMessage("No changes have been made.");
      return;
    }

    const confirmed = await AlertDialog.confirm({
      title: "Confirm Profile Update",
      text: "Are you sure you want to save these changes?",
      confirmText: "Yes, save",
      cancelText: "Cancel",
      confirmColor: "#3b82f6",
      icon: "info",
    });

    if (!confirmed) return;

    updateUser({ name: newName, email: newEmail });
    toast.success("Profile changes saved successfully!");
    setIsEditing(false);
    setNoChangeMessage("");
  };

  const handlePasswordChange = async () => {
    if (!validatePassword()) return;

    const confirmed = await AlertDialog.confirm({
      title: "Confirm Password Change",
      text: "Are you sure you want to change your password?",
      confirmText: "Yes, change",
      cancelText: "Cancel",
      confirmColor: "#3b82f6",
      icon: "warning",
    });

    if (!confirmed) return;

    try {
      await authService.updatePassword(user.id, oldPassword, newPassword);
      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An error occurred while changing password.");
    }
  };

  const handleLogout = async () => {
    const confirmed = await AlertDialog.confirm({
      title: "Are you sure you want to log out?",
      text: "You will be signed out from this account.",
      confirmText: "Yes, log out",
      cancelText: "Cancel",
      confirmColor: "#ef4444",
      icon: "warning",
    });

    if (!confirmed) return;

    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex justify-center items-start min-h-[calc(100vh-6rem)] px-4 sm:px-6 py-6">
      {/* Card */}
      <div
        className="
          w-full max-w-md sm:max-w-lg 
          bg-white/95 backdrop-blur-md 
          p-6 sm:p-7 
          rounded-2xl sm:rounded-3xl 
          shadow-[0_18px_45px_rgba(15,23,42,0.08)]
          border border-slate-100
          transition-all duration-300 hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)]
        "
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6 sm:mb-7">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-primary/20 flex items-center justify-center mb-3 shadow-inner border border-white/70">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <span className="text-xl font-extrabold text-white">
                {initial}
              </span>
            </div>
          </div>
          <h1 className="text-lg sm:text-xl font-poppins font-bold text-quinary">
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm font-inter text-quaternary">
            Manage your profile and security
          </p>
        </div>

        {/* Password Form */}
        {isChangingPassword ? (
          <div className="space-y-4 text-left">
            <InputField
              label="Old Password"
              type="password"
              value={oldPassword}
              placeholder="Enter old password"
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <InputField
              label="New Password"
              type="password"
              value={newPassword}
              placeholder="Enter new password"
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <InputField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              placeholder="Repeat new password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && (
              <p className="text-red-500 text-sm font-medium mt-1">{error}</p>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <Button
                text="Save Password"
                onClick={handlePasswordChange}
                className="bg-[#4CAF50] hover:bg-[#229926] text-secondary font-semibold py-2 rounded-xl transition-all"
              />
              <Button
                text="Cancel"
                onClick={() => {
                  setIsChangingPassword(false);
                  setError("");
                }}
                className="bg-gray-300 hover:bg-gray-400 text-[#333] font-semibold border-0 py-2 rounded-xl transition-all"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Profile Form */}
            {!isEditing ? (
              <div className="space-y-4 text-left">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-quinary">
                    Name
                  </p>
                  <p className="text-quinary border-b border-gray-300 pb-1 text-sm">
                    {user.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-quinary">
                    Email
                  </p>
                  <p className="text-quinary border-b border-gray-300 pb-1 text-sm">
                    {user.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <InputField
                  label="Name"
                  type="text"
                  value={newName}
                  placeholder="Enter your name"
                  onChange={(e) => setNewName(e.target.value)}
                />
                <InputField
                  label="Email"
                  type="email"
                  value={newEmail}
                  placeholder="Enter your email"
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                {error && (
                  <p className="text-red-500 text-sm font-medium mt-1">
                    {error}
                  </p>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="mt-7 flex flex-col sm:grid sm:grid-cols-2 sm:gap-3">
              {isEditing ? (
                <>
                  {noChangeMessage && (
                    <p className="sm:col-span-2 text-yellow-600 text-xs sm:text-sm font-medium mb-1">
                      {noChangeMessage}
                    </p>
                  )}
                  <Button
                    text="Save"
                    onClick={handleSaveWithConfirm}
                    className="bg-[#4CAF50] hover:bg-[#229926] text-white font-semibold py-2 rounded-xl transition-all"
                  />
                  <Button
                    text="Cancel"
                    onClick={() => {
                      setIsEditing(false);
                      setError("");
                      setNoChangeMessage("");
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-[#333] font-semibold border-0 py-2 rounded-xl transition-all"
                  />
                </>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:col-span-2 sm:space-x-3 space-y-2 sm:space-y-0">
                    <Button
                      text="Edit Profile"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-primary hover:bg-[#e6a100] text-white font-semibold py-2 rounded-xl transition-all"
                    />
                    <Button
                      text="Change Password"
                      onClick={() => setIsChangingPassword(true)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-xl transition-all"
                    />
                  </div>
                  <div className="mt-2 sm:mt-3 sm:col-span-2">
                    <Button
                      text="Logout"
                      onClick={handleLogout}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-all"
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingPage;
