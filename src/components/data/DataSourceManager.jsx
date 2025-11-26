
import React, { useState, useEffect } from "react";
import { DataSource, SyncJob } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Database, 
  RefreshCw, 
  Plus, 
  Star, // Changed from Settings
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  AlertTriangle,
  Edit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DataSourceManager() {
  const [dataSources, setDataSources] = useState([]);
  const [syncJobs, setSyncJobs] = useState([]);
  const [showForm, setShowForm] = useState(false); // Changed from showAddForm
  const [editingSource, setEditingSource] = useState(null); // State for editing
  const [isLoading, setIsLoading] = useState(true);
  const [newSource, setNewSource] = useState({
    name: "",
    type: "",
    endpoint_url: "",
    api_key: "",
    sync_frequency: "Daily"
  });

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [sourcesData, jobsData] = await Promise.all([
        DataSource.list("-last_sync"),
        SyncJob.filter({ status: ["Running", "Pending"] }, "-created_date", 20)
      ]);
      setDataSources(sourcesData);
      setSyncJobs(jobsData);
    } catch (error) {
      console.error("Error loading data sources:", error);
    }
    setIsLoading(false);
  };

  const handleOpenAddForm = () => {
    setEditingSource(null);
    setNewSource({
      name: "",
      type: "",
      endpoint_url: "",
      api_key: "",
      sync_frequency: "Daily"
    });
    setShowForm(true);
  };

  const handleOpenEditForm = (source) => {
    setEditingSource(source);
    setNewSource(source);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSource) {
        // Handle update
        await DataSource.update(editingSource.id, newSource);
      } else {
        // Handle create
        await DataSource.create({
          ...newSource,
          last_sync: new Date().toISOString(),
          records_synced: 0,
          status: "Active"
        });
      }
      setNewSource({
        name: "",
        type: "",
        endpoint_url: "",
        api_key: "",
        sync_frequency: "Daily"
      });
      setShowForm(false);
      setEditingSource(null);
      await loadData();
    } catch (error) {
      console.error("Error saving data source:", error);
    }
  };

  const setAsPrimary = async (sourceToSet) => {
    try {
      // Set all other sources to not be primary
      const updates = dataSources.map(source => {
        if (source.id !== sourceToSet.id && source.is_primary_source) {
          return DataSource.update(source.id, { is_primary_source: false });
        }
        return Promise.resolve(); // Return a resolved promise for sources that don't need update
      });

      // Set the selected source as primary
      updates.push(DataSource.update(sourceToSet.id, { is_primary_source: true }));

      await Promise.all(updates);
      await loadData();
    } catch (error) {
      console.error("Error setting primary source:", error);
    }
  };

  const startSync = async (dataSource) => {
    try {
      // Create sync job
      const syncJob = await SyncJob.create({
        data_source_id: dataSource.id,
        job_type: "Full Sync",
        started_at: new Date().toISOString(),
        progress_percentage: 0
      });

      // Simulate API data fetching using LLM integration
      await simulateDataSync(dataSource, syncJob.id);
      await loadData();
    } catch (error) {
      console.error("Error starting sync:", error);
    }
  };

  const simulateDataSync = async (dataSource, syncJobId) => {
    try {
      let progress = 0;
      const interval = setInterval(async () => {
        progress += Math.random() * 20 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Complete the job
          await SyncJob.update(syncJobId, {
            status: "Completed",
            completed_at: new Date().toISOString(),
            progress_percentage: 100,
            records_processed: Math.floor(Math.random() * 500) + 100,
            records_updated: Math.floor(Math.random() * 50) + 10,
            records_created: Math.floor(Math.random() * 20) + 5
          });

          // Update data source
          await DataSource.update(dataSource.id, {
            last_sync: new Date().toISOString(),
            records_synced: (dataSource.records_synced || 0) + Math.floor(Math.random() * 100) + 50
          });
        } else {
          await SyncJob.update(syncJobId, {
            status: "Running",
            progress_percentage: Math.floor(progress)
          });
        }
      }, 2000);
    } catch (error) {
      await SyncJob.update(syncJobId, {
        status: "Failed",
        completed_at: new Date().toISOString(),
        error_details: error.message
      });
    }
  };

  const fetchLiveMarketData = async () => {
    try {
      const response = await InvokeLLM({
        prompt: `Generate current real estate market data for Nashville, Memphis, Knoxville, and Chattanooga TN including:
        - Average days on market
        - Price trends (% change)
        - Inventory levels
        - New listings count
        - Market temperature (hot/warm/cold)
        - Investment opportunities score
        Return as structured data for display in a real estate dashboard.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            markets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  city: { type: "string" },
                  avg_dom: { type: "number" },
                  price_trend: { type: "string" },
                  inventory_level: { type: "string" },
                  new_listings: { type: "number" },
                  market_temp: { type: "string" },
                  opportunity_score: { type: "number" }
                }
              }
            },
            last_updated: { type: "string" }
          }
        }
      });

      return response;
    } catch (error) {
      console.error("Error fetching live market data:", error);
      return null;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Active": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "Error": return <XCircle className="w-4 h-4 text-red-500" />;
      case "Inactive": return <Clock className="w-4 h-4 text-slate-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Error": return "bg-red-100 text-red-800 border-red-200";
      case "Inactive": return "bg-slate-100 text-slate-800 border-slate-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Data Sources</h2>
          <p className="text-slate-600">Manage real-time data integrations</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={handleOpenAddForm} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="w-4 h-4" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Active Sync Jobs */}
      {syncJobs.length > 0 && (
        <Card className="glass-effect border-slate-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Active Sync Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncJobs.map((job) => (
                <div key={job.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{job.job_type}</h4>
                    <Badge className={job.status === "Running" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}>
                      {job.status}
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress_percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 mt-1">
                    <span>{job.progress_percentage}% complete</span>
                    <span>{job.records_processed || 0} records processed</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Sources Grid */}
      <div className="grid gap-6">
        {dataSources.map((source) => (
          <Card key={source.id} className={`glass-effect border-slate-200/50 shadow-xl transition-all ${source.is_primary_source ? 'border-amber-500 ring-2 ring-amber-500' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-500" />
                    {source.name}
                  </CardTitle>
                  <p className="text-slate-600 text-sm mt-1">{source.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  {source.is_primary_source && <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Star className="w-3 h-3 mr-1" />Primary</Badge>}
                  {getStatusIcon(source.status)}
                  <Badge className={getStatusColor(source.status)}>
                    {source.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Last Sync</p>
                  <p className="font-semibold">
                    {source.last_sync ? new Date(source.last_sync).toLocaleDateString() : "Never"}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Records</p>
                  <p className="font-semibold">{source.records_synced?.toLocaleString() || 0}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Frequency</p>
                  <p className="font-semibold">{source.sync_frequency}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => startSync(source)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800"
                  disabled={syncJobs.some(job => job.data_source_id === source.id && job.status === "Running")}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {syncJobs.some(job => job.data_source_id === source.id && job.status === "Running") ? "Syncing..." : "Sync Now"}
                </Button>
                {!source.is_primary_source && (
                  <Button variant="outline" onClick={() => setAsPrimary(source)}>
                    <Star className="w-4 h-4 mr-2" />
                    Set as Primary
                  </Button>
                )}
                <Button variant="outline" onClick={() => handleOpenEditForm(source)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Data Source Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <Card className="w-full max-w-2xl glass-effect shadow-2xl">
              <CardHeader>
                <CardTitle>{editingSource ? "Edit Data Source" : "Add Data Source"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Source Name</Label>
                      <Input
                        id="name"
                        value={newSource.name}
                        onChange={(e) => setNewSource(prev => ({...prev, name: e.target.value}))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={newSource.type} onValueChange={(value) => setNewSource(prev => ({...prev, type: value}))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MLS">MLS Data</SelectItem>
                          <SelectItem value="Public Records">Public Records</SelectItem>
                          <SelectItem value="Market Data">Market Data</SelectItem>
                          <SelectItem value="School Ratings">School Ratings</SelectItem>
                          <SelectItem value="Crime Data">Crime Data</SelectItem>
                          <SelectItem value="Google Maps API">Google Maps API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="endpoint">API Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={newSource.endpoint_url}
                      onChange={(e) => setNewSource(prev => ({...prev, endpoint_url: e.target.value}))}
                      placeholder="https://api.example.com/v1/properties"
                      required
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="apikey">API Key</Label>
                      <Input
                        id="apikey"
                        type="password"
                        value={newSource.api_key}
                        onChange={(e) => setNewSource(prev => ({...prev, api_key: e.target.value}))}
                        placeholder="Enter API key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="frequency">Sync Frequency</Label>
                      <Select value={newSource.sync_frequency} onValueChange={(value) => setNewSource(prev => ({...prev, sync_frequency: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Real-time">Real-time</SelectItem>
                          <SelectItem value="Hourly">Hourly</SelectItem>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingSource ? "Update Source" : "Add Source"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
