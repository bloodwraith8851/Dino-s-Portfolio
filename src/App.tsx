import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ServicesSection from './components/ServicesSection';
import ProjectsSection from './components/ProjectsSection';
import ContactSection from './components/ContactSection';
import { supabase } from './lib/supabase';
import { trackEvent } from './lib/neon';
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
          let ip = 'Unknown'; let city = 'Unknown'; let org = 'ISP';
          try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            if (ipData.ip) ip = ipData.ip;
            
            try {
              const geoRes = await fetch(`https://ipinfo.io/${ip}/json`);
              const geoData = await geoRes.json();
              if (geoData.city) city = geoData.city;
              if (geoData.org) org = geoData.org.replace(/^AS\d+\s/, '').substring(0, 15);
            } catch(e) {
              try {
                const geoRes2 = await fetch(`https://ipapi.co/${ip}/json/`);
                const geoData2 = await geoRes2.json();
                if (geoData2.city) city = geoData2.city;
                if (geoData2.org) org = geoData2.org.substring(0, 15);
              } catch(err) {}
            }
            
            (window as any).__GEO_DATA__ = { ip, city, org };
            if (!stored && city !== 'Unknown') alias = `${city} Visitor`;
          } catch(e) {}
          await channel.track({ alias, online_at: new Date().toISOString(), ip, city, org });
        }
      });

    // Listen for identity updates from the terminal
    const handleIdentity = async (e: any) => {
      if (channel.state === 'joined') {
        const geo = (window as any).__GEO_DATA__ || { ip: 'Unknown', city: 'Unknown', org: 'ISP' };
        await channel.track({ alias: e.detail, online_at: new Date().toISOString(), ip: geo.ip, city: geo.city, org: geo.org });
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
