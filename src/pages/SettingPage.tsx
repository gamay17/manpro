import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";

const SettingPage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [newName, setNewName] = useState(user?.name || "");

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-400">Tidak ada data pengguna.</p>
      </div>
    );
  }

  const handleSave = () => {
    updateUser(newName);
    alert("Nama berhasil diperbarui!");
  };

  return (
    <div className="flex justify-center items-start min-h-screen px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Pengaturan Akun
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600">
              Nama
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border-b border-gray-300 py-1 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600">
              Email
            </label>
            <p className="text-gray-800 border-b border-gray-300 py-1">
              {user.email}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <Button
            text="Simpan"
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
          />
          <Button
            text="Logout"
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
