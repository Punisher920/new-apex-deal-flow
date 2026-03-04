import React, { useState, useEffect } from "react";
import { Property } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Home, DollarSign, Star } from "lucide-react";

export default function DealFlowDashboard() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const data = await Property.list("-deal_score", 50);
      setProperties(data);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
    setIsLoading(false);
  };

  const totalProperties = properties.length;
  const hotLeads = properties.filter(p => (p.deal_score || 0) >= 80).length;
  const avgDealScore = totalProperties > 0
    ? (properties.reduce((s, p) => s + (p.deal_score || 0), 0) / totalProperties).toFixed(1)
    : 0;
  const totalProjectedProfit = properties.reduce((s, p) => s + (p.projected_profit || 0), 0);
  const topProperties = properties.slice(0, 10);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-slate-500">Loading Deal Flow Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Deal Flow Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of all real estate investment opportunities</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Home className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Properties</p>
              <p className="text-2xl font-bold text-slate-800">{totalProperties}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><Star className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Hot Leads (80+)</p>
              <p className="text-2xl font-bold text-red-600">{hotLeads}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Avg Deal Score</p>
              <p className="text-2xl font-bold text-green-600">{avgDealScore}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><DollarSign className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Projected Profit</p>
              <p className="text-xl font-bold text-purple-600">${totalProjectedProfit.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Properties Grid */}
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Top Deals by Score</h2>
      {topProperties.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-slate-500">No properties found. Add some properties to get started.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topProperties.map((property) => (
            <Card key={property.id} className={`border ${(property.deal_score || 0) >= 80 ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-800">{property.address || 'No address'}</CardTitle>
                    <p className="text-xs text-slate-500">{property.city}{property.state ? `, ${property.state}` : ''}</p>
                  </div>
                  <Badge variant={(property.deal_score || 0) >= 80 ? 'destructive' : 'secondary'}>
                    Score: {property.deal_score ?? 'N/A'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">List: ${(property.list_price || 0).toLocaleString()}</span>
                  <span className="text-green-600 font-medium">Profit: ${(property.projected_profit || 0).toLocaleString()}</span>
                </div>
                {property.status && <Badge variant="outline" className="mt-2 text-xs">{property.status}</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
