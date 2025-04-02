import { Search, ChevronDown, Settings, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "./search-bar";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterActive: boolean;
  toggleFilters: () => void;
}

export function Header({ search, onSearchChange, filterActive, toggleFilters }: HeaderProps) {
  return (
    <header className="h-12 bg-black flex items-center px-4 border-b border-gray-800 shadow-md">
      {/* Left side: Library dropdown */}
      <div className="flex items-center mr-4">
        <button className="flex items-center text-white">
          <span className="font-medium">Library</span>
          <ChevronDown className="ml-1 h-4 w-4" />
        </button>
      </div>
      
      {/* Middle: Search */}
      <div className="flex-1 max-w-md px-4">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder="Search library..."
        />
      </div>
      
      {/* Right side: Actions */}
      <div className="flex items-center space-x-2">
        <button 
          className={cn(
            "p-2 rounded-md",
            filterActive ? "bg-gray-800 text-blue-400" : "text-gray-400 hover:bg-gray-800"
          )}
          onClick={toggleFilters}
          title="Toggle filters"
        >
          <Filter className="h-5 w-5" />
        </button>
        
        <button 
          className="p-2 rounded-md text-gray-400 hover:bg-gray-800"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}