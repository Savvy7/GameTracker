
import type { Game } from "@shared/schema";
import { cn } from "@/lib/utils";

interface GameListProps {
  games: Game[];
  isLoading?: boolean;
  selectedId?: number | null;
  onSelect?: (id: number) => void;
}

export function GameList({ games, isLoading, selectedId, onSelect }: GameListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No games found
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {games.map((game) => (
        <button
          key={game.id}
          className={cn(
            "w-full flex items-center gap-3 p-2 rounded text-left hover:bg-accent",
            selectedId === game.id && "bg-accent"
          )}
          onClick={() => onSelect?.(game.id)}
        >
          {game.cover ? (
            <img
              src={game.cover}
              alt={game.title}
              className="w-12 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No Cover</span>
            </div>
          )}
          <div>
            <div className="font-medium truncate">{game.title}</div>
            <div className="text-sm text-muted-foreground">{game.releaseDate}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
