import Link from "next/link";
import {
    MessageSquare,
    PenTool,
    User,
    Briefcase,
    Sparkles,
    ArrowRight,
    CheckCircle,
    Zap,
    Shield,
    Globe
} from "lucide-react";

const features = [
    {
        icon: MessageSquare,
        title: "Smart Reply",
        description: "AI-generated reply suggestions for LinkedIn messages. Respond faster and more professionally.",
        color: "from-blue-500 to-cyan-500",
    },
    {
        icon: PenTool,
        title: "Post Writer",
        description: "Create engaging LinkedIn posts with AI. Choose tone, format, and get viral-worthy content.",
        color: "from-purple-500 to-pink-500",
    },
    {
        icon: User,
        title: "Profile Optimizer",
        description: "Get your profile reviewed and receive actionable suggestions to stand out.",
        color: "from-orange-500 to-yellow-500",
    },
    {
        icon: Briefcase,
        title: "Job Matcher",
        description: "Analyze how well your profile matches any job posting. Identify gaps and improve.",
        color: "from-green-500 to-emerald-500",
    },
];

const benefits = [
    { icon: Zap, text: "Save 10+ hours per week" },
    { icon: Shield, text: "Secure & Private" },
    { icon: Globe, text: "Works in English & Vietnamese" },
];

const pricingPlans = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        features: [
            "5 AI replies per day",
            "3 posts per month",
            "1 profile review per month",
            "3 job matches per month",
        ],
        cta: "Get Started",
        highlighted: false,
    },
    {
        name: "Pro",
        price: "$9.99",
        period: "per month",
        features: [
            "Unlimited AI replies",
            "20 posts per month",
            "Unlimited profile reviews",
            "20 job matches per month",
            "Priority support",
        ],
        cta: "Start Pro Trial",
        highlighted: true,
    },
    {
        name: "Premium",
        price: "$19.99",
        period: "per month",
        features: [
            "Everything in Pro",
            "Unlimited posts",
            "Unlimited job matches",
            "Advanced analytics",
            "API access",
            "Team features",
        ],
        cta: "Go Premium",
        highlighted: false,
    },
];

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-8 h-8 text-primary-500" />
                            <span className="text-xl font-bold gradient-text">LinkedBoost AI</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
                            <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
                            <Link href="/login" className="btn btn-ghost text-sm py-2">
                                Sign In
                            </Link>
                            <Link href="/login" className="btn btn-primary text-sm py-2">
                                Get Started Free
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-purple-900/20" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm mb-8 animate-fade-in">
                        <Sparkles className="w-4 h-4" />
                        AI-Powered LinkedIn Assistant
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
                        Boost Your
                        <span className="gradient-text"> LinkedIn </span>
                        Presence
                    </h1>

                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        Reply smarter, write better posts, optimize your profile, and find the perfect job match — all powered by AI.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <Link href="/login" className="btn btn-primary text-lg px-8 py-4">
                            Start Free Today
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a href="#features" className="btn btn-ghost text-lg px-8 py-4">
                            See How It Works
                        </a>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        {benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <benefit.icon className="w-5 h-5 text-primary-500" />
                                {benefit.text}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Everything You Need to
                            <span className="gradient-text"> Succeed </span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Four powerful AI features designed to supercharge your LinkedIn presence and career growth.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="card group cursor-pointer"
                            >
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-transparent via-primary-950/20 to-transparent">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            Simple,
                            <span className="gradient-text"> Transparent </span>
                            Pricing
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Start free, upgrade when you need more power.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {pricingPlans.map((plan, index) => (
                            <div
                                key={index}
                                className={`card relative ${plan.highlighted ? 'border-primary-500 scale-105' : ''}`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 text-white text-sm font-medium rounded-full">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-gray-400">/{plan.period}</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-center gap-3 text-gray-300">
                                            <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/login"
                                    className={`btn w-full ${plan.highlighted ? 'btn-primary' : 'btn-ghost'}`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center card bg-gradient-to-br from-primary-900/50 to-purple-900/50 border-primary-500/20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Supercharge Your LinkedIn?
                    </h2>
                    <p className="text-gray-400 text-lg mb-8">
                        Join thousands of professionals using AI to grow their network and career.
                    </p>
                    <Link href="/login" className="btn btn-primary text-lg px-8 py-4 inline-flex">
                        Get Started Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-gray-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary-500" />
                        <span className="font-semibold">LinkedBoost AI</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        © 2026 LinkedBoost AI. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-400">
                        <a href="#" className="hover:text-white transition">Privacy</a>
                        <a href="#" className="hover:text-white transition">Terms</a>
                        <a href="#" className="hover:text-white transition">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
