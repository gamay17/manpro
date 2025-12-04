import { Link } from "react-router-dom";
import { Rocket, Workflow } from "lucide-react";
import { motion } from "framer-motion";

const LandingPage = () => {
  return (
    <div
      className="
        relative flex min-h-screen w-screen overflow-hidden
        bg-gradient-to-br from-[#FFB300] via-[#FFC94A] to-[#FF9800]
        text-slate-900
      "
    >
      
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.9),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgba(255,255,255,0.9),transparent_50%)]" />

      
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-6 sm:px-8 lg:px-10 lg:py-10">
        
        <header className="flex items-center justify-between mb-8 sm:mb-10">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black/5 backdrop-blur-sm">
              <Workflow className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold font-poppins text-slate-900">
                ManPro
              </span>
              <span className="text-[11px] font-inter text-slate-600">
                Management Project
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-sm font-inter">
            <Link
              to="/login"
              className="rounded-full border border-black/10 bg-white/70 px-4 py-1.5 text-slate-800 backdrop-blur-sm hover:bg-white transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-slate-900 px-4 py-1.5 text-white font-medium hover:bg-slate-800 transition"
            >
              Get Started
            </Link>
          </div>
        </header>

        
        <div className="flex flex-1 flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-14">
          
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium text-amber-700 shadow-sm mb-4 backdrop-blur-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Boost your project workflow
            </div>

            <h1 className="font-poppins text-[2.4rem] leading-snug font-extrabold text-slate-900 drop-shadow-sm sm:text-[3rem] lg:text-[3.4rem]">
              Plan Smarter,{" "}
              <span className="text-amber-700">Work Better</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl font-inter text-sm sm:text-base leading-relaxed text-slate-700">
              Kelola semua project, task, dan progres tim dalam satu tempat
              yang rapi. Fokus pada hal penting, biar urusan tracking kami yang
              urus.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            >
              <Link
                to="/register"
                className="
                  inline-flex items-center justify-center rounded-full 
                  bg-slate-900 px-7 py-2.5 text-sm font-semibold text-white
                  shadow-[0_12px_30px_rgba(15,23,42,0.35)]
                  hover:bg-slate-800 hover:translate-y-0.5
                  transition-all
                "
              >
                <Rocket className="mr-2 h-4 w-4" />
                Start for free
              </Link>

              <Link
                to="/login"
                className="
                  inline-flex items-center justify-center rounded-full 
                  border border-slate-800/15 bg-white/70 px-6 py-2.5 
                  text-sm font-semibold text-slate-900 shadow-sm
                  backdrop-blur-sm hover:bg-white
                  transition-all
                "
              >
                Already have an account?
              </Link>
            </motion.div>

            
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-inter text-slate-700 lg:justify-start">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Real-time task status
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Clear division & roles
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Simple, intuitive UI
              </div>
            </div>
          </motion.div>

          
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="flex-1 flex justify-center"
          >
            <div
              className="
                w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-md
                shadow-[0_20px_55px_rgba(15,23,42,0.25)]
                border border-white/70
                p-5 sm:p-6
              "
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-inter text-slate-500">
                    Active project
                  </p>
                  <p className="text-sm font-semibold font-poppins text-slate-900">
                    Website Management Project
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                  On Track
                </span>
              </div>

              <div className="space-y-3">
                {["Design Auth", "Database Setup", "Frontend Dashboard"].map(
                  (task, idx) => (
                    <div
                      key={task}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {task}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {idx === 0
                              ? "UI/UX • In Review"
                              : idx === 1
                              ? "Backend • In Progress"
                              : "Frontend • Todo"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`
                          rounded-full px-2.5 py-0.5 text-[11px] font-medium
                          ${
                            idx === 0
                              ? "bg-violet-50 text-violet-700"
                              : idx === 1
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }
                        `}
                      >
                        {idx === 0
                          ? "Review"
                          : idx === 1
                          ? "In Progress"
                          : "Todo"}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 font-inter">
                <span>3 tasks • 2 members</span>
                <span className="rounded-full bg-slate-900/90 px-2.5 py-1 text-[10px] font-medium text-white">
                  See more inside
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-8 right-6 hidden lg:block"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-black/10 backdrop-blur-sm">
          <Rocket className="h-9 w-9 text-white drop-shadow-xl" />
        </div>
      </motion.div>

      
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: [0, -18, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ repeat: Infinity, duration: 6 }}
          className="absolute left-1/4 top-1/3 h-3 w-3 rounded-full bg-white/60 blur-sm"
        />
        <motion.div
          animate={{ y: [0, -22, 0], opacity: [0.2, 0.7, 0.2] }}
          transition={{ repeat: Infinity, duration: 7 }}
          className="absolute left-2/3 top-1/2 h-2.5 w-2.5 rounded-full bg-white/70 blur-sm"
        />
      </div>
    </div>
  );
};

export default LandingPage;
