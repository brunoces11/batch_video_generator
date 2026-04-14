import { useBatch } from './context/BatchContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ProjectList } from './components/project/ProjectList';
import { ProjectSetup } from './components/project/ProjectSetup';
import { BatchDashboard } from './components/batch/BatchDashboard';

function AppContent() {
  const { view } = useBatch();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'list' && <ProjectList />}
        {view === 'setup' && <ProjectSetup />}
        {view === 'dashboard' && <BatchDashboard />}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
