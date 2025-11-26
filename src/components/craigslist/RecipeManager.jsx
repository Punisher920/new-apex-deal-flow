
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Search, Clock, Plus, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from 'framer-motion';

const AddRecipeForm = ({ apiBaseUrl, onRecipeAdded, onAddClose }) => {
  const [name, setName] = useState('');
  const [searchUrl, setSearchUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !searchUrl) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, searchUrl, cadenceMinutes: 60 }), // Added default cadence
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({ detail: 'Failed to add recipe. Check API logs.' }));
        throw new Error(result.detail || 'Failed to add recipe');
      }
      toast({ title: "Success", description: "New search recipe has been added.", variant: "success" });
      onRecipeAdded();
    } catch (e) {
      let errorMessage = e.message;
      if (e.message.includes("Failed to fetch")) {
        errorMessage = "Could not connect to the API service. Please ensure the API URL is correct and the service is running.";
      }
      toast({ title: "Error Adding Recipe", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="p-4 border-t border-slate-200"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="font-semibold text-slate-800">Add New Search Recipe</h4>
        <div>
          <Label htmlFor="recipe-name">Recipe Name</Label>
          <Input id="recipe-name" placeholder="e.g., Nashville Investor Specials" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="search-url">Craigslist Search URL</Label>
          <Input id="search-url" placeholder="Paste URL from Craigslist..." value={searchUrl} onChange={(e) => setSearchUrl(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onAddClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Recipe"}</Button>
        </div>
      </form>
    </motion.div>
  );
};

export default function RecipeManager({ recipes, selectedRecipe, onSelectRecipe, onRefresh, isLoading, isAdding, onAddClose, onRecipeAdded, apiBaseUrl }) {
  const [refreshingId, setRefreshingId] = useState(null);

  const handleRefreshClick = async (recipeId) => {
    setRefreshingId(recipeId);
    await onRefresh(recipeId);
    setRefreshingId(null);
  };
  
  return (
    <Card className="glass-effect border-slate-200/50 shadow-xl h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-500" />
          Saved Searches
        </CardTitle>
        <CardDescription>Select a search to view leads or refresh to get the latest.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center p-8 text-slate-500">Loading recipes...</div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe) => {
              const isSelected = selectedRecipe?.id === recipe.id;
              const isRefreshing = refreshingId === recipe.id;
              return (
                <div
                  key={recipe.id}
                  onClick={() => onSelectRecipe(recipe)}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-slate-900">{recipe.name}</h4>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="w-8 h-8"
                      onClick={(e) => { e.stopPropagation(); handleRefreshClick(recipe.id); }}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                    <Clock className="w-3 h-3" />
                    Last run: {recipe.last_run ? new Date(recipe.last_run).toLocaleString() : 'Never'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <AnimatePresence>
        {isAdding && <AddRecipeForm apiBaseUrl={apiBaseUrl} onRecipeAdded={onRecipeAdded} onAddClose={onAddClose} />}
      </AnimatePresence>
    </Card>
  );
}
