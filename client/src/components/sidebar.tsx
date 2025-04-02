
import { Link } from "wouter";
import { Home, Library, Star, Clock, Settings } from "lucide-react";

export function Sidebar() {
  return (
    <div className="w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-4">
      <Link href="/">
        <button className="p-2 text-primary hover:bg-accent rounded-lg">
          <Home size={24} />
        </button>
      </Link>
      <button className="p-2 text-muted-foreground hover:bg-accent rounded-lg">
        <Library size={24} />
      </button>
      <button className="p-2 text-muted-foreground hover:bg-accent rounded-lg">
        <Star size={24} />
      </button>
      <button className="p-2 text-muted-foreground hover:bg-accent rounded-lg">
        <Clock size={24} />
      </button>
      <div className="flex-1" />
      <button className="p-2 text-muted-foreground hover:bg-accent rounded-lg">
        <Settings size={24} />
      </button>
    </div>
  );
}
