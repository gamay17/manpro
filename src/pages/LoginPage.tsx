import { Link, useNavigate } from "react-router-dom";
import Background from "../assets/image/background.png";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // check if fields are empty
    if (!email || !password) {
      setMessage({
        text: "Please fill in both email and password.",
        type: "error",
      });
      return;
    }

    try {
      await login(email, password);

      // reset form
      setEmail("");
      setPassword("");

      setTimeout(() => navigate("/home"), 500);
    } catch {
      // show error message if login fails
      setMessage({
        text: "Incorrect email or password.",
        type: "error",
      });
    }
  };

  return (
    <div className="h-screen w-screen bg-secondary flex flex-col md:flex-row overflow-hidden">
      {/* Left side - login form */}
      <div className="w-full md:w-[40%] flex justify-center items-start pt-28 px-6 ">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm flex flex-col justify-center gap-3"
        >
          <h1 className="font-poppins font-bold text-[36px] md:text-[42px] text-center text-quinary leading-snug">
            SIGN IN
          </h1>
          <p className="text-center text-quaternary font-inter font-medium text-[15px] leading-relaxed mb-3">
            Let’s get you signed in so you can continue where you left off.
          </p>

          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />

          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />

          <div className="w-full text-right mb-3">
            <Link
              to="/forgotPassword"
              className="text-sm font-inter font-medium text-primary hover:underline cursor-pointer"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Message display */}
          {message && (
            <p
              className={`text-sm text-center ${
                message.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {message.text}
            </p>
          )}

          <Button
            type="submit"
            text="Login"
            className="bg-primary hover:bg-[#d69601] text-secondary w-full rounded-xl py-2.5 text-[16px] font-semibold transition-all duration-200"
          />

          <div className="flex justify-center gap-2">
            <span className="font-inter text-sm font-medium text-[#666666]">
              Don’t have an account?
            </span>
            <Link
              to="/register"
              className="text-sm font-inter font-semibold text-primary hover:underline"
            >
              Sign Up
            </Link>
          </div>
        </form>
      </div>

      {/* Right side - background image */}
      <div className="hidden md:flex w-[60%] justify-center items-center px-4">
        <div className="relative w-full h-[92vh] rounded-2xl overflow-hidden shadow-xl">
          <img
            src={Background}
            alt="Welcome Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 flex flex-col mt-16 px-14 text-white">
            <h1 className="text-[38px] md:text-[46px] font-bold font-poppins leading-snug">
              Hello, <br /> Welcome!
            </h1>
            <p className="mt-4 text-[18px] md:text-[20px] font-medium font-inter text-justify max-w-[85%]">
              Step into your workspace and make today productive — your projects
              are waiting for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
