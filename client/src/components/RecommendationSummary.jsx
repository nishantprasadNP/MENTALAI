import React from "react";

export default function RecommendationSummary({ title = "Movies for your mood", summary = "" }) {
  if (!summary) return null;
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="mb-3">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{summary}</p>
      </div>
    </div>
  );
}
