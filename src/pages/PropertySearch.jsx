import React from "react";
import PropertySearchEngine from "../components/search/PropertySearchEngine";

export default function PropertySearch() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            National Property Search
          </h1>
          <p className="text-slate-600 text-lg">
            Search for wholesale deals across all 50 states with AI-powered analysis
          </p>
        </div>

        <PropertySearchEngine />
      </div>
    </div>
  );
}