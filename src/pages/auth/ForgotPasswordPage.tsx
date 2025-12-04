import { Link, useNavigate } from "react-router-dom";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import { useState } from "react";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);


  const validateField = (
    field: keyof typeof errors,
    value: string,
    currentPassword = password
  ) => {
    let error = "";
    switch (field) {
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
    (field: keyof typeof errors) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (field === "email") setEmail(val);
      if (field === "password") setPassword(val);
      if (field === "confirmPassword") setConfirmPassword(val);
    };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    const emailErr = validateField("email", email);
    const passwordErr = validateField("password", password);
    const confirmErr = validateField(
      "confirmPassword",
      confirmPassword,
      password
    );

    setErrors({ email: emailErr, password: passwordErr, confirmPassword: confirmErr });

    if (emailErr || passwordErr || confirmErr) {
      setMessage({
        text: "Please check your inputs again.",
        type: "error",
      });
      return;
    }

    try {

      await new Promise((res) => setTimeout(res, 800));

      setMessage({
        text: "Password reset successfully!",
        type: "success",
      });

      setTimeout(() => setIsFading(true), 500);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ text: err.message, type: "error" });
      }
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-start w-full py-4 transition-opacity duration-700 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      <h1 className="font-black text-4xl font-poppins text-primary mb-6">
        Reset Password
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-80 gap-2 sm:gap-4"
      >
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={handleChange("email")}
          placeholder="Enter your email"
        />
        {hasSubmitted && errors.email && (
          <p className="text-sm text-red-500">{errors.email}</p>
        )}

        <InputField
          label="New Password"
          type="password"
          value={password}
          onChange={handleChange("password")}
          placeholder="Enter new password"
        />
        {hasSubmitted && errors.password && (
          <p className="text-sm text-red-500">{errors.password}</p>
        )}

        <InputField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={handleChange("confirmPassword")}
          placeholder="Re-enter new password"
        />
        {hasSubmitted && errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword}</p>
        )}

        {message && (
          <p
            className={`text-sm text-center mt-1 transition-all duration-300 ${
              message.type === "error" ? "text-red-500" : "text-green-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="mt-6">
          <Button
            type="submit"
            text="Reset Password"
            className="bg-primary hover:bg-[#d69601] text-secondary border-0 py-2 rounded-lg font-semibold transition-all duration-200"
          />
        </div>

        <p className="text-sm text-center font-inter font-medium text-quaternary">
          Remember your password?{" "}
          <Link to="/login" className="text-quinary font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
