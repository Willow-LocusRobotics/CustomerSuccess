"use client";

import {
  Activity,
  ExternalLink,
  Wifi,
  WifiOff,
  Battery,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

const fleetStatus = [
  { id: "LB-2041", status: "Active", battery: 82, temp: 38, zone: "Zone A", task: "Picking" },
  { id: "LB-2043", status: "Active", battery: 65, temp: 41, zone: "Zone B", task: "Transport" },
  { id: "LB-2044", status: "Charging", battery: 34, temp: 29, zone: "Bay 2", task: "—" },
  { id: "LB-2047", status: "Active", battery: 91, temp: 36, zone: "Zone A", task: "Picking" },
  { id: "LB-2050", status: "Alert", battery: 12, temp: 52, zone: "Zone C", task: "Stopped" },
  { id: "LB-2051", status: "Active", battery: 77, temp: 37, zone: "Zone B", task: "Put-away" },
  { id: "LB-2055", status: "Offline", battery: 0, temp: 22, zone: "Maintenance", task: "—" },
  { id: "LB-2058", status: "Active", battery: 88, temp: 35, zone: "Zone A", task: "Picking" },
];

const statusConfig: Record<string, { color: string; bg: string; icon: typeof CheckCircle }> = {
  Active: { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
  Charging: { color: "text-blue-600", bg: "bg-blue-50", icon: Battery },
  Alert: { color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle },
  Offline: { color: "text-gray-400", bg: "bg-gray-100", icon: WifiOff },
};

const alerts = [
  {
    id: 1,
    bot: "LB-2050",
    message: "Battery critically low — unable to reach charging station",
    severity: "Critical",
    time: "12 min ago",
  },
  {
    id: 2,
    bot: "LB-2050",
    message: "Thermal threshold exceeded (52°C)",
    severity: "Warning",
    time: "15 min ago",
  },
  {
    id: 3,
    bot: "LB-2055",
    message: "Bot offline — scheduled maintenance in progress",
    severity: "Info",
    time: "2 hours ago",
  },
];

export default function LokimonPage() {
  const activeCount = fleetStatus.filter((b) => b.status === "Active").length;
  const alertCount = fleetStatus.filter((b) => b.status === "Alert").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs text-locus-gray-400 mb-1">Resources</p>
          <h1 className="text-2xl font-bold text-locus-gray-800">Lokimon</h1>
          <p className="text-sm text-locus-gray-400 mt-1">
            Real-time fleet monitoring, diagnostics, and alerting
          </p>
        </div>
        <a
          href="https://lokimon.locusrobotics.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-locus-blue hover:bg-locus-blue/90 text-white font-medium rounded-lg transition-colors text-sm shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Open Lokimon
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Fleet", value: fleetStatus.length, icon: Activity, bg: "bg-locus-light-blue", color: "text-locus-dark" },
          { label: "Active", value: activeCount, icon: Wifi, bg: "bg-green-50", color: "text-green-600" },
          { label: "Alerts", value: alertCount, icon: AlertTriangle, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Offline", value: fleetStatus.filter((b) => b.status === "Offline").length, icon: WifiOff, bg: "bg-gray-100", color: "text-gray-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-locus-gray-100 shadow-sm p-5"
          >
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-locus-gray-800">{s.value}</p>
            <p className="text-xs text-locus-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-locus-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-locus-gray-100">
            <h2 className="font-semibold text-locus-gray-800">Fleet Status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-locus-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-locus-gray-400 uppercase tracking-wider">Bot ID</th>
                  <th className="px-6 py-3 text-xs font-medium text-locus-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-locus-gray-400 uppercase tracking-wider">Battery</th>
                  <th className="px-6 py-3 text-xs font-medium text-locus-gray-400 uppercase tracking-wider">Temp</th>
                  <th className="px-6 py-3 text-xs font-medium text-locus-gray-400 uppercase tracking-wider">Zone</th>
                  <th className="px-6 py-3 text-xs font-medium text-locus-gray-400 uppercase tracking-wider">Task</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-locus-gray-100">
                {fleetStatus.map((bot) => {
                  const cfg = statusConfig[bot.status] || statusConfig.Active;
                  return (
                    <tr key={bot.id} className="hover:bg-locus-gray-50 transition-colors">
                      <td className="px-6 py-3 font-mono font-medium text-locus-gray-800">
                        {bot.id}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <cfg.icon className="w-3 h-3" />
                          {bot.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-locus-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                bot.battery > 50
                                  ? "bg-green-500"
                                  : bot.battery > 20
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${bot.battery}%` }}
                            />
                          </div>
                          <span className="text-xs text-locus-gray-600">
                            {bot.battery}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`flex items-center gap-1 text-xs ${bot.temp > 45 ? "text-red-600 font-medium" : "text-locus-gray-600"}`}>
                          <Thermometer className="w-3 h-3" />
                          {bot.temp}°C
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-locus-gray-600">
                        {bot.zone}
                      </td>
                      <td className="px-6 py-3 text-xs text-locus-gray-600">
                        {bot.task}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-locus-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-locus-gray-100">
            <h2 className="font-semibold text-locus-gray-800">Active Alerts</h2>
          </div>
          <div className="divide-y divide-locus-gray-100">
            {alerts.map((alert) => (
              <div key={alert.id} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      alert.severity === "Critical"
                        ? "bg-red-100 text-red-700"
                        : alert.severity === "Warning"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-xs font-mono text-locus-gray-400">
                    {alert.bot}
                  </span>
                </div>
                <p className="text-sm text-locus-gray-600">{alert.message}</p>
                <p className="flex items-center gap-1 text-xs text-locus-gray-400 mt-1.5">
                  <Clock className="w-3 h-3" />
                  {alert.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
