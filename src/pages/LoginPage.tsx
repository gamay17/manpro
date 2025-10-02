import { Link, useNavigate } from "react-router-dom";
import Background from "../assets/image/background.png";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { useState } from "react";


import { loginUser } from "../service/authService";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  
  const validateField = (field: string, value: string) => {
    let error = "";

    switch (field) {
      case "email":
        if (!value) error = "Email wajib diisi!";
        else if (!/\S+@\S+\.\S+/.test(value))
          error = "Format email tidak valid, contoh : example@email.com";
        break;
      case "password":
        if (!value) error = "Password wajib diisi!";
        else if (value.length < 8) error = "Password minimal 8 karakter!";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };


  const handleChange =
    (field: "email" | "password") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;

      if (field === "email") setEmail(val);
      if (field === "password") setPassword(val);

      validateField(field, val);

      
      if (message?.type === "error" && email && password) {
        setMessage(null);
      }
    };

  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = validateField("email", email);
    const passErr = validateField("password", password);

    if (!email || !password) {
      setMessage({
        text: "Harap lengkapi semua field sebelum melanjutkan.",
        type: "error",
      });
      return;
    }

    if (emailErr || passErr) {
      setMessage({
        text: "Periksa kembali form Anda, ada data yang belum valid.",
        type: "error",
      });
      return;
    }

    try {
      
      const user = loginUser(email, password);

      setMessage({
        text: `Login berhasil! Selamat datang, ${user.name}.`,
        type: "success",
      });

      
      setEmail("");
      setPassword("");
      setErrors({ email: "", password: "" });

      
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({
          text: err.message,
          type: "error",
        });
      } else {
        setMessage({
          text: "Email atau password salah!",
          type: "error",
        });
      }
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden">
      
      <div className="w-full md:w-[40%] p-6 bg-secondary flex flex-col items-center justify-start pt-12 md:pt-20">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h1 className="font-bold text-[32px] md:text-[38px] mb-10 text-center font-poppins">
            Sign In
          </h1>

          <div className="flex flex-col gap-2">
            
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={handleChange("email")}
              placeholder="Enter email"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}

            
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

            <div className="w-full text-right">
              <Link
                to="/forgotPassword"
                className="text-sm font-inter font-medium hover:underline cursor-pointer"
              >
                Forgot Password?
              </Link>
            </div>

            
            {message && (
              <p
                className={`text-sm text-center mb-2 ${
                  message.type === "error" ? "text-red-600" : "text-green-600"
                }`}
              >
                {message.text}
              </p>
            )}

            <div className="w-full mt-3">
              <Button
                type="submit"
                text="Login"
                className="bg-primary hover:bg-[#d69601] text-quinary w-full"
              />
            </div>

            <div className="flex justify-center gap-2 mt-3">
              <span className="font-inter text-sm font-medium text-[#666666]">
                Don't have an account?
              </span>
              <Link
                to="/register"
                className="text-sm font-inter font-semibold hover:underline cursor-pointer"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </form>
      </div>

      
      <div
        className="hidden md:block w-[60%] bg-primary"
        style={{
          backgroundImage: `url(${Background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mt-20 ml-16 mr-10">
          <h1 className="text-[32px] md:text-[40px] font-bold leading-tight font-poppins">
            Hello,
            <br /> Welcome!
          </h1>
          <p className="mt-4 text-[16px] md:text-[20px] font-semibold font-inter text-justify">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            rhoncus suscipit nibh, eget placerat nisi fringilla ut. Nulla
            euismod quam non porttitor viverra. Etiam condimentum diam vel lacus
            faucibus scelerisque. Cras placerat erat condimentum porta
            tristique. Morbi aliquam congue ex eget rhoncus. Suspendisse
            potenti. Ut at arcu in mauris tempor dictum non at purus. Integer
            dui nisl, dictum et lacinia ut, dictum vitae sapien.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
