"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";

const priorities = ["Low", "Medium", "High", "Critical"];
const caseTypes = [
  "Problem",
  "Feature Request",
  "Service Request",
  "Question",
  "Maintenance",
];

export default function NewCasePage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    Subject: "",
    Description: "",
    Priority: "Medium",
    Type: "Problem",
    ContactEmail: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production, POST to /api/salesforce/cases
    // await fetch("/api/salesforce/cases", { method: "POST", body: JSON.stringify(form) });
    setSubmitted(true);
    setTimeout(() => router.push("/cases"), 3000);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-locus-gray-800">
          Case Submitted Successfully
        </h1>
        <p className="mt-3 text-locus-gray-400">
          Your support case has been created. Our team will review it shortly
          and reach out. Redirecting to your cases...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/cases"
        className="inline-flex items-center gap-1.5 text-sm text-locus-gray-400 hover:text-locus-dark transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cases
      </Link>

      <div className="bg-white rounded-xl border border-locus-gray-100 shadow-sm p-6 md:p-8">
        <h1 className="text-xl font-bold text-locus-gray-800 mb-1">
          Create a Support Case
        </h1>
        <p className="text-sm text-locus-gray-400 mb-8">
          Fill out the form below and our team will get back to you as soon as
          possible.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-locus-gray-800 mb-1.5">
              Contact Email
            </label>
            <input
              type="email"
              required
              value={form.ContactEmail}
              onChange={(e) =>
                setForm({ ...form, ContactEmail: e.target.value })
              }
              placeholder="your.email@company.com"
              className="w-full px-4 py-2.5 rounded-lg border border-locus-gray-200 focus:outline-none focus:ring-2 focus:ring-locus-blue/30 focus:border-locus-blue text-sm"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-locus-gray-800 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              required
              value={form.Subject}
              onChange={(e) => setForm({ ...form, Subject: e.target.value })}
              placeholder="Brief summary of the issue"
              className="w-full px-4 py-2.5 rounded-lg border border-locus-gray-200 focus:outline-none focus:ring-2 focus:ring-locus-blue/30 focus:border-locus-blue text-sm"
            />
          </div>

          {/* Priority + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-locus-gray-800 mb-1.5">
                Priority
              </label>
              <select
                value={form.Priority}
                onChange={(e) =>
                  setForm({ ...form, Priority: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-locus-gray-200 focus:outline-none focus:ring-2 focus:ring-locus-blue/30 focus:border-locus-blue text-sm bg-white"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-locus-gray-800 mb-1.5">
                Case Type
              </label>
              <select
                value={form.Type}
                onChange={(e) => setForm({ ...form, Type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-locus-gray-200 focus:outline-none focus:ring-2 focus:ring-locus-blue/30 focus:border-locus-blue text-sm bg-white"
              >
                {caseTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-locus-gray-800 mb-1.5">
              Description
            </label>
            <textarea
              required
              rows={6}
              value={form.Description}
              onChange={(e) =>
                setForm({ ...form, Description: e.target.value })
              }
              placeholder="Provide as much detail as possible — affected bots, error messages, steps to reproduce, etc."
              className="w-full px-4 py-3 rounded-lg border border-locus-gray-200 focus:outline-none focus:ring-2 focus:ring-locus-blue/30 focus:border-locus-blue text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/cases"
              className="px-4 py-2.5 text-sm font-medium text-locus-gray-600 hover:text-locus-gray-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-locus-blue hover:bg-locus-blue/90 text-white font-medium rounded-lg transition-colors text-sm"
            >
              <Send className="w-4 h-4" />
              Submit Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
