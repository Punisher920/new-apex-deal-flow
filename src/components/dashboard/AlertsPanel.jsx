import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, TrendingUp, Clock, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const alertIcons = {
  "High Score Deal": TrendingUp,
  "Price Drop": AlertTriangle,
  "New Listing": Bell,
  "Market Change": Clock
};

const alertColors = {
  Critical: "bg-red-100 text-red-800 border-red-200",
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Low: "bg-blue-100 text-blue-800 border-blue-200"
};

export default function AlertsPanel({ alerts, onRefresh }) {
  return (
    <Card className="glass-effect border-slate-200/50 shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Recent Alerts ({alerts.length})
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onRefresh}
            className="text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No new alerts</p>
              <p className="text-sm text-slate-400">We'll notify you of new opportunities</p>
            </div>
          ) : (
            alerts.map((alert, index) => {
              const Icon = alertIcons[alert.alert_type] || Bell;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-full">
                      <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-slate-900">{alert.alert_type}</h4>
                        <Badge className={`text-xs ${alertColors[alert.priority]} border`}>
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{alert.message}</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="text-xs bg-slate-900 hover:bg-slate-800">
                          View Deal
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs text-slate-600">
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}