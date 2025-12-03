// src/pages/login.tsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import Background from "../../assets/image/background.png";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

type FromState = { from?: { pathname: string } };

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as FromState) || {};
  const from = state.from?.pathname || "/";

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const eTrim = email.trim();
    const pTrim = password.trim();

    if (!eTrim || !pTrim) {
      setMessage({
        text: "Please fill in both email and password.",
        type: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await login(eTrim, pTrim);

      setEmail("");
      setPassword("");
      setMessage({ text: "Welcome back! Redirecting…", type: "success" });

      navigate(from, { replace: true });
    } catch (err) {
      const text =
        err instanceof Error ? err.message : "Incorrect email or password.";
      setMessage({ text, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (message) setMessage(null);
  };
  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (message) setMessage(null);
  };

  return (
    <div className="min-h-screen w-screen bg-secondary flex flex-col md:flex-row items-center justify-center px-4 md:px-10 lg:px-16 overflow-hidden">
      {/* LEFT: form */}
      <div className="w-full md:w-[40%] flex justify-center items-center mb-10 md:mb-0">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm px-6 py-8 md:px-8 md:py-10 flex flex-col gap-4"
        >
          <div className="text-center mb-2">
            <h1 className="font-poppins font-bold text-[32px] md:text-[36px] text-quinary tracking-tight">
              SIGN IN
            </h1>
            <p className="mt-2 text-quaternary font-inter font-medium text-[14px] md:text-[15px] leading-relaxed">
              Let’s get you signed in so you can continue where you left off.
            </p>
          </div>

          <div className="space-y-3 mt-2">
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={onEmailChange}
              placeholder="Enter your email"
            />

            <InputField
              label="Password"
              type="password"
              value={password}
              onChange={onPasswordChange}
              placeholder="Enter your password"
            />
          </div>

          <div className="w-full flex justify-end mt-1">
            <Link
              to="/forgotPassword"
              className="text-xs md:text-sm font-inter font-medium text-primary hover:underline hover:opacity-80 transition"
            >
              Forgot Password?
            </Link>
          </div>

          {message && (
            <div className="mt-1">
              <p
                className={`text-xs md:text-sm text-center px-3 py-2 rounded-full border ${
                  message.type === "error"
                    ? "text-red-600 border-red-200 bg-red-50"
                    : "text-emerald-600 border-emerald-200 bg-emerald-50"
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          <div className="mt-2">
            <Button
              type="submit"
              text={isSubmitting ? "Signing In..." : "Login"}
              className={`bg-primary text-secondary w-full rounded-full py-2.5 text-[15px] font-semibold tracking-wide shadow-lg shadow-primary/40 hover:shadow-primary/60 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:bg-[#d69601]"
              }`}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="font-inter text-xs md:text-sm font-medium text-[#777777]">
              Don’t have an account?
            </span>
            <Link
              to="/register"
              className="text-xs md:text-sm font-inter font-semibold text-primary hover:underline hover:opacity-90"
            >
              Sign Up
            </Link>
          </div>
        </form>
      </div>

      {/* RIGHT: hero image */}
      <div className="hidden md:flex w-[60%] justify-center items-center">
        <div className="relative w-full h-[86vh] max-h-[640px] rounded-3xl overflow-hidden shadow-[0_26px_80px_rgba(0,0,0,0.18)]">
          <img
            src={Background}
            alt="Workspace background"
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {/* overlay untuk kontras teks */}
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 flex flex-col justify-center px-12 lg:px-16 text-white">
            <h1 className="text-[34px] lg:text-[42px] font-bold font-poppins leading-snug drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]">
              Hello,
              <br /> Welcome!
            </h1>
            <p className="mt-4 text-[16px] lg:text-[18px] font-medium font-inter max-w-[75%] leading-relaxed drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
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
