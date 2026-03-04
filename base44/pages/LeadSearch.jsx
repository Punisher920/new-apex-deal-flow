import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function LeadSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await base44.functions.invoke('searchLeads', {
        query: query.trim(),
        limit: 30,
      });
      setResults(data?.leads || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Lead Search</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by address, city, zip..."
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {searched && !loading && (
        <p className="text-sm text-gray-500 mb-4">
          {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
        </p>
      )}

      <div className="space-y-3">
        {results.map((lead) => (
          <div
            key={lead.id || lead._id}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">{lead.address || lead.title}</p>
                <p className="text-sm text-gray-500">
                  {lead.city}{lead.state ? `, ${lead.state}` : ''} {lead.zip}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                  Score: {lead.deal_score ?? lead.score ?? 'N/A'}
                </span>
                <p className="text-xs text-gray-400 mt-1">{lead.status}</p>
              </div>
            </div>
            <div className="mt-2 flex gap-6 text-sm text-gray-600">
              {lead.list_price && <span>List: ${lead.list_price.toLocaleString()}</span>}
              {lead.projected_profit && (
                <span className="text-green-600">
                  Profit: ${lead.projected_profit.toLocaleString()}
                </span>
              )}
              {lead.property_type && <span>Type: {lead.property_type}</span>}
            </div>
          </div>
        ))}

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No leads found for "{query}". Try a different search term.
          </div>
        )}
      </div>
    </div>
  );
}
