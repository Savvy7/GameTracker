import { Link, useLocation } from "wouter";
import { ChevronDown, Settings, Filter, User, Plus, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "./search-bar";
import { useAuth } from "@/hooks/use-auth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterActive: boolean;
  toggleFilters: () => void;
}

export function Header({ search, onSearchChange, filterActive, toggleFilters }: HeaderProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // Function to get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };
  
  return (
    <header className="h-16 bg-black flex items-center px-4 border-b border-gray-800 shadow-md">
      {/* Left side: Library dropdown */}
      <div className="flex items-center mr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center text-white px-2 py-1 rounded-md hover:bg-gray-800">
              <span className="font-medium">Library</span>
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-700">
            <DropdownMenuItem onClick={() => navigate("/")} className="text-gray-200 hover:bg-gray-700 cursor-pointer">
              All Games
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/recent")} className="text-gray-200 hover:bg-gray-700 cursor-pointer">
              Recently Played
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/favorites")} className="text-gray-200 hover:bg-gray-700 cursor-pointer">
              Favorites
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={() => navigate("/stats")} className="text-gray-200 hover:bg-gray-700 cursor-pointer">
              Statistics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Middle: Search */}
      <div className="flex-1 max-w-xl px-4">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder="Search library..."
        />
      </div>
      
      {/* Right side: Actions */}
      <div className="flex items-center space-x-3">
        {user ? (
          <>
            <Link href="/add">
              <Button 
                variant="outline" 
                size="sm"
                className="hidden md:flex bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Game
              </Button>
            </Link>
            
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 rounded-full overflow-hidden">
                  <Avatar className="h-8 w-8 cursor-pointer border border-gray-700">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-700">
                      {getInitials(user.displayName || user.username)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700 text-gray-200">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || user.username}</p>
                    <p className="text-xs leading-none text-gray-400">@{user.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer hover:bg-gray-700">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/friends")} className="cursor-pointer hover:bg-gray-700">
                  Friends
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-700">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-gray-700"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
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
            
            <Link href="/auth">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700"
              >
                <User className="mr-1 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}