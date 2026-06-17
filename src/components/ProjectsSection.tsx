import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import FadeIn from './FadeIn';
import LiveProjectButton from './LiveProjectButton';

interface Project {
  id: number;
  name: string;
  category: string;
  live_url: string;
  images: { col1Image1: string; col1Image2: string; col2Image: string };
  defaultLikes: number;
}

const PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Forge',
    category: 'Creative Studio',
    live_url: '#',
    images: { col1Image1: '/Forge.png', col1Image2: '/Forge1.png', col2Image: '/Forge2.png' },
    defaultLikes: 142,
  },
  {
    id: 2,
    name: 'LawLab',
    category: 'Legal Tech',
    live_url: '#',
    images: { col1Image1: '/lawlab.png', col1Image2: '/lawlab1.png', col2Image: '/lawlab2.png' },
    defaultLikes: 89,
  },
  {
    id: 3,
    name: 'ResumeIQ',
    category: 'AI Analyzer',
    live_url: '#',
    images: {
      col1Image1: '/resumeiq-hero.png',
      col1Image2: '/resumeiq-feedback.png',
      col2Image: '/resumeiq-score.png',
    },
    defaultLikes: 256,
  },
  {
    id: 4,
    name: 'Notch',
    category: 'Design System',
    live_url: '#',
    images: { col1Image1: '/notch-hero.png', col1Image2: '/notch-pricing.png', col2Image: '/notch-mockup.png' },
    defaultLikes: 75,
  },
];

interface ProjectCardProps {
  project: Project;
  index: number;
  total: number;
}

const ProjectCard = ({ project, index, total }: ProjectCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [likes, setLikes] = useState(project.defaultLikes);
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLikes((l) => l - 1);
      setLiked(false);
    } else {
      setLikes((l) => l + 1);
      setLiked(true);
    }
    // Fire-and-forget to the API — no await, no blocking, no error shown to user
    const API_URL = import.meta.env.DEV ? 'http://localhost:5173' : '';
    fetch(`${API_URL}/api/projects/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id }),
    }).catch(() => {
      /* silently ignore */
    });
  };

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'start start'],
  });

  const targetScale = 1 - (total - 1 - index) * 0.03;
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);
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
                  className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-[#1A1A1A]/80 hover:bg-[#2A2A2A] transition-all duration-200 ease-out active:scale-95 border px-3 py-1 sm:px-4 sm:py-1.5 rounded-full cursor-pointer group ${liked ? 'border-blue-500/70' : 'border-[#333] hover:border-blue-500/50'}`}
                >
                  <span
                    className={`transition-transform origin-center ${liked ? 'scale-125' : 'group-hover:scale-125'}`}
                  >
                    💙
                  </span>
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
                src={project.images.col1Image1}
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
                src={project.images.col1Image2}
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
              src={project.images.col2Image}
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
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} total={PROJECTS.length} />
        ))}
      </div>
    </section>
  );
};

export default ProjectsSection;
