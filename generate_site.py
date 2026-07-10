#!/usr/bin/env python3
"""
Generates the multi-page Camodevops website.
Outputs a structured directory of HTML files with shared navigation and footer.
"""

import os

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Shared Head and Navigation
SHARED_HEAD = """<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Camodevops</title>
    <link rel="icon" type="image/x-icon" href="favico.ico">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <script>
        mermaid.initialize({{ 
            startOnLoad: true, 
            theme: 'dark',
            themeVariables: {{
                darkMode: true,
                background: '#18181b',
                primaryColor: '#14b8a6',
                primaryTextColor: '#ffffff',
                primaryBorderColor: '#2dd4bf',
                lineColor: '#64748b',
                secondaryColor: '#27272a',
                tertiaryColor: '#09090b'
            }},
            flowchart: {{
                curve: 'basis',
                padding: 20,
                nodeSpacing: 50,
                rankSpacing: 60
            }}
        }});
        tailwind.config = {{
            theme: {{
                extend: {{
                    fontFamily: {{
                        sans: ['Inter', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    }},
                    colors: {{
                        camo: {{
                            950: '#09090b',
                            900: '#18181b',
                            800: '#27272a',
                            accent: '#14b8a6',
                            accentHover: '#2dd4bf',
                        }}
                    }}
                }}
            }}
        }}
    </script>
    <style>
        body {{ background-color: #09090b; color: #e4e4e7; }}
        .glow-text {{ text-shadow: 0 0 20px rgba(20, 184, 166, 0.3); }}
    </style>
</head>
<body class="font-sans antialiased flex flex-col min-h-screen">

    <!-- Navigation -->
    <nav class="border-b border-camo-800 bg-camo-950/90 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <a href="index.html" class="flex items-center gap-3">
                    <img src="logo.png" alt="Camodevops Logo" class="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]" />
                    <span class="font-mono font-bold text-white tracking-wider hidden sm:inline">Camo<span class="text-camo-accent">DevOps</span></span>
                </a>
                <div class="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-400">
                    <a href="index.html" class="nav-link hover:text-camo-accent transition-colors {nav_home}">Home</a>
                    <a href="platform.html" class="nav-link hover:text-camo-accent transition-colors {nav_platform}">Platform</a>
                    <a href="services.html" class="nav-link hover:text-camo-accent transition-colors {nav_services}">Services</a>
                    <a href="architecture.html" class="nav-link hover:text-camo-accent transition-colors {nav_architecture}">Architecture</a>
                    <a href="sovereignty.html" class="nav-link hover:text-camo-accent transition-colors {nav_sovereignty}">Sovereignty</a>
                    <a href="about.html" class="nav-link hover:text-camo-accent transition-colors {nav_about}">About</a>
                    <a href="audit.html" class="px-4 py-2 bg-camo-accent/10 border border-camo-accent/30 text-camo-accent rounded hover:bg-camo-accent/20 transition-all {nav_audit}">Request Audit</a>
                </div>
                <!-- Mobile menu button -->
                <button id="mobile-menu-button" type="button" class="lg:hidden inline-flex items-center justify-center p-2 rounded text-zinc-400 hover:text-camo-accent hover:bg-camo-800/50 transition-colors" aria-label="Toggle navigation menu" aria-controls="mobile-menu" aria-expanded="false">
                    <svg id="menu-icon-open" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    <svg id="menu-icon-close" class="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
        <!-- Mobile menu panel -->
        <div id="mobile-menu" class="hidden lg:hidden border-t border-camo-800 bg-camo-950/95 backdrop-blur-md">
            <div class="px-4 py-4 space-y-1 text-sm font-medium text-zinc-300">
                <a href="index.html" class="block px-3 py-2 rounded hover:bg-camo-800/50 hover:text-camo-accent transition-colors {nav_home}">Home</a>
                <a href="platform.html" class="block px-3 py-2 rounded hover:bg-camo-800/50 hover:text-camo-accent transition-colors {nav_platform}">Platform</a>
                <a href="services.html" class="block px-3 py-2 rounded hover:bg-camo-800/50 hover:text-camo-accent transition-colors {nav_services}">Services</a>
                <a href="architecture.html" class="block px-3 py-2 rounded hover:bg-camo-800/50 hover:text-camo-accent transition-colors {nav_architecture}">Architecture</a>
                <a href="sovereignty.html" class="block px-3 py-2 rounded hover:bg-camo-800/50 hover:text-camo-accent transition-colors {nav_sovereignty}">Sovereignty</a>
                <a href="about.html" class="block px-3 py-2 rounded hover:bg-camo-800/50 hover:text-camo-accent transition-colors {nav_about}">About</a>
                <a href="audit.html" class="block px-3 py-2 mt-2 text-center bg-camo-accent/10 border border-camo-accent/30 text-camo-accent rounded hover:bg-camo-accent/20 transition-all {nav_audit}">Request Audit</a>
            </div>
        </div>
    </nav>

    <main class="flex-grow">
"""

# Shared Footer
SHARED_FOOTER = """    </main>

    <!-- Footer -->
    <footer class="border-t border-camo-800 bg-camo-950 py-12 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-3">
                <img src="logo.png" alt="Camodevops Logo" class="h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]" />
                <div class="flex flex-col">
                    <span class="font-mono font-bold text-white tracking-wider text-sm">CAMO <span class="text-camo-accent">.DEVOPS.ONLINE</span></span>
                    <span class="text-xs text-zinc-500 font-mono">Functional Synergy. Strategic Navigation.</span>
                </div>
            </div>
            <div class="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-sm text-zinc-500 font-mono text-center md:text-right">
                <a href="https://t.me/Camodevopsbot" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 hover:text-camo-accent transition-colors group">
                    <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    <span>@Camodevopsbot</span>
                </a>
                <a href="https://wa.me/27604549405" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 hover:text-camo-accent transition-colors group">
                    <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    <span>WhatsApp</span>
                </a>
                <a href="privacy.html" class="hover:text-camo-accent transition-colors">Privacy (POPIA)</a>
                <a href="terms.html" class="hover:text-camo-accent transition-colors">Terms (ECTA)</a>
                <span>&copy; 2026 Camodevops. All systems operational.</span>
            </div>
        </div>
    </footer>

    <!-- Scroll Reveal Script -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.remove('opacity-0', 'translate-y-8');
                        entry.target.classList.add('opacity-100', 'translate-y-0');
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
            document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
        });
    </script>

    <!-- Mobile Menu Toggle -->
    <script>
        (function () {
            const btn = document.getElementById('mobile-menu-button');
            const menu = document.getElementById('mobile-menu');
            const iconOpen = document.getElementById('menu-icon-open');
            const iconClose = document.getElementById('menu-icon-close');
            if (!btn || !menu) return;
            const setOpen = (open) => {
                menu.classList.toggle('hidden', !open);
                btn.setAttribute('aria-expanded', String(open));
                iconOpen.classList.toggle('hidden', open);
                iconClose.classList.toggle('hidden', !open);
            };
            btn.addEventListener('click', () => setOpen(menu.classList.contains('hidden')));
            menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
            window.addEventListener('resize', () => { if (window.innerWidth >= 1024) setOpen(false); });
        })();
    </script>
</body>
</html>
"""

# Page Contents
PAGES = {
    "index.html": {
        "title": "Home",
        "nav": {"nav_home": "text-camo-accent"},
        "content": """
    <!-- Hero Section -->
    <section class="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden">
        <div class="absolute inset-0 z-0">
            <img src="herobg.png" alt="" class="w-full h-full object-cover opacity-40" />
            <div class="absolute inset-0 bg-gradient-to-b from-camo-950/70 via-camo-950/85 to-camo-950"></div>
        </div>
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-camo-accent/10 border border-camo-accent/20 text-camo-accent text-xs font-mono mb-8">
                <span class="w-2 h-2 rounded-full bg-camo-accent animate-pulse"></span>
                SOVEREIGN AI INFRASTRUCTURE
            </div>
            <h1 class="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                <span class="text-camo-accent glow-text">95%</span> of AI projects fail to deliver a profit <span class="text-zinc-500 text-2xl md:text-3xl font-normal block mt-2 font-mono">(MIT NANDA Research)</span>
            </h1>
            <p class="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Most AI initiatives collapse under their own weight. They are rigid, overly dependent on third-party cloud APIs, and fundamentally disconnected from actual business workflows. We reject the hype. We build specific, localized, and sovereign AI capabilities that integrate seamlessly into your existing infrastructure.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="platform.html" class="px-8 py-4 bg-camo-accent hover:bg-camo-accentHover text-camo-950 font-bold rounded-md transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                    Explore the Camodevops Engine
                </a>
                <a href="audit.html" class="px-8 py-4 bg-transparent border border-zinc-700 hover:border-camo-accent text-zinc-300 hover:text-camo-accent font-semibold rounded-md transition-all duration-300">
                    Request Discovery Audit
                </a>
            </div>
        </div>
    </section>

    <!-- CamoFlow OS Highlight -->
    <section class="py-20 bg-camo-900/30 border-y border-camo-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">CamoFlow OS</h2>
                <p class="text-xl text-zinc-400 max-w-3xl mx-auto">AI that lives on your machine — not someone else's cloud.</p>
            </div>
            <div class="grid md:grid-cols-2 gap-8 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="p-8 rounded-xl bg-camo-950 border border-camo-800 hover:border-camo-accent/50 transition-all duration-300">
                    <h3 class="text-xl font-bold text-camo-accent mb-4 font-mono">The Problem</h3>
                    <ul class="space-y-3 text-zinc-400">
                        <li class="flex items-start gap-3"><span class="text-red-400 mt-1">✕</span> Cloud bills spiral in foreign currency.</li>
                        <li class="flex items-start gap-3"><span class="text-red-400 mt-1">✕</span> Client data shipped to overseas servers (POPIA risk).</li>
                        <li class="flex items-start gap-3"><span class="text-red-400 mt-1">✕</span> Vendor lock-in: their prices, their outages, their terms.</li>
                    </ul>
                </div>
                <div class="p-8 rounded-xl bg-camo-950 border border-camo-800 hover:border-camo-accent/50 transition-all duration-300">
                    <h3 class="text-xl font-bold text-camo-accent mb-4 font-mono">The Camodevops Shift</h3>
                    <ul class="space-y-3 text-zinc-400">
                        <li class="flex items-start gap-3"><span class="text-camo-accent mt-1">✓</span> Local-first: Your data never leaves the building.</li>
                        <li class="flex items-start gap-3"><span class="text-camo-accent mt-1">✓</span> Near-zero cost per query. No per-token bills.</li>
                        <li class="flex items-start gap-3"><span class="text-camo-accent mt-1">✓</span> You own the box. Runs offline. Swap anything.</li>
                    </ul>
                </div>
            </div>
            <div class="text-center mt-10 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <a href="platform.html" class="inline-block px-8 py-3 border border-camo-accent text-camo-accent rounded hover:bg-camo-accent/10 transition-colors font-semibold">View Full Platform Details →</a>
            </div>
        </div>
    </section>

    <!-- What we build for you -->
    <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-14 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-camo-accent/10 border border-camo-accent/20 text-camo-accent text-xs font-mono mb-6">
                    <span class="w-2 h-2 rounded-full bg-camo-accent animate-pulse"></span>
                    FOUR CRAFTS. ONE OPERATOR.
                </div>
                <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">What Camo delivers</h2>
                <p class="text-lg text-zinc-400 leading-relaxed">Sound Technician. Vibe Coder. AI Orchestrator. Web Designer. Four disciplines in one operator &mdash; so your event sounds right, your product ships fast, your AI runs sovereign, and your site converts.</p>
            </div>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="p-6 rounded-xl bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300">
                    <p class="text-camo-accent font-mono text-xs mb-2">&#127911; SOUND TECHNICIAN</p>
                    <h3 class="text-lg font-bold text-white mb-2">Audio that moves people</h3>
                    <p class="text-sm text-zinc-400">Live events, studio sessions, podcasts and broadcast &mdash; FOH mixing, clean capture, mixes that translate on every speaker.</p>
                </div>
                <div class="p-6 rounded-xl bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300">
                    <p class="text-camo-accent font-mono text-xs mb-2">&#9000; VIBE CODER</p>
                    <h3 class="text-lg font-bold text-white mb-2">Products that ship fast</h3>
                    <p class="text-sm text-zinc-400">AI-assisted rapid development: web apps, automation scripts, MVP sprints and internal tools built and live in days, not months.</p>
                </div>
                <div class="p-6 rounded-xl bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300">
                    <p class="text-camo-accent font-mono text-xs mb-2">&#129302; AI ORCHESTRATOR</p>
                    <h3 class="text-lg font-bold text-white mb-2">Local AI you own</h3>
                    <p class="text-sm text-zinc-400">CamoFlow OS: multi-agent swarms and RAG pipelines on your hardware. No cloud fees, 100% data residency, runs offline.</p>
                </div>
                <div class="p-6 rounded-xl bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300">
                    <p class="text-camo-accent font-mono text-xs mb-2">&#127760; WEB DESIGNER</p>
                    <h3 class="text-lg font-bold text-white mb-2">Sites that load fast &amp; last</h3>
                    <p class="text-sm text-zinc-400">Static brochure sites from R3,500, dynamic CMS platforms from R8,000, and custom sovereign apps from R20,000 &mdash; no plugin bloat.</p>
                </div>
                <div class="p-6 rounded-xl bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300">
                    <h3 class="text-lg font-bold text-white mb-2">Everything connected</h3>
                    <p class="text-sm text-zinc-400">WhatsApp, Shopify, Google Workspace, CRM, label printers &mdash; wired into one system you can see, search and control.</p>
                </div>
                <div class="p-6 rounded-xl bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300">
                    <h3 class="text-lg font-bold text-white mb-2">Built to last &mdash; and yours</h3>
                    <p class="text-sm text-zinc-400">Docs, training and on-site handover included. You own what was built &mdash; no subscription trap, no dependency on me to keep it running.</p>
                </div>
            </div>
            <div class="text-center mt-10 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <a href="services.html" class="inline-block px-8 py-4 bg-camo-accent hover:bg-camo-accentHover text-camo-950 font-bold rounded-md transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">See all services &amp; pricing →</a>
                <p class="mt-4 text-sm text-zinc-500 font-mono">Full breakdown of every service on the Services page.</p>
            </div>
        </div>
    </section>

    <!-- Credentials -->
    <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="max-w-3xl mb-12 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-camo-accent/10 border border-camo-accent/20 text-camo-accent text-xs font-mono mb-6">
                    <span class="w-2 h-2 rounded-full bg-camo-accent animate-pulse"></span>
                    CREDENTIALS
                </div>
                <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">Certified &amp; credentialed</h2>
                <p class="text-zinc-400 leading-relaxed">
                    We don't just talk about sovereign AI and security for SMEs &mdash; we hold formal credentials in both, issued by recognised institutions and held by Cameron De Vries.
                </p>
            </div>
            <div class="grid md:grid-cols-2 gap-8 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <!-- Cert: AI Fluency -->
                <div class="group">
                    <div class="relative">
                        <div class="absolute -inset-2 bg-camo-accent/20 rounded-xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <a href="cert-ai-fluency.pdf" target="_blank" rel="noopener noreferrer" class="relative block rounded-xl overflow-hidden border border-camo-800 group-hover:border-camo-accent/50 transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.4)]">
                            <img src="cert-ai-fluency.png" alt="Certificate of Completion — AI Fluency for Small Businesses, awarded to Cameron De Vries by Anthropic and PayPal" class="w-full h-auto" loading="lazy" />
                        </a>
                    </div>
                    <div class="mt-4">
                        <h3 class="text-white font-semibold">AI Fluency for Small Businesses</h3>
                        <p class="text-sm text-zinc-500 mt-1">Certificate of Completion &middot; Anthropic &amp; PayPal</p>
                        <a href="cert-ai-fluency.pdf" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 mt-2 text-sm text-camo-accent hover:text-camo-accentHover transition-colors">View PDF →</a>
                    </div>
                </div>
                <!-- Cert: SANCS -->
                <div class="group">
                    <div class="relative">
                        <div class="absolute -inset-2 bg-camo-accent/20 rounded-xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <a href="cert-sancs.pdf" target="_blank" rel="noopener noreferrer" class="relative block rounded-xl overflow-hidden border border-camo-800 group-hover:border-camo-accent/50 transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.4)]">
                            <img src="cert-sancs.png" alt="Certificate of Participation — 3rd Edition of the Southern Africa–Netherlands Cyber Security School (SANCS), awarded to Cameron De Vries, April 2026" class="w-full h-auto" loading="lazy" />
                        </a>
                    </div>
                    <div class="mt-4">
                        <h3 class="text-white font-semibold">Southern Africa–Netherlands Cyber Security School</h3>
                        <p class="text-sm text-zinc-500 mt-1">Certificate of Participation &middot; 3rd Edition (SANCS), April 2026 &middot; Hague Centre for Strategic Studies &amp; Stellenbosch University</p>
                        <a href="cert-sancs.pdf" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 mt-2 text-sm text-camo-accent hover:text-camo-accentHover transition-colors">View PDF →</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
""",
    },
    "platform.html": {
        "title": "Platform & Capabilities",
        "nav": {"nav_platform": "text-camo-accent"},
        "content": """
    <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">Core Capabilities</h1>
                <p class="text-zinc-400 max-w-2xl mx-auto">We do not sell generic software. We engineer targeted platform capabilities designed for SME operational reality.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Card 1 -->
                <div class="group scroll-reveal opacity-0 translate-y-8 p-6 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] hover:scale-[1.02] transition-all duration-500 ease-out">
                    <h3 class="text-xl font-bold text-white font-mono mb-4">Local Multi-Agent Orchestration</h3>
                    <p class="text-sm text-zinc-400 mb-3"><span class="text-red-400 font-semibold">Problem:</span> Cloud-based agent frameworks leak proprietary context and create severe vendor lock-in.</p>
                    <p class="text-sm text-zinc-300 mb-4"><span class="text-camo-accent font-semibold">Execution:</span> Lightweight, localized agent swarms powered by open-weight models, orchestrated via secure, on-premise message brokers.</p>
                    <div class="pt-3 border-t border-camo-800">
                        <span class="inline-flex items-center gap-2 text-camo-accent font-mono text-xs bg-camo-accent/10 px-2 py-1 rounded">40% reduction in inference latency | Zero external data egress</span>
                    </div>
                </div>
                <!-- Card 2 -->
                <div class="group scroll-reveal opacity-0 translate-y-8 p-6 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] hover:scale-[1.02] transition-all duration-500 ease-out">
                    <h3 class="text-xl font-bold text-white font-mono mb-4">Sovereign RAG Pipelines</h3>
                    <p class="text-sm text-zinc-400 mb-3"><span class="text-red-400 font-semibold">Problem:</span> Off-the-shelf AI tools index sensitive SME data into third-party vector databases, bypassing compliance mandates.</p>
                    <p class="text-sm text-zinc-300 mb-4"><span class="text-camo-accent font-semibold">Execution:</span> Isolated, on-premise Retrieval-Augmented Generation pipelines featuring strict RBAC and locally hosted embedding models.</p>
                    <div class="pt-3 border-t border-camo-800">
                        <span class="inline-flex items-center gap-2 text-camo-accent font-mono text-xs bg-camo-accent/10 px-2 py-1 rounded">100% data residency compliance | Sub-second retrieval</span>
                    </div>
                </div>
                <!-- Card 3 -->
                <div class="group scroll-reveal opacity-0 translate-y-8 p-6 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] hover:scale-[1.02] transition-all duration-500 ease-out">
                    <h3 class="text-xl font-bold text-white font-mono mb-4">Automated Workflow Integration</h3>
                    <p class="text-sm text-zinc-400 mb-3"><span class="text-red-400 font-semibold">Problem:</span> AI tools operate in silos, forcing teams into manual data transfer and fracturing existing CI/CD or ERP workflows.</p>
                    <p class="text-sm text-zinc-300 mb-4"><span class="text-camo-accent font-semibold">Execution:</span> Custom, Python-based middleware and API hooks that embed AI decision nodes directly into established operational pipelines.</p>
                    <div class="pt-3 border-t border-camo-800">
                        <span class="inline-flex items-center gap-2 text-camo-accent font-mono text-xs bg-camo-accent/10 px-2 py-1 rounded">Eliminates 15+ hours of manual weekly data reconciliation</span>
                    </div>
                </div>
                <!-- Card 4 -->
                <div class="group scroll-reveal opacity-0 translate-y-8 p-6 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] hover:scale-[1.02] transition-all duration-500 ease-out">
                    <h3 class="text-xl font-bold text-white font-mono mb-4">IaC AI Deployment</h3>
                    <p class="text-sm text-zinc-400 mb-3"><span class="text-red-400 font-semibold">Problem:</span> AI model deployment is often treated as a fragile, one-off script rather than a reproducible infrastructure component.</p>
                    <p class="text-sm text-zinc-300 mb-4"><span class="text-camo-accent font-semibold">Execution:</span> Every AI service is packaged as a hardened Docker container, accompanied by Terraform or Ansible playbooks for deterministic deployment.</p>
                    <div class="pt-3 border-t border-camo-800">
                        <span class="inline-flex items-center gap-2 text-camo-accent font-mono text-xs bg-camo-accent/10 px-2 py-1 rounded">Deployment time reduced from days to minutes | Zero config drift</span>
                    </div>
                </div>
            </div>

            <!-- Packages -->
            <div class="mt-24 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <h2 class="text-3xl font-bold text-white text-center mb-10 font-mono">Engagement Models</h2>
                <div class="grid md:grid-cols-3 gap-6">
                    <div class="p-8 rounded-xl bg-camo-950 border border-camo-800 flex flex-col">
                        <h4 class="text-xl font-bold text-white mb-2">Augmented</h4>
                        <p class="text-3xl font-bold text-camo-accent mb-4">R2,500 – R4,500 <span class="text-sm text-zinc-500 font-normal">once-off</span></p>
                        <p class="text-zinc-400 text-sm mb-6 flex-grow">One focused AI feature or automation, built and deployed directly on your existing stack.</p>
                        <a href="audit.html" class="block text-center px-4 py-3 border border-camo-accent/30 text-camo-accent rounded hover:bg-camo-accent/10 transition-colors font-semibold">Request Scope</a>
                    </div>
                    <div class="relative p-8 rounded-xl bg-camo-900 border-2 border-camo-accent flex flex-col shadow-[0_0_30px_rgba(20,184,166,0.1)]">
                        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-camo-accent text-camo-950 text-xs font-bold rounded-full">POPULAR</div>
                        <h4 class="text-xl font-bold text-white mb-2">Moat</h4>
                        <p class="text-3xl font-bold text-camo-accent mb-4">R3,000 – R8,000 <span class="text-sm text-zinc-500 font-normal">/ month</span></p>
                        <p class="text-zinc-400 text-sm mb-6 flex-grow">A managed CamoFlow engine that continuously evolves, adapts, and scales with your business.</p>
                        <a href="audit.html" class="block text-center px-4 py-3 bg-camo-accent text-camo-950 rounded hover:bg-camo-accentHover transition-colors font-bold">Start Managed</a>
                    </div>
                    <div class="p-8 rounded-xl bg-camo-950 border border-camo-800 flex flex-col">
                        <h4 class="text-xl font-bold text-white mb-2">Ownership</h4>
                        <p class="text-3xl font-bold text-camo-accent mb-4">R15,000 – R35,000 <span class="text-sm text-zinc-500 font-normal">once-off</span></p>
                        <p class="text-zinc-400 text-sm mb-6 flex-grow">Your own CamoFlow OS, fully built, configured, and handed over. You own it outright.</p>
                        <a href="audit.html" class="block text-center px-4 py-3 border border-camo-accent/30 text-camo-accent rounded hover:bg-camo-accent/10 transition-colors font-semibold">Discuss Build</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
""",
    },
    "services.html": {
        "title": "Services",
        "nav": {"nav_services": "text-camo-accent"},
        "content": """
    <!-- Services Hero -->
    <section class="py-20 border-b border-camo-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-camo-accent/10 border border-camo-accent/20 text-camo-accent text-xs font-mono mb-6">
                    <span class="w-2 h-2 rounded-full bg-camo-accent animate-pulse"></span>
                    FOUR CRAFTS. ONE OPERATOR.
                </div>
                <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Services</h1>
                <p class="text-lg text-zinc-400 leading-relaxed mb-8">
                    Sound Technician. Vibe Coder. AI Orchestrator. Web Designer. Four disciplines that rarely live in one operator &mdash; and that combination is the edge. Bring one craft or all four to your next project.
                </p>
                <div class="flex flex-wrap justify-center gap-3">
                    <span class="px-4 py-2 rounded-full bg-camo-800 border border-camo-accent/30 text-camo-accent font-mono text-sm">&#127911; Sound Technician</span>
                    <span class="px-4 py-2 rounded-full bg-camo-800 border border-camo-accent/30 text-camo-accent font-mono text-sm">&#9000; Vibe Coder</span>
                    <span class="px-4 py-2 rounded-full bg-camo-800 border border-camo-accent/30 text-camo-accent font-mono text-sm">&#129302; AI Orchestrator</span>
                    <span class="px-4 py-2 rounded-full bg-camo-800 border border-camo-accent/30 text-camo-accent font-mono text-sm">&#127760; Web Designer</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Service Catalog -->
    <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">

            <!-- 01 SOUND TECHNICIAN -->
            <div class="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="flex items-center gap-4 mb-3">
                    <span class="font-mono text-camo-accent text-sm border border-camo-accent/30 rounded px-2 py-1">01</span>
                    <h2 class="text-2xl md:text-3xl font-bold text-white">Sound Technician <span class="text-zinc-500 font-normal text-base md:text-lg">&mdash; the room sounds right</span></h2>
                </div>
                <p class="text-zinc-400 mb-8 max-w-2xl">Professional audio engineering for live events, studio sessions, podcasts and broadcast. Clean capture, honest mixes, audiences that feel it.</p>
                <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">Live Event Sound Engineering</h3>
                        <p class="text-sm text-zinc-400">FOH and monitor mixing for concerts, conferences and corporate events. PA system setup, gain structure, and real-time mix management from front to back.</p>
                    </div>
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">Studio Recording &amp; Mixing</h3>
                        <p class="text-sm text-zinc-400">Session recording, tracking, editing and stereo mixing for artists, bands and content creators. Mixes that translate on every speaker.</p>
                    </div>
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">Podcast Production &amp; Post</h3>
                        <p class="text-sm text-zinc-400">End-to-end podcast audio: recording setup, noise reduction, levelling, EQ and final master to loudness spec. Professional from episode one.</p>
                    </div>
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">Broadcast &amp; Streaming Audio</h3>
                        <p class="text-sm text-zinc-400">Audio chain setup for live streams, YouTube, radio and hybrid events. Consistent loudness, zero dropout, broadcast-ready output.</p>
                    </div>
                </div>
            </div>

            <!-- 02 VIBE CODER -->
            <div class="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="flex items-center gap-4 mb-3">
                    <span class="font-mono text-camo-accent text-sm border border-camo-accent/30 rounded px-2 py-1">02</span>
                    <h2 class="text-2xl md:text-3xl font-bold text-white">Vibe Coder <span class="text-zinc-500 font-normal text-base md:text-lg">&mdash; ideas that ship</span></h2>
                </div>
                <p class="text-zinc-400 mb-8 max-w-2xl">AI-assisted rapid development. Products go from brief to live in days, not months &mdash; lean, tested, and yours to own outright.</p>
                <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">Rapid Web &amp; App Builds</h3>
                        <p class="text-sm text-zinc-400">Full-stack web apps built fast with AI-assisted development. Clean code, responsive design, deployed and live before the other quote arrives.</p>
                    </div>
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">Automation &amp; Integration Scripts</h3>
                        <p class="text-sm text-zinc-400">Python scripts and API connectors that wire your tools together &mdash; WhatsApp, Google Workspace, Shopify, databases. One trigger, zero manual steps.</p>
                    </div>
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">MVP &amp; Prototype Sprints</h3>
                        <p class="text-sm text-zinc-400">From brief to clickable prototype in a focused sprint &mdash; real enough to demo to investors or test with users before committing to the full build.</p>
                    </div>
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">Dashboards &amp; Internal Tools</h3>
                        <p class="text-sm text-zinc-400">Control rooms, client portals, reporting dashboards and inventory consoles built to spec. No bloat, no unnecessary dependencies &mdash; just what the job requires.</p>
                    </div>
                </div>
            </div>

            <!-- 03 AI ORCHESTRATOR -->
            <div class="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="flex items-center gap-4 mb-3">
                    <span class="font-mono text-camo-accent text-sm border border-camo-accent/30 rounded px-2 py-1">03</span>
                    <h2 class="text-2xl md:text-3xl font-bold text-white">AI Orchestrator <span class="text-zinc-500 font-normal text-base md:text-lg">&mdash; intelligence on your machine</span></h2>
                </div>
                <p class="text-zinc-400 mb-8 max-w-2xl">Sovereign, local-first AI. Multi-agent systems, RAG pipelines, and the full CamoFlow OS &mdash; no cloud bills, no data leaks, runs offline.</p>
                <div class="relative p-8 rounded-xl bg-camo-900 border-2 border-camo-accent/40 shadow-[0_0_30px_rgba(20,184,166,0.1)] mb-6">
                    <h3 class="text-xl font-bold text-camo-accent font-mono mb-3">CamoFlow OS &mdash; Flagship Local AI Engine</h3>
                    <p class="text-zinc-300 max-w-3xl leading-relaxed">A fully sovereign AI operating system deployed on your own hardware. Multi-agent swarms, a natural-language query layer over your business data, and automated workflows &mdash; 100% data residency, no per-token cloud fees, runs offline.</p>
                    <div class="mt-5 flex flex-wrap gap-2">
                        <span class="text-xs font-mono text-camo-accent bg-camo-accent/10 px-2 py-1 rounded">No per-token bills</span>
                        <span class="text-xs font-mono text-camo-accent bg-camo-accent/10 px-2 py-1 rounded">100% data residency</span>
                        <span class="text-xs font-mono text-camo-accent bg-camo-accent/10 px-2 py-1 rounded">Runs offline</span>
                        <span class="text-xs font-mono text-camo-accent bg-camo-accent/10 px-2 py-1 rounded">You own it outright</span>
                    </div>
                </div>
                <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">Local Multi-Agent Deployment</h3>
                        <p class="text-sm text-zinc-400">Agent swarms built on open-weight models (Ollama, DeepSeek, Qwen) orchestrated on-premise. Zero external data egress, 40%+ lower latency than cloud.</p>
                    </div>
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">Sovereign RAG Pipelines</h3>
                        <p class="text-sm text-zinc-400">On-premise Retrieval-Augmented Generation over your documents and databases. Ask in plain language, get answers from your own data. POPIA-compliant by design.</p>
                    </div>
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">Workflow Automation</h3>
                        <p class="text-sm text-zinc-400">AI decision nodes wired into your operational pipelines. CSV drops, Telegram triggers, API events &mdash; the system reads, acts, and writes back without lifting a finger.</p>
                    </div>
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">IaC AI Deployment</h3>
                        <p class="text-sm text-zinc-400">Every AI service packaged as a hardened Docker container with Terraform or Ansible playbooks. Reproducible, auditable, zero config drift.</p>
                    </div>
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">AI Readiness Audit</h3>
                        <p class="text-sm text-zinc-400">A focused technical review of your stack to map exactly where local AI integrates, what the prerequisites are, and what ROI looks like before a line is written.</p>
                    </div>
                    <div class="p-5 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300">
                        <h3 class="text-white font-semibold font-mono text-sm mb-2">Training &amp; Handover</h3>
                        <p class="text-sm text-zinc-400">Plain-language docs, runbooks and a live training session. You own the system and understand it &mdash; no dependency on me to keep it running.</p>
                    </div>
                </div>
            </div>

            <!-- 04 WEB DESIGN -->
            <div class="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="flex items-center gap-4 mb-3">
                    <span class="font-mono text-camo-accent text-sm border border-camo-accent/30 rounded px-2 py-1">04</span>
                    <h2 class="text-2xl md:text-3xl font-bold text-white">Web Design <span class="text-zinc-500 font-normal text-base md:text-lg">&mdash; fast, sovereign, yours</span></h2>
                </div>
                <p class="text-zinc-400 mb-8 max-w-2xl">Performance-first websites built without bloat. Static sites that load in under a second, dynamic platforms you control, and custom sovereign apps that run on your own infrastructure.</p>

                <!-- Pricing tiers -->
                <div class="grid md:grid-cols-3 gap-6 mb-10">
                    <div class="p-8 rounded-xl bg-camo-950 border border-camo-800 flex flex-col">
                        <div class="mb-4">
                            <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Static / Brochure Site</span>
                            <h3 class="text-xl font-bold text-white mt-1">Lightning &amp; Clean</h3>
                        </div>
                        <p class="text-3xl font-bold text-camo-accent mb-1">R3,500 &ndash; R6,500 <span class="text-sm text-zinc-500 font-normal">once-off</span></p>
                        <p class="text-xs text-zinc-500 font-mono mb-5">Best for startups, local businesses, portfolios &amp; landing pages</p>
                        <ul class="space-y-2 text-sm text-zinc-400 flex-grow mb-6">
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> 1&ndash;5 fully responsive pages</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> SEO optimization built in</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> Contact form integration</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> High-performance static hosting (Cloudflare)</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> Sub-second page loads</li>
                        </ul>
                        <a href="audit.html" class="block text-center px-4 py-3 border border-camo-accent/30 text-camo-accent rounded hover:bg-camo-accent/10 transition-colors font-semibold">Get a Quote</a>
                    </div>
                    <div class="relative p-8 rounded-xl bg-camo-900 border-2 border-camo-accent flex flex-col shadow-[0_0_30px_rgba(20,184,166,0.1)]">
                        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-camo-accent text-camo-950 text-xs font-bold rounded-full">POPULAR</div>
                        <div class="mb-4">
                            <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Dynamic / CMS Site</span>
                            <h3 class="text-xl font-bold text-white mt-1">Content You Control</h3>
                        </div>
                        <p class="text-3xl font-bold text-camo-accent mb-1">R8,000 &ndash; R15,000 <span class="text-sm text-zinc-500 font-normal">once-off</span></p>
                        <p class="text-xs text-zinc-500 font-mono mb-5">Best for SMEs needing blogs, booking, or regular updates</p>
                        <ul class="space-y-2 text-sm text-zinc-400 flex-grow mb-6">
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> Multi-page with headless CMS</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> User-managed content dashboard</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> Dynamic forms &amp; basic analytics</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> Blog / news / portfolio module</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> Mobile-first responsive design</li>
                        </ul>
                        <a href="audit.html" class="block text-center px-4 py-3 bg-camo-accent text-camo-950 rounded hover:bg-camo-accentHover transition-colors font-bold">Get a Quote</a>
                    </div>
                    <div class="p-8 rounded-xl bg-camo-950 border border-camo-800 flex flex-col">
                        <div class="mb-4">
                            <span class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Custom Sovereign App</span>
                            <h3 class="text-xl font-bold text-white mt-1">Built to Own</h3>
                        </div>
                        <p class="text-3xl font-bold text-camo-accent mb-1">From R20,000 <span class="text-sm text-zinc-500 font-normal">project-based</span></p>
                        <p class="text-xs text-zinc-500 font-mono mb-5">Best for e-commerce, custom dashboards &amp; business platforms</p>
                        <ul class="space-y-2 text-sm text-zinc-400 flex-grow mb-6">
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> Advanced integrations &amp; APIs</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> Yoco / Stripe payment gateways</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> User authentication &amp; RBAC</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> Custom database design</li>
                            <li class="flex items-start gap-2"><span class="text-camo-accent mt-0.5">&#10003;</span> Self-hosted or sovereign deployment</li>
                        </ul>
                        <a href="audit.html" class="block text-center px-4 py-3 border border-camo-accent/30 text-camo-accent rounded hover:bg-camo-accent/10 transition-colors font-semibold">Discuss Build</a>
                    </div>
                </div>

                <!-- Monthly retainers -->
                <div class="rounded-xl bg-camo-900/50 border border-camo-800 p-6">
                    <h3 class="text-lg font-bold text-white font-mono mb-4">Monthly Retainer Add-Ons</h3>
                    <div class="grid sm:grid-cols-3 gap-4">
                        <div class="p-4 rounded-lg bg-camo-950 border border-camo-800">
                            <h4 class="text-white font-semibold text-sm mb-1">Hosting &amp; Maintenance</h4>
                            <p class="text-camo-accent font-mono font-bold text-sm mb-2">R250 &ndash; R500 / month</p>
                            <p class="text-xs text-zinc-400">Domain management, SSL, automated weekly backups and uptime monitoring.</p>
                        </div>
                        <div class="p-4 rounded-lg bg-camo-950 border border-camo-800">
                            <h4 class="text-white font-semibold text-sm mb-1">Content Updates &amp; Support</h4>
                            <p class="text-camo-accent font-mono font-bold text-sm mb-2">R450 &ndash; R900 / month</p>
                            <p class="text-xs text-zinc-400">Dedicated hours for text, image and minor design updates each month.</p>
                        </div>
                        <div class="p-4 rounded-lg bg-camo-950 border border-camo-800">
                            <h4 class="text-white font-semibold text-sm mb-1">AI &amp; Automation Integration</h4>
                            <p class="text-camo-accent font-mono font-bold text-sm mb-2">Custom add-on</p>
                            <p class="text-xs text-zinc-400">Link your site to backend workflows, CRM lead-capture and automated email sequencing.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </section>

    <!-- Portfolio -->
    <section class="py-20 bg-camo-900/30 border-y border-camo-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-camo-accent/10 border border-camo-accent/20 text-camo-accent text-xs font-mono mb-6">
                    <span class="w-2 h-2 rounded-full bg-camo-accent animate-pulse"></span>
                    SELECTED WORK
                </div>
                <h2 class="text-3xl font-bold text-white mb-4">Past Builds</h2>
                <p class="text-zinc-400 max-w-2xl mx-auto">A sample of sites and systems built for clients. Click any card to open the live project.</p>
            </div>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <!-- Portfolio Card 1 -->
                <a href="https://camodevops.online" target="_blank" rel="noopener noreferrer" class="group block rounded-xl overflow-hidden bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300">
                    <div class="h-44 bg-gradient-to-br from-camo-accent/20 to-camo-800 flex items-center justify-center">
                        <span class="font-mono text-camo-accent text-sm opacity-60">camodevops.online</span>
                    </div>
                    <div class="p-5">
                        <h3 class="text-white font-semibold mb-1">CamoDevOps Online</h3>
                        <p class="text-xs text-zinc-400 mb-3">Static sovereign site &mdash; Cloudflare Workers, TailwindCSS, Python generator</p>
                        <div class="flex flex-wrap gap-1">
                            <span class="text-xs font-mono text-camo-accent bg-camo-accent/10 px-2 py-0.5 rounded">Static</span>
                            <span class="text-xs font-mono text-camo-accent bg-camo-accent/10 px-2 py-0.5 rounded">Cloudflare</span>
                            <span class="text-xs font-mono text-camo-accent bg-camo-accent/10 px-2 py-0.5 rounded">TailwindCSS</span>
                        </div>
                    </div>
                </a>
                <!-- Portfolio Card 2 — placeholder, update URL and description -->
                <div class="group block rounded-xl overflow-hidden bg-camo-950 border border-camo-800 border-dashed opacity-60">
                    <div class="h-44 bg-camo-900 flex items-center justify-center">
                        <span class="font-mono text-zinc-600 text-sm">Your next case study</span>
                    </div>
                    <div class="p-5">
                        <h3 class="text-zinc-500 font-semibold mb-1">Coming Soon</h3>
                        <p class="text-xs text-zinc-600">Portfolio case study to be added</p>
                    </div>
                </div>
                <!-- Portfolio Card 3 — placeholder -->
                <div class="group block rounded-xl overflow-hidden bg-camo-950 border border-camo-800 border-dashed opacity-60">
                    <div class="h-44 bg-camo-900 flex items-center justify-center">
                        <span class="font-mono text-zinc-600 text-sm">Your next case study</span>
                    </div>
                    <div class="p-5">
                        <h3 class="text-zinc-500 font-semibold mb-1">Coming Soon</h3>
                        <p class="text-xs text-zinc-600">Portfolio case study to be added</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA -->
    <section class="py-20">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <h2 class="text-3xl font-bold text-white mb-4">Need one craft, or all four?</h2>
            <p class="text-zinc-400 max-w-3xl mx-auto mb-8 leading-relaxed">
                Engage for a single discipline &mdash; a live event, a rapid web build, a sovereign AI deployment, or a new site &mdash; or bring all four together in one engagement. Start with a 60-minute Discovery Audit: no commitment, just a clear picture of what the build looks like.
            </p>
            <a href="audit.html" class="inline-block px-10 py-4 bg-camo-accent hover:bg-camo-accentHover text-camo-950 font-bold text-lg rounded-md transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                Request a Discovery Audit
            </a>
            <p class="mt-4 text-sm text-zinc-500 font-mono">60 minutes. No sales deck. Just a technical assessment.</p>
        </div>
    </section>
""",
    },
    "architecture.html": {
        "title": "Architecture & Orchestration",
        "nav": {"nav_architecture": "text-camo-accent"},
        "content": """
    <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">Architecture & Orchestration</h1>
                <p class="text-zinc-400 max-w-2xl mx-auto">Fluent, deterministic workflows designed for zero-trust environments and local-first execution.</p>
            </div>
            
            <div class="grid lg:grid-cols-2 gap-12 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <!-- Tool Functionality Blueprint -->
                <div class="bg-camo-900/50 border border-camo-800 rounded-xl p-6 overflow-x-auto">
                    <h3 class="text-lg font-bold text-camo-accent font-mono mb-6 flex items-center gap-2">Tool Functionality Flow</h3>
                    <div class="mermaid flex justify-center">
graph TD
    classDef default fill:#18181b,stroke:#3f3f46,stroke-width:1px,color:#e4e4e7,font-family:'Inter',sans-serif;
    classDef trigger fill:#0f766e,stroke:#14b8a6,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef core fill:#09090b,stroke:#2dd4bf,stroke-width:2px,color:#f4f4f5;
    classDef tool fill:#27272a,stroke:#14b8a6,stroke-width:1px,color:#5eead4;
    classDef output fill:#115e59,stroke:#14b8a6,stroke-width:2px,color:#ffffff,font-weight:bold;
    USER(["User Request / Trigger"]):::trigger
    ORCH["Core Engine / Router"]:::core
    subgraph Tool_Ecosystem [" Tool and Functionality Layer "]
        style Tool_Ecosystem fill:#09090b,stroke:#27272a,stroke-width:1px,color:#a1a1aa,rx:12,ry:12
        T1[API Integration Tool]:::tool
        T2[Data Processing Engine]:::tool
        T3[Local AI Model Layer]:::tool
    end
    DELIVERY(["Polished Front-End Output"]):::output
    USER --> |Structured Input| ORCH
    ORCH <--> |Orchestrate| T1
    ORCH <--> |Transform| T2
    ORCH <--> |Analyze| T3
    ORCH --> |Stream Results| DELIVERY
    linkStyle default stroke:#52525b,stroke-width:2px;
                    </div>
                </div>

                <!-- Business Illustration Blueprint -->
                <div class="bg-camo-900/50 border border-camo-800 rounded-xl p-6 overflow-x-auto">
                    <h3 class="text-lg font-bold text-camo-accent font-mono mb-6 flex items-center gap-2">Business Architecture & Value</h3>
                    <div class="mermaid flex justify-center">
graph LR
    classDef default fill:#18181b,stroke:#3f3f46,stroke-width:1px,color:#e4e4e7,font-family:'Inter',sans-serif;
    classDef vision fill:#0f766e,stroke:#14b8a6,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef pillar fill:#27272a,stroke:#52525b,stroke-width:1px,color:#d4d4d8;
    classDef value fill:#115e59,stroke:#14b8a6,stroke-width:1px,color:#5eead4;
    BIZ(["Business Core & Vision"]):::vision
    subgraph Pillars [" Operational Strategy "]
        style Pillars fill:#09090b,stroke:#27272a,stroke-width:1px,color:#a1a1aa,rx:12,ry:12
        P1[Digital Skills Training]:::pillar
        P2[Sustainable Ecosystems]:::pillar
        P3[Local Infrastructure]:::pillar
    end
    V1[Community Impact]:::value
    V2[Sovereign Technology]:::value
    BIZ --> Pillars
    P1 --> V1
    P2 --> V1
    P3 --> V2
    linkStyle default stroke:#52525b,stroke-width:2px;
                    </div>
                </div>
            </div>

            <!-- ===== REAL ClientOS architecture & orchestration ===== -->
            <div class="mt-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="text-center mb-10">
                    <h2 class="text-3xl font-bold text-white mb-3">CamoDevOps Enterprise OS &mdash; Live System</h2>
                    <p class="text-zinc-400 max-w-3xl mx-auto">The real ClientOS: one Obsidian vault that is also an automation repo. CSV and chat inputs are ingested into a typed note graph; the Hermes Gateway dispatches the Flow Squad to read, act, and write back &mdash; streamed to a live ops cockpit.</p>
                </div>

                <!-- Real System Architecture -->
                <div class="bg-camo-900/50 border border-camo-800 rounded-xl p-6 overflow-x-auto mb-8">
                    <h3 class="text-lg font-bold text-camo-accent font-mono mb-6 flex items-center gap-2">Real System Architecture</h3>
                    <div class="mermaid flex justify-center">
graph TD
    classDef default fill:#18181b,stroke:#3f3f46,stroke-width:1px,color:#e4e4e7,font-family:'Inter',sans-serif;
    classDef input fill:#0f766e,stroke:#14b8a6,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef pipe fill:#27272a,stroke:#14b8a6,stroke-width:1px,color:#5eead4;
    classDef brain fill:#1e1b4b,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef ops fill:#115e59,stroke:#14b8a6,stroke-width:2px,color:#ffffff,font-weight:bold;

    CSV([CSV / data drops]):::input
    TG([Telegram bot]):::input
    APIIN([API server 127.0.0.1:8642]):::input

    BIN[99_Ingestion_Bin]:::pipe
    ING["ingest_csv.py<br/>systemd timer + flock"]:::pipe

    subgraph VAULT [" CamoDevOps Enterprise OS &mdash; single Obsidian vault "]
        HR[01 People Ops]
        FIN[02 Finance]
        SALES[03 Marketing and Sales]
        MAP["04 Map Board · geo pins"]
        TASKS[05 Tasks]
    end

    HERMES["Hermes Gateway<br/>cron 60s · kanban 60s · sessions"]:::brain
    SQUAD["Flow Squad<br/>Goku · Graham · Sophia<br/>Letitia · Alicia · Coco"]:::brain

    JOBS["_ops/jobs pulses"]:::ops
    FEED[agent_thinking feed]:::ops
    DASH(["Obsidian dashboards<br/>Dataview · auto-refresh ~2s"]):::ops

    CSV --> BIN
    BIN --> ING
    ING -->|route by type| HR
    ING --> FIN
    ING --> SALES
    ING --> MAP
    TG --> HERMES
    APIIN --> HERMES
    HERMES --> SQUAD
    SQUAD -->|read + write notes| VAULT
    SQUAD --> JOBS
    SQUAD --> FEED
    JOBS --> DASH
    FEED --> DASH
    VAULT --> DASH
    linkStyle default stroke:#52525b,stroke-width:2px;
                    </div>
                </div>

                <!-- Real Orchestration Flow -->
                <div class="bg-camo-900/50 border border-camo-800 rounded-xl p-6 overflow-x-auto">
                    <h3 class="text-lg font-bold text-camo-accent font-mono mb-6 flex items-center gap-2">Real Orchestration Flow</h3>
                    <div class="mermaid flex justify-center">
sequenceDiagram
    autonumber
    participant T as Trigger
    participant G as Hermes Gateway
    participant K as Kanban dispatcher
    participant A as Flow Squad agent
    participant P as Tool plugins
    participant V as Vault notes
    participant O as Ops cockpit
    T->>G: Telegram msg / cron tick / CSV drop
    G->>G: Load session (~/.hermes/sessions)
    G->>K: Enqueue job into _ops/jobs
    K->>A: Dispatch every 60s
    A->>P: Call web / browser / image tools
    P-->>A: Results (secrets redacted)
    A->>V: Write frontmatter notes (route by type)
    A->>O: Pulse status + agent_thinking
    O-->>T: Reply + Live Ops dashboard (~2s refresh)
                    </div>
                </div>
            </div>
        </div>
    </section>
""",
    },
    "sovereignty.html": {
        "title": "Data Sovereignty",
        "nav": {"nav_sovereignty": "text-camo-accent"},
        "content": """
    <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">The Sovereign Stack</h1>
                <p class="text-zinc-400 max-w-2xl mx-auto">Why localization matters for your business.</p>
            </div>
            
            <div class="grid md:grid-cols-2 gap-12 items-center scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div>
                    <p class="text-zinc-400 mb-6 leading-relaxed text-lg">
                        Generic, cloud-hosted AI treats your data as a byproduct. For an SME, your data is your competitive advantage and your primary liability. 
                    </p>
                    <p class="text-white font-semibold mb-8 border-l-4 border-camo-accent pl-4 text-xl">
                        Your data never leaves your perimeter unless you explicitly engineer it to.
                    </p>
                    <ul class="space-y-6">
                        <li class="flex items-start gap-4">
                            <div class="w-8 h-8 rounded-full bg-camo-accent/10 flex items-center justify-center text-camo-accent flex-shrink-0 mt-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <div>
                                <h4 class="text-white font-semibold text-lg">True Data Residency</h4>
                                <p class="text-zinc-400">Models and vector stores run on your hardware or your chosen private cloud.</p>
                            </div>
                        </li>
                        <li class="flex items-start gap-4">
                            <div class="w-8 h-8 rounded-full bg-camo-accent/10 flex items-center justify-center text-camo-accent flex-shrink-0 mt-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <div>
                                <h4 class="text-white font-semibold text-lg">No Hidden Telemetry</h4>
                                <p class="text-zinc-400">We strip out phone-home mechanisms and ensure complete opacity from external model providers.</p>
                            </div>
                        </li>
                        <li class="flex items-start gap-4">
                            <div class="w-8 h-8 rounded-full bg-camo-accent/10 flex items-center justify-center text-camo-accent flex-shrink-0 mt-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <div>
                                <h4 class="text-white font-semibold text-lg">Deterministic Behavior</h4>
                                <p class="text-zinc-400">Local execution means predictable performance, predictable costs, and no surprise API rate limits.</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <div class="relative">
                    <div class="absolute -inset-4 bg-camo-accent/20 rounded-xl blur-2xl opacity-30"></div>
                    <div class="relative bg-camo-900 border border-camo-800 rounded-xl p-8 font-mono text-sm">
                        <div class="flex items-center gap-2 mb-4 border-b border-camo-800 pb-4">
                            <div class="w-3 h-3 rounded-full bg-red-500"></div>
                            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div class="w-3 h-3 rounded-full bg-green-500"></div>
                            <span class="ml-2 text-zinc-500">sovereign_deploy.sh</span>
                        </div>
                        <div class="space-y-2 text-zinc-300">
                            <p><span class="text-camo-accent">$</span> camodevops init --local</p>
                            <p class="text-zinc-500"># Initializing sovereign environment...</p>
                            <p><span class="text-green-400">✓</span> Pulling local embedding model (Mistral-7B)</p>
                            <p><span class="text-green-400">✓</span> Configuring local vector store (ChromaDB)</p>
                            <p><span class="text-green-400">✓</span> Establishing air-gapped agent network</p>
                            <p><span class="text-green-400">✓</span> Verifying zero egress policies</p>
                            <p class="mt-4 text-camo-accent">Deployment successful. Data residency: 100%.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Philosophy -->
            <div class="mt-24 border-t border-camo-800 pt-16">
                <h2 class="text-3xl font-bold text-white text-center mb-12">Core Integration Philosophies</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                    <div class="p-6 text-center">
                        <div class="w-12 h-12 mx-auto mb-4 rounded-lg bg-camo-accent/10 flex items-center justify-center text-camo-accent">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                        </div>
                        <h3 class="text-lg font-bold text-white mb-2">Python-Native</h3>
                        <p class="text-sm text-zinc-400">All custom logic and orchestration scripts are written in clean, well-documented Python for easy handoff.</p>
                    </div>
                    <div class="p-6 text-center">
                        <div class="w-12 h-12 mx-auto mb-4 rounded-lg bg-camo-accent/10 flex items-center justify-center text-camo-accent">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        </div>
                        <h3 class="text-lg font-bold text-white mb-2">Docker-Ready</h3>
                        <p class="text-sm text-zinc-400">Every component is delivered as a self-contained, versioned container. If it runs here, it runs there.</p>
                    </div>
                    <div class="p-6 text-center">
                        <div class="w-12 h-12 mx-auto mb-4 rounded-lg bg-camo-accent/10 flex items-center justify-center text-camo-accent">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                        </div>
                        <h3 class="text-lg font-bold text-white mb-2">Local Data First</h3>
                        <p class="text-sm text-zinc-400">We design systems to read directly from your existing local databases, eliminating risky cloud sync.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
""",
    },
    "about.html": {
        "title": "About",
        "nav": {"nav_about": "text-camo-accent"},
        "content": """
    <!-- About Hero -->
    <section class="relative pt-20 pb-16 overflow-hidden border-b border-camo-800">
        <div class="absolute inset-0 z-0 bg-gradient-to-b from-camo-900/40 via-camo-950 to-camo-950"></div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="grid lg:grid-cols-5 gap-12 items-center">
                <div class="lg:col-span-3 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-camo-accent/10 border border-camo-accent/20 text-camo-accent text-xs font-mono mb-6">
                        <span class="w-2 h-2 rounded-full bg-camo-accent animate-pulse"></span>
                        ABOUT &middot; THE ARCHITECT
                    </div>
                    <h1 class="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-3">The Architect</h1>
                    <p class="text-xl md:text-2xl text-camo-accent font-semibold mb-6 glow-text">Engineering Sovereignty, Empowering the Underdog</p>
                    <p class="text-lg text-zinc-300 leading-relaxed mb-6 border-l-4 border-camo-accent pl-4">
                        I don't just write code; I build digital armor for the people the status quo forgot.
                    </p>
                    <p class="text-zinc-400 leading-relaxed">
                        My name is <span class="text-white font-semibold">Cameron &ldquo;Camo&rdquo; De Vries</span>. I am a Sound Technician, Vibe Coder, AI Orchestrator, and the founder of <em>Unspoken Truths</em>.
                    </p>
                </div>
                <div class="lg:col-span-2 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                    <div class="relative">
                        <div class="absolute -inset-3 bg-camo-accent/20 rounded-2xl blur-2xl opacity-40"></div>
                        <img src="camo-portrait.jpg" alt="Cameron &quot;Camo&quot; De Vries" class="relative w-full max-w-sm mx-auto rounded-2xl border border-camo-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] object-cover" loading="lazy" />
                    </div>
                </div>
            </div>
            <div class="mt-14 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <p class="text-2xl md:text-3xl font-bold text-white text-center max-w-4xl mx-auto leading-snug">
                    &ldquo;If you don't own your infrastructure, <span class="text-camo-accent">you don't own your future.</span>&rdquo;
                </p>
            </div>
        </div>
    </section>

    <!-- The Mission -->
    <section class="py-20">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <h2 class="text-3xl font-bold text-white mb-6 font-mono">The Mission: Why I Build</h2>
            <div class="space-y-5 text-zinc-400 leading-relaxed">
                <p>For too long, local entrepreneurs and SMEs have been held hostage by the &ldquo;subscription trap.&rdquo; Corporate giants sell them expensive, bloated software, bleeding their margins dry just to keep the lights on. They tell you that you need a fortune to automate your business.</p>
                <p class="text-2xl font-bold text-camo-accent">That is a lie.</p>
                <p>I specialize in building sovereign AI automation tools&mdash;custom-engineered, open-source systems that deliver enterprise-level power for next to nothing. I don't build for the boardroom; I build for the shop floor, the small business owner in Bonteheuwel, and the entrepreneur who is fighting to make their first hire. My goal is to streamline your operations so you can stop paying for tech and start investing in your people.</p>
            </div>
        </div>
    </section>

    <!-- Unspoken Truths -->
    <section class="py-20 bg-camo-900/30 border-y border-camo-800">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <h2 class="text-3xl font-bold text-white mb-6 font-mono">Rooted in Reality: The <span class="text-camo-accent">Unspoken Truths</span> Advantage</h2>
            <div class="space-y-5 text-zinc-400 leading-relaxed">
                <p>My work is forged in the fires of real-world struggle. Through <em>Unspoken Truths</em>, I've documented the harsh realities of our economy and the strength it takes to survive when the system is rigged against you.</p>
                <p>I know the cost of every cent. I know the grit required to build something from nothing. That lived experience is the foundation of every tool I deploy. When you partner with me, you aren't just getting an AI dev; you're getting a collaborator who understands that <span class="text-white font-semibold">efficiency is the bridge between surviving and thriving.</span></p>
            </div>
            <div class="mt-8 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <p class="text-sm font-mono text-camo-accent mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.35-.66.46-1 .26-2.74-1.67-6.19-2.05-10.25-1.12-.4.09-.8-.16-.89-.56-.09-.4.16-.8.56-.89 4.44-1.02 8.26-.58 11.32 1.29.36.2.46.66.26 1.02zm1.47-3.27c-.27.43-.84.57-1.27.3-3.14-1.93-7.93-2.49-11.64-1.36-.49.15-1.01-.13-1.16-.61-.15-.49.13-1.01.61-1.16 4.24-1.29 9.52-.66 13.13 1.56.43.27.57.84.3 1.27zm.13-3.41C15.13 8.36 8.9 8.15 5.27 9.26c-.58.18-1.2-.15-1.38-.73-.18-.58.15-1.2.73-1.38 4.17-1.27 11.05-1.02 15.42 1.57.52.31.69.99.38 1.51-.31.52-.99.69-1.51.38z"/></svg>
                    Listen &mdash; <em>Unspoken Truths</em>
                </p>
                <iframe style="border-radius:12px" src="https://open.spotify.com/embed/episode/7EoivtiQqdy36khDaPvPky?utm_source=generator" width="100%" height="152" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <p class="mt-3 text-sm"><a href="https://open.spotify.com/episode/7EoivtiQqdy36khDaPvPky" target="_blank" rel="noopener noreferrer" class="text-camo-accent hover:text-camo-accentHover transition-colors">Open in Spotify →</a></p>
            </div>
        </div>
    </section>

    <!-- My Arsenal -->
    <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-3xl font-bold text-white text-center mb-12 font-mono scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">My Arsenal</h2>
            <div class="grid md:grid-cols-3 gap-6 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div class="p-6 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300">
                    <p class="text-camo-accent font-mono text-xs mb-2">&#127911; SOUND TECHNICIAN</p>
                    <h3 class="text-lg font-bold text-white font-mono mb-3">Audio Engineering</h3>
                    <p class="text-sm text-zinc-400">FOH and monitor mixing for live events, studio recording and mixing for artists, end-to-end podcast production, and broadcast audio chains. The room sounds right.</p>
                </div>
                <div class="p-6 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300">
                    <p class="text-camo-accent font-mono text-xs mb-2">&#9000; VIBE CODER &nbsp;&#129302; AI ORCHESTRATOR</p>
                    <h3 class="text-lg font-bold text-white font-mono mb-3">Code &amp; AI Systems</h3>
                    <p class="text-sm text-zinc-400">AI-assisted rapid builds that ship in days. Local-first agent swarms (Ollama, DeepSeek, Qwen), sovereign RAG pipelines, workflow automation &mdash; data stays on your machine, not Silicon Valley's.</p>
                </div>
                <div class="p-6 rounded-lg bg-camo-950 border border-camo-800 hover:border-camo-accent/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300">
                    <p class="text-camo-accent font-mono text-xs mb-2">&#127760; WEB DESIGNER</p>
                    <h3 class="text-lg font-bold text-white font-mono mb-3">Web Design &amp; Handover</h3>
                    <p class="text-sm text-zinc-400">Performance-first sites and sovereign apps &mdash; from R3,500 static builds to custom R20,000+ platforms. No plugin bloat. Full docs, training, and genuine ownership at handover.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- The Bottom Line -->
    <section class="py-20 bg-camo-900/30 border-t border-camo-800">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <h2 class="text-2xl font-bold text-camo-accent mb-4 font-mono">The Bottom Line</h2>
            <p class="text-zinc-400 leading-relaxed mb-8 max-w-2xl mx-auto">The big players want you to stay small and keep paying. I'm here to make sure you grow big, stay sovereign, and finally get the edge you deserve.</p>
            <p class="text-2xl md:text-3xl font-bold text-white leading-snug mb-10">I don't just build technology.<br /> <span class="text-camo-accent glow-text">I build the infrastructure of independence.</span></p>
            <a href="audit.html" class="inline-block px-10 py-4 bg-camo-accent hover:bg-camo-accentHover text-camo-950 font-bold text-lg rounded-md transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                Request a Discovery Audit
            </a>
        </div>
    </section>
""",
    },
    "audit.html": {
        "title": "Request Discovery Audit",
        "nav": {"nav_audit": "text-camo-accent"},
        "content": """
    <section class="py-24 relative">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Do not book a sales call.</h1>
            <p class="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
                We do not do pitch decks. If you are evaluating AI for your operations, you need a technical assessment, not a marketing presentation. 
            </p>
            <div class="bg-camo-900/50 border border-camo-800 rounded-xl p-8 md:p-12 text-left mb-10">
                <h3 class="text-2xl font-bold text-camo-accent mb-4 font-mono">The Discovery Audit</h3>
                <p class="text-zinc-300 mb-6 leading-relaxed">
                    A focused, 60-minute technical review of your current infrastructure, data workflows, and automation bottlenecks. 
                </p>
                <ul class="space-y-3 text-zinc-400 mb-8">
                    <li class="flex items-start gap-3"><span class="text-camo-accent mt-1">→</span> We identify exactly where localized AI can be integrated.</li>
                    <li class="flex items-start gap-3"><span class="text-camo-accent mt-1">→</span> We outline the technical prerequisites for your stack.</li>
                    <li class="flex items-start gap-3"><span class="text-camo-accent mt-1">→</span> We determine if Camodevops is the right fit for your operational reality.</li>
                </ul>
                <a href="https://t.me/Camodevopsbot" target="_blank" rel="noopener noreferrer" class="inline-block w-full md:w-auto text-center px-10 py-4 bg-camo-accent hover:bg-camo-accentHover text-camo-950 font-bold text-lg rounded-md transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                    Initiate Audit via Telegram
                </a>
                <p class="mt-6 text-sm text-zinc-500 font-mono">No commitment required. Technical prerequisites will be sent upon booking.</p>
            </div>
        </div>
    </section>
""",
    },
    "privacy.html": {
        "title": "Privacy Policy",
        "nav": {},
        "content": """
    <section class="py-20 bg-camo-900/30 border-y border-camo-800">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 class="text-3xl font-bold text-white mb-2 font-mono">Privacy Policy</h1>
            <p class="text-camo-accent text-sm font-mono mb-8">Compliance: Protection of Personal Information Act (POPIA), No. 4 of 2013</p>
            <div class="space-y-6 text-zinc-400 text-sm leading-relaxed">
                <div><h3 class="text-white font-semibold mb-2">1. Introduction & Overview</h3><p>Camodevops is committed to protecting the privacy and data sovereignty of our clients. This Privacy Policy outlines how we process personal information in strict compliance with POPIA.</p></div>
                <div><h3 class="text-white font-semibold mb-2">2. The Information We Collect</h3><p>We collect only the minimum required: Contact Information (name, business email), Technical Infrastructure Metadata (provided voluntarily during diagnostics), and Digital Identifiers (IP addresses, processed lawfully).</p></div>
                <div><h3 class="text-white font-semibold mb-2">3. Purpose of Processing</h3><p>To respond to inquiries, schedule discovery audits, deliver customized local AI tools, and ensure the security of our digital platforms.</p></div>
                <div><h3 class="text-white font-semibold mb-2">4. Our Sovereign Data Philosophy</h3><ul class="list-disc pl-5 mt-2 space-y-1"><li><span class="text-camo-accent">Local Processing First:</span> We prioritize configuring AI tools locally on client infrastructure.</li><li><span class="text-camo-accent">Zero Third-Party Leaks:</span> We do not sell, rent, or lease your data, nor use it to train public models.</li><li><span class="text-camo-accent">Cross-Border Controls:</span> Any cross-border transfer complies fully with Section 72 of POPIA.</li></ul></div>
                <div><h3 class="text-white font-semibold mb-2">5. Information Security Safeguards</h3><p>In alignment with Section 19 of POPIA, we implement robust technical measures including encrypted communications, local repository isolation, and access-controlled deployment pipelines.</p></div>
                <div><h3 class="text-white font-semibold mb-2">6. Your Data Rights</h3><p>Under POPIA, you retain the right to confirm what personal information we hold, request correction or destruction of inaccurate data, and object to processing for valid reasons.</p></div>
                <div><h3 class="text-white font-semibold mb-2">7. Contact Our Information Officer</h3><p>For any queries, contact the Camodevops Information Officer at: <a href="mailto:legal@camodevops.co.za" class="text-camo-accent hover:underline">legal@camodevops.co.za</a>.</p></div>
            </div>
        </div>
    </section>
""",
    },
    "terms.html": {
        "title": "Terms & Conditions",
        "nav": {},
        "content": """
    <section class="py-20">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 class="text-3xl font-bold text-white mb-2 font-mono">Terms & Conditions</h1>
            <p class="text-camo-accent text-sm font-mono mb-8">Governed by the laws of the Republic of South Africa & Electronic Communications and Transactions Act (ECTA)</p>
            <div class="space-y-6 text-zinc-400 text-sm leading-relaxed">
                <div><h3 class="text-white font-semibold mb-2">1. Acceptance of Terms</h3><p>By accessing camodevops.co.za, you agree to be bound by these Terms and Conditions and all applicable laws of the Republic of South Africa.</p></div>
                <div><h3 class="text-white font-semibold mb-2">2. Nature of Services & Disclaimers</h3><p>This website serves as a technical capability catalog. Content does not constitute binding technical advice. All information is provided "as is" without express or implied warranties regarding system fit.</p></div>
                <div><h3 class="text-white font-semibold mb-2">3. Intellectual Property Rights</h3><p>All content, architecture diagrams, code frameworks, and the name Camodevops are the exclusive intellectual property of Cameron De Vries / Camodevops, protected under South African and international law. You may not scrape, copy, or commercially distribute our content without explicit written authorization.</p></div>
                <div><h3 class="text-white font-semibold mb-2">4. Acceptable Use Policy</h3><p>You strictly agree not to deploy automated bots, scrapers, or malicious scripts; attempt to bypass security boundaries; or submit fraudulent information via our forms.</p></div>
                <div><h3 class="text-white font-semibold mb-2">5. Limitation of Liability</h3><p>To the maximum extent permitted by the ECTA, Camodevops will not be held liable for any direct, indirect, incidental, or consequential damages resulting from your use of this website or its technical materials.</p></div>
                <div><h3 class="text-white font-semibold mb-2">6. Governing Law</h3><p>These terms are governed by the laws of the Republic of South Africa. Any disputes will be subject to the exclusive jurisdiction of the courts located in Cape Town, South Africa.</p></div>
            </div>
        </div>
    </section>
""",
    },
}

# Generate Pages
for filename, page_data in PAGES.items():
    nav_classes = {
        "nav_home": "",
        "nav_platform": "",
        "nav_services": "",
        "nav_architecture": "",
        "nav_sovereignty": "",
        "nav_about": "",
        "nav_audit": "",
    }
    nav_classes.update(page_data["nav"])

    html = SHARED_HEAD.format(title=page_data["title"], **nav_classes)
    html += page_data["content"]
    html += SHARED_FOOTER

    with open(os.path.join(OUTPUT_DIR, filename), "w", encoding="utf-8") as f:
        f.write(html)

print(f"Successfully generated multi-page website in: {OUTPUT_DIR}")
