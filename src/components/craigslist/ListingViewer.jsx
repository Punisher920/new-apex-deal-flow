import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ExternalLink, DollarSign, MapPin, Calendar, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const ListingCard = ({ listing, index }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ delay: index * 0.05 }}
    className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
  >
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1">
        <a href={listing.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
          {listing.title}
        </a>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 mt-2">
          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-emerald-500" /> {formatCurrency(listing.price)}</span>
          {listing.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-orange-500" /> {listing.location}</span>}
          {listing.postedAt && <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-slate-500" /> {new Date(listing.postedAt).toLocaleDateString()}</span>}
        </div>
      </div>
      <Button asChild variant="outline" size="sm">
        <a href={listing.url} target="_blank" rel="noopener noreferrer">
          View
          <ExternalLink className="w-3 h-3 ml-2" />
        </a>
      </Button>
    </div>
  </motion.div>
);

export default function ListingViewer({ listings, isLoading, recipeName }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredListings = listings.filter(listing => 
    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (listing.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="glass-effect border-slate-200/50 shadow-xl h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              Leads from "{recipeName || 'Select a Search'}"
            </CardTitle>
            <CardDescription>Showing {filteredListings.length} of {listings.length} results.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Filter leads..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[75vh] overflow-y-auto">
        {isLoading ? (
          <div className="text-center p-8 text-slate-500">Loading listings...</div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center p-8 text-slate-500">
            <h3 className="font-semibold text-lg">No Listings Found</h3>
            <p>Try refreshing the search recipe or adjusting your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredListings.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}