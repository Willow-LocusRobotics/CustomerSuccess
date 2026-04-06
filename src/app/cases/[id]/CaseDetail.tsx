"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Clock, User, Paperclip } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

// Demo data — replaced by API when Salesforce is connected
const demoCase = {
  Id: "5001",
  CaseNumber: "00045123",
  Subject: "LocusBot navigation error in Zone B",
  Description:
    "Multiple LocusBots in Zone B are experiencing navigation errors when transitioning between aisles 14 and 15. The bots pause for 10-15 seconds before rerouting. This is impacting pick rates during peak shift hours.\n\nAffected bots: LB-2041, LB-2043, LB-2047\nFrequency: Approximately every 3rd traversal\nFirst observed: April 2, 2026",
  Status: "In Progress",
  Priority: "High",
  CreatedDate: "2026-04-03T14:22:00Z",
  LastModifiedDate: "2026-04-05T09:15:00Z",
  Type: "Problem",
  Origin: "Web Portal",
};

const demoComments = [
  {
    id: "c1",
    author: "Support Agent — Maria R.",
    body: "Thank you for reporting this issue. We've identified that there may be a LiDAR calibration drift affecting the bots in that zone. We're scheduling a remote diagnostic session.",
    createdDate: "2026-04-03T16:45:00Z",
    isAgent: true,
  },
  {
    id: "c2",
    author: "You",
    body: "Thanks Maria. We've also noticed that LB-2043 has a slightly different behavior — it stops completely rather than pausing. Could be related?",
    createdDate: "2026-04-04T09:20:00Z",
    isAgent: false,
  },
  {
    id: "c3",
    author: "Support Agent — Maria R.",
    body: "Good observation. We've pulled the telemetry data for LB-2043 and confirmed a sensor anomaly. We're pushing a firmware patch to the affected units. ETA for resolution: within 24 hours.",
    createdDate: "2026-04-05T09:15:00Z",
    isAgent: true,
  },
];

export default function CaseDetailPage() {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(demoComments);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: `c${comments.length + 1}`,
        author: "You",
        body: newComment,
        createdDate: new Date().toISOString(),
        isAgent: false,
      },
    ]);
    setNewComment("");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/cases"
        className="inline-flex items-center gap-1.5 text-sm text-locus-gray-400 hover:text-locus-dark transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cases
      </Link>

      {/* Case Header */}
      <div className="bg-white rounded-xl border border-locus-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-mono text-locus-gray-400">
            #{demoCase.CaseNumber}
          </span>
          <StatusBadge status={demoCase.Status} />
          <PriorityBadge priority={demoCase.Priority} />
        </div>
        <h1 className="text-xl font-bold text-locus-gray-800">
          {demoCase.Subject}
        </h1>

        {/* Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-locus-gray-100">
          {[
            { label: "Type", value: demoCase.Type },
            { label: "Origin", value: demoCase.Origin },
            { label: "Created", value: formatDate(demoCase.CreatedDate) },
            {
              label: "Last Updated",
              value: formatDate(demoCase.LastModifiedDate),
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-locus-gray-400 uppercase tracking-wider">
                {item.label}
              </p>
              <p className="text-sm font-medium text-locus-gray-800 mt-0.5">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-locus-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-locus-gray-800 mb-3">Description</h2>
        <p className="text-sm text-locus-gray-600 whitespace-pre-line leading-relaxed">
          {demoCase.Description}
        </p>
      </div>

      {/* Activity / Comments */}
      <div className="bg-white rounded-xl border border-locus-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-locus-gray-800 mb-6">Activity</h2>

        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  comment.isAgent
                    ? "bg-locus-dark text-white"
                    : "bg-locus-light-blue text-locus-dark"
                }`}
              >
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-locus-gray-800">
                    {comment.author}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-locus-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatDate(comment.createdDate)}
                  </span>
                </div>
                <p className="text-sm text-locus-gray-600 leading-relaxed">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="mt-8 pt-6 border-t border-locus-gray-100">
          <label className="block text-sm font-medium text-locus-gray-800 mb-2">
            Add a Comment
          </label>
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Type your message..."
            className="w-full px-4 py-3 rounded-lg border border-locus-gray-200 focus:outline-none focus:ring-2 focus:ring-locus-blue/30 focus:border-locus-blue text-sm resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-locus-gray-400 hover:text-locus-gray-600 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Attach file
            </button>
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-locus-blue hover:bg-locus-blue/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
