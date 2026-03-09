import { motion } from 'motion/react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Smartphone, Bell, LayoutDashboard, Code, ArrowRight, Server, CheckCircle2, Gauge, Wrench, Rocket, Bot, Activity, TrendingUp, Shield, MonitorSmartphone, Network } from 'lucide-react';
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
      'Grafana, Home Assistant, n8n, CI/CD pipelines, or custom internal tools. If it has a URL and renders in a browser, you can save it as a native app in Relay.',
    icon: <LayoutDashboard className="w-6 h-6 text-accent" />,
    title: 'Save any dashboard',
  },
  {
    description:
      'Each saved dashboard gets a unique webhook token. Send a POST request to trigger a secure push notification.',
    icon: <Bell className="w-6 h-6 text-accent" />,
    title: 'Webhook alerts',
  },
  {
    description:
      "Tapping a notification doesn't just open the app — it opens the exact dashboard associated with that alert instantly.",
    icon: <Smartphone className="w-6 h-6 text-accent" />,
    title: 'Tap to open',
  },
  {
    description:
      'No complex SDKs to install. Relay works with any system, script, or service that can send a simple HTTP POST request. Bash, Python, Node, GitHub Actions — it all works.',
    icon: <Server className="w-6 h-6 text-accent" />,
    title: 'Universal compatibility',
  },
] as const;

const USE_CASE_CARDS: LandingUseCaseCard[] = [
  {
    description:
      'Run agent systems like Obelisk, OpenClaw, or other automations and receive instant alerts when tasks complete or fail.',
    icon: <Bot className="w-6 h-6 text-accent" />,
    tags: ['Obelisk', 'OpenClaw', 'Custom Agents'],
    title: 'Monitor AI Agents',
    workflow: [
      'Agent finishes job',
      'Webhook sent to Relay',
      'Phone notification',
      'Tap → open agent dashboard',
    ],
  },
  {
    description:
      'Relay works with self-hosted dashboards like Grafana, Home Assistant, Kubernetes dashboards, internal tools, and AI agent control panels.',
    icon: <Wrench className="w-6 h-6 text-accent" />,
    note: 'Keep everything private on your network while still receiving alerts on your phone.',
    tags: ['Grafana', 'Home Assistant', 'Kubernetes', 'Internal Tools', 'AI Panels'],
    title: 'Self-Hosted Dashboards',
  },
  {
    description:
      'Ideal for monitoring CI pipelines, server deployments, automation workflows, and background jobs.',
    icon: <Activity className="w-6 h-6 text-accent" />,
    tags: ['CI/CD', 'Deployments', 'Cron Jobs', 'n8n'],
    title: 'Monitor Automations',
    workflow: ['Deployment finished', 'Webhook → Relay', 'Phone alert'],
  },
  {
    description:
      'Receive alerts when trades execute, strategies trigger, or errors occur, then jump straight into the relevant dashboard.',
    icon: <TrendingUp className="w-6 h-6 text-accent" />,
    tags: ['Trade Alerts', 'Strategy Triggers', 'Error Monitoring', 'Portfolio Bots'],
    title: 'Trading Bots & Monitoring',
    workflow: ['Trade executed', 'Strategy triggered', 'Relay alert sent'],
  },
  {
    description:
      'Relay loads dashboards inside a mobile webview. For the best experience, ask your AI or frontend tool to generate a narrow-screen version.',
    icon: <MonitorSmartphone className="w-6 h-6 text-accent" />,
    quote:
      '"Create a mobile responsive version of this dashboard UI optimized for a narrow phone screen. Use stacked layouts and large touch targets."',
    title: 'Best Practice for Dashboards',
  },
  {
    description:
      "Most self-hosted dashboards aren't publicly accessible. Use Tailscale to securely access your internal dashboards from your phone.",
    icon: <Network className="w-6 h-6 text-accent" />,
    title: 'Private Network Access',
    workflow: [
      'Self-hosted server',
      'Tailscale network',
      'Phone running Relay',
      'Dashboard loads securely',
    ],
  },
] as const;

const HOW_IT_WORKS_STEPS: LandingStep[] = [
  {
    desc: 'Open the Relay app and add your dashboard URL (e.g., your Grafana instance).',
    step: '01',
    title: 'Add a URL',
  },
  {
    desc: 'Relay generates a unique, secure webhook token for that specific dashboard.',
    step: '02',
    title: 'Get a Token',
  },
  {
    desc: 'Your systems POST to the webhook. You get a push notification instantly.',
    step: '03',
    title: 'Send a POST',
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
              Push notifications for your<br />
              dashboards and scripts.
            </h1>
            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Bridge the gap between your critical infrastructure and your phone. Trigger instant mobile alerts from any script, server, or internal tool with a simple webhook.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="h-12 px-6 rounded-lg bg-accent text-white font-medium flex items-center gap-2 hover:bg-emerald-600 transition-all w-full sm:w-auto justify-center cursor-pointer">
                <ArrowRight className="w-4 h-4" />
                Get Started Free
              </Link>
              <Link to="/pricing" className="h-12 px-6 rounded-lg bg-surface text-text-main font-medium border border-border flex items-center gap-2 hover:bg-surface-hover transition-all w-full sm:w-auto justify-center">
                View Pricing
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
                  <p className="text-text-main">curl -X POST relayapp.dev/webhook \</p>
                  <p className="text-text-main">  -d '&#123;"title": "Build passed"&#125;'</p>
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
                      <p className="text-text-muted text-xs mt-0.5 leading-snug">All tests passed. Tap to open Grafana.</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Everything you need.</h2>
            <p className="text-text-muted max-w-2xl mx-auto text-lg">Relay is designed to be simple, fast, and stay out of your way until you need it.</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Built for builders.</h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">Whether you're running AI agents, managing servers, or monitoring automations — Relay keeps you in the loop.</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How it works</h2>
            <p className="text-text-muted text-lg">Three simple steps to connect your infrastructure to your phone.</p>
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
                <h3 className="text-lg font-semibold">Try it now</h3>
                <p className="text-sm text-text-muted">Send a notification to your phone with a single command.</p>
              </div>
            </div>
            <div className="bg-bg rounded-xl p-6 overflow-x-auto border border-border">
              <pre className="font-mono text-sm text-text-muted leading-relaxed">
                <code>
                  curl -X POST https://relayapp.dev/webhook \<br />
                  &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                  &nbsp;&nbsp;-d '&#123;<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;"token": "YOUR_WEBHOOK_TOKEN",<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;"title": "Hello from Relay",<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;"body": "It works."<br />
                  &nbsp;&nbsp;&#125;'
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Ready to get started?</h2>
            <p className="text-text-muted text-lg mb-8">Create a free account and start receiving push notifications from your infrastructure in minutes.</p>
            <Link to="/signup" className="inline-flex h-12 px-8 rounded-lg bg-accent text-white font-medium items-center gap-2 hover:bg-emerald-600 transition-all cursor-pointer">
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
