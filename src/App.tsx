import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Terminal, Smartphone, Bell, LayoutDashboard, Code, Github, BookOpen, ArrowRight, Zap, Server, CheckCircle2, User } from 'lucide-react';
import { supabase } from './lib/supabase';

const INTEGRATIONS = {
  bash: {
    name: "Bash",
    code: `curl -X POST https://relayapp.dev/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "YOUR_WEBHOOK_TOKEN",
    "title": "Build completed",
    "body": "All tests passed"
  }'`
  },
  github: {
    name: "GitHub Actions",
    code: `- name: Send Relay Notification
  run: |
    curl -X POST https://relayapp.dev/webhook \\
      -H "Content-Type: application/json" \\
      -d '{
        "token": "\${{ secrets.RELAY_TOKEN }}",
        "title": "Action Failed",
        "body": "Workflow \${{ github.workflow }} failed"
      }'`
  },
  python: {
    name: "Python",
    code: `import requests

requests.post("https://relayapp.dev/webhook", json={
    "token": "YOUR_WEBHOOK_TOKEN",
    "title": "Model trained",
    "body": "Accuracy: 98.5%"
})`
  },
  node: {
    name: "Node.js",
    code: `fetch("https://relayapp.dev/webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token: "YOUR_WEBHOOK_TOKEN",
    title: "Server Error",
    body: "Database connection lost"
  })
});`
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<keyof typeof INTEGRATIONS>('bash');
  const [showNotification, setShowNotification] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Simple animation loop for the hero visual
  useEffect(() => {
    const interval = setInterval(() => {
      setShowNotification(false);
      setTimeout(() => setShowNotification(true), 1500); // Trigger notification after "webhook" fires
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent/30">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <span className="font-semibold tracking-tight">Relay</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
            <a href="#features" className="hover:text-text-main transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-text-main transition-colors">How it works</a>
            <a href="#api" className="hover:text-text-main transition-colors">API</a>
            <Link to="/pricing" className="hover:text-text-main transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link to="/dashboard" className="h-9 px-4 rounded-md bg-text-main text-bg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                <User className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden md:flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors">
                  <span>Sign in</span>
                </Link>
                <Link to="/signup" className="h-9 px-4 rounded-md bg-text-main text-bg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-medium text-text-muted mb-8">
              <span className="flex h-2 w-2 rounded-full bg-accent"></span>
              Relay v1.0 is now open source
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Your dashboards,<br />
              one tap away.
            </h1>
            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              Save any web dashboard as a native app. Send push notifications via webhook. Tap to open instantly. The missing bridge between your infrastructure and your pocket.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="h-12 px-6 rounded-lg bg-accent text-white font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors w-full sm:w-auto justify-center">
                <BookOpen className="w-4 h-4" />
                Read the Docs
              </button>
              <button className="h-12 px-6 rounded-lg bg-surface text-text-main font-medium border border-border flex items-center gap-2 hover:bg-surface-hover transition-colors w-full sm:w-auto justify-center">
                <Github className="w-4 h-4" />
                View on GitHub
              </button>
            </div>
          </motion.div>
        </section>

        {/* Hero Visual (Terminal -> Webhook -> Phone) */}
        <section className="py-12 px-6 max-w-6xl mx-auto overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            
            {/* Left: Terminal */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-[340px] bg-surface border border-border rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="h-10 border-b border-border flex items-center px-4 gap-2 bg-[#1A1A1A]">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <div className="ml-2 text-xs font-mono text-text-muted">deploy.sh</div>
              </div>
              <div className="p-5 font-mono text-xs text-text-muted space-y-2">
                <p><span className="text-accent">➜</span> <span className="text-blue-400">~</span> ./deploy.sh</p>
                <p>Building project...</p>
                <p>Running tests...</p>
                <p className="text-green-400">✓ All tests passed</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-text-main">curl -X POST relayapp.dev/webhook \</p>
                  <p className="text-text-main">  -d '&#123;"title": "Build passed"&#125;'</p>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 6, repeat: Infinity, times: [0, 0.1, 0.8, 1] }}
                    className="text-green-400 mt-2"
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
                className="absolute left-0 w-4 h-4 -ml-2 rounded-full bg-accent shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10"
              />
              <div className="absolute top-4 text-[10px] font-mono text-text-muted uppercase tracking-widest">Webhook</div>
            </div>

            {/* Right: Phone */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-[280px] h-[560px] bg-black border-[6px] border-surface rounded-[2.5rem] relative overflow-hidden shadow-2xl"
            >
              {/* Dynamic Island / Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-surface rounded-b-2xl z-20"></div>
              
              {/* Screen Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black p-4 pt-12">
                {/* Fake App Grid */}
                <div className="grid grid-cols-4 gap-4 opacity-40 mt-8">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-surface border border-border"></div>
                  ))}
                </div>

                {/* Notification Popup */}
                <motion.div 
                  initial={{ y: -100, opacity: 0, scale: 0.9 }}
                  animate={{ 
                    y: showNotification ? 0 : -100, 
                    opacity: showNotification ? 1 : 0,
                    scale: showNotification ? 1 : 0.9
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-12 left-3 right-3 bg-[#1A1A1A]/90 backdrop-blur-xl border border-border rounded-2xl p-3 shadow-2xl z-30"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-white" />
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

        {/* Features Bento Grid */}
        <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Everything you need.</h2>
            <p className="text-text-muted max-w-2xl mx-auto text-lg">Relay is designed to be simple, fast, and stay out of your way until you need it.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-8 hover:border-border/80 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-bg border border-border flex items-center justify-center mb-6">
                <LayoutDashboard className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Save any dashboard</h3>
              <p className="text-text-muted leading-relaxed max-w-md">
                Grafana, Home Assistant, n8n, CI/CD pipelines, or custom internal tools. If it has a URL and renders in a browser, you can save it as a native app in Relay.
              </p>
            </div>
            
            <div className="bg-surface border border-border rounded-2xl p-8 hover:border-border/80 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-bg border border-border flex items-center justify-center mb-6">
                <Bell className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Webhook alerts</h3>
              <p className="text-text-muted leading-relaxed">
                Each saved dashboard gets a unique webhook token. Send a POST request to trigger a secure push notification.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-8 hover:border-border/80 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-bg border border-border flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Tap to open</h3>
              <p className="text-text-muted leading-relaxed">
                Tapping a notification doesn't just open the app—it opens the exact dashboard associated with that alert instantly.
              </p>
            </div>

            <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-8 hover:border-border/80 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-bg border border-border flex items-center justify-center mb-6">
                <Server className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Universal compatibility</h3>
              <p className="text-text-muted leading-relaxed max-w-md">
                No complex SDKs to install. Relay works with any system, script, or service that can send a simple HTTP POST request. Bash, Python, Node, GitHub Actions—it all works.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-6 max-w-5xl mx-auto border-t border-border">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How it works</h2>
            <p className="text-text-muted text-lg">Three simple steps to connect your infrastructure to your phone.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
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
              <div key={i} className="relative">
                <div className="text-5xl font-bold text-surface-hover mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* API & Integrations */}
        <section id="api" className="py-24 px-6 max-w-6xl mx-auto border-t border-border">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Simple, predictable API.</h2>
              <p className="text-text-muted mb-8 text-lg leading-relaxed">
                No complex authentication flows. Just a single endpoint that accepts a JSON payload. Integrate it into any script or pipeline in seconds.
              </p>
              
              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-2 py-1 rounded bg-accent/20 text-accent text-xs font-mono font-bold">POST</span>
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
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
              <div className="flex border-b border-border overflow-x-auto hide-scrollbar bg-[#111]">
                {(Object.keys(INTEGRATIONS) as Array<keyof typeof INTEGRATIONS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                      activeTab === key 
                        ? 'border-accent text-text-main bg-surface' 
                        : 'border-transparent text-text-muted hover:text-text-main hover:bg-surface/50'
                    }`}
                  >
                    {INTEGRATIONS[key].name}
                  </button>
                ))}
              </div>
              <div className="p-6 overflow-x-auto bg-[#0A0A0A]">
                <pre className="font-mono text-sm text-text-muted leading-relaxed">
                  <code>{INTEGRATIONS[activeTab].code}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-surface border border-border flex items-center justify-center">
              <Zap className="w-3 h-3 text-accent" />
            </div>
            <span className="font-semibold tracking-tight">Relay</span>
            <span className="text-text-muted text-sm ml-2">— Open source dashboard launcher</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-text-muted">
            <a href="#" className="hover:text-text-main transition-colors">API Docs</a>
            <a href="#" className="hover:text-text-main transition-colors">Privacy</a>
            <a href="#" className="hover:text-text-main transition-colors flex items-center gap-1">
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
