"use client";

import { useState } from "react";
import {
  Search,
  BookOpen,
  ChevronRight,
  Eye,
  Clock,
  Cpu,
  Wrench,
  Wifi,
  Settings,
  HelpCircle,
  BarChart3,
} from "lucide-react";

// Demo categories
const categories = [
  { name: "Getting Started", icon: HelpCircle, count: 12 },
  { name: "Robot Operations", icon: Cpu, count: 24 },
  { name: "Maintenance & Repair", icon: Wrench, count: 18 },
  { name: "Connectivity & Networking", icon: Wifi, count: 9 },
  { name: "Configuration", icon: Settings, count: 15 },
  { name: "Analytics & Reporting", icon: BarChart3, count: 7 },
];

// Demo articles
const demoArticles = [
  {
    Id: "ka1",
    Title: "How to perform a LocusBot factory reset",
    Summary:
      "Step-by-step instructions for performing a factory reset on any LocusBot model, including data backup procedures.",
    ArticleNumber: "KB-001042",
    LastPublishedDate: "2026-03-28T10:00:00Z",
    ArticleTotalViewCount: 1243,
    category: "Robot Operations",
  },
  {
    Id: "ka2",
    Title: "Troubleshooting navigation errors in confined zones",
    Summary:
      "Common causes and solutions for LocusBot navigation issues in tight warehouse aisles and congested areas.",
    ArticleNumber: "KB-001038",
    LastPublishedDate: "2026-03-25T14:30:00Z",
    ArticleTotalViewCount: 892,
    category: "Robot Operations",
  },
  {
    Id: "ka3",
    Title: "Charging station setup and optimal placement guide",
    Summary:
      "Best practices for positioning charging stations to maximize fleet uptime and minimize travel distance.",
    ArticleNumber: "KB-001035",
    LastPublishedDate: "2026-03-20T09:15:00Z",
    ArticleTotalViewCount: 756,
    category: "Configuration",
  },
  {
    Id: "ka4",
    Title: "WMS integration API reference and troubleshooting",
    Summary:
      "Technical documentation for integrating Locus with popular WMS platforms, including common API error resolutions.",
    ArticleNumber: "KB-001029",
    LastPublishedDate: "2026-03-15T11:00:00Z",
    ArticleTotalViewCount: 654,
    category: "Connectivity & Networking",
  },
  {
    Id: "ka5",
    Title: "Firmware update procedure for LocusBot fleet",
    Summary:
      "How to schedule and deploy firmware updates across your entire fleet with zero downtime.",
    ArticleNumber: "KB-001024",
    LastPublishedDate: "2026-03-10T08:45:00Z",
    ArticleTotalViewCount: 1087,
    category: "Maintenance & Repair",
  },
  {
    Id: "ka6",
    Title: "Understanding your support dashboard metrics",
    Summary:
      "A guide to interpreting key performance indicators and metrics available in your support dashboard.",
    ArticleNumber: "KB-001018",
    LastPublishedDate: "2026-03-05T16:00:00Z",
    ArticleTotalViewCount: 432,
    category: "Analytics & Reporting",
  },
];

export default function KnowledgePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = demoArticles.filter((a) => {
    const matchesSearch =
      !search ||
      a.Title.toLowerCase().includes(search.toLowerCase()) ||
      a.Summary?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCategory || a.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-locus-gray-800">
          Knowledge Base
        </h1>
        <p className="text-sm text-locus-gray-400 mt-1">
          Browse articles, guides, and documentation for Locus solutions
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-locus-gray-400" />
        <input
          type="text"
          placeholder="Search the knowledge base..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-locus-gray-200 focus:outline-none focus:ring-2 focus:ring-locus-blue/30 focus:border-locus-blue text-sm bg-white shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-locus-gray-800 uppercase tracking-wider mb-3">
            Categories
          </h2>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                !selectedCategory
                  ? "bg-locus-dark text-white"
                  : "text-locus-gray-600 hover:bg-locus-gray-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                All Articles
              </span>
              <span className="text-xs opacity-60">
                {demoArticles.length}
              </span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat.name
                    ? "bg-locus-dark text-white"
                    : "text-locus-gray-600 hover:bg-locus-gray-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <cat.icon className="w-4 h-4" />
                  {cat.name}
                </span>
                <span className="text-xs opacity-60">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Articles */}
        <div className="lg:col-span-3">
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-locus-gray-100 p-12 text-center">
                <BookOpen className="w-10 h-10 text-locus-gray-200 mx-auto mb-3" />
                <p className="text-locus-gray-400 font-medium">
                  No articles found
                </p>
                <p className="text-sm text-locus-gray-400 mt-1">
                  Try different search terms or browse a category
                </p>
              </div>
            ) : (
              filtered.map((article) => (
                <div
                  key={article.Id}
                  className="group bg-white rounded-xl border border-locus-gray-100 shadow-sm p-5 hover:shadow-md hover:border-locus-blue/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono text-locus-gray-400">
                          {article.ArticleNumber}
                        </span>
                        <span className="text-xs text-locus-blue bg-locus-light-blue px-2 py-0.5 rounded-full">
                          {article.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-locus-gray-800 group-hover:text-locus-dark transition-colors">
                        {article.Title}
                      </h3>
                      <p className="mt-1.5 text-sm text-locus-gray-400 leading-relaxed line-clamp-2">
                        {article.Summary}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-locus-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(
                            article.LastPublishedDate!
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.ArticleTotalViewCount?.toLocaleString()}{" "}
                          views
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-locus-gray-200 group-hover:text-locus-blue transition-colors mt-1 shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
