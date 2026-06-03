import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ServicesSection from './components/ServicesSection';
import BootSequence from './components/BootSequence';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './lib/supabase';
import { trackEvent } from './lib/neon';
import { initErrorReporting } from './lib/errorReporting';
import React, { useEffect, useState, Suspense } from 'react';

// Lazy-loaded sections
const ProjectsSection = React.lazy(() => import('./components/ProjectsSection'));
const ContactSection = React.lazy(() => import('./components/ContactSection'));

// Initialize error reporting before anything renders
initErrorReporting();

// Expose globally for the terminal to read
declare global {
  interface Window {
    __ACTIVE_VISITORS__: number;
    __VISITOR_PRESENCE__: any[];
  }
}
window.__ACTIVE_VISITORS__ = 1;
window.__VISITOR_PRESENCE__ = [];

const App = () => {
  const [isBanned, setIsBanned] = useState<boolean | null>(null);
  const [showBoot, setShowBoot] = useState<boolean>(
    !sessionStorage.getItem('hasBooted')
  );

  useEffect(() => {
    /* 0. Check for Banned IP (with retry) */
    const checkBan = async () => {
      const attemptBanCheck = async (): Promise<void> => {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.ip) {
          const { data: banData } = await supabase.from('banned_ips').select('ip').eq('ip', data.ip).single();
          if (banData) {
            setIsBanned(true);
            return;
          }
        }
        setIsBanned(false);
      };

      try {
        await attemptBanCheck();
      } catch {
        // Retry once after 2 seconds before giving up
        try {
          await new Promise(r => setTimeout(r, 2000));
          await attemptBanCheck();
        } catch {
          // If both attempts fail, allow access (fail-open)
          setIsBanned(false);
        }
      }
    };
    checkBan();

    /* 1. Track Active Visitors globally via Supabase Presence */
    const channel = supabase.channel('global_visitors');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let total = 0;
        const presences: any[] = [];
        for (const id in state) {
          total += state[id].length;
          presences.push(...state[id]);
        }
        window.__ACTIVE_VISITORS__ = Math.max(1, total);
        window.__VISITOR_PRESENCE__ = presences;
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const stored = localStorage.getItem('visitorName');
          let alias = stored || 'Anonymous Node';
          let ip = 'Unknown'; let city = 'Unknown'; let org = 'ISP'; let lat = 0; let lng = 0;
          try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            if (ipData.ip) ip = ipData.ip;
            
            try {
              const geoRes = await fetch(`https://ipinfo.io/${ip}/json`);
              const geoData = await geoRes.json();
              if (geoData.city) city = geoData.city;
              if (geoData.org) org = geoData.org.replace(/^AS\d+\s/, '').substring(0, 15);
              if (geoData.loc) {
                const [lt, lg] = geoData.loc.split(',');
                lat = parseFloat(lt); lng = parseFloat(lg);
              }
            } catch(e) {
              try {
                const geoRes2 = await fetch(`https://ipapi.co/${ip}/json/`);
                const geoData2 = await geoRes2.json();
                if (geoData2.city) city = geoData2.city;
                if (geoData2.org) org = geoData2.org.substring(0, 15);
                if (geoData2.latitude) lat = parseFloat(geoData2.latitude);
                if (geoData2.longitude) lng = parseFloat(geoData2.longitude);
              } catch(err) {}
            }
            
            (window as any).__GEO_DATA__ = { ip, city, org, lat, lng };
            if (!stored && city !== 'Unknown') alias = `${city} Visitor`;
          } catch(e) {}
          await channel.track({ alias, online_at: new Date().toISOString(), ip, city, org, lat, lng });
        }
      });

    // Listen for identity updates from the terminal
    const handleIdentity = async (e: any) => {
      if (channel.state === 'joined') {
        const geo = (window as any).__GEO_DATA__ || { ip: 'Unknown', city: 'Unknown', org: 'ISP', lat: 0, lng: 0 };
        await channel.track({ alias: e.detail, online_at: new Date().toISOString(), ip: geo.ip, city: geo.city, org: geo.org, lat: geo.lat, lng: geo.lng });
      }
    };
    window.addEventListener('identity_updated', handleIdentity);

    /* 2. Track Page View via Neon DB Edge Function (server-side, secure) */
    const trackView = async () => {
      const stored = localStorage.getItem('visitorName');
      await trackEvent({
        event_type: 'page_view',
        visitor_alias: stored || 'anonymous',
        metadata: { referrer: document.referrer, ua: navigator.userAgent.substring(0, 80) },
      });
    };
    trackView();

    return () => {
      window.removeEventListener('identity_updated', handleIdentity);
      supabase.removeChannel(channel);
    };
  }, []);

  if (isBanned === true) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-[var(--bg-color)] text-red-500 font-mono text-center flex-col gap-6 p-6">
        <span className="text-8xl">🛑</span>
        <h1 className="text-4xl md:text-6xl font-bold tracking-widest">ERROR 403</h1>
        <h2 className="text-xl md:text-2xl text-red-400">ACCESS FORBIDDEN</h2>
        <div className="max-w-lg mt-4 border border-red-900/50 bg-red-950/20 p-6 rounded-lg">
          <p className="text-sm md:text-base text-gray-400">
            Your IP address has been permanently banned from accessing this server.
            If you believe this is an error, please contact the administrator.
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
        <BootSequence onComplete={() => {
          setShowBoot(false);
          sessionStorage.setItem('hasBooted', 'true');
        }} />
      )}
      
      <main
        className="relative w-full"
        style={{ overflowX: 'clip', background: 'var(--bg-color)' }}
      >
          <ErrorBoundary><HeroSection /></ErrorBoundary>
          <ErrorBoundary><AboutSection /></ErrorBoundary>
          <ErrorBoundary><ServicesSection /></ErrorBoundary>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-neutral-500 font-mono">Loading module...</div>}>
            <ErrorBoundary><ProjectsSection /></ErrorBoundary>
            <ErrorBoundary><ContactSection /></ErrorBoundary>
          </Suspense>
      </main>
    </>
  );
};

export default App;
