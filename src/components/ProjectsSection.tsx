import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import FadeIn from './FadeIn';
import LiveProjectButton from './LiveProjectButton';
import { supabase } from '../lib/supabase';

// Map database project IDs to their respective images
const PROJECT_IMAGES: Record<number, any> = {
  1: { col1Image1: '/Forge.png', col1Image2: '/Forge1.png', col2Image: '/Forge2.png' },
  2: { col1Image1: '/lawlab.png', col1Image2: '/lawlab1.png', col2Image: '/lawlab2.png' },
  3: { col1Image1: '/resumeiq-hero.png', col1Image2: '/resumeiq-feedback.png', col2Image: '/resumeiq-score.png' },
  4: { col1Image1: '/notch-hero.png', col1Image2: '/notch-pricing.png', col2Image: '/notch-mockup.png' },
};

interface DbProject {
  id: number;
  slug: string;
  name: string;
  category: string;
  live_url: string;
  description: string;
  tech_stack: string[];
  likes: number;
}

interface ProjectCardProps {
  project: DbProject;
  index: number;
  total: number;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const ProjectCard = ({ project, index, total }: ProjectCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [likes, setLikes] = useState(project.likes);

  useEffect(() => {
    // Update local state if the initial prop changes
    setLikes(project.likes);
  }, [project.likes]);

  useEffect(() => {
    // Realtime subscription for likes
    const channel = supabase
      .channel(`likes_${project.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'project_likes', filter: `project_id=eq.${project.id}` },
        (payload) => {
          setLikes(payload.new.likes_count);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id]);

  const handleLike = async () => {
    setLikes((l) => l + 1); // Optimistic UI
    try {
      const API_URL = import.meta.env.DEV ? 'http://localhost:5173' : '';
      const res = await fetch(`${API_URL}/api/projects/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (!res.ok) {
        await res.json();
        if (res.status === 429) {
          // Rate limited — revert optimistic update
          setLikes((l) => Math.max(0, l - 1));
        }
      }
    } catch {
      setLikes((l) => Math.max(0, l - 1));
    }
  };

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'start start'],
  });

  const targetScale = 1 - (total - 1 - index) * 0.03;
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

  const images = PROJECT_IMAGES[project.id] || PROJECT_IMAGES[1];
  const numberStr = project.id.toString().padStart(2, '0');

  return (
    <div ref={cardRef} className="sticky top-24 md:top-32 h-[85vh] w-full" style={{ top: `${96 + index * 28}px` }}>
      <motion.article
        style={{ scale }}
        className="origin-top mx-auto h-full w-full flex flex-col gap-4 sm:gap-6 md:gap-8 rounded-[40px] sm:rounded-[50px] md:rounded-[60px] border-2 border-[#151515] bg-[#050505] p-4 sm:p-6 md:p-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 sm:gap-6">
          <div className="flex flex-row items-start gap-3 sm:gap-6 md:gap-10 min-w-0 w-full">
            <div
              className="shrink-0 font-black text-[#D7E2EA] leading-none"
              style={{ fontSize: 'clamp(2.5rem, 10vw, 140px)' }}
            >
              {numberStr}
            </div>

            <div className="flex flex-col gap-1 sm:gap-3 pt-1 sm:pt-3 md:pt-4 min-w-0 flex-1">
              <span
                className="font-light uppercase tracking-widest text-[#D7E2EA]/60"
                style={{ fontSize: 'clamp(0.65rem, 1.2vw, 1rem)' }}
              >
                {project.category}
              </span>
              <h3
                className="font-medium uppercase text-[#D7E2EA] leading-tight flex items-center gap-3 sm:gap-4"
                style={{ fontSize: 'clamp(1.1rem, 2.2vw, 2.1rem)' }}
              >
                {project.name}
                <button
                  onClick={handleLike}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-[#1A1A1A]/80 hover:bg-[#2A2A2A] transition-all duration-200 ease-out-custom active:scale-95 border border-[#333] px-3 py-1 sm:px-4 sm:py-1.5 rounded-full cursor-pointer group hover:border-blue-500/50"
                >
                  <span className="text-blue-500 group-hover:scale-125 transition-transform origin-center">💙</span>
                  <span className="text-[#D7E2EA] font-mono tabular-nums">{likes}</span>
                </button>
              </h3>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-auto pt-1 sm:pt-2 md:pt-3 w-full sm:w-auto">
            <LiveProjectButton href={project.live_url || '#'} className="w-full sm:w-auto" />
          </div>
        </div>

        <div className="grid grid-cols-[40%_60%] gap-3 sm:gap-4 md:gap-5 flex-1 min-h-0">
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 min-h-0">
            <div
              className="overflow-hidden rounded-[40px] sm:rounded-[50px] md:rounded-[60px]"
              style={{ height: 'clamp(130px, 16vw, 230px)' }}
            >
              <img
                src={images.col1Image1}
                alt={`${project.name} preview 1`}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
            <div
              className="overflow-hidden rounded-[40px] sm:rounded-[50px] md:rounded-[60px]"
              style={{ height: 'clamp(160px, 22vw, 340px)' }}
            >
              <img
                src={images.col1Image2}
                alt={`${project.name} preview 2`}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[40px] sm:rounded-[50px] md:rounded-[60px] min-h-0">
            <img
              src={images.col2Image}
              alt={`${project.name} preview 3`}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        </div>
      </motion.article>
    </div>
  );
};

const HARDCODED_PROJECTS: DbProject[] = [
  {
    id: 1,
    slug: 'forge',
    name: 'Forge',
    category: 'Creative Studio',
    live_url: '#',
    description: 'Creative digital studio',
    tech_stack: ['Next.js', 'Tailwind'],
    likes: 142,
  },
  {
    id: 2,
    slug: 'lawlab',
    name: 'LawLab',
    category: 'Legal Tech',
    live_url: '#',
    description: 'Legal practice management',
    tech_stack: ['React', 'Node.js'],
    likes: 89,
  },
  {
    id: 3,
    slug: 'resumeiq',
    name: 'ResumeIQ',
    category: 'AI Analyzer',
    live_url: '#',
    description: 'AI resume analyzer',
    tech_stack: ['React', 'OpenAI'],
    likes: 256,
  },
  {
    id: 4,
    slug: 'notch',
    name: 'Notch',
    category: 'Design System',
    live_url: '#',
    description: 'Component library',
    tech_stack: ['React', 'Framer Motion'],
    likes: 75,
  },
];

const ProjectsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="projects"
      className="relative z-10 -mt-10 sm:-mt-12 md:-mt-14 w-full rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] bg-[#050505] px-4 sm:px-6 md:px-10 pt-20 sm:pt-24 md:pt-32 pb-24"
    >
      <FadeIn y={40}>
        <h2
          className="hero-heading text-center font-black uppercase tracking-tight leading-none mb-16 sm:mb-20 md:mb-28"
          style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
        >
          Project
        </h2>
      </FadeIn>

      <div ref={containerRef} className="mx-auto max-w-7xl min-h-[50vh]">
        {HARDCODED_PROJECTS.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={i}
            total={HARDCODED_PROJECTS.length}
            containerRef={containerRef}
          />
        ))}
      </div>
    </section>
  );
};

export default ProjectsSection;
