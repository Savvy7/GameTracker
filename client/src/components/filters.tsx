import { useState } from "react";
import { X, Filter, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FiltersProps {
  className?: string;
}

export function Filters({ className }: FiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    platforms: [],
    genres: [],
    status: [],
    sortBy: ["title"]
  });

  const handleFilterToggle = (category: string, value: string) => {
    setSelectedFilters(prev => {
      const current = [...(prev[category] || [])];
      const index = current.indexOf(value);
      
      if (index >= 0) {
        current.splice(index, 1);
      } else {
        if (category === "sortBy") {
          // Single selection for sort
          return { ...prev, [category]: [value] };
        }
        current.push(value);
      }
      
      return { ...prev, [category]: current };
    });
  };

  const isSelected = (category: string, value: string) => {
    return selectedFilters[category]?.includes(value) || false;
  };

  return (
    <div className={cn("bg-black border-l border-gray-800 overflow-y-auto", className)}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </h2>
          <button className="p-2 text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Sorting */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Sort By</h3>
          <div className="space-y-1">
            {["title", "releaseDate", "rating", "addedDate"].map(sort => (
              <button 
                key={sort} 
                className={cn(
                  "flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-800",
                  isSelected("sortBy", sort) ? "bg-gray-800 text-blue-400" : "text-gray-400"
                )}
                onClick={() => handleFilterToggle("sortBy", sort)}
              >
                {isSelected("sortBy", sort) && <Check className="h-3 w-3 mr-2 text-blue-400" />}
                <span className="ml-1">
                  {sort === "title" && "Name (A-Z)"}
                  {sort === "releaseDate" && "Release Date"}
                  {sort === "rating" && "Rating"}
                  {sort === "addedDate" && "Date Added"}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Platforms */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Platforms</h3>
          <div className="space-y-1">
            {["PC", "PlayStation", "Xbox", "Nintendo", "Mobile"].map(platform => (
              <button 
                key={platform} 
                className={cn(
                  "flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-800",
                  isSelected("platforms", platform) ? "bg-gray-800 text-blue-400" : "text-gray-400"
                )}
                onClick={() => handleFilterToggle("platforms", platform)}
              >
                {isSelected("platforms", platform) && <Check className="h-3 w-3 mr-2 text-blue-400" />}
                <span className="ml-1">{platform}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Genres */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Genres</h3>
          <div className="space-y-1">
            {["Action", "Adventure", "RPG", "Strategy", "Shooter", "Puzzle", "Indie", "Sports", "Racing", "Simulation"].map(genre => (
              <button 
                key={genre} 
                className={cn(
                  "flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-800",
                  isSelected("genres", genre) ? "bg-gray-800 text-blue-400" : "text-gray-400"
                )}
                onClick={() => handleFilterToggle("genres", genre)}
              >
                {isSelected("genres", genre) && <Check className="h-3 w-3 mr-2 text-blue-400" />}
                <span className="ml-1">{genre}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Play Status */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Play Status</h3>
          <div className="space-y-1">
            {[
              { id: "not_started", label: "Not Started" },
              { id: "in_progress", label: "In Progress" },
              { id: "completed", label: "Completed" },
              { id: "abandoned", label: "Abandoned" }
            ].map(status => (
              <button 
                key={status.id} 
                className={cn(
                  "flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-800",
                  isSelected("status", status.id) ? "bg-gray-800 text-blue-400" : "text-gray-400"
                )}
                onClick={() => handleFilterToggle("status", status.id)}
              >
                {isSelected("status", status.id) && <Check className="h-3 w-3 mr-2 text-blue-400" />}
                <span className="ml-1">{status.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Reset button */}
        <button className="w-full mt-2 py-2 px-4 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-md">
          Reset Filters
        </button>
      </div>
    </div>
  );
}