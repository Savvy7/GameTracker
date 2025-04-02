
import { cn } from "@/lib/utils";

interface FiltersProps {
  className?: string;
}

export function Filters({ className }: FiltersProps) {
  return (
    <div className={cn("p-4 space-y-6", className)}>
      <div>
        <h3 className="mb-2 text-sm font-medium">Library</h3>
        <select className="w-full bg-background border border-input rounded-md">
          <option>All Games</option>
          <option>Installed</option>
          <option>Not Installed</option>
        </select>
      </div>
      
      <div>
        <h3 className="mb-2 text-sm font-medium">Platform</h3>
        <select className="w-full bg-background border border-input rounded-md">
          <option>All Platforms</option>
          <option>PC</option>
          <option>PlayStation</option>
          <option>Xbox</option>
        </select>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Genre</h3>
        <select className="w-full bg-background border border-input rounded-md">
          <option>All Genres</option>
          <option>Action</option>
          <option>RPG</option>
          <option>Strategy</option>
        </select>
      </div>
    </div>
  );
}
