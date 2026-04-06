"use client";

import {
  Cpu,
  ExternalLink,
  BarChart3,
  Settings,
  Map,
  Package,
  Zap,
  Users,
} from "lucide-react";

const hubModules = [
  {
    title: "Fleet Overview",
    description:
      "Real-time view of all active LocusBots across your facilities, including status, location, and current task assignments.",
    icon: Map,
    status: "Live",
  },
  {
    title: "Task Management",
    description:
      "Monitor and manage pick, put, and transport tasks. View queue depth, completion rates, and worker assignments.",
    icon: Package,
    status: "Live",
  },
  {
    title: "Performance Analytics",
    description:
      "Deep-dive analytics on throughput, units per hour, and bot utilization across shifts and zones.",
    icon: BarChart3,
    status: "Live",
  },
  {
    title: "User Administration",
    description:
      "Manage user access, roles, and permissions for your LocusHub instance. Configure site-level settings.",
    icon: Users,
    status: "Live",
  },
  {
    title: "Zone Configuration",
    description:
      "Configure warehouse zones, staging areas, charging stations, and bot traffic patterns.",
    icon: Settings,
    status: "Live",
  },
  {
    title: "Integrations",
    description:
      "Manage connections to your WMS, ERP, and other third-party systems. View integration health and logs.",
    icon: Zap,
    status: "Live",
  },
];

export default function LocusHubPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs text-locus-gray-400 mb-1">Resources</p>
          <h1 className="text-2xl font-bold text-locus-gray-800">LocusHub</h1>
          <p className="text-sm text-locus-gray-400 mt-1">
            Your central operations hub for fleet management and warehouse
            automation
          </p>
        </div>
        <a
          href="https://hub.locusrobotics.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-locus-blue hover:bg-locus-blue/90 text-white font-medium rounded-lg transition-colors text-sm shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Open LocusHub
        </a>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-locus-dark to-locus-navy rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-locus-blue/20 rounded-xl flex items-center justify-center">
            <Cpu className="w-6 h-6 text-locus-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              LocusHub Operations Platform
            </h2>
            <p className="text-sm text-locus-gray-200">
              Centralized command and control for your Locus deployment
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[
            { label: "Active Bots", value: "48", sub: "across 3 sites" },
            { label: "Tasks Today", value: "2,847", sub: "+12% vs yesterday" },
            { label: "Uptime", value: "99.8%", sub: "last 30 days" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/10 rounded-xl px-5 py-4"
            >
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-locus-gray-200 mt-0.5">
                {stat.label}
              </p>
              <p className="text-xs text-locus-blue mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hub Modules */}
      <h2 className="font-semibold text-locus-gray-800 mb-4">Hub Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hubModules.map((mod) => (
          <div
            key={mod.title}
            className="group bg-white rounded-xl border border-locus-gray-100 shadow-sm p-5 hover:shadow-md hover:border-locus-blue/20 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-locus-light-blue rounded-lg flex items-center justify-center">
                <mod.icon className="w-5 h-5 text-locus-dark" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {mod.status}
              </span>
            </div>
            <h3 className="font-semibold text-locus-gray-800 group-hover:text-locus-dark transition-colors">
              {mod.title}
            </h3>
            <p className="mt-1.5 text-sm text-locus-gray-400 leading-relaxed">
              {mod.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
