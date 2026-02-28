import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen font-sans">
      {/* 1. HEADER: Logo left, Navbar right-aligned */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Space for Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl font-display">
              S
            </div>
            <span className="font-display font-bold text-xl tracking-tight">STELLAR</span>
          </div>

          {/* Right-aligned Navbar (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors">Product</a>
            <a href="#" className="text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#" className="text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#" className="px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-all">
              Get Started
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-zinc-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navbar */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b border-zinc-100 px-6 py-6 flex flex-col gap-4"
          >
            <a href="#" className="text-lg font-medium text-zinc-900">Product</a>
            <a href="#" className="text-lg font-medium text-zinc-900">Features</a>
            <a href="#" className="text-lg font-medium text-zinc-900">Pricing</a>
            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium">
              Get Started
            </button>
          </motion.div>
        )}
      </header>

      {/* 2. HERO SECTION: Left-aligned text, Right-aligned image */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-zinc-900 mb-6 leading-[1.1]">
              Build the future <br />
              <span className="text-indigo-600">faster than ever.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 mb-10 max-w-lg leading-relaxed">
              Our platform provides the tools you need to scale your infrastructure without the complexity. 
              Join thousands of developers building amazing things.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                Start Building
              </button>
              <button className="px-8 py-4 bg-white border border-zinc-200 text-zinc-900 rounded-2xl font-semibold hover:bg-zinc-50 transition-all">
                View Demo
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" 
                alt="Hero Dashboard"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -z-10 opacity-60" />
            <div className="absolute -top-6 -right-6 w-48 h-48 bg-purple-100 rounded-full blur-3xl -z-10 opacity-60" />
          </motion.div>
        </div>
      </section>

      {/* 3. SCROLL PROMPT */}
      <div className="flex justify-center pb-20">
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-zinc-400"
        >
          <span className="text-xs font-semibold uppercase tracking-widest">Scroll to explore</span>
          <ChevronDown size={20} />
        </motion.div>
      </div>

      {/* 4. MAIN SECTION: H1 Heading and Big Image */}
      <section className="py-24 bg-zinc-50 px-6">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-display font-bold text-zinc-900 mb-6"
          >
            Everything you need in one place
          </motion.h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Stop juggling multiple tools. We've unified your workflow into a single, 
            powerful interface designed for high-performance teams.
          </p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-zinc-200"
        >
          <img 
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2072" 
            alt="Main Feature Visual"
            className="w-full h-auto"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </section>

      {/* 4.5 STATEMENT SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-display font-bold text-zinc-900 leading-tight"
          >
            "We don't just build tools; we craft the infrastructure for the next generation of digital pioneers."
          </motion.h2>
        </div>
      </section>

      {/* 5. THREE COLUMNS: Image, Subheading, Body Paragraph */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          {/* Column 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group"
          >
            <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-zinc-100">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" 
                alt="Analytics"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-2xl font-display font-bold text-zinc-900 mb-4">Real-time Analytics</h3>
            <p className="text-zinc-600 leading-relaxed">
              Track every interaction as it happens. Our low-latency data pipeline ensures 
              you're always looking at the most current information.
            </p>
          </motion.div>

          {/* Column 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="group"
          >
            <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-zinc-100">
              <img 
                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800" 
                alt="Security"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-2xl font-display font-bold text-zinc-900 mb-4">Enterprise Security</h3>
            <p className="text-zinc-600 leading-relaxed">
              Your data is protected by industry-leading encryption and compliance standards. 
              We take security as seriously as you do.
            </p>
          </motion.div>

          {/* Column 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-zinc-100">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" 
                alt="Collaboration"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-2xl font-display font-bold text-zinc-900 mb-4">Team Collaboration</h3>
            <p className="text-zinc-600 leading-relaxed">
              Built for teams of all sizes. Share projects, leave comments, and 
              collaborate in real-time without missing a beat.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-display font-bold text-lg tracking-tight">STELLAR</span>
          </div>
          <p className="text-zinc-400 text-sm">
            © 2026 Stellar Technologies Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">Twitter</a>
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">GitHub</a>
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}