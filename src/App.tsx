import { motion } from 'motion/react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Smartphone, Bell, Code, ArrowRight, Server, Wrench, Bot, Shield } from 'lucide-react';
import { RelayIcon } from './components/RelayLogo';
import { INTEGRATIONS } from './features/landing/content';
import { FAQSection } from './features/landing/FAQSection';
import { LandingFooter } from './features/landing/LandingFooter';
import { LandingNav } from './features/landing/LandingNav';
import { MobileDownloadSection } from './features/landing/MobileDownloadSection';
import { useLandingPage } from './features/landing/useLandingPage';

interface LandingFeatureCard {
  description: string;
  icon: ReactElement;
  title: string;
}

interface LandingUseCaseCard {
  description: string;
  icon: ReactElement;
  note?: string;
  quote?: string;
  tags?: string[];
  title: string;
  workflow?: string[];
}

interface LandingStep {
  desc: string;
  step: string;
  title: string;
}

const FEATURE_CARDS: LandingFeatureCard[] = [
  {
    description:
      'Stop polling your own terminals. Use our lightweight SDK to trigger instant mobile alerts when your agents finish a task or your trading bot executes a move.',
    icon: <Bell className="w-6 h-6 text-accent" />,
    title: 'Push Notifications via SDK',
  },
  {
    description:
      "Don't waste time on Swift or Kotlin. Relay wraps your web-based dashboards in a high-performance native shell with support for haptics and deep-linking.",
    icon: <Smartphone className="w-6 h-6 text-accent" />,
    title: 'Native Mobile Runtime',
  },
  {
    description:
      "Skip the complex OAuth setup. Relay handles the mobile login and injects secure identity headers into your webview requests, so your backend always knows it's you.",
    icon: <Shield className="w-6 h-6 text-accent" />,
    title: 'Auth-as-a-Header',
  },
  {
    description:
      'Add action buttons to your notifications. Approve a deployment or kill a runaway agent directly from your lock screen with a single tap.',
    icon: <Server className="w-6 h-6 text-accent" />,
    title: 'Interactive Webhooks',
  },
] as const;

const USE_CASE_CARDS: LandingUseCaseCard[] = [
  {
    description:
      "You're building a custom dashboard with Claude and Cursor and need it on your phone without the App Store headache.",
    icon: <Terminal className="w-6 h-6 text-accent" />,
    title: 'The Vibe-Coder',
  },
  {
    description:
      "You're running autonomous agents and need a reliable way to get an approve signal while you're away from your desk.",
    icon: <Bot className="w-6 h-6 text-accent" />,
    title: 'The AI Agent Builder',
  },
  {
    description:
      "You've built a custom Home Assistant panel or a private monitoring tool and want it to feel like a first-class citizen on iOS or Android.",
    icon: <Wrench className="w-6 h-6 text-accent" />,
    title: 'The Home Automator',
  },
] as const;

const HOW_IT_WORKS_STEPS: LandingStep[] = [
  {
    desc: "Provide the URL of your dashboard—whether it's a local tunnel, a Vercel deploy, or a self-hosted instance.",
    step: '01',
    title: 'Point to your URL',
  },
  {
    desc: 'Install @relayapp/sdk and add three lines of code to start triggering notifications from your backend or frontend.',
    step: '02',
    title: 'Drop in the SDK',
  },
  {
    desc: 'Open the Relay mobile app to see your tool wrapped in a native interface with all your notifications synced.',
    step: '03',
    title: 'Get the App',
  },
] as const;

export default function App() {
  const {
    activeTab,
    isSignedIn,
    mobileMenuOpen,
    navLogoRotate,
    openFAQ,
    setActiveTab,
    setMobileMenuOpen,
    setOpenFAQ,
    showNotification,
  } = useLandingPage();

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans">
      <LandingNav
        isSignedIn={isSignedIn}
        mobileMenuOpen={mobileMenuOpen}
        navLogoRotate={navLogoRotate}
        onToggleMobileMenu={() => setMobileMenuOpen((isOpen) => !isOpen)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      <main>
        {/* Dot grid — full width, hero height, organic fade from edges inward */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-16 z-0 dot-grid"
          style={{
            height: '750px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 30%, black 80%), linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 30%, black 80%), linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10"
          >
            <motion.div
              animate={{
                rotate:  [0, 0, 0, 360, 360, 360],
                scale:   [1, 1, 1.15, 1.15, 1, 1],
                y:       [0, 0, -12, -12, 0, 0],
              }}
              transition={{
                duration: 3,
                delay: 0.5,
                ease: [0.4, 0, 0.2, 1],
                times:  [0, 0.2, 0.35, 0.65, 0.8, 1],
              }}
              className="mx-auto mb-10 w-fit"
            >
              <RelayIcon size={180} className="text-accent" />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.08]">
              The mobile runtime for<br />
              tools you build with AI.
            </h1>
            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Bridge the gap between your custom dashboards and your phone. Add push notifications, mobile wrapping, and secure auth to your vibe-coded tools in 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="h-12 px-6 rounded-lg bg-accent text-white font-medium flex items-center gap-2 hover:bg-blue-600 transition-all w-full sm:w-auto justify-center cursor-pointer">
                <ArrowRight className="w-4 h-4" />
                Get Started Free
              </Link>
              <Link to="/#api" className="h-12 px-6 rounded-lg bg-surface text-text-main font-medium border border-border flex items-center gap-2 hover:bg-surface-hover transition-all w-full sm:w-auto justify-center">
                View Documentation
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Hero Visual (Terminal -> Webhook -> Phone) */}
        <section className="pt-20 pb-12 px-6 max-w-6xl mx-auto overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">

            {/* Left: Terminal — theme-aware */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-[340px] bg-surface border border-border rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="h-10 border-b border-border flex items-center px-4 gap-2 bg-surface-hover">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
                <div className="ml-2 text-xs font-mono text-text-muted">deploy.sh</div>
              </div>
              <div className="p-5 font-mono text-xs text-text-muted space-y-2">
                <p><span className="text-accent">➜</span> <span className="text-blue-400">~</span> ./deploy.sh</p>
                <p>Building project...</p>
                <p>Running tests...</p>
                <p className="text-emerald-500">✓ All tests passed</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-text-main">import &#123; Relay &#125; from '@relayapp/sdk'</p>
                  <p className="text-text-main">const relay = new Relay(&#123; token: process.env.RELAY_TOKEN &#125;)</p>
                  <p className="text-text-main">await relay.notify(&#123; title: 'Build passed' &#125;)</p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 6, repeat: Infinity, times: [0, 0.1, 0.8, 1] }}
                    className="text-emerald-500 mt-2"
                  >
                    {"{"}"success": true{"}"}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Middle: Animated Webhook Line */}
            <div className="hidden md:flex items-center justify-center w-32 relative h-px bg-border">
              <motion.div
                animate={{ x: [0, 128] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4.5, ease: "easeInOut" }}
                className="absolute left-0 w-4 h-4 -ml-2 rounded-full bg-accent shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10"
              />
              <div className="absolute top-4 text-[10px] font-mono text-text-muted uppercase tracking-widest">Webhook</div>
            </div>

            {/* Right: Phone — theme-aware */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-[280px] h-[560px] bg-bg border-[6px] border-border rounded-[2.5rem] relative overflow-hidden shadow-2xl"
            >
              {/* Dynamic Island */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-surface-hover rounded-b-2xl z-20"></div>

              {/* Screen */}
              <div className="absolute inset-0 bg-bg p-4 pt-12">
                {/* App Grid */}
                <div className="grid grid-cols-4 gap-4 opacity-30 mt-8">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-surface border border-border"></div>
                  ))}
                </div>

                {/* Notification */}
                <motion.div
                  initial={{ y: -100, opacity: 0, scale: 0.9 }}
                  animate={{
                    y: showNotification ? 0 : -100,
                    opacity: showNotification ? 1 : 0,
                    scale: showNotification ? 1 : 0.9
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-12 left-3 right-3 bg-surface/95 backdrop-blur-xl border border-border rounded-2xl p-3 shadow-2xl z-30"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <RelayIcon size={22} className="text-white" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-text-main text-sm font-semibold">Relay</p>
                        <p className="text-text-muted text-[10px]">now</p>
                      </div>
                      <p className="text-text-main text-sm font-medium leading-snug">Build passed</p>
                      <p className="text-text-muted text-xs mt-0.5 leading-snug">All tests passed. Tap to open your dashboard.</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </section>

        <MobileDownloadSection />

        {/* Features */}
        <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Everything your personal tool needs.</h2>
            <p className="text-text-muted max-w-2xl mx-auto text-lg">Ship vibe-coded dashboards with push, auth, and a native wrapper without touching Swift or Kotlin.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURE_CARDS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group h-full bg-surface border border-border rounded-2xl p-8 hover:border-accent/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-text-muted leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section id="use-cases" className="py-24 px-6 max-w-6xl mx-auto border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Who it's for.</h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">Built for developers who build their own tools — vibe-coders, agent operators, and self-hosters.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {USE_CASE_CARDS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="h-full bg-surface border border-border rounded-2xl p-8 flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-text-muted leading-relaxed text-sm mb-6">
                  {item.description}
                </p>

                {item.note ? (
                  <p className="text-sm text-text-muted mb-6">{item.note}</p>
                ) : null}

                {item.workflow ? (
                  <div className="bg-bg border border-border rounded-xl p-4 font-mono text-xs text-text-muted space-y-1 mb-6">
                    {item.workflow.map((line, lineIndex) => (
                      <div key={line}>
                        <p>{line}</p>
                        {lineIndex < item.workflow.length - 1 ? (
                          <p className="text-accent">  &darr;</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {item.quote ? (
                  <div className="bg-bg border border-border rounded-xl p-4 mb-6">
                    <p className="text-xs font-mono text-text-muted italic">{item.quote}</p>
                  </div>
                ) : null}

                {item.tags ? (
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-hover text-text-muted border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-6 max-w-5xl mx-auto border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">From idea to mobile app in minutes.</h2>
            <p className="text-text-muted text-lg">Point Relay at your dashboard, drop in the SDK, and open the native app—done.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {HOW_IT_WORKS_STEPS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-5xl font-bold text-accent/50 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-surface border border-border rounded-2xl p-8 max-w-3xl mx-auto shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Code className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Integrate in seconds.</h3>
                <p className="text-sm text-text-muted">Use @relayapp/sdk to send interactive notifications from any script.</p>
              </div>
            </div>
            <div className="bg-bg rounded-xl p-6 overflow-x-auto border border-border">
              <pre className="font-mono text-sm text-text-muted leading-relaxed">
                <code>
{`import { Relay } from '@relayapp/sdk'

const relay = new Relay({
  token: process.env.RELAY_TOKEN
})

// Trigger a notification with an action button
await relay.notify({
  title: 'Agent task complete',
  body: 'Obelisk finished the codebase audit.',
  actions: [{ label: 'View Report', url: 'https://yourdomain.com/api/actions/view' }]
})`}
                </code>
              </pre>
            </div>
          </motion.div>
        </section>

        {/* API & Integrations */}
        <section id="api" className="py-24 px-6 max-w-6xl mx-auto border-t border-border">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Simple, predictable API.</h2>
              <p className="text-text-muted mb-8 text-lg leading-relaxed">
                No complex authentication flows. Just a single endpoint that accepts a JSON payload. Integrate it into any script or pipeline in seconds.
              </p>

              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-2 py-1 rounded bg-accent/10 text-accent text-xs font-mono font-bold">POST</span>
                  <code className="text-sm font-mono text-text-main">https://relayapp.dev/webhook</code>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <code className="text-text-main font-mono text-sm">token</code>
                    <span className="text-text-muted text-xs">string, required</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <code className="text-text-main font-mono text-sm">title</code>
                    <span className="text-text-muted text-xs">string, required</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <code className="text-text-main font-mono text-sm">body</code>
                    <span className="text-text-muted text-xs">string, optional</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Code tabs — theme-aware */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl"
            >
              <div className="flex border-b border-border overflow-x-auto hide-scrollbar bg-surface-hover">
                {(Object.keys(INTEGRATIONS) as Array<keyof typeof INTEGRATIONS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                      activeTab === key
                        ? 'border-accent text-text-main bg-surface'
                        : 'border-transparent text-text-muted hover:text-text-main hover:bg-surface/50'
                    }`}
                  >
                    {INTEGRATIONS[key].name}
                  </button>
                ))}
              </div>
              <div className="p-6 overflow-x-auto bg-bg">
                <pre className="font-mono text-sm text-text-muted leading-relaxed">
                  <code>{INTEGRATIONS[activeTab].code}</code>
                </pre>
              </div>
            </motion.div>
          </div>
        </section>

        <FAQSection
          openFAQ={openFAQ}
          onToggleFAQ={(index) => setOpenFAQ(openFAQ === index ? null : index)}
        />

        {/* CTA */}
        <section className="py-24 px-6 border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Ready to ship your mobile tool?</h2>
            <p className="text-text-muted text-lg mb-8">Join the wave of developers building their own infra. Create a free account and get your first notification today.</p>
            <Link to="/signup" className="inline-flex h-12 px-8 rounded-lg bg-accent text-white font-medium items-center gap-2 hover:bg-blue-600 transition-all cursor-pointer">
              <ArrowRight className="w-4 h-4" />
              Get Started Free
            </Link>
          </motion.div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
