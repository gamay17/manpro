import { projects } from "../utils/projects";
import { type ProjectStatus } from "../types/project";

const ProjectSummary = () => {
  // Hitung jumlah project per status
  const countByStatus = (status: ProjectStatus) =>
    projects.filter((p) => p.status === status).length;

  return (
    <div className="mt-12">
      {/* Judul */}
      <h1 className="text-2xl font-bold text-start mb-8">
        Project Status Summary
      </h1>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 lg:gap-28">
        <div className="bg-primary text-secondary p-4 rounded-lg shadow-md flex justify-between items-center">
          <h3 className="text-lg md:text-xl font-semibold">All Project</h3>
          <p className="text-lg md:text-2xl font-bold ml-4 md:ml-12">
            {projects.length}
          </p>
        </div>

        <div className="bg-[#4CAF50] text-secondary p-4 rounded-lg shadow-md flex justify-between items-center">
          <h3 className="text-lg md:text-xl font-semibold">Completed</h3>
          <p className="text-lg md:text-2xl font-bold ml-4 md:ml-12">
            {countByStatus("completed")}
          </p>
        </div>

        <div className="bg-[#349EF2] text-secondary p-4 rounded-lg shadow-md flex justify-between items-center">
          <h3 className="text-lg md:text-xl font-semibold">In Progress</h3>
          <p className="text-lg md:text-2xl font-bold ml-4 md:ml-12">
            {countByStatus("in-progress")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectSummary;
