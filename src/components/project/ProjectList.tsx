import { useEffect, useState } from 'react';
import { Plus, FolderOpen, Trash2 } from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { listProjects, deleteProject } from '../../services/projectService';
import { getFragmentsByProject } from '../../services/fragmentService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { STATUS_COLORS } from '../../lib/constants';
import type { Project } from '../../lib/types';

export function ProjectList() {
  const { setProject, setFragments, setView } = useBatch();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = async (project: Project) => {
    const fragments = await getFragmentsByProject(project.id);
    setProject(project);
    setFragments(fragments);
    setView(project.status === 'draft' ? 'setup' : 'dashboard');
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Video Projects</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your video generation projects
          </p>
        </div>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setView('setup')}
        >
          New Video Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-16">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-gray-900 mb-1">
            No video projects yet
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Create your first video project to start generating expansions
          </p>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setView('setup')}
          >
            New Video Project
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => {
            const colors = STATUS_COLORS[project.status] || STATUS_COLORS.draft;
            return (
              <Card
                key={project.id}
                className="hover:border-gray-300 transition-colors cursor-pointer"
                padding={false}
              >
                <div
                  className="p-4 flex items-center justify-between"
                  onClick={() => handleOpen(project)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {project.name}
                      </h3>
                      <Badge
                        className={`${colors.bg} ${colors.text}`}
                        dot
                        dotColor={colors.dot}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{project.total_fragments} expansion{project.total_fragments !== 1 ? 's' : ''}</span>
                      <span>{project.completed_fragments} completed</span>
                      {project.failed_fragments > 0 && (
                        <span className="text-red-500">
                          {project.failed_fragments} failed
                        </span>
                      )}
                      <span>
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
