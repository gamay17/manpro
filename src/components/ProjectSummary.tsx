import React, { useEffect, useMemo, useState } from "react";
import { createProjectService } from "../service/project.service";
import type { Project, ProjectStatus } from "../types/project";
import { useAuth } from "../hooks/useAuth";

const ProjectSummary: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const svc = useMemo(
    () => (userId ? createProjectService(userId) : null),
    [userId]
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!svc) return;
      try {
        setLoading(true);
        const list = await svc.getAll();
        if (alive) setProjects(list);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [svc]);

  const counts = useMemo(() => {
    const countByStatus = (status: ProjectStatus) =>
      projects.filter((p) => p.status === status).length;

    return {
      all: projects.length,
      completed: countByStatus("completed"),
      inProgress: countByStatus("in-progress"),
    };
  }, [projects]);

  return (
    <div className="mt-6">
      {/* Title lebih kecil */}
      <h1 className="text-lg font-semibold text-start mb-6 font-poppins text-slate-700">
        Project Status Summary
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* All */}
        <div className="bg-primary text-white px-4 py-3 rounded-lg shadow-sm flex justify-between items-center font-poppins">
          <h3 className="text-sm font-medium">All Project</h3>
          <p className="text-xl font-bold">{loading ? "…" : counts.all}</p>
        </div>

        {/* Completed */}
        <div className="bg-[#4CAF50] text-white px-4 py-3 rounded-lg shadow-sm flex justify-between items-center font-poppins">
          <h3 className="text-sm font-medium">Completed</h3>
          <p className="text-xl font-bold">{loading ? "…" : counts.completed}</p>
        </div>

        {/* In Progress */}
        <div className="bg-[#349EF2] text-white px-4 py-3 rounded-lg shadow-sm flex justify-between items-center font-poppins">
          <h3 className="text-sm font-medium">In Progress</h3>
          <p className="text-xl font-bold">{loading ? "…" : counts.inProgress}</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectSummary;
