import SearchBar from "../../components/SearchBar";
import ProjectSummary from "../../components/ProjectSummary";

const HomePage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-0 py-6 sm:py-8">
            <header className="mb-6 sm:mb-8">
        <h1 className="font-poppins font-bold text-quinary text-3xl sm:text-4xl">
          Plan Smarter, Work Better
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          Kelola dan pantau semua project kamu dalam satu tempat yang rapi.
        </p>
      </header>

            <section
        className="
          bg-white rounded-2xl
          shadow-[0_18px_45px_rgba(15,23,42,0.08)]
          border border-slate-100/80
          px-4 sm:px-6 md:px-8 py-5 sm:py-6 space-y-6
        "
      >
                <div>
          <SearchBar />
        </div>

                <div>
          <ProjectSummary />
        </div>
      </section>
    </div>
  );
};

export default HomePage;
