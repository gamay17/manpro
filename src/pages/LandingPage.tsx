import { Link } from "react-router-dom";
import { Rocket, Workflow } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="relative min-h-screen w-screen flex flex-col items-center justify-center overflow-hidden bg-[#FFB300] text-gray-800">
      {/* Background Accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ffb300] via-orange-400 to-[#ffb300] opacity-95" />
      <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <Workflow className="w-14 h-14 text-white drop-shadow-lg" />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold font-poppins leading-tight text-white drop-shadow-md">
          Manage Your{" "}
          <span className="text-[#fff1cc]">Projects</span> Smarter
        </h1>

        {/* Subtitle */}
        <p className="text-white/90 text-lg sm:text-xl mt-6 mb-10 font-inter max-w-2xl mx-auto leading-relaxed">
          Simplify teamwork, track progress, and reach your goals faster with an
          intuitive project management experience.
        </p>

        {/* Buttons */}
        <div className="flex gap-6 justify-center">
          <Link
            to="/login"
            className="px-8 py-3 bg-white text-[#FFB300] font-semibold rounded-full shadow-md hover:bg-[#fff1cc] hover:scale-105 transition-transform duration-300"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="px-8 py-3 bg-[#ffb300] text-white font-semibold rounded-full shadow-md border-2 border-transparent hover:bg-[#cc8b00] hover:scale-105 transition-transform duration-300"
          >
            Register
          </Link>
        </div>
      </div>

      {/* Decorative Rocket */}
      <div className="absolute bottom-10 right-10 hidden md:block animate-bounce">
        <Rocket className="w-16 h-16 text-white opacity-90 drop-shadow-xl" />
      </div>
    </div>
  );
};

export default LandingPage;
