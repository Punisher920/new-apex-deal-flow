import React, { useState } from "react";
import { runFollowUpSequence } from "@/functions/runFollowUpSequence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, CheckCircle, AlertCircle, RefreshCw, Users, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FollowUpSequencer({ type = "lead", onComplete }) {
  const [isRunning, setIsRunning] = useState(false);
  const [method, setMethod] = useState("SMS");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);
    const res = await runFollowUpSequence({ type, method });
    if (res.data?.success) {
      setResult(res.data.results);
      if (onComplete) onComplete();
    } else {
      setError(res.data?.error || "Follow-up sequence failed");
    }
    setIsRunning(false);
  };

  const icon = type === "lead" ? Target : Users;
  const label = type === "lead" ? "Lead Follow-Up" : "Buyer Outreach";
  const description = type === "lead"
    ? "Send automated follow-ups to all active leads that haven't been contacted in 3+ days"
    : "Send deal alerts to active buyers matching new properties";

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <MessageCircle className="w-5 h-5" />
          {label}
        </CardTitle>
        <p className="text-sm text-blue-700">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {type === "lead" && (
          <div className="flex gap-3">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="flex-1 bg-white">
                <SelectValue placeholder="Contact Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Phone">Phone Script</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          onClick={handleRun}
          disabled={isRunning}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          {isRunning ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Running sequence...</>
          ) : (
            <><Send className="w-4 h-4" /> Run {label}</>
          )}
        </Button>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg text-emerald-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                {result.sent?.length || 0} contacts sent · {result.skipped?.length || 0} skipped
              </div>
              {result.sent?.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.sent.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-white rounded border border-blue-100 text-xs text-slate-600">
                      <span className="truncate">{item.address || item.name}</span>
                      <Badge className="text-xs bg-blue-100 text-blue-700 shrink-0 ml-2">
                        {item.method || `${item.deals_sent} deals`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}