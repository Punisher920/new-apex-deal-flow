import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Database, XCircle } from 'lucide-react';

export default function ApiStatusIndicator({ activeSource }) {
  if (!activeSource) {
    return (
      <Card className="glass-effect border-red-200/50 shadow-xl bg-red-50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-bold text-red-900">No Primary Data Source Selected</p>
              <p className="text-sm text-red-700">Property search is disabled. Please select a primary source in Data Integrations.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-slate-200/50 shadow-xl">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-500" />
          <div>
            <p className="font-bold text-slate-900">Live Search via {activeSource.name}</p>
            <p className="text-sm text-slate-600">All property queries are using this primary data source.</p>
          </div>
        </div>
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
          <CheckCircle className="w-4 h-4 mr-2" />
          Connected
        </Badge>
      </CardContent>
    </Card>
  );
}