import { Link, useNavigate } from "react-router-dom";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import type { IRegisterPayload } from "../../types/auth";
import toast from "react-hot-toast";

type ErrorState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<ErrorState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const validateField = (
    field: keyof ErrorState,
    value: string,
    currentPassword = password
  ) => {
    let error = "";
    switch (field) {
      case "name":
        if (!value) error = "Name is required!";
        break;
      case "email":
        if (!value) error = "Email is required!";
        else if (!/\S+@\S+\.\S+/.test(value)) error = "Invalid email format.";
        break;
      case "password":
        if (!value) error = "Password is required!";
        else if (value.length < 8)
          error = "Password must be at least 8 characters.";
        break;
      case "confirmPassword":
        if (!value) error = "Please confirm your password.";
        else if (value !== currentPassword) error = "Passwords do not match!";
        break;
    }
    return error;
  };

  const handleChange =
    (field: keyof ErrorState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (message) setMessage(null);
      if (field === "name") setName(val);
      if (field === "email") setEmail(val);
      if (field === "password") setPassword(val);
      if (field === "confirmPassword") setConfirmPassword(val);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    const nameErr = validateField("name", name.trim());
    const emailErr = validateField("email", email.trim());
    const passwordErr = validateField("password", password);
    const confirmErr = validateField(
      "confirmPassword",
      confirmPassword,
      password
    );

    setErrors({
      name: nameErr,
      email: emailErr,
      password: passwordErr,
      confirmPassword: confirmErr,
    });

    if (nameErr || emailErr || passwordErr || confirmErr) {
      setMessage({ text: "Please check your inputs again.", type: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: IRegisterPayload = {
        name: name.trim(),
        email: email.trim(),
        password,
      };
      await toast.promise(
        register(payload.name, payload.email, payload.password),
        {
          loading: "Creating your account...",
          success: "Registration successful! Redirecting...",
          error: (err) =>
            err instanceof Error ? err.message : "Registration failed.",
        },
        { success: { duration: 1500 } }
      );
      setTimeout(() => setIsFading(true), 300);
      setTimeout(() => navigate("/login"), 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`
        w-full transition-opacity duration-700
        ${isFading ? "opacity-0" : "opacity-100"}
      `}
    >
      
      <div className="mb-6 sm:mb-8 text-center sm:text-left">
        <h1 className="font-black text-3xl sm:text-4xl font-poppins text-primary mb-2">
          Create your account
        </h1>
        <p className="text-sm sm:text-base text-quaternary max-w-sm mx-auto sm:mx-0">
          Join us and start exploring your dashboard with a clean and simple
          experience.
        </p>
      </div>

      
      <form onSubmit={handleSubmit} className="w-full space-y-3 sm:space-y-4">
        <div className="space-y-1">
          <InputField
            label="Name"
            type="text"
            value={name}
            onChange={handleChange("name")}
            placeholder="Enter your name"
          />
          {hasSubmitted && errors.name && (
            <p className="text-xs sm:text-sm text-red-500 text-left">
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={handleChange("email")}
            placeholder="Enter your email"
          />
          {hasSubmitted && errors.email && (
            <p className="text-xs sm:text-sm text-red-500 text-left">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={handleChange("password")}
            placeholder="Create password"
          />
          {hasSubmitted && errors.password && (
            <p className="text-xs sm:text-sm text-red-500 text-left">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <InputField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={handleChange("confirmPassword")}
            placeholder="Re-enter password"
          />
          {hasSubmitted && errors.confirmPassword && (
            <p className="text-xs sm:text-sm text-red-500 text-left">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {message && (
          <p
            className={`text-xs sm:text-sm text-center mt-1 transition-all duration-300 ${
              message.type === "error" ? "text-red-500" : "text-green-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="pt-3">
          <Button
            type="submit"
            text={isSubmitting ? "Signing Up..." : "Sign Up"}
            className={`bg-primary text-secondary w-full rounded-full py-2.5 text-[15px] font-semibold tracking-wide shadow-lg shadow-primary/40 hover:shadow-primary/60 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
              isSubmitting
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-[#d69601]"
            }`}
            disabled={isSubmitting}
          />
        </div>

        <p className="text-xs sm:text-sm text-center font-inter font-medium text-quaternary pt-1">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-quinary font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
