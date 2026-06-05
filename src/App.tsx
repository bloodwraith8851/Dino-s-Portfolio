import React, { useState, Suspense } from 'react';
import BootSequence from './components/BootSequence';
import ErrorBoundary from './components/ErrorBoundary';
import { initErrorReporting } from './lib/errorReporting';
import { useBanCheck } from './hooks/useBanCheck';
import { usePresence } from './hooks/usePresence';
import { usePageTracking } from './hooks/usePageTracking';

// Lazy-loaded sections — code-split for performance
const HeroSection = React.lazy(() => import('./components/HeroSection'));
const AboutSection = React.lazy(() => import('./components/AboutSection'));
const ServicesSection = React.lazy(() => import('./components/ServicesSection'));
const ProjectsSection = React.lazy(() => import('./components/ProjectsSection'));
const ContactSection = React.lazy(() => import('./components/ContactSection'));

// Initialize error reporting before anything renders
initErrorReporting();

// Seed globals so the terminal can read them immediately
window.__ACTIVE_VISITORS__ = 1;
window.__VISITOR_PRESENCE__ = [];

const App = () => {
  const [isBanned, setIsBanned] = useState<boolean | null>(null);
  const [showBoot, setShowBoot] = useState<boolean>(!sessionStorage.getItem('hasBooted'));

  useBanCheck(setIsBanned);
  usePresence();
  usePageTracking();

  if (isBanned === true) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-[var(--bg-color)] text-red-500 font-mono text-center flex-col gap-6 p-6">
        <span className="text-8xl">🛑</span>
        <h1 className="text-4xl md:text-6xl font-bold tracking-widest">ERROR 403</h1>
        <h2 className="text-xl md:text-2xl text-red-400">ACCESS FORBIDDEN</h2>
        <div className="max-w-lg mt-4 border border-red-900/50 bg-red-950/20 p-6 rounded-lg">
          <p className="text-sm md:text-base text-gray-400">
            Your IP address has been permanently banned from accessing this server. If you believe this is an error,
            please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  // Prevent flashing the site while checking ban status
  if (isBanned === null) return <div className="h-screen w-full bg-[var(--bg-color)]" />;

  return (
    <>
      {showBoot && (
        <BootSequence
          onComplete={() => {
            setShowBoot(false);
            sessionStorage.setItem('hasBooted', 'true');
          }}
        />
      )}

      <main className="relative w-full" style={{ overflowX: 'clip', background: 'var(--bg-color)' }}>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center text-neutral-500 font-mono">
              Loading module...
            </div>
          }
        >
          <ErrorBoundary>
            <HeroSection />
          </ErrorBoundary>
          <ErrorBoundary>
            <AboutSection />
          </ErrorBoundary>
          <ErrorBoundary>
            <ServicesSection />
          </ErrorBoundary>
          <ErrorBoundary>
            <ProjectsSection />
          </ErrorBoundary>
          <ErrorBoundary>
            <ContactSection />
          </ErrorBoundary>
        </Suspense>
      </main>
    </>
  );
};

export default App;
