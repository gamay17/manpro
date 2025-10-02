import { Link, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { useState } from "react";
import { registerUser } from "../service/authService"; // ✅ Import service untuk simpan user ke localStorage

// Tipe untuk menyimpan error tiap field
type ErrorState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate(); // ✅ Hook untuk redirect ke halaman lain

  // State input form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State untuk menyimpan error spesifik di tiap field
  const [errors, setErrors] = useState<ErrorState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // State untuk pesan global (error/sukses)
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  // ✅ Fungsi validasi tiap field
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

    // Simpan error ke state
    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  // ✅ Hapus pesan global kalau semua field sudah diisi
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

  // ✅ Fungsi untuk handle perubahan input
  const handleChange =
    (field: keyof ErrorState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;

      // Update state sesuai field
      if (field === "name") setName(val);
      if (field === "email") setEmail(val);
      if (field === "password") setPassword(val);
      if (field === "confirmPassword") setConfirmPassword(val);

      // Jalankan validasi tiap kali user mengetik
      validateField(field, val, field === "confirmPassword" ? password : val);

      // Kalau password berubah, cek ulang confirm password
      if (field === "password" && confirmPassword) {
        validateField("confirmPassword", confirmPassword, val);
      }

      // Kalau semua sudah terisi, hapus pesan global
      clearGlobalIfAllFilled(
        field === "name" ? val : name,
        field === "email" ? val : email,
        field === "password" ? val : password,
        field === "confirmPassword" ? val : confirmPassword
      );
    };

  // ✅ Fungsi ketika form disubmit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Jalankan validasi semua field
    const nameErr = validateField("name", name);
    const emailErr = validateField("email", email);
    const passwordErr = validateField("password", password);
    const confirmErr = validateField(
      "confirmPassword",
      confirmPassword,
      password
    );

    // Kalau ada field kosong → tampilkan pesan global
    if (!name || !email || !password || !confirmPassword) {
      setMessage({
        text: "Harap lengkapi semua field sebelum melanjutkan.",
        type: "error",
      });
      return;
    }

    // Kalau ada error format → tampilkan pesan global
    if (nameErr || emailErr || passwordErr || confirmErr) {
      setMessage({
        text: "Periksa kembali form Anda, ada data yang belum valid.",
        type: "error",
      });
      return;
    }

    try {
      // ✅ Simpan user ke localStorage lewat service
      registerUser(name, email, password);

      // Pesan sukses
      setMessage({
        text: "Registrasi berhasil!",
        type: "success",
      });

      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setErrors({ name: "", email: "", password: "", confirmPassword: "" });

      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        setMessage(null);
        navigate("/login");
      }, 2000);
    } catch (err: unknown) {
      // Kalau gagal (misal email sudah terdaftar)
      if (err instanceof Error) {
        setMessage({ text: err.message, type: "error" });
      }
    }
  };

  return (
    <>
      <h1 className="font-bold text-[33px] m-2 font-poppins">Sign Up</h1>

      {/* Form Register */}
      <form onSubmit={handleSubmit} className="flex flex-col w-80 gap-3">
        {/* Name */}
        <InputField
          label="Name"
          type="text"
          value={name}
          onChange={handleChange("name")}
          placeholder="Enter name"
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}

        {/* Email */}
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={handleChange("email")}
          placeholder="Enter email"
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}

        {/* Password */}
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

        {/* Confirm Password */}
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

        {/* Pesan Global */}
        {message && (
          <p
            className={`text-sm text-center ${
              message.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Tombol Register */}
        <div className="w-full mt-6">
          <Button
            type="submit"
            text="Register"
            className="bg-primary hover:bg-[#d69601] text-quinary"
          />
        </div>

        {/* Link ke Login */}
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
