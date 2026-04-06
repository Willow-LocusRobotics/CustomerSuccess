"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Filter,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

// Demo data — replaced by API calls when Salesforce is connected
const demoCases = [
  {
    Id: "5001",
    CaseNumber: "00045123",
    Subject: "LocusBot navigation error in Zone B",
    Status: "In Progress",
    Priority: "High",
    CreatedDate: "2026-04-03T14:22:00Z",
    LastModifiedDate: "2026-04-05T09:15:00Z",
    Type: "Problem",
  },
  {
    Id: "5002",
    CaseNumber: "00045098",
    Subject: "Request firmware update for fleet",
    Status: "New",
    Priority: "Medium",
    CreatedDate: "2026-04-02T10:30:00Z",
    LastModifiedDate: "2026-04-02T10:30:00Z",
    Type: "Feature Request",
  },
  {
    Id: "5003",
    CaseNumber: "00044987",
    Subject: "Charging station intermittent failure - Bay 3",
    Status: "Escalated",
    Priority: "Critical",
    CreatedDate: "2026-04-01T08:00:00Z",
    LastModifiedDate: "2026-04-05T16:45:00Z",
    Type: "Problem",
  },
  {
    Id: "5004",
    CaseNumber: "00044800",
    Subject: "Dashboard metrics not loading for shift managers",
    Status: "Working",
    Priority: "Medium",
    CreatedDate: "2026-03-28T12:15:00Z",
    LastModifiedDate: "2026-04-04T11:30:00Z",
    Type: "Problem",
  },
  {
    Id: "5005",
    CaseNumber: "00044650",
    Subject: "Annual maintenance scheduling request",
    Status: "Closed",
    Priority: "Low",
    CreatedDate: "2026-03-20T09:00:00Z",
    LastModifiedDate: "2026-03-25T14:00:00Z",
    Type: "Service Request",
  },
  {
    Id: "5006",
    CaseNumber: "00044601",
    Subject: "Integration with WMS - API timeout errors",
    Status: "Resolved",
    Priority: "High",
    CreatedDate: "2026-03-18T16:30:00Z",
    LastModifiedDate: "2026-03-22T10:00:00Z",
    Type: "Problem",
  },
];

const statusFilters = ["All", "New", "In Progress", "Working", "Escalated", "Closed", "Resolved"];

export default function CasesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = demoCases.filter((c) => {
    const matchesSearch =
      !search ||
      c.Subject.toLowerCase().includes(search.toLowerCase()) ||
      c.CaseNumber.includes(search);
    const matchesStatus =
      statusFilter === "All" || c.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-locus-gray-800">My Cases</h1>
          <p className="text-sm text-locus-gray-400 mt-1">
            Track and manage your support requests
          </p>
        </div>
        <Link
          href="/cases/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-locus-blue hover:bg-locus-blue/90 text-white font-medium rounded-lg transition-colors text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          New Case
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-locus-gray-100 shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-locus-gray-400" />
            <input
              type="text"
              placeholder="Search by case number or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-locus-gray-200 focus:outline-none focus:ring-2 focus:ring-locus-blue/30 focus:border-locus-blue text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-locus-gray-400" />
            <div className="flex flex-wrap gap-1">
              {statusFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-locus-dark text-white"
                      : "bg-locus-gray-100 text-locus-gray-600 hover:bg-locus-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="bg-white rounded-xl border border-locus-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-locus-gray-200 mx-auto mb-3" />
            <p className="text-locus-gray-400 font-medium">No cases found</p>
            <p className="text-sm text-locus-gray-400 mt-1">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="divide-y divide-locus-gray-100">
            {filtered.map((c) => (
              <Link
                key={c.Id}
                href={`/cases/${c.Id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-locus-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono text-locus-gray-400">
                      #{c.CaseNumber}
                    </span>
                    <StatusBadge status={c.Status} />
                    <PriorityBadge priority={c.Priority} />
                  </div>
                  <h3 className="font-medium text-locus-gray-800 truncate group-hover:text-locus-dark transition-colors">
                    {c.Subject}
                  </h3>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-locus-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Opened{" "}
                      {new Date(c.CreatedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>
                      Updated{" "}
                      {new Date(c.LastModifiedDate).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                    <span className="text-locus-gray-200">|</span>
                    <span>{c.Type}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-locus-gray-200 group-hover:text-locus-blue transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 text-xs text-locus-gray-400 text-right">
        Showing {filtered.length} of {demoCases.length} cases
      </div>
    </div>
  );
}
