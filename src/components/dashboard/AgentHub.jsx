import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getGithubAgents } from "@/functions/getGithubAgents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Play, RefreshCw, ChevronRight, Loader2, GitBranch, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LOCAL_AGENTS = [
  { name: "apex_deal_flow_manager", description: "Finds deals, updates market data, manages buyers and tracks the entire investment pipeline with live web intelligence.", status: "active" },
  { name: "wholesaling_analyst", description: "Analyzes wholesale deals, calculates MAO, and evaluates market comps.", status: "active" },
  { name: "closr_intro_agent", description: "Initiates seller conversations and qualifies leads.", status: "active" },
  { name: "closr_reveal_agent", description: "Uncovers seller motivation and pain points.", status: "active" },
  { name: "closr_assessment_agent", description: "Assesses property condition and deal viability.", status: "active" },
  { name: "closr_secure_positioning_agent", description: "Positions offers to secure seller commitment.", status: "active" },
  { name: "closr_offer_agent", description: "Presents and negotiates offers strategically.", status: "active" },
  { name: "closr_close_agent", description: "Closes the deal and coordinates contract signing.", status: "active" },
];

export default function AgentHub({ githubRepo = "" }) {
  const [agents, setAgents] = useState(LOCAL_AGENTS);
  const [githubAgents, setGithubAgents] = useState([]);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [repoInput, setRepoInput] = useState(githubRepo);
  const [triggeringAgent, setTriggeringAgent] = useState(null);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [recentActivity, setRecentActivity] = useState({});

  const fetchGithubAgents = async () => {
    if (!repoInput.trim()) return;
    setLoadingGithub(true);
    setGithubError("");
    try {
      const res = await getGithubAgents({ repo: repoInput.trim() });
      if (res.data?.agents?.length > 0) {
        setGithubAgents(res.data.agents);
      } else if (res.data?.error) {
        setGithubError(res.data.error);
      }
    } catch (e) {
      setGithubError(e.message);
    }
    setLoadingGithub(false);
  };

  const loadRecentActivity = async (agentName) => {
    try {
      const convos = await base44.agents.listConversations({ agent_name: agentName });
      const recent = convos.slice(0, 3).map(c => ({
        id: c.id,
        name: c.metadata?.name || "Conversation",
        date: c.created_date
      }));
      setRecentActivity(prev => ({ ...prev, [agentName]: recent }));
    } catch {
      setRecentActivity(prev => ({ ...prev, [agentName]: [] }));
    }
  };

  const handleTriggerAgent = async (agentName) => {
    setTriggeringAgent(agentName);
    try {
      const convo = await base44.agents.createConversation({
        agent_name: agentName,
        metadata: { name: `Quick Start - ${new Date().toLocaleString()}` }
      });
      window.location.href = `/AgentChat`;
    } catch (e) {
      console.error("Error triggering agent:", e);
    }
    setTriggeringAgent(null);
  };

  const toggleExpand = (agentName) => {
    if (expandedAgent === agentName) {
      setExpandedAgent(null);
    } else {
      setExpandedAgent(agentName);
      if (!recentActivity[agentName]) loadRecentActivity(agentName);
    }
  };

  const allAgents = [
    ...agents,
    ...githubAgents.filter(ga => !agents.some(a => a.name === ga.name)).map(ga => ({
      ...ga,
      status: "github",
    }))
  ];

  return (
    <Card className="glass-effect border-slate-200/50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5 text-blue-500" />
            AI Agent Hub
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 ml-1">{allAgents.length}</Badge>
          </CardTitle>
        </div>

        {/* GitHub repo input */}
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <GitBranch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="owner/repo-name (to load from GitHub)"
              value={repoInput}
              onChange={e => setRepoInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchGithubAgents()}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={fetchGithubAgents} disabled={loadingGithub}>
            {loadingGithub ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          </Button>
        </div>
        {githubError && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3" /> {githubError}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {allAgents.map(agent => (
            <div key={agent.name} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-left"
                onClick={() => toggleExpand(agent.name)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${agent.status === 'active' ? 'bg-emerald-500' : agent.status === 'github' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{agent.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p className="text-xs text-slate-500 truncate">{agent.description?.slice(0, 60)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <Badge variant="outline" className={`text-xs ${agent.status === 'github' ? 'border-blue-300 text-blue-600' : 'border-emerald-300 text-emerald-600'}`}>
                    {agent.status === 'github' ? 'GitHub' : 'Active'}
                  </Badge>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedAgent === agent.name ? 'rotate-90' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {expandedAgent === agent.name && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 bg-slate-50"
                  >
                    <div className="p-3 space-y-3">
                      <p className="text-xs text-slate-600">{agent.description}</p>

                      {recentActivity[agent.name] !== undefined && (
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">Recent Activity</p>
                          {recentActivity[agent.name].length > 0 ? (
                            <div className="space-y-1">
                              {recentActivity[agent.name].map(c => (
                                <div key={c.id} className="text-xs text-slate-500 flex justify-between">
                                  <span className="truncate">{c.name}</span>
                                  <span className="text-slate-400 ml-2 flex-shrink-0">{new Date(c.date).toLocaleDateString()}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No recent conversations</p>
                          )}
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full h-7 text-xs gold-gradient text-white"
                        onClick={() => handleTriggerAgent(agent.name)}
                        disabled={triggeringAgent === agent.name}
                      >
                        {triggeringAgent === agent.name ? (
                          <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Starting...</>
                        ) : (
                          <><Play className="w-3 h-3 mr-1" /> Trigger Agent</>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}