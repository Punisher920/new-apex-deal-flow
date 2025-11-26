import React from "react";
import { MapPin, DollarSign } from "lucide-react";

export default function PropertyMap({ properties }) {
  return (
    <div className="relative h-96 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden">
      {/* Map placeholder with property markers */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Interactive Map</h3>
          <p className="text-slate-500">Showing {properties.length} properties</p>
        </div>
      </div>
      
      {/* Simulated property markers */}
      <div className="absolute top-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg">
          85
        </div>
      </div>
      
      <div className="absolute top-3/4 left-2/3 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg">
          78
        </div>
      </div>
      
      <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg">
          92
        </div>
      </div>
      
      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
            <span>Score 80+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
            <span>Score 70-79</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Score 90+</span>
          </div>
        </div>
      </div>
    </div>
  );
}