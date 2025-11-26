import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, 
  TrendingUp, 
  Users, 
  Settings,
  Bell,
  Search,
  DollarSign,
  Database,
  ClipboardList,
  Target, // Added Target icon for Leads Pipeline
  MessageCircle, // Added MessageCircle icon for Outreach Status
  Calculator, // Added Calculator icon for Smart MAO Calculator
  BarChart3, // Re-added BarChart3 for Comparable Analysis
  Newspaper, // Added icon for Craigslist Leads
  Bot // Added icon for Agent Chat
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "Leads Pipeline", 
    url: createPageUrl("LeadsPipeline"),
    icon: Target,
  },
  {
    title: "Craigslist Leads",
    url: createPageUrl("CraigslistLeads"),
    icon: Newspaper,
  },
  {
    title: "Market Analysis",
    url: createPageUrl("MarketAnalysis"),
    icon: TrendingUp,
  },
  {
    title: "Smart MAO Calculator",
    url: createPageUrl("SmartMAOCalculator"),
    icon: Calculator,
  },
  {
    title: "Comparable Analysis",
    url: createPageUrl("ComparableAnalysis"),
    icon: BarChart3,
  },
  {
    title: "Agent Chat",
    url: createPageUrl("AgentChat"),
    icon: Bot,
  },
  {
    title: "Agent Diagnostics",
    url: createPageUrl("AgentDiagnostics"),
    icon: Settings,
  },
  {
    title: "Outreach Status",
    url: createPageUrl("OutreachStatus"), 
    icon: MessageCircle,
  },
  {
    title: "Buyer CRM",
    url: createPageUrl("BuyerCRM"),
    icon: Users,
  },
  {
    title: "Property Search",
    url: createPageUrl("PropertySearch"),
    icon: Search,
  },
  {
    title: "Deal Analysis",
    url: createPageUrl("DealAnalysis"),
    icon: TrendingUp,
  },
  {
    title: "My Criteria",
    url: createPageUrl("MyCriteria"),
    icon: ClipboardList,
  },
  {
    title: "Data Integrations",
    url: createPageUrl("DataIntegrations"),
    icon: Database,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --background: 248 250 252;
          --foreground: 15 23 42;
          --card: 255 255 255;
          --primary: 245 158 11;
          --primary-foreground: 255 255 255;
          --secondary: 15 23 42;
          --accent: 245 158 11;
          --border: 226 232 240;
          --muted: 248 250 252;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        
        .luxury-gradient {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        }
        
        .gold-gradient {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
      
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r border-slate-200 luxury-gradient">
          <SidebarHeader className="border-b border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white">DealFinder</h2>
                <p className="text-xs text-slate-300">AI-Powered Real Estate</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-slate-400 uppercase tracking-wider px-2 py-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`group hover:bg-slate-700/50 hover:text-amber-400 transition-all duration-300 rounded-xl p-3 ${
                          location.pathname === item.url ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="text-xs font-medium text-slate-400 uppercase tracking-wider px-2 py-3">
                Quick Stats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 space-y-4">
                  <div className="glass-effect rounded-xl p-4 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Active Deals</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        Live
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-white">24</p>
                    <p className="text-xs text-slate-400">+12% this week</p>
                  </div>
                  
                  <div className="glass-effect rounded-xl p-4 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Data Sources</span>
                      <Database className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">4</p>
                    <p className="text-xs text-slate-400">All connected</p>
                  </div>
                  
                  <div className="glass-effect rounded-xl p-4 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Avg Profit</span>
                      <DollarSign className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">$15.2K</p>
                    <p className="text-xs text-slate-400">Per deal</p>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-700/50 p-4">
            <div className="flex items-center gap-3 mb-4">
              <Button size="sm" className="flex-1 gold-gradient hover:opacity-90 transition-opacity">
                <Bell className="w-4 h-4 mr-2" />
                Alerts: 3
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">RE</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">Real Estate Pro</p>
                <p className="text-xs text-slate-400">Premium Account</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-h-screen">
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 md:hidden sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-slate-900">DealFinder</h1>
            </div>
          </header>

          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}