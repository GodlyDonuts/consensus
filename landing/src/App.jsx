import { motion } from 'framer-motion';
import {
  Download,
  Terminal,
  Chrome,
  Server,
  Mic,
  Brain,
  RefreshCw,
  Zap,
  ArrowRight,
  Sparkles,
  Database,
  AudioLines,
  X,
  Code
} from 'lucide-react';
import './index.css';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const glowVariant = {
  initial: { opacity: 0.5, scale: 1 },
  hover: { opacity: 1, scale: 1.05, transition: { duration: 0.3 } }
};

// Hero Section
const Hero = () => (
  <section className="relative min-h-screen flex flex-col justify-center items-center px-6 overflow-hidden">
    {/* Background Effects */}
    <div className="absolute inset-0 bg-grid opacity-20 z-0 pointer-events-none"></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-action-blue/20 rounded-full blur-[120px] animate-blob z-0 pointer-events-none"></div>
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-action-purple/20 rounded-full blur-[100px] z-0 pointer-events-none"></div>

    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="relative z-10 max-w-5xl text-center"
    >
      <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
        <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium text-gray-300 flex items-center gap-2">
          <Sparkles size={14} className="text-yellow-400" />
          The Ultimate Hackathon Tool
        </span>
      </motion.div>

      <motion.h1
        variants={fadeInUp}
        className="text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.9]"
      >
        <span className="block text-white">MEETINGS TO</span>
        <span className="text-gradient-blue glow-text">CODE. FAST.</span>
      </motion.h1>

      <motion.p
        variants={fadeInUp}
        className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light"
      >
        DevDraft AI streams client requirements directly into your IDE.
        It handles the pivots, remembers the context, and <span className="text-white font-medium">writes the PRD while they speak.</span>
      </motion.p>

      <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-6">
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="https://github.com/GodlyDonuts/consensus"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-lg font-bold rounded-full overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          <Download size={24} />
          Download Extension
        </motion.a>
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="#how-it-works"
          className="inline-flex items-center gap-3 bg-white/5 text-white border border-white/10 px-8 py-4 text-lg font-bold rounded-full hover:bg-white/10 transition-colors backdrop-blur-md"
        >
          How It Works
          <ArrowRight size={24} />
        </motion.a>
      </motion.div>
    </motion.div>
  </section>
);

// How It Works Section
const HowItWorks = () => {
  const steps = [
    {
      icon: Terminal,
      title: "Clone & Setup",
      code: "git clone repo",
      desc: "Clone the repo and install dependencies."
    },
    {
      icon: Chrome,
      title: "Load Extension",
      code: "chrome://extensions",
      desc: "Enable Developer Mode, 'Load Unpacked'."
    },
    {
      icon: Server,
      title: "Start Backend",
      code: "uvicorn main:app",
      desc: "Power the Gemini + Deepgram engine."
    },
    {
      icon: Mic,
      title: "Analyze",
      code: "Start Analysis",
      desc: "Open side panel in any meeting tab."
    }
  ];

  return (
    <section id="how-it-works" className="relative py-32 px-6">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="max-w-7xl mx-auto"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-4xl md:text-6xl font-bold tracking-tight mb-20 text-center"
        >
          Setup in <span className="text-gradient-blue">Seconds</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="glass-card p-8 rounded-3xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-surface-highlight rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:border-action-blue/50 transition-colors">
                  <step.icon size={28} className="text-white group-hover:text-action-blue transition-colors" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <code className="block bg-black/50 text-gray-300 text-sm px-3 py-2 rounded-lg mb-4 font-mono border border-white/5">
                  $ {step.code}
                </code>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

// Core Features Bento Grid
const CoreFeatures = () => {
  return (
    <section className="py-32 px-6 relative">
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-action-blue/10 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="max-w-7xl mx-auto relative z-10"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-center"
        >
          Built for <span className="text-white">Speed</span>
        </motion.h2>
        <motion.p variants={fadeInUp} className="text-xl text-gray-400 text-center mb-20 max-w-2xl mx-auto">
          A multi-model AI architecture designed to keep up with the fastest pivoters.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          {/* Feature 1: Large Span */}
          <motion.div variants={fadeInUp} className="glass-card md:col-span-2 p-10 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-64 h-64 bg-action-purple/20 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-action-purple/30 transition-colors duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md">
                <Brain size={24} className="text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Smart Context Memory</h3>
              <p className="text-gray-400 text-lg max-w-md">Summarizes 50k+ characters in real-time. It doesn't just record; it understands the thread of conversation.</p>
            </div>
            <div className="absolute bottom-0 right-0 p-10 opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500">
              {/* Decorative Element */}
              <div className="flex gap-2">
                <div className="w-20 h-2 bg-white/20 rounded-full"></div>
                <div className="w-10 h-2 bg-action-purple/50 rounded-full"></div>
              </div>
              <div className="flex gap-2 mt-2 ml-4">
                <div className="w-10 h-2 bg-white/20 rounded-full"></div>
                <div className="w-24 h-2 bg-white/10 rounded-full"></div>
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Instruction Overrides */}
          <motion.div variants={fadeInUp} className="glass-card p-10 rounded-3xl flex flex-col justify-between group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md">
                <RefreshCw size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Instruction Overrides</h3>
              <p className="text-gray-400">"Latest Instruction Trumps All" logic. Indecisive clients? No problem.</p>
            </div>
          </motion.div>

          {/* Feature 3: Data in Motion */}
          <motion.div variants={fadeInUp} className="glass-card p-10 rounded-3xl flex flex-col justify-between group overflow-hidden">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md">
                <Zap size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Data in Motion</h3>
              <p className="text-gray-400">Streaming Kafka topics via Confluent. Event-driven requirements.</p>
            </div>
          </motion.div>

          {/* Feature 4: Tech Stack (Span 2) */}
          <motion.div variants={fadeInUp} className="glass-card md:col-span-2 p-10 rounded-3xl flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-30"></div>
            <div className="relative z-10 flex flex-wrap gap-8 items-center justify-center opacity-70">
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="text-blue-400" /> <span className="font-bold">Gemini</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Database className="text-green-400" /> <span className="font-bold">Supabase</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Code className="text-yellow-400" /> <span className="font-bold">Deepgram</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-center mt-8 z-10">Powered by the Modern Stack</h3>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

// Live PRD Preview
const LivePRDPreview = () => {
  const transcript = [
    { speaker: "Client", text: "I want a Kanban board, like Trello..." },
    { speaker: "Dev", text: "Noted. Backend preferences?" },
    { speaker: "Client", text: "Let's use Firebase." },
    { speaker: "Client", text: "Wait, actually Supabase is better." },
    { speaker: "Client", text: "And make the UI light mode." }
  ];

  return (
    <section className="py-32 px-6 bg-surface-highlight/30">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="max-w-7xl mx-auto"
      >
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Watch it <span className="text-gradient-blue">Build</span>
          </h2>
          <p className="text-xl text-gray-400">Real-time visualizations of your requirements.</p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 h-auto xl:h-[600px]">
          {/* Transcript Panel */}
          <motion.div variants={fadeInUp} className="glass-panel rounded-2xl p-0 flex flex-col h-full overflow-hidden border-2 border-white/5">
            <div className="bg-white/5 p-4 border-b border-white/5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="text-xs font-mono text-gray-500 ml-2">transcript.log</span>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 font-mono text-sm">
              {transcript.map((line, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.3 }}
                  viewport={{ once: true }}
                  className="flex gap-4"
                >
                  <span className={`flex-shrink-0 opacity-50 ${line.speaker === 'Client' ? 'text-blue-400' : 'text-green-400'}`}>
                    [{line.speaker}]
                  </span>
                  <span className="text-gray-300">{line.text}</span>
                </motion.div>
              ))}
              <div className="flex items-center gap-2 text-action-blue animate-pulse">
                <span className="w-1.5 h-4 bg-action-blue"></span>
              </div>
            </div>
          </motion.div>

          {/* Kanban Board */}
          <motion.div variants={fadeInUp} className="bg-surface rounded-2xl p-6 h-full flex flex-col border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-action-blue to-action-purple"></div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold flex items-center gap-2">
                <Brain size={20} className="text-action-purple" />
                Generated PRD
              </h3>
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">v0.4.1</span>
            </div>

            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Active Column */}
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Approved</span>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="bg-surface-highlight border border-white/5 p-4 rounded-lg hover:border-action-blue/50 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">FEAT</span>
                  </div>
                  <p className="font-medium text-sm text-gray-200 group-hover:text-white">Kanban Board UI</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 }}
                  className="bg-surface-highlight border border-white/5 p-4 rounded-lg hover:border-action-blue/50 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">TECH</span>
                  </div>
                  <p className="font-medium text-sm text-gray-200 group-hover:text-white">Supabase Backend</p>
                  <p className="text-xs text-gray-500 mt-1">Postgres DB + Auth</p>
                </motion.div>
              </div>

              {/* Superseded Column */}
              <div className="flex flex-col gap-3 opacity-50">
                <span className="text-xs uppercase tracking-widest text-gray-600 font-bold mb-2">Discarded</span>
                <motion.div
                  className="bg-surface-highlight/30 border border-dashed border-white/5 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-500/10 text-gray-400">TECH</span>
                    <X size={12} className="text-red-500" />
                  </div>
                  <p className="font-medium text-sm text-gray-500 line-through">Firebase Backend</p>
                  <p className="text-xs text-red-500 mt-2 font-mono">&gt;&gt; Overridden</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

// Footer
const Footer = () => (
  <footer className="py-20 px-6 border-t border-white/5 bg-midnight relative overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-action-blue/5 blur-[100px] rounded-full pointer-events-none"></div>
    <div className="max-w-4xl mx-auto text-center relative z-10">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <motion.h2 variants={fadeInUp} className="text-5xl md:text-8xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
          READY TO <br /> DRAFT?
        </motion.h2>
        <motion.div variants={fadeInUp}>
          <a
            href="https://github.com/GodlyDonuts/consensus"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-black px-12 py-5 text-xl font-bold rounded-full hover:bg-gray-200 transition-colors"
          >
            <Download size={24} />
            Get DevDraft AI
          </a>
        </motion.div>
        <motion.div variants={fadeInUp} className="mt-16 text-gray-600 text-sm font-medium tracking-widest">
          BUILT FOR HACKATHONS • OPEN SOURCE
        </motion.div>
      </motion.div>
    </div>
  </footer>
);

// Main App
function App() {
  return (
    <div className="bg-midnight min-h-screen text-white selection:bg-action-blue selection:text-white">
      <Hero />
      <HowItWorks />
      <CoreFeatures />
      <LivePRDPreview />
      <Footer />
    </div>
  );
}

export default App;
