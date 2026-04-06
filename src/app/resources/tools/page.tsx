"use client";

import {
  Wrench,
  ExternalLink,
  Download,
  FileText,
  Code,
  Globe,
  HardDrive,
  Radio,
  ArrowRight,
} from "lucide-react";

const tools = [
  {
    title: "Locus API Documentation",
    description:
      "Complete REST API reference for integrating with the Locus platform. Includes authentication, endpoints, and code examples.",
    icon: Code,
    action: "View Docs",
    href: "#",
  },
  {
    title: "Firmware Downloads",
    description:
      "Download the latest firmware packages for LocusBots and charging stations. Includes release notes and installation guides.",
    icon: Download,
    action: "Browse Downloads",
    href: "#",
  },
  {
    title: "Network Configuration Tool",
    description:
      "Validate and configure network settings for your Locus deployment. Test connectivity, firewall rules, and bandwidth requirements.",
    icon: Globe,
    action: "Launch Tool",
    href: "#",
  },
  {
    title: "Site Survey Toolkit",
    description:
      "Tools and templates for conducting warehouse site surveys prior to Locus deployment or expansion.",
    icon: Radio,
    action: "Download Kit",
    href: "#",
  },
  {
    title: "Log Collector",
    description:
      "Gather and package diagnostic logs from your Locus fleet for support case escalation. Supports bulk collection.",
    icon: HardDrive,
    action: "Launch",
    href: "#",
  },
  {
    title: "Release Notes Archive",
    description:
      "Complete archive of software release notes, known issues, and changelogs for all Locus products.",
    icon: FileText,
    action: "View Archive",
    href: "#",
  },
];

export default function AdditionalToolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-locus-gray-400 mb-1">Resources</p>
        <h1 className="text-2xl font-bold text-locus-gray-800">
          Additional Tools
        </h1>
        <p className="text-sm text-locus-gray-400 mt-1">
          Utilities, downloads, and integrations to support your Locus
          deployment
        </p>
      </div>

      {/* Tools banner */}
      <div className="bg-gradient-to-r from-locus-dark to-locus-navy rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-locus-blue/20 rounded-xl flex items-center justify-center">
            <Wrench className="w-6 h-6 text-locus-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Tools &amp; Utilities
            </h2>
            <p className="text-sm text-locus-gray-200 mt-0.5">
              Everything you need to manage, troubleshoot, and optimize your
              Locus deployment
            </p>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <a
            key={tool.title}
            href={tool.href}
            className="group bg-white rounded-xl border border-locus-gray-100 shadow-sm p-6 hover:shadow-md hover:border-locus-blue/20 transition-all"
          >
            <div className="w-10 h-10 bg-locus-light-blue rounded-lg flex items-center justify-center mb-4">
              <tool.icon className="w-5 h-5 text-locus-dark" />
            </div>
            <h3 className="font-semibold text-locus-gray-800 group-hover:text-locus-dark transition-colors">
              {tool.title}
            </h3>
            <p className="mt-1.5 text-sm text-locus-gray-400 leading-relaxed">
              {tool.description}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-locus-blue font-medium">
              {tool.action}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>
        ))}
      </div>

      {/* Help */}
      <div className="mt-8 bg-white rounded-xl border border-locus-gray-100 shadow-sm p-6 text-center">
        <p className="text-sm text-locus-gray-600">
          Need a tool or integration not listed here?{" "}
          <a
            href="/cases/new"
            className="text-locus-blue font-medium hover:underline"
          >
            Submit a request
          </a>{" "}
          and our team will help.
        </p>
      </div>
    </div>
  );
}
