import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-orange-500">
      <h1 className="text-5xl font-bold text-white mb-8 font-poppins">
        Manage Your Projects Smarter
      </h1>
      <p className="text-white text-lg mb-12 text-center px-4 font-inter">
        Streamline your team collaboration, track tasks efficiently, and stay on
        top of every project milestone with ease. Take control of your workflow
        today.
      </p>

      <div className="flex gap-6">
        <Link
          to="/login"
          className="px-6 py-3 bg-secondary text-primary font-bold rounded hover:bg-tertiary transition cursor-pointer"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="px-6 py-3 bg-primary text-secondary font-bold rounded hover:bg-[#d69601] transition cursor-pointer"
        >
          Register
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
