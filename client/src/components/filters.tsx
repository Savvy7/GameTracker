import { useState } from "react";
import { X, Filter, Check, ChevronDown, ChevronUp, Star, Tag, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface FiltersProps {
  className?: string;
  onApplyFilters?: (filters: FilterState) => void;
}

interface FilterState {
  platforms: string[];
  genres: string[];
  status: string[];
  tags: string[];
  favorite: boolean;
  ratings: number[];
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export function Filters({ className, onApplyFilters }: FiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    platforms: [],
    genres: [],
    status: [],
    tags: [],
    favorite: false,
    ratings: [],
    sortBy: "title",
    sortDirection: "asc"
  });

  const handleFilterToggle = (category: keyof FilterState, value: string) => {
    setSelectedFilters(prev => {
      if (category === "sortBy") {
        return { 
          ...prev, 
          [category]: value,
          sortDirection: prev.sortBy === value && prev.sortDirection === "asc" ? "desc" : "asc"
        };
      }
      
      const current = [...(prev[category] as string[])];
      const index = current.indexOf(value);
      
      if (index >= 0) {
        current.splice(index, 1);
      } else {
        current.push(value);
      }
      
      return { ...prev, [category]: current };
    });
  };

  const handleToggleFavorite = () => {
    setSelectedFilters(prev => ({
      ...prev,
      favorite: !prev.favorite
    }));
  };

  const handleReset = () => {
    setSelectedFilters({
      platforms: [],
      genres: [],
      status: [],
      tags: [],
      favorite: false,
      ratings: [],
      sortBy: "title",
      sortDirection: "asc"
    });
  };

  const handleApplyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters(selectedFilters);
    }
  };

  const isSelected = (category: keyof FilterState, value: string) => {
    const values = selectedFilters[category] as string[];
    return values?.includes(value) || false;
  };

  // Helper functions to show active filter counts
  const getActiveFilterCount = (category: keyof FilterState) => {
    if (category === "favorite") return selectedFilters.favorite ? 1 : 0;
    const values = selectedFilters[category] as string[] | number[];
    return values?.length || 0;
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
        
        <Accordion type="multiple" defaultValue={["sort"]} className="space-y-3">
          {/* Sorting */}
          <AccordionItem value="sort" className="border-b border-gray-800">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex justify-between items-center w-full pr-2">
                <span className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  Sort By
                </span>
                {getActiveFilterCount("sortBy") > 0 && (
                  <Badge className="bg-blue-600 hover:bg-blue-700 ml-2 h-5">
                    {selectedFilters.sortBy} ({selectedFilters.sortDirection === "asc" ? "A-Z" : "Z-A"})
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1 pl-6">
                {[
                  { id: "title", label: "Name" },
                  { id: "releaseDate", label: "Release Date" },
                  { id: "rating", label: "Rating" },
                  { id: "lastPlayed", label: "Last Played" },
                  { id: "totalPlayTime", label: "Play Time" }
                ].map(sort => (
                  <button 
                    key={sort.id} 
                    className={cn(
                      "flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-800",
                      selectedFilters.sortBy === sort.id ? "bg-gray-800 text-blue-400" : "text-gray-400"
                    )}
                    onClick={() => handleFilterToggle("sortBy", sort.id)}
                  >
                    {selectedFilters.sortBy === sort.id && (
                      <span className="h-3 w-3 mr-2 text-blue-400">
                        {selectedFilters.sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    <span className="ml-1">{sort.label}</span>
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Play Status */}
          <AccordionItem value="status" className="border-b border-gray-800">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex justify-between items-center w-full pr-2">
                <span className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  Play Status
                </span>
                {getActiveFilterCount("status") > 0 && (
                  <Badge className="bg-blue-600 hover:bg-blue-700 ml-2 h-5">
                    {getActiveFilterCount("status")}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1 pl-6">
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
            </AccordionContent>
          </AccordionItem>
          
          {/* Ratings */}
          <AccordionItem value="ratings" className="border-b border-gray-800">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex justify-between items-center w-full pr-2">
                <span className="text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-2 text-gray-400" />
                  Personal Rating
                </span>
                {getActiveFilterCount("ratings") > 0 && (
                  <Badge className="bg-blue-600 hover:bg-blue-700 ml-2 h-5">
                    {getActiveFilterCount("ratings")}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1 pl-6">
                {[
                  { id: "unrated", label: "Not Rated" },
                  { id: "1-3", label: "1-3 (Low)" },
                  { id: "4-6", label: "4-6 (Medium)" },
                  { id: "7-10", label: "7-10 (High)" }
                ].map(rating => (
                  <button 
                    key={rating.id} 
                    className={cn(
                      "flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-800",
                      isSelected("ratings", rating.id) ? "bg-gray-800 text-blue-400" : "text-gray-400"
                    )}
                    onClick={() => handleFilterToggle("ratings", rating.id)}
                  >
                    {isSelected("ratings", rating.id) && <Check className="h-3 w-3 mr-2 text-blue-400" />}
                    <span className="ml-1">{rating.label}</span>
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Platforms */}
          <AccordionItem value="platforms" className="border-b border-gray-800">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex justify-between items-center w-full pr-2">
                <span className="text-sm font-medium flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-gray-400" />
                  Platforms
                </span>
                {getActiveFilterCount("platforms") > 0 && (
                  <Badge className="bg-blue-600 hover:bg-blue-700 ml-2 h-5">
                    {getActiveFilterCount("platforms")}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1 pl-6">
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
            </AccordionContent>
          </AccordionItem>
          
          {/* Genres */}
          <AccordionItem value="genres" className="border-b border-gray-800">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex justify-between items-center w-full pr-2">
                <span className="text-sm font-medium flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-gray-400" />
                  Genres
                </span>
                {getActiveFilterCount("genres") > 0 && (
                  <Badge className="bg-blue-600 hover:bg-blue-700 ml-2 h-5">
                    {getActiveFilterCount("genres")}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1 pl-6">
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
            </AccordionContent>
          </AccordionItem>

          {/* Tags */}
          <AccordionItem value="tags" className="border-b border-gray-800">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex justify-between items-center w-full pr-2">
                <span className="text-sm font-medium flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-gray-400" />
                  Tags
                </span>
                {getActiveFilterCount("tags") > 0 && (
                  <Badge className="bg-blue-600 hover:bg-blue-700 ml-2 h-5">
                    {getActiveFilterCount("tags")}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1 pl-6">
                {["Co-op", "Multiplayer", "Single-player", "Open World", "VR", "Story Rich", "Difficult"].map(tag => (
                  <button 
                    key={tag} 
                    className={cn(
                      "flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-800",
                      isSelected("tags", tag) ? "bg-gray-800 text-blue-400" : "text-gray-400"
                    )}
                    onClick={() => handleFilterToggle("tags", tag)}
                  >
                    {isSelected("tags", tag) && <Check className="h-3 w-3 mr-2 text-blue-400" />}
                    <span className="ml-1">{tag}</span>
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {/* Favorites toggle */}
        <div className="py-4 flex items-center justify-between border-b border-gray-800">
          <span className="text-sm">Favorites Only</span>
          <Switch 
            checked={selectedFilters.favorite}
            onCheckedChange={handleToggleFavorite}
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button 
            className="flex-1 py-2 px-4 text-sm bg-transparent hover:bg-gray-800 text-white border border-gray-700 rounded-md"
            onClick={handleReset}
          >
            Reset
          </button>
          <button 
            className="flex-1 py-2 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}