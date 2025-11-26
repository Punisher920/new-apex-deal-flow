import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, MapPin, DollarSign } from "lucide-react";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Market Analytics</h1>
          <p className="text-slate-600 text-lg">Market trends and investment insights</p>
        </div>

        <div className="text-center py-16">
          <BarChart3 className="w-24 h-24 text-slate-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-slate-600 mb-3">Analytics Coming Soon</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Advanced market analytics, trend analysis, and ROI tracking features will be available in the next update.
          </p>
        </div>
      </div>
    </div>
  );
}