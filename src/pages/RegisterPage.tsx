import { Link, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { useState } from "react";
import { authService } from "../service/authService";
import type { IRegisterPayload } from "../types/auth";

type ErrorState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    field: string,
    value: string,
    currentPassword = password
  ) => {
    let error = "";

    switch (field) {
      case "name":
        if (!value) error = "Nama wajib diisi!";
        break;
      case "email":
        if (!value) error = "Email wajib diisi!";
        else if (!/\S+@\S+\.\S+/.test(value))
          error = "Format email tidak valid, contoh: example@email.com";
        break;
      case "password":
        if (!value) error = "Password wajib diisi!";
        else if (value.length < 8) error = "Password minimal 8 karakter!";
        break;
      case "confirmPassword":
        if (!value) error = "Konfirmasi password wajib diisi!";
        else if (value !== currentPassword) error = "Password tidak cocok!";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const clearGlobalIfAllFilled = (
    nameVal: string,
    emailVal: string,
    passVal: string,
    confirmVal: string
  ) => {
    if (
      message?.type === "error" &&
      nameVal.trim() &&
      emailVal.trim() &&
      passVal.trim() &&
      confirmVal.trim()
    ) {
      setMessage(null);
    }
  };

  const handleChange =
    (field: keyof ErrorState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;

      if (field === "name") setName(val);
      if (field === "email") setEmail(val);
      if (field === "password") setPassword(val);
      if (field === "confirmPassword") setConfirmPassword(val);

      validateField(field, val, field === "confirmPassword" ? password : val);

      if (field === "password" && confirmPassword) {
        validateField("confirmPassword", confirmPassword, val);
      }

      clearGlobalIfAllFilled(
        field === "name" ? val : name,
        field === "email" ? val : email,
        field === "password" ? val : password,
        field === "confirmPassword" ? val : confirmPassword
      );
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateField("name", name);
    const emailErr = validateField("email", email);
    const passwordErr = validateField("password", password);
    const confirmErr = validateField(
      "confirmPassword",
      confirmPassword,
      password
    );

    if (!name || !email || !password || !confirmPassword) {
      setMessage({
        text: "Harap lengkapi semua field sebelum melanjutkan.",
        type: "error",
      });
      return;
    }

    if (nameErr || emailErr || passwordErr || confirmErr) {
      setMessage({
        text: "Periksa kembali form Anda, ada data yang belum valid.",
        type: "error",
      });
      return;
    }

    try {
      const payload: IRegisterPayload = { name, email, password };
      await authService.register(payload);

      setMessage({
        text: "Registrasi berhasil!",
        type: "success",
      });

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setErrors({ name: "", email: "", password: "", confirmPassword: "" });

      setTimeout(() => {
        setMessage(null);
        navigate("/login");
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ text: err.message, type: "error" });
      }
    }
  };

  return (
    <>
      <h1 className="font-bold text-[33px] m-2 font-poppins">Sign Up</h1>

      <form onSubmit={handleSubmit} className="flex flex-col w-80 gap-3">
        <InputField
          label="Name"
          type="text"
          value={name}
          onChange={handleChange("name")}
          placeholder="Enter name"
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}

        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={handleChange("email")}
          placeholder="Enter email"
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}

        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={handleChange("password")}
          placeholder="Enter password"
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}

        <InputField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={handleChange("confirmPassword")}
          placeholder="Confirm password"
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword}</p>
        )}

        {message && (
          <p
            className={`text-sm text-center ${
              message.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="w-full mt-6">
          <Button
            type="submit"
            text="Register"
            className="bg-primary hover:bg-[#d69601] text-quinary"
          />
        </div>

        <div className="gap-2 mt-2 w-full text-center">
          <span className="text-sm font-medium text-quaternary font-inter">
            Do have an account?{" "}
          </span>
          <Link
            to="/login"
            className="text-sm font-inter font-semibold hover:underline cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      </form>
    </>
  );
};

export default RegisterPage;
