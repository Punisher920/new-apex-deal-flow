import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600 text-lg">Manage your account preferences and deal criteria</p>
        </div>

        <div className="text-center py-16">
          <SettingsIcon className="w-24 h-24 text-slate-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-slate-600 mb-3">Settings Panel Coming Soon</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Comprehensive settings for deal criteria, notifications, and account preferences will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}