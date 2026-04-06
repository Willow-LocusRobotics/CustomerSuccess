"use client";

import {
  FolderOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  ThumbsUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// Demo metrics — in production these come from /api/salesforce/metrics
const metrics = {
  openCases: 12,
  resolvedThisMonth: 34,
  avgResolutionHours: 4.2,
  satisfactionScore: 96,
};

const statCards = [
  {
    label: "Open Cases",
    value: metrics.openCases,
    icon: FolderOpen,
    color: "text-locus-blue",
    bg: "bg-locus-light-blue",
    trend: "-8%",
    trendUp: false,
    trendLabel: "vs last month",
  },
  {
    label: "Resolved This Month",
    value: metrics.resolvedThisMonth,
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    trend: "+12%",
    trendUp: true,
    trendLabel: "vs last month",
  },
  {
    label: "Avg Resolution Time",
    value: `${metrics.avgResolutionHours}h`,
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    trend: "-15%",
    trendUp: false,
    trendLabel: "improvement",
  },
  {
    label: "Satisfaction Score",
    value: `${metrics.satisfactionScore}%`,
    icon: ThumbsUp,
    color: "text-violet-600",
    bg: "bg-violet-50",
    trend: "+2%",
    trendUp: true,
    trendLabel: "vs last month",
  },
];

const casesByPriority = [
  { priority: "Critical", count: 1, color: "bg-red-500", pct: 8 },
  { priority: "High", count: 3, color: "bg-orange-500", pct: 25 },
  { priority: "Medium", count: 5, color: "bg-amber-400", pct: 42 },
  { priority: "Low", count: 3, color: "bg-green-500", pct: 25 },
];

const casesByStatus = [
  { status: "New", count: 4, color: "bg-blue-500" },
  { status: "In Progress", count: 5, color: "bg-amber-500" },
  { status: "Escalated", count: 1, color: "bg-red-500" },
  { status: "On Hold", count: 2, color: "bg-gray-400" },
];

const monthlyTrend = [
  { month: "Nov", opened: 28, closed: 30 },
  { month: "Dec", opened: 22, closed: 25 },
  { month: "Jan", opened: 35, closed: 31 },
  { month: "Feb", opened: 30, closed: 33 },
  { month: "Mar", opened: 26, closed: 28 },
  { month: "Apr", opened: 18, closed: 34 },
];

const recentActivity = [
  {
    id: 1,
    action: "Case #00045123 updated to In Progress",
    time: "2 hours ago",
    icon: TrendingUp,
  },
  {
    id: 2,
    action: "Case #00044987 escalated to Critical",
    time: "5 hours ago",
    icon: AlertTriangle,
  },
  {
    id: 3,
    action: "Case #00044800 assigned to Maria R.",
    time: "1 day ago",
    icon: FolderOpen,
  },
  {
    id: 4,
    action: "Case #00044650 resolved and closed",
    time: "2 days ago",
    icon: CheckCircle,
  },
  {
    id: 5,
    action: "Case #00044601 resolved",
    time: "4 days ago",
    icon: CheckCircle,
  },
];

export default function DashboardPage() {
  const maxTrend = Math.max(
    ...monthlyTrend.flatMap((m) => [m.opened, m.closed])
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-locus-gray-800">
          Support Dashboard
        </h1>
        <p className="text-sm text-locus-gray-400 mt-1">
          Overview of your support experience and key metrics
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-locus-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  stat.label === "Avg Resolution Time"
                    ? "text-green-600"
                    : stat.trendUp
                      ? "text-green-600"
                      : "text-green-600"
                }`}
              >
                {stat.label === "Open Cases" || stat.label === "Avg Resolution Time" ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                )}
                {stat.trend}
              </div>
            </div>
            <p className="text-2xl font-bold text-locus-gray-800">
              {stat.value}
            </p>
            <p className="text-xs text-locus-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-locus-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-locus-gray-800 mb-6">
            Monthly Case Trend
          </h2>
          <div className="space-y-3">
            {monthlyTrend.map((month) => (
              <div key={month.month} className="flex items-center gap-3">
                <span className="text-xs text-locus-gray-400 w-8">
                  {month.month}
                </span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 bg-locus-blue/20 rounded-full relative overflow-hidden"
                      style={{ width: "100%" }}
                    >
                      <div
                        className="h-full bg-locus-blue rounded-full transition-all duration-500"
                        style={{
                          width: `${(month.opened / maxTrend) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-locus-gray-400 w-6 text-right">
                      {month.opened}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 bg-green-100 rounded-full relative overflow-hidden"
                      style={{ width: "100%" }}
                    >
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${(month.closed / maxTrend) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-locus-gray-400 w-6 text-right">
                      {month.closed}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-locus-gray-100">
            <div className="flex items-center gap-2 text-xs text-locus-gray-400">
              <div className="w-3 h-3 bg-locus-blue rounded-full" />
              Opened
            </div>
            <div className="flex items-center gap-2 text-xs text-locus-gray-400">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              Closed
            </div>
          </div>
        </div>

        {/* Cases by Priority */}
        <div className="bg-white rounded-xl border border-locus-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-locus-gray-800 mb-6">
            Open Cases by Priority
          </h2>
          <div className="space-y-4">
            {casesByPriority.map((item) => (
              <div key={item.priority}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-locus-gray-600">{item.priority}</span>
                  <span className="font-medium text-locus-gray-800">
                    {item.count}
                  </span>
                </div>
                <div className="h-2 bg-locus-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Cases by Status */}
          <h2 className="font-semibold text-locus-gray-800 mt-8 mb-4">
            Open Cases by Status
          </h2>
          <div className="space-y-2">
            {casesByStatus.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-locus-gray-50"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 ${item.color} rounded-full`} />
                  <span className="text-sm text-locus-gray-600">
                    {item.status}
                  </span>
                </div>
                <span className="text-sm font-semibold text-locus-gray-800">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 bg-white rounded-xl border border-locus-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-locus-gray-800 mb-4">
          Recent Activity
        </h2>
        <div className="divide-y divide-locus-gray-100">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 py-3"
            >
              <div className="w-8 h-8 bg-locus-gray-50 rounded-lg flex items-center justify-center shrink-0">
                <activity.icon className="w-4 h-4 text-locus-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-locus-gray-600 truncate">
                  {activity.action}
                </p>
              </div>
              <span className="text-xs text-locus-gray-400 shrink-0">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
