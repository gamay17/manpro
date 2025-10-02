import { Link } from "react-router-dom";
import Button from "../components/Button";
import { useState } from "react";
import InputField from "../components/InputField";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      setMessage("Semua field wajib diisi!");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Password tidak cocok");
      return;
    }

    console.log("Register data:", { email, password });
    setMessage("Registrasi berhasil .");
  };

  return (
    <>
      <h1 className="font-bold text-[33px] m-6">Reset Password</h1>

      <form onSubmit={handleSubmit} className="flex flex-col w-80 gap-2">
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
        />

        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => {
            if (password.length < 8) {
              setMessage("Password minimal 8 karakter!");
            } else {
              setMessage("");
            }
          }}
          placeholder="Enter password"
        />

        <InputField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
        />

        {message && (
          <p className="text-sm text-center text-red-600">{message}</p>
        )}

        <div className="w-full mt-4">
          <Button
            type="submit"
            text="Register"
            className="bg-primary hover:bg-[#d69601] text-black"
          />
        </div>

        <div className="flex justify-center gap-2 w-full text-center">
          <span className="text-sm font-medium text-quaternary">
            Do have an account?{" "}
          </span>
          <Link
            to="/login"
            className="text-sm font-medium hover:underline cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      </form>
    </>
  );
};

export default ForgotPasswordPage;
