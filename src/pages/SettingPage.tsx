import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { AlertDialog } from "../components/AlertDialog";
import { CircleUser } from "lucide-react";
import { authService } from "../service/authService";
import toast from "react-hot-toast";

const SettingPage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();

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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#FFB300] to-[#FF8C00]">
        <p className="text-lg text-white font-semibold drop-shadow-lg">
          No user data available.
        </p>
      </div>
    );
  }

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

  // --- Handlers ---

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
      icon: "question",
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
      icon: "question",
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

    if (confirmed) logout();
  };

  return (
    <div className="flex justify-center items-start min-h-screen p-6">
      <div className="w-full max-w-md bg-secondary/95 backdrop-blur-md p-8 rounded-3xl shadow-xl transition-all duration-300 hover:shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-3 shadow-inner">
            <CircleUser className="w-14 h-14 text-primary" />
          </div>
          <h1 className="text-xl font-poppins font-bold text-quanary">
            Account Settings
          </h1>
          <p className="text-sm font-inter text-quaternary">
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
            <div className="mt-6 flex flex-col space-y-3">
              <Button
                text="Save Password"
                onClick={handlePasswordChange}
                className="bg-[#4CAF50] hover:bg-[#229926] text-secondary font-semibold py-2 px-4 rounded-xl transition-all"
              />
              <Button
                text="Cancel"
                onClick={() => {
                  setIsChangingPassword(false);
                  setError("");
                }}
                className="bg-gray-300 hover:bg-gray-400 text-[#333] font-semibold py-2 px-4 rounded-xl transition-all"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Profile Form */}
            {!isEditing ? (
              <div className="space-y-4 text-left">
                <div>
                  <p className="text-sm font-bold text-quanary">Name</p>
                  <p className="text-quanary border-b border-gray-300 pb-1">
                    {user.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-quanary">Email</p>
                  <p className="text-quanary border-b border-gray-300 pb-1">
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
            <div className="mt-8 flex flex-col space-y-3">
              {isEditing ? (
                <>
                  {noChangeMessage && (
                    <p className="text-yellow-600 text-sm font-medium mb-2">
                      {noChangeMessage}
                    </p>
                  )}
                  <Button
                    text="Save"
                    onClick={handleSaveWithConfirm}
                    className="bg-[#4CAF50] hover:bg-[#229926] text-white font-semibold py-2 px-4 rounded-xl transition-all"
                  />
                  <Button
                    text="Cancel"
                    onClick={() => {
                      setIsEditing(false);
                      setError("");
                      setNoChangeMessage("");
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-[#333] font-semibold py-2 px-4 rounded-xl transition-all"
                  />
                </>
              ) : (
                <>
                  <Button
                    text="Edit Profile"
                    onClick={() => setIsEditing(true)}
                    className="bg-primary hover:bg-[#e6a100] text-white font-semibold py-2 px-4 rounded-xl transition-all"
                  />
                  <Button
                    text="Change Password"
                    onClick={() => setIsChangingPassword(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition-all"
                  />
                  <Button
                    text="Logout"
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl transition-all"
                  />
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
