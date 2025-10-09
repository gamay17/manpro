import SearchBar from "../components/SearchBar";
import ProjectSummary from "../components/ProjectSummary";

const HomePage: React.FC = () => {
  return (
    <div className="flex h-screen bg-tertiary">
      <main className="flex-1 flex flex-col items-center p-6">
        <h1 className="font-bold font-poppins text-quinary text-3xl text-center mb-6">
          Plan Smarter, Work Better
        </h1>
        <SearchBar />
        <ProjectSummary />
      </main>
    </div>
  );
};

export default HomePage;
