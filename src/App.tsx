import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ServicesSection from './components/ServicesSection';
import ProjectsSection from './components/ProjectsSection';
import ContactSection from './components/ContactSection';
import { supabase } from './lib/supabase';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    /* 0. Check for Banned IP */
    const checkBan = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.ip) {
          const { data: banData } = await supabase.from('banned_ips').select('ip').eq('ip', data.ip).single();
          if (banData) {
            setIsBanned(true);
            return;
          }
        }
      } catch(e) {}
      setIsBanned(false);
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
          if (!stored) {
            try {
              const res = await fetch('https://ipapi.co/json/');
              const data = await res.json();
              if (data.city) alias = `${data.city} Visitor`;
            } catch(e) {}
          }
          await channel.track({ alias, online_at: new Date().toISOString() });
        }
      });

    // Listen for identity updates from the terminal
    const handleIdentity = async (e: any) => {
      if (channel.state === 'joined') {
        await channel.track({ alias: e.detail, online_at: new Date().toISOString() });
      }
    };
    window.addEventListener('identity_updated', handleIdentity);

    /* 2. Track Page View (Silently fail if table isn't created yet) */
    const trackView = async () => {
      const date = new Date().toISOString().split('T')[0];
      // Note: Assumes an RPC or simple insert logic. If RPC fails, we ignore it.
      await supabase.rpc('increment_page_view', { view_date: date });
    };
    trackView();

    return () => {
      window.removeEventListener('identity_updated', handleIdentity);
      supabase.removeChannel(channel);
    };
  }, []);

  if (isBanned === true) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-[#050505] text-red-500 font-mono text-center flex-col gap-6 p-6">
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
  if (isBanned === null) return <div className="h-screen w-full bg-[#0c0c0c]" />;

  return (
    <main
      className="relative w-full"
      style={{ overflowX: 'clip', background: '#0C0C0C' }}
    >
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
      <ContactSection />
    </main>
  );
};

export default App;
