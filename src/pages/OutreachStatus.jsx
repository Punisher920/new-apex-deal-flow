import React, { useState, useEffect } from "react";
import { OutreachLog, Property, Owner } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Send,
  User,
  MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OutreachStatus() {
  const [outreachLogs, setOutreachLogs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [owners, setOwners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsData, propsData, ownersData] = await Promise.all([
        OutreachLog.list("-contact_date", 200),
        Property.list("", 200),
        Owner.list("", 200)
      ]);
      
      setOutreachLogs(logsData);
      setProperties(propsData);
      setOwners(ownersData);
    } catch (error) {
      console.error("Error loading outreach data:", error);
    }
    setIsLoading(false);
  };

  const getProperty = (parcelId) => {
    return properties.find(p => p.parcel_id === parcelId);
  };

  const getOwner = (parcelId) => {
    return owners.find(o => o.parcel_id === parcelId);
  };

  const handleUpdateResponse = async (logId, status, response) => {
    try {
      await OutreachLog.update(logId, {
        response_received: status === "Responded",
        response_text: response,
        status: status
      });
      
      setSelectedLog(null);
      setResponseText("");
      await loadData();
    } catch (error) {
      console.error("Error updating response:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Sent": return <Send className="w-4 h-4 text-blue-500" />;
      case "Delivered": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "Responded": return <MessageCircle className="w-4 h-4 text-purple-500" />;
      case "Interested": return <AlertCircle className="w-4 h-4 text-green-500" />;
      case "Not Interested": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Sent": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Delivered": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Responded": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Interested": return "bg-green-100 text-green-800 border-green-200";
      case "Not Interested": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case "SMS": return <Phone className="w-4 h-4" />;
      case "Email": return <Mail className="w-4 h-4" />;
      case "Phone": return <Phone className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const filteredLogs = outreachLogs.filter(log => {
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    const matchesMethod = filterMethod === "all" || log.contact_method === filterMethod;
    return matchesStatus && matchesMethod;
  });

  const stats = {
    total: outreachLogs.length,
    sent: outreachLogs.filter(log => log.status === "Sent").length,
    responded: outreachLogs.filter(log => log.status === "Responded" || log.status === "Interested").length,
    interested: outreachLogs.filter(log => log.status === "Interested").length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Outreach Status</h1>
          <p className="text-slate-600 text-lg">Track all contact attempts and responses from property owners</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <Send className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-600">Total Contacts</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.sent}</p>
              <p className="text-sm text-slate-600">Awaiting Response</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.responded}</p>
              <p className="text-sm text-slate-600">Responded</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.interested}</p>
              <p className="text-sm text-slate-600">Interested</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-effect border-slate-200/50 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Responded">Responded</SelectItem>
                  <SelectItem value="Interested">Interested</SelectItem>
                  <SelectItem value="Not Interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Mail">Mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Outreach Logs */}
        <Card className="glass-effect border-slate-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              Contact History ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {filteredLogs.map((log, index) => {
                  const property = getProperty(log.parcel_id);
                  const owner = getOwner(log.parcel_id);
                  
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-500" />
                              {log.owner_name}
                            </h4>
                            <Badge className={`${getStatusColor(log.status)} border flex items-center gap-1`}>
                              {getStatusIcon(log.status)}
                              {log.status}
                            </Badge>
                          </div>
                          
                          {property && (
                            <p className="text-slate-600 flex items-center gap-1 text-sm">
                              <MapPin className="w-4 h-4" />
                              {property.address}, {property.city}, {property.state}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              {getMethodIcon(log.contact_method)}
                              {log.contact_method}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(log.contact_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Message Sent:</p>
                        <p className="text-sm text-slate-600">{log.message_sent}</p>
                      </div>

                      {log.response_text && (
                        <div className="mb-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <p className="text-sm font-medium text-emerald-800 mb-1">Response Received:</p>
                          <p className="text-sm text-emerald-700">{log.response_text}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {!log.response_received && (
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedLog(log)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Log Response
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4 mr-2" />
                          Follow Up
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Response Modal */}
        <AnimatePresence>
          {selectedLog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <Card className="w-full max-w-2xl glass-effect shadow-2xl">
                <CardHeader>
                  <CardTitle>Log Response from {selectedLog.owner_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Response Status</label>
                    <Select value={selectedLog.status} onValueChange={(value) => setSelectedLog({...selectedLog, status: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Responded">Responded</SelectItem>
                        <SelectItem value="Interested">Interested</SelectItem>
                        <SelectItem value="Not Interested">Not Interested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Response Details</label>
                    <Textarea
                      placeholder="Enter the owner's response..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setSelectedLog(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleUpdateResponse(selectedLog.id, selectedLog.status, responseText)}>
                      Save Response
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}