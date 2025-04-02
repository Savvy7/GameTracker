import { Link, useLocation } from "wouter";
import { 
  Home, 
  Play, 
  Download, 
  Clock, 
  Heart, 
  CheckSquare, 
  AlertCircle,
  BarChart2,
  Users,
  User,
  LogIn,
  LogOut,
  PlusCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isLoggedIn = !!user;

  const libraryItems = [
    { href: "/", icon: Home, label: "Library" },
    { href: "/recent", icon: Clock, label: "Recently Played" },
    { href: "/installed", icon: Download, label: "Installed" },
    { href: "/active", icon: Play, label: "Now Playing" },
    { href: "/favorites", icon: Heart, label: "Favorites" },
    { href: "/completed", icon: CheckSquare, label: "Completed" },
    { href: "/abandoned", icon: AlertCircle, label: "Abandoned" },
    { href: "/stats", icon: BarChart2, label: "Statistics" },
  ];

  const accountItems = isLoggedIn 
    ? [
        { href: "/profile", icon: User, label: "Profile" },
        { href: "/friends", icon: Users, label: "Friends" },
      ]
    : [
        { href: "/auth", icon: LogIn, label: "Login / Register" },
      ];
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        // Redirect to home after logout
        navigate("/");
      }
    });
  };

  return (
    <div className={cn("bg-black text-white overflow-y-auto p-2 flex flex-col", className)}>
      <div className="py-4 flex-1">
        <h2 className="text-lg font-semibold px-3 mb-3 text-gray-200">Playnite</h2>
        
        <div className="text-xs uppercase font-semibold tracking-wider text-gray-500 mt-4 mb-2 px-3">
          Library
        </div>
        <nav className="space-y-1">
          {libraryItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 cursor-pointer",
                location === item.href ? "bg-gray-800 text-blue-400" : "text-gray-400"
              )}>
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
        
        <div className="text-xs uppercase font-semibold tracking-wider text-gray-500 mt-6 mb-2 px-3">
          Account
        </div>
        <nav className="space-y-1">
          {accountItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 cursor-pointer",
                location === item.href ? "bg-gray-800 text-blue-400" : "text-gray-400"
              )}>
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </div>
            </Link>
          ))}
          
          {isLoggedIn && (
            <div 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 cursor-pointer text-gray-400"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </div>
          )}
        </nav>
      </div>
      
      {isLoggedIn && (
        <div className="p-3 pt-0">
          <Link href="/add">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Game
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}