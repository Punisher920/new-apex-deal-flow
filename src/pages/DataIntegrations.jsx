
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Zap, 
  BarChart3, 
  Settings,
  Globe,
  RefreshCw
} from "lucide-react";

import DataSourceManager from "../components/data/DataSourceManager";
import LiveMarketData from "../components/data/LiveMarketData";
import AutoPropertyUpdater from "../components/data/AutoPropertyUpdater";
import RealAPIConnector from "../components/apis/RealAPIConnector"; // New import for the Real Estate API Connector

export default function DataIntegrations() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Data Integrations
          </h1>
          <p className="text-slate-600 text-lg">
            Real-time data sources and automated updates for market intelligence
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Sources</p>
                  <p className="text-2xl font-bold text-slate-900">4</p>
                  <p className="text-xs text-emerald-600">All connected</p>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Auto-Updates</p>
                  <p className="text-2xl font-bold text-slate-900">24/7</p>
                  <p className="text-xs text-emerald-600">Running</p>
                </div>
                <Zap className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Market Data</p>
                  <p className="text-2xl font-bold text-slate-900">Live</p>
                  <p className="text-xs text-blue-600">Real-time</p>
                </div>
                <BarChart3 className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">API Status</p>
                  <p className="text-2xl font-bold text-slate-900">100%</p>
                  <p className="text-xs text-emerald-600">Healthy</p>
                </div>
                <Globe className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="live-data" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="live-data" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Live Market Data
            </TabsTrigger>
            <TabsTrigger value="auto-update" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Auto-Updates
            </TabsTrigger>
            <TabsTrigger value="data-sources" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Sources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-data" className="space-y-6">
            <LiveMarketData />
            
            <Card className="glass-effect border-slate-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-500" />
                  External Data Feeds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">MLS Data</h4>
                    <p className="text-sm text-blue-700">Real-time property listings</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs text-emerald-600">Connected</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">Public Records</h4>
                    <p className="text-sm text-purple-700">Tax assessments & ownership</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs text-emerald-600">Connected</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-900 mb-2">School Ratings</h4>
                    <p className="text-sm text-amber-700">GreatSchools API data</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs text-emerald-600">Connected</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auto-update" className="space-y-6">
            <AutoPropertyUpdater />
            
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass-effect border-slate-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-500" />
                    Update Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Property Values</h4>
                        <p className="text-sm text-slate-600">ARV and market analysis</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">Every 15 min</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Market Trends</h4>
                        <p className="text-sm text-slate-600">Price movements and inventory</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">Every 5 min</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">New Listings</h4>
                        <p className="text-sm text-slate-600">Fresh opportunities</p>
                      </div>
                      <span className="text-sm font-medium text-emerald-600">Real-time</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-slate-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-500" />
                    AI Enhancement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                      <h4 className="font-semibold text-emerald-900 mb-2">Smart Analysis</h4>
                      <p className="text-sm text-emerald-700">AI-powered deal scoring and market insights</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Predictive Models</h4>
                      <p className="text-sm text-blue-700">Forecasting price trends and opportunities</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2">Risk Assessment</h4>
                      <p className="text-sm text-purple-700">Automated property condition evaluation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data-sources" className="space-y-6">
            <DataSourceManager />
            
            <div className="mt-8">
              <RealAPIConnector />
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
