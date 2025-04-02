import { Link, useLocation } from "wouter";
import { 
  Home, 
  Search, 
  Play, 
  Download, 
  Clock, 
  Heart, 
  Settings, 
  CheckSquare, 
  AlertCircle,
  BarChart2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    { href: "/", icon: Home, label: "Library" },
    { href: "/recent", icon: Clock, label: "Recently Played" },
    { href: "/installed", icon: Download, label: "Installed" },
    { href: "/active", icon: Play, label: "Now Playing" },
    { href: "/favorites", icon: Heart, label: "Favorites" },
    { href: "/completed", icon: CheckSquare, label: "Completed" },
    { href: "/abandoned", icon: AlertCircle, label: "Abandoned" },
    { href: "/stats", icon: BarChart2, label: "Statistics" },
  ];

  return (
    <div className={cn("bg-black text-white overflow-y-auto p-2", className)}>
      <div className="py-4">
        <h2 className="text-lg font-semibold px-3 mb-3 text-gray-200">Playnite</h2>
        
        <nav className="space-y-1">
          {navigationItems.map((item) => (
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
        
        <div className="mt-6 px-3">
          <div className="text-xs uppercase font-semibold tracking-wider text-gray-500 mb-2">
            Platforms
          </div>
          <nav className="space-y-1">
            <Link href="/platform/pc">
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 cursor-pointer",
                location === "/platform/pc" ? "bg-gray-800 text-blue-400" : "text-gray-400"
              )}>
                PC
              </div>
            </Link>
            <Link href="/platform/playstation">
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 cursor-pointer",
                location === "/platform/playstation" ? "bg-gray-800 text-blue-400" : "text-gray-400"
              )}>
                PlayStation
              </div>
            </Link>
            <Link href="/platform/xbox">
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 cursor-pointer",
                location === "/platform/xbox" ? "bg-gray-800 text-blue-400" : "text-gray-400"
              )}>
                Xbox
              </div>
            </Link>
            <Link href="/platform/nintendo">
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 cursor-pointer",
                location === "/platform/nintendo" ? "bg-gray-800 text-blue-400" : "text-gray-400"
              )}>
                Nintendo
              </div>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}