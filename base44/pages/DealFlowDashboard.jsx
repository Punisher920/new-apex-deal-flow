import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function DealFlowDashboard() {
  const [stats, setStats] = useState(null);
  const [hotLeads, setHotLeads] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [statsData, hotData, leadsData] = await Promise.all([
        base44.functions.invoke('getDashboardStats', {}),
        base44.functions.invoke('getHotLeads', { minScore: 80, limit: 10 }),
        base44.functions.invoke('getLeads', { limit: 50, sort: '-deal_score' }),
      ]);
      setStats(statsData);
      setHotLeads(hotData?.leads || hotData || []);
      setLeads(leadsData?.leads || leadsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading Deal Flow Dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Apex Deal Flow Dashboard</h1>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Leads" value={stats.totalLeads} />
          <StatCard label="Hot Leads" value={stats.hotLeads} color="text-red-500" />
          <StatCard label="Avg Deal Score" value={stats.avgDealScore?.toFixed(1)} />
          <StatCard label="Projected Profit" value={`$${(stats.totalProjectedProfit||0).toLocaleString()}`} color="text-green-600" />
        </div>
      )}

      {/* Hot Leads */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Hot Leads (Score 80+)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotLeads.map((lead) => (
            <LeadCard key={lead.id || lead._id} lead={lead} hot />
          ))}
          {hotLeads.length === 0 && <p className="text-gray-500">No hot leads found.</p>}
        </div>
      </section>

      {/* All Leads */}
      <section>
        <h2 className="text-xl font-semibold mb-3">All Leads</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Address</th>
                <th className="p-2 text-left">Score</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Profit</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id || lead._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{lead.address || lead.title}</td>
                  <td className="p-2 font-bold">{lead.deal_score ?? lead.score}</td>
                  <td className="p-2">{lead.status}</td>
                  <td className="p-2">${(lead.list_price || 0).toLocaleString()}</td>
                  <td className="p-2 text-green-600">${(lead.projected_profit || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, color = 'text-gray-800' }) {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
    </div>
  );
}

function LeadCard({ lead, hot }) {
  return (
    <div className={`border rounded-lg p-4 shadow-sm ${hot ? 'border-red-300 bg-red-50' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold">{lead.address || lead.title}</p>
          <p className="text-sm text-gray-500">{lead.city}, {lead.state}</p>
        </div>
        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
          Score: {lead.deal_score ?? lead.score}
        </span>
      </div>
      <div className="mt-2 flex gap-4 text-sm">
        <span>List: ${(lead.list_price||0).toLocaleString()}</span>
        <span className="text-green-600">Profit: ${(lead.projected_profit||0).toLocaleString()}</span>
      </div>
    </div>
  );
}
