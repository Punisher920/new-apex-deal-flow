import React, { useState, useEffect } from "react";
import { Property } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function LeadSearch() {
  const [query, setQuery] = useState("");
  const [allProperties, setAllProperties] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadAllProperties();
  }, []);

  const loadAllProperties = async () => {
    setIsLoading(true);
    try {
      const data = await Property.list("-deal_score", 200);
      setAllProperties(data);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
    setIsLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const filtered = allProperties.filter(p =>
      p.address?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.zip?.includes(q) ||
      p.state?.toLowerCase().includes(q)
    );
    setResults(filtered);
    setHasSearched(true);
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    if (e.target.value === "") {
      setResults([]);
      setHasSearched(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Lead Search</h1>
        <p className="text-slate-500 mt-1">Search properties by address, city, state, or zip</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search by address, city, zip..."
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? "Loading..." : "Search"}
        </Button>
      </form>

      {isLoading && (
        <p className="text-center text-slate-500">Loading properties...</p>
      )}

      {hasSearched && !isLoading && (
        <p className="text-sm text-slate-500 mb-4">
          {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
        </p>
      )}

      <div className="space-y-3">
        {results.map((property) => (
          <Card key={property.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-800">{property.address || "No address"}</p>
                  <p className="text-sm text-slate-500">
                    {property.city}{property.state ? `, ${property.state}` : ""}
                    {property.zip ? ` ${property.zip}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={(property.deal_score || 0) >= 80 ? "destructive" : "secondary"}>
                    Score: {property.deal_score ?? "N/A"}
                  </Badge>
                  {property.status && (
                    <p className="text-xs text-slate-400 mt-1">{property.status}</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex gap-6 text-sm">
                {property.list_price && (
                  <span className="text-slate-600">List: ${property.list_price.toLocaleString()}</span>
                )}
                {property.projected_profit && (
                  <span className="text-green-600 font-medium">
                    Profit: ${property.projected_profit.toLocaleString()}
                  </span>
                )}
                {property.property_type && (
                  <span className="text-slate-500">{property.property_type}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {hasSearched && !isLoading && results.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              No properties found for "{query}". Try a different search term.
            </CardContent>
          </Card>
        )}

        {!hasSearched && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center text-slate-400">
              Enter a search term above to find properties.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
