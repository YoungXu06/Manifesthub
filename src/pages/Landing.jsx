import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowRight, FiStar, FiHeart, FiTarget, FiCheckCircle, FiZap, FiEye, FiTrendingUp } from 'react-icons/fi';
import ThemeToggle from '../components/common/ThemeToggle';
import useStore from '../store';

/* ─────────────────────────────────────────────
   Stars (static DOM, twinkling via CSS)
───────────────────────────────────────────── */
const STAR_COUNT = 160;

function useStars() {
  const [stars] = useState(() =>
    Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      size: Math.random() * 2 + 0.5,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 6,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.7 + 0.2,
    }))
  );
  return stars;
}

/* ─────────────────────────────────────────────
   Canvas Meteor System  (rAF, no React state)
───────────────────────────────────────────── */
function useMeteorCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let rafId;
    let meteors = [];
    let lastSpawn = 0;

    /* ── resize ── */
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* ── Meteor factory ── */
    const createMeteor = () => {
      // Spawn along the top edge or right edge, biased toward top-right quarter
      const spawnEdge = Math.random();
      let sx, sy;
      if (spawnEdge < 0.65) {
        // top edge, right 55%
        sx = canvas.width * (0.45 + Math.random() * 0.55);
        sy = -10;
      } else {
        // right edge, top 45%
        sx = canvas.width + 10;
        sy = canvas.height * Math.random() * 0.45;
      }

      // 135° in canvas coords: cos(135°)≈-0.707 (left), sin(135°)≈+0.707 (down)
      // → upper-right to lower-left diagonal
      const angleDeg = 135 + (Math.random() - 0.5) * 20;
      const angleRad = (angleDeg * Math.PI) / 180;
      const speed = 6 + Math.random() * 7;           // px/frame

      return {
        x: sx,
        y: sy,
        vx: Math.cos(angleRad) * speed,
        vy: Math.sin(angleRad) * speed,
        length: 90 + Math.random() * 140,             // visual trail length
        life: 0,                                       // 0 → 1
        maxLife: 55 + Math.random() * 55,              // frames
        thickness: 0.8 + Math.random() * 1.0,
        brightness: 0.7 + Math.random() * 0.3,        // peak white intensity
      };
    };

    /* ── Draw a single meteor ── */
    const drawMeteor = (m) => {
      // Ease: fade in first 15% of life, hold, fade out last 25%
      let alpha;
      const t = m.life / m.maxLife;
      if (t < 0.15)       alpha = t / 0.15;
      else if (t < 0.75)  alpha = 1;
      else                alpha = 1 - (t - 0.75) / 0.25;
      alpha *= m.brightness;

      // Tail start (farthest back) → head (current position)
      const tailX = m.x - m.vx * (m.length / (Math.abs(m.vx) + Math.abs(m.vy) || 1)) * (m.length / 12);
      const tailY = m.y - m.vy * (m.length / (Math.abs(m.vx) + Math.abs(m.vy) || 1)) * (m.length / 12);

      // Gradient: transparent at tail → bright white at head
      const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, `rgba(255,255,255,0)`);
      grad.addColorStop(0.5, `rgba(200,190,255,${alpha * 0.4})`);
      grad.addColorStop(0.85, `rgba(230,220,255,${alpha * 0.85})`);
      grad.addColorStop(1, `rgba(255,255,255,${alpha})`);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';      // additive blend → glowing
      ctx.strokeStyle = grad;
      ctx.lineWidth   = m.thickness;
      ctx.lineCap     = 'round';
      ctx.shadowColor = `rgba(180,160,255,${alpha * 0.6})`;
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      // Bright core (thinner, pure white)
      const coreGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      coreGrad.addColorStop(0, `rgba(255,255,255,0)`);
      coreGrad.addColorStop(0.7, `rgba(255,255,255,${alpha * 0.3})`);
      coreGrad.addColorStop(1, `rgba(255,255,255,${alpha})`);
      ctx.strokeStyle = coreGrad;
      ctx.lineWidth   = m.thickness * 0.35;
      ctx.shadowBlur  = 3;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      ctx.restore();
    };

    /* ── Animation loop ── */
    const tick = (timestamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn: staggered, 1.8–4s gap between meteors
      if (timestamp - lastSpawn > 1800 + Math.random() * 2200) {
        meteors.push(createMeteor());
        lastSpawn = timestamp;
      }

      meteors = meteors.filter(m => {
        m.x    += m.vx;
        m.y    += m.vy;
        m.life += 1;
        const offScreen = m.x < -200 || m.y > canvas.height + 200;
        const expired   = m.life >= m.maxLife;
        if (!offScreen && !expired) {
          drawMeteor(m);
          return true;
        }
        return false;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);
}

/* ─────────────────────────────────────────────
   Section components
───────────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, title, desc, gradient }) => (
  <div className="group relative flex flex-col items-start p-7 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-400 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/20">
    <div className={`mb-5 p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

const StepCard = ({ number, title, desc }) => (
  <div className="flex items-start gap-5">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/30">
      {number}
    </div>
    <div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const TestimonialCard = ({ quote, name, role, avatar }) => (
  <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
    <div className="flex mb-3">
      {[...Array(5)].map((_, i) => (
        <FiStar key={i} className="w-4 h-4 text-yellow-400 fill-current" style={{ fill: 'currentColor' }} />
      ))}
    </div>
    <p className="text-sm text-gray-300 italic mb-5 leading-relaxed">"{quote}"</p>
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
        {avatar}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-gray-400">{role}</p>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main Landing component
───────────────────────────────────────────── */
const Landing = () => {
  const { t } = useTranslation();
  const { user } = useStore();
  const stars = useStars();
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const meteorCanvasRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useMeteorCanvas(meteorCanvasRef);

  const features = [
    {
      icon: FiEye,
      title: 'Visual Dream Board',
      desc: 'Create stunning vision boards with images, quotes, and goals. Bring your dreams to life in a visual canvas.',
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      icon: FiHeart,
      title: 'Daily Gratitude & Habits',
      desc: 'Build a powerful daily practice with check-ins, gratitude journaling, and streak tracking.',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: FiTrendingUp,
      title: 'Track Your Progress',
      desc: 'Monitor every goal with progress bars, milestones, and an interactive calendar to stay on track.',
      gradient: 'from-emerald-500 to-teal-600',
    },
  ];

  const steps = [
    { number: '01', title: 'Create Your Vision', desc: 'Add your dreams as vision cards with images, descriptions, and emotional anchors.' },
    { number: '02', title: 'Build Daily Rituals', desc: 'Check in every day, write gratitude, and recite your personalized affirmations.' },
    { number: '03', title: 'Manifest & Celebrate', desc: 'Track your progress, complete goals, and celebrate every win on your journey.' },
  ];

  const testimonials = [
    {
      quote: "ManifestHub transformed how I approach my goals. Having everything visual and organized keeps me focused and motivated every single day.",
      name: "Sarah L.",
      role: "Entrepreneur",
      avatar: "S",
    },
    {
      quote: "The daily check-in and gratitude journal are game changers. My streak is at 60 days and I've manifested 3 major goals this year!",
      name: "Marcus T.",
      role: "Life Coach",
      avatar: "M",
    },
    {
      quote: "Beautiful, minimal, and powerful. I love how the vision board keeps me connected to what really matters in my life.",
      name: "Aiko N.",
      role: "Designer",
      avatar: "A",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-black">
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: floatY 5s ease-in-out infinite; }
        .animate-scale-in { animation: scaleIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-slide-up-d1 { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
        .animate-slide-up-d2 { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        .shimmer-text {
          background: linear-gradient(90deg, #a78bfa, #f472b6, #fbbf24, #a78bfa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .nebula-bg {
          background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(88, 28, 135, 0.35) 0%, transparent 70%),
                      radial-gradient(ellipse 60% 50% at 20% 70%, rgba(49, 46, 129, 0.25) 0%, transparent 60%),
                      radial-gradient(ellipse 50% 40% at 80% 30%, rgba(157, 23, 77, 0.2) 0%, transparent 60%);
        }
        .glass-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
        }
        .cta-glow {
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.4), 0 0 80px rgba(139, 92, 246, 0.15);
        }
      `}</style>

      {/* ── Cosmic Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* deep space gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030008] via-[#0e0520] to-[#050012]" />
        {/* nebula glow */}
        <div className="absolute inset-0 nebula-bg" />
        {/* stars */}
        {stars.map(s => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              left: `${s.left}%`,
              top: `${s.top}%`,
              opacity: s.opacity,
              animation: `twinkle ${s.duration}s infinite ${s.delay}s`,
            }}
          />
        ))}
        {/* Canvas meteor system — rAF driven, no React re-renders */}
        <canvas
          ref={meteorCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ mixBlendMode: 'screen' }}
        />
        {/* parallax nebula disc */}
        <div
          className="absolute top-1/3 left-1/2 w-[900px] h-[900px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            transform: `translate(-50%, calc(-50% + ${scrollY * 0.08}px))`,
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Silhouette person + glow */}
        <div
          className="absolute bottom-0 left-1/2 w-full max-w-xl h-[38vh] pointer-events-none"
          style={{
            transform: `translate(-50%, ${scrollY * 0.08}px)`,
          }}
        >
          {/* person svg */}
          <div
            className="w-full h-full"
            style={{
              backgroundImage: "url('/person.svg')",
              backgroundSize: 'contain',
              backgroundPosition: 'center bottom',
              backgroundRepeat: 'no-repeat',
              filter: 'brightness(0.85) invert(1) opacity(0.55) drop-shadow(0 0 12px rgba(200,180,255,0.3))',
            }}
          />
          {/* radial glow beneath the figure */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 60% 30% at 50% 90%, rgba(139,92,246,0.18) 0%, transparent 70%)',
            }}
          />
        </div>
      </div>

      {/* ── Content Layer ── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── Navbar ── */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/manifest-hub-logo.jpg"
                alt="ManifestHub"
                className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow"
              />
              <span className="text-lg font-bold text-white tracking-tight">{t('app.name')}</span>
            </Link>

            {/* Nav actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <Link to="/dashboard" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
                  Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors hidden sm:block">
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section ref={heroRef} className="flex-1 flex items-center justify-center min-h-[88vh] px-5">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="animate-slide-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Law of Attraction · Goal Manifestation Platform
            </div>

            {/* Headline */}
            <h1 className="animate-scale-in text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
              Manifest Your Dreams<br />
              <span className="shimmer-text">Into Reality</span>
            </h1>

            {/* Sub */}
            <p className="animate-slide-up-d1 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Your thoughts create your reality. Visualize your goals, build powerful daily habits,
              and watch your dreams transform into achievements — one intention at a time.
            </p>

            {/* CTAs */}
            <div className="animate-slide-up-d2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 text-white font-semibold text-base hover:from-purple-600 hover:via-violet-600 hover:to-indigo-700 transition-all cta-glow hover:scale-105 active:scale-100"
              >
                Start Your Journey — Free
                <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/15 text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/5 font-medium text-base transition-all"
              >
                Already have an account
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                <span>No credit card required</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-700" />
              <div className="hidden sm:flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Free forever plan</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-700" />
              <div className="hidden sm:flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                <span>2 min to set up</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-24 px-5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Why ManifestHub</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything you need to manifest</h2>
              <p className="mt-4 text-gray-400 max-w-xl mx-auto text-base leading-relaxed">
                A complete system to turn your intentions into reality, built on proven Law of Attraction principles.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section className="py-24 px-5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">The Process</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">3 steps to manifest your reality</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-8">
                {steps.map(s => <StepCard key={s.number} {...s} />)}
              </div>
              {/* Illustration / preview mockup */}
              <div className="hidden md:flex items-center justify-center">
                <div className="relative w-72 h-80 animate-float">
                  {/* mock dashboard card */}
                  <div className="absolute inset-0 rounded-3xl glass-card overflow-hidden p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <FiTarget className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="h-2.5 w-28 rounded bg-white/20 mb-1" />
                        <div className="h-2 w-16 rounded bg-white/10" />
                      </div>
                    </div>
                    <div className="h-32 rounded-xl bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-white/10" />
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span><span className="text-purple-300">73%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['✓ Affirmation', '✓ Gratitude'].map(tag => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* floating accent dots */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-purple-500/20 blur-xl" />
                  <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-indigo-500/20 blur-xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-24 px-5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-pink-400 text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">People are manifesting with us</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.map(t => <TestimonialCard key={t.name} {...t} />)}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-28 px-5">
          <div className="max-w-2xl mx-auto text-center">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 blur-3xl rounded-full" />
              <div className="relative p-5 rounded-2xl glass-card">
                <FiZap className="w-8 h-8 text-purple-400 mx-auto" />
              </div>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
              Your best life is<br />
              <span className="shimmer-text">one decision away</span>
            </h2>
            <p className="text-gray-400 mb-10 text-lg leading-relaxed">
              Join thousands of people who are already manifesting their dreams with ManifestHub. Start for free, no credit card needed.
            </p>
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 text-white font-bold text-lg hover:from-purple-600 hover:via-violet-600 hover:to-indigo-700 transition-all cta-glow hover:scale-105 active:scale-100"
            >
              Begin Your Journey Today
              <FiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/5 py-8 px-5">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <img
                src="/manifest-hub-logo.jpg"
                alt="ManifestHub"
                className="w-5 h-5 rounded object-cover"
              />
              <span>{t('app.name')}</span>
            </div>
            <p>&copy; {new Date().getFullYear()} ManifestHub. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-gray-300 transition-colors">Sign in</Link>
              <Link to="/register" className="hover:text-gray-300 transition-colors">Get started</Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Landing;
