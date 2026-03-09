import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Terminal, Smartphone, Bell, LayoutDashboard, Code, ArrowRight, Server, CheckCircle2, User, Menu, X, Gauge, Wrench, Rocket, Bot, Activity, TrendingUp, Shield, MonitorSmartphone, Network } from 'lucide-react';
import { supabase } from './lib/supabase';
import { RelayIcon } from './components/RelayLogo';
import { ThemeToggle } from './components/ThemeToggle';
import { FAQItem } from './features/landing/FAQItem';
import { FAQ_ITEMS, INTEGRATIONS } from './features/landing/content';

export default function App() {
  const [activeTab, setActiveTab] = useState<keyof typeof INTEGRATIONS>('bash');
  const [showNotification, setShowNotification] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // Scroll-linked rotation for nav logo
  const { scrollY } = useScroll();
  const navLogoRotate = useTransform(scrollY, [0, 8000], [0, 1800]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowNotification(false);
      setTimeout(() => setShowNotification(true), 1500);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on route change or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <motion.div style={{ rotate: navLogoRotate }}>
              <RelayIcon size={24} className="text-text-main" />
            </motion.div>
            <span className="font-semibold tracking-tight">Relay</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
            <a href="#features" className="hover:text-text-main transition-colors">Features</a>
            <a href="#use-cases" className="hover:text-text-main transition-colors">Use Cases</a>
            <a href="#how-it-works" className="hover:text-text-main transition-colors">How it works</a>
            <a href="#api" className="hover:text-text-main transition-colors">API</a>
            <Link to="/pricing" className="hover:text-text-main transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isSignedIn ? (
              <Link to="/dashboard" className="h-9 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all flex items-center gap-2">
                <User className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden md:flex items-center text-sm font-medium text-text-muted hover:text-text-main transition-colors">
                  Sign in
                </Link>
                <Link to="/signup" className="hidden md:flex h-9 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all items-center">
                  Get Started
                </Link>
              </>
            )}
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border bg-bg overflow-hidden"
            >
              <div className="px-6 py-4 space-y-1">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors">Features</a>
                <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors">Use Cases</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors">How it works</a>
                <a href="#api" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors">API</a>
                <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors">Pricing</Link>
                {!isSignedIn && (
                  <div className="pt-3 space-y-2 border-t border-border mt-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors">Sign in</Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-medium text-accent hover:text-emerald-600 transition-colors">Get Started Free</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <LayoutDashboard className="w-6 h-6 text-accent" />, title: "Save any dashboard", desc: "Grafana, Home Assistant, n8n, CI/CD pipelines, or custom internal tools. If it has a URL and renders in a browser, you can save it as a native app in Relay.", wide: true },
              { icon: <Bell className="w-6 h-6 text-accent" />, title: "Webhook alerts", desc: "Each saved dashboard gets a unique webhook token. Send a POST request to trigger a secure push notification." },
              { icon: <Smartphone className="w-6 h-6 text-accent" />, title: "Tap to open", desc: "Tapping a notification doesn't just open the app — it opens the exact dashboard associated with that alert instantly." },
              { icon: <Server className="w-6 h-6 text-accent" />, title: "Universal compatibility", desc: "No complex SDKs to install. Relay works with any system, script, or service that can send a simple HTTP POST request. Bash, Python, Node, GitHub Actions — it all works.", wide: true },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`${item.wide ? 'lg:col-span-2' : ''} group bg-surface border border-border rounded-2xl p-8 hover:border-accent/20 transition-all`}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className={`text-text-muted leading-relaxed ${item.wide ? 'max-w-md' : ''}`}>{item.desc}</p>
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

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Monitor AI Agents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4 }}
              className="bg-surface border border-border rounded-2xl p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Bot className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Monitor AI Agents</h3>
              <p className="text-text-muted leading-relaxed text-sm mb-6">Run agent systems like Obelisk, OpenClaw, or other automations and receive instant alerts when tasks complete or fail.</p>
              <div className="bg-bg border border-border rounded-xl p-4 font-mono text-xs text-text-muted space-y-1">
                <p>Agent finishes job</p>
                <p className="text-accent">  &darr;</p>
                <p>Webhook sent to Relay</p>
                <p className="text-accent">  &darr;</p>
                <p>Phone notification</p>
                <p className="text-accent">  &darr;</p>
                <p>Tap &rarr; open agent dashboard</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                {["Obelisk", "OpenClaw", "Custom Agents"].map(tool => (
                  <span key={tool} className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-hover text-text-muted border border-border">{tool}</span>
                ))}
              </div>
            </motion.div>

            {/* Self-Hosted Dashboards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-surface border border-border rounded-2xl p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Wrench className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Self-Hosted Dashboards</h3>
              <p className="text-text-muted leading-relaxed text-sm mb-6">Relay works with self-hosted dashboards like Grafana, Home Assistant, Kubernetes dashboards, internal tools, and AI agent control panels. Keep everything private on your network while still receiving alerts on your phone.</p>
              <div className="flex flex-wrap gap-2">
                {["Grafana", "Home Assistant", "Kubernetes", "Internal Tools", "AI Panels"].map(tool => (
                  <span key={tool} className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-hover text-text-muted border border-border">{tool}</span>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Monitor Automations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-surface border border-border rounded-2xl p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Monitor Automations</h3>
              <p className="text-text-muted leading-relaxed text-sm mb-6">Ideal for monitoring CI pipelines, server deployments, automation workflows, and background jobs.</p>
              <div className="bg-bg border border-border rounded-xl p-4 font-mono text-xs text-text-muted space-y-1">
                <p>Deployment finished</p>
                <p className="text-accent">  &darr;</p>
                <p>Webhook &rarr; Relay</p>
                <p className="text-accent">  &darr;</p>
                <p>Phone alert</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                {["CI/CD", "Deployments", "Cron Jobs", "n8n"].map(tool => (
                  <span key={tool} className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-hover text-text-muted border border-border">{tool}</span>
                ))}
              </div>
            </motion.div>

            {/* Trading Bots & Monitoring */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-surface border border-border rounded-2xl p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Trading Bots & Monitoring</h3>
              <p className="text-text-muted leading-relaxed text-sm mb-6">Users running trading bots or scripts can receive alerts when trades execute, strategies trigger, or errors occur.</p>
              <div className="flex flex-wrap gap-2">
                {["Trade Alerts", "Strategy Triggers", "Error Monitoring", "Portfolio Bots"].map(tool => (
                  <span key={tool} className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-hover text-text-muted border border-border">{tool}</span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Tips: Dashboard Best Practice + Networking */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-surface border border-border rounded-2xl p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <MonitorSmartphone className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Best Practice for Dashboards</h3>
              <p className="text-text-muted leading-relaxed text-sm mb-4">Relay loads dashboards inside a mobile webview. For the best experience, ask your AI or frontend tool to generate a mobile-responsive version.</p>
              <div className="bg-bg border border-border rounded-xl p-4">
                <p className="text-xs font-mono text-text-muted italic">"Create a mobile responsive version of this dashboard UI optimized for a narrow phone screen. Use stacked layouts and large touch targets."</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="bg-surface border border-border rounded-2xl p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Network className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Private Network Access</h3>
              <p className="text-text-muted leading-relaxed text-sm mb-4">Most self-hosted dashboards aren't publicly accessible. Use Tailscale to securely access your internal dashboards from your phone.</p>
              <div className="bg-bg border border-border rounded-xl p-4 font-mono text-xs text-text-muted space-y-1">
                <p>Self-hosted server</p>
                <p className="text-accent">  &darr;</p>
                <p>Tailscale network</p>
                <p className="text-accent">  &darr;</p>
                <p>Phone running Relay</p>
                <p className="text-accent">  &darr;</p>
                <p>Dashboard loads securely</p>
              </div>
            </motion.div>
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
            {[
              {
                step: "01",
                title: "Add a URL",
                desc: "Open the Relay app and add your dashboard URL (e.g., your Grafana instance)."
              },
              {
                step: "02",
                title: "Get a Token",
                desc: "Relay generates a unique, secure webhook token for that specific dashboard."
              },
              {
                step: "03",
                title: "Send a POST",
                desc: "Your systems POST to the webhook. You get a push notification instantly."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
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
                  curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/notify/YOUR_TOKEN \<br />
                  &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                  &nbsp;&nbsp;-d '&#123;<br />
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

        {/* FAQ */}
        <section id="faq" className="py-24 px-6 max-w-3xl mx-auto border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Frequently asked questions</h2>
            <p className="text-text-muted text-lg">Everything you need to know about Relay.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="border-t border-border"
          >
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem
                key={i}
                item={item}
                isOpen={openFAQ === i}
                onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </motion.div>
        </section>

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

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <RelayIcon size={20} className="text-text-main" />
                <span className="font-semibold">Relay</span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                Real-time webhook notifications for your dashboards, straight to your phone.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-text-muted">
                <li><a href="#features" className="hover:text-text-main transition-colors">Features</a></li>
                <li><a href="#use-cases" className="hover:text-text-main transition-colors">Use Cases</a></li>
                <li><a href="#how-it-works" className="hover:text-text-main transition-colors">How it works</a></li>
                <li><Link to="/pricing" className="hover:text-text-main transition-colors">Pricing</Link></li>
                <li><a href="#api" className="hover:text-text-main transition-colors">API</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm text-text-muted">
                <li><a href="#faq" className="hover:text-text-main transition-colors">FAQ</a></li>
                <li><Link to="/login" className="hover:text-text-main transition-colors">Sign in</Link></li>
                <li><Link to="/signup" className="hover:text-text-main transition-colors">Sign up</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-text-muted">
                <li><Link to="/privacy" className="hover:text-text-main transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-text-main transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-muted">&copy; {new Date().getFullYear()} Relay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
