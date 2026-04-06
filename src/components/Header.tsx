"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Headset,
  BookOpen,
  FolderOpen,
  Library,
  BarChart3,
  Cpu,
  Activity,
  Wrench,
  ChevronDown,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Support Home", icon: Headset },
  { href: "/cases", label: "My Cases", icon: FolderOpen },
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
];

const resourcesSubMenu = [
  {
    href: "/resources/dashboards",
    label: "Dashboards / Reports",
    icon: BarChart3,
    description: "Support metrics and reporting",
  },
  {
    href: "/resources/locushub",
    label: "LocusHub",
    icon: Cpu,
    description: "Central operations hub",
  },
  {
    href: "/resources/lokimon",
    label: "Lokimon",
    icon: Activity,
    description: "Fleet monitoring and diagnostics",
  },
  {
    href: "/resources/tools",
    label: "Additional Tools",
    icon: Wrench,
    description: "Utilities and integrations",
  },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isResourcesActive = pathname.startsWith("/resources");

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setResourcesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setResourcesOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="bg-locus-navy sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-locus-blue flex items-center justify-center">
              <Headset className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-tight tracking-tight">
                LOCUS
              </span>
              <span className="text-locus-blue text-[10px] font-medium tracking-widest uppercase leading-tight">
                Support Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-locus-blue/15 text-locus-blue"
                      : "text-locus-gray-200 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Resources Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isResourcesActive
                    ? "bg-locus-blue/15 text-locus-blue"
                    : "text-locus-gray-200 hover:text-white hover:bg-white/5"
                }`}
              >
                <Library className="w-4 h-4" />
                Resources
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    resourcesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {resourcesOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-locus-navy border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2">
                    {resourcesSubMenu.map((item) => {
                      const isItemActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-150 ${
                            isItemActive
                              ? "bg-locus-blue/15 text-locus-blue"
                              : "text-locus-gray-200 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isItemActive
                                ? "bg-locus-blue/20"
                                : "bg-white/5"
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p
                              className={`text-xs mt-0.5 ${
                                isItemActive
                                  ? "text-locus-blue/70"
                                  : "text-locus-gray-400"
                              }`}
                            >
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* User area */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-locus-blue/20 border border-locus-blue/30 flex items-center justify-center">
              <span className="text-locus-blue text-xs font-semibold">U</span>
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-locus-navy border-t border-white/10 pb-4">
          <nav className="px-4 pt-2 space-y-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-locus-blue/15 text-locus-blue"
                      : "text-locus-gray-200 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile Resources Accordion */}
            <button
              onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isResourcesActive
                  ? "bg-locus-blue/15 text-locus-blue"
                  : "text-locus-gray-200 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-3">
                <Library className="w-4 h-4" />
                Resources
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  mobileResourcesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {mobileResourcesOpen && (
              <div className="pl-6 space-y-1">
                {resourcesSubMenu.map((item) => {
                  const isItemActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                        isItemActive
                          ? "bg-locus-blue/15 text-locus-blue font-medium"
                          : "text-locus-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
