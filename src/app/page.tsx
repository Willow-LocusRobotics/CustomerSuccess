"use client";

import Link from "next/link";
import {
  FolderOpen,
  PlusCircle,
  BookOpen,
  Library,
  Search,
  ArrowRight,
  Headset,
  Clock,
  ShieldCheck,
} from "lucide-react";

const quickActions = [
  {
    title: "Create a Case",
    description: "Submit a new support request to our team",
    href: "/cases/new",
    icon: PlusCircle,
    color: "bg-locus-blue",
  },
  {
    title: "My Cases",
    description: "Track and manage your open support cases",
    href: "/cases",
    icon: FolderOpen,
    color: "bg-locus-dark",
  },
  {
    title: "Knowledge Base",
    description: "Browse articles, guides, and documentation",
    href: "/knowledge",
    icon: BookOpen,
    color: "bg-emerald-600",
  },
  {
    title: "Resources",
    description: "Dashboards, LocusHub, Lokimon, and more",
    href: "/resources/dashboards",
    icon: Library,
    color: "bg-violet-600",
  },
];

const features = [
  {
    icon: Headset,
    title: "24/7/365 Support",
    description: "World-class support around the clock at no additional cost",
  },
  {
    icon: Clock,
    title: "Fast Resolution",
    description: "Priority-based routing ensures critical issues get immediate attention",
  },
  {
    icon: ShieldCheck,
    title: "Proactive Monitoring",
    description: "Continuous system health checks and preventive maintenance",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-locus-navy via-locus-dark to-locus-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-locus-blue/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              How can we{" "}
              <span className="text-locus-blue">help you</span> today?
            </h1>
            <p className="mt-4 text-lg text-locus-gray-200 leading-relaxed">
              Access your support cases, browse our knowledge base, or view your
              support dashboard — all in one place.
            </p>

            {/* Search Bar */}
            <div className="mt-8 relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-locus-gray-400" />
              <input
                type="text"
                placeholder="Search knowledge base articles, cases, or topics..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-locus-blue focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-white rounded-xl p-6 shadow-sm border border-locus-gray-100 hover:shadow-md hover:border-locus-blue/30 transition-all duration-200"
            >
              <div
                className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-4`}
              >
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-locus-gray-800 group-hover:text-locus-dark transition-colors">
                {action.title}
              </h3>
              <p className="mt-1 text-sm text-locus-gray-400">
                {action.description}
              </p>
              <div className="mt-3 flex items-center gap-1 text-sm text-locus-blue font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Go <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-locus-gray-800">
            World-Class Support for Your Operations
          </h2>
          <p className="mt-3 text-locus-gray-400 max-w-xl mx-auto">
            Locus Robotics provides comprehensive support to keep your warehouse
            automation running at peak performance.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="text-center p-6"
            >
              <div className="w-14 h-14 bg-locus-light-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-locus-dark" />
              </div>
              <h3 className="font-semibold text-lg text-locus-gray-800">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-locus-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-locus-dark to-locus-navy rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Need immediate assistance?
          </h2>
          <p className="mt-3 text-locus-gray-200 max-w-lg mx-auto">
            Our support team is available 24/7/365. Create a case and we will
            get back to you as quickly as possible.
          </p>
          <Link
            href="/cases/new"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-locus-blue hover:bg-locus-blue/90 text-white font-semibold rounded-lg transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Create a Support Case
          </Link>
        </div>
      </section>
    </div>
  );
}
