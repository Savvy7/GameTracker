import { Link } from "wouter";
import { Game } from "@shared/schema";
import { Star } from "lucide-react";

interface GameListProps {
  games: Game[];
  isLoading?: boolean;
}

export function GameList({ games, isLoading = false }: GameListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="w-full aspect-[3/4] bg-gray-800 rounded-md"></div>
            <div className="h-4 bg-gray-800 rounded mt-2 w-3/4"></div>
            <div className="h-3 bg-gray-800 rounded mt-2 w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-lg mb-2">No games found</p>
        <p className="text-sm">Try a different search or add a new game to your library</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {games.map((game) => (
        <Link key={game.id} href={`/games/${game.id}`}>
          <div className="group cursor-pointer">
            <div className="relative w-full aspect-[3/4] bg-gray-800 rounded-md overflow-hidden transition-all group-hover:shadow-lg group-hover:shadow-blue-500/10">
              {game.cover ? (
                <img
                  src={game.cover}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">No Cover</span>
                </div>
              )}
              
              {/* Play status */}
              {game.playStatus && game.playStatus !== "not_started" && (
                <div className="absolute top-2 right-2 p-1 rounded-full bg-black/70">
                  {game.playStatus === "completed" && (
                    <div className="w-3 h-3 rounded-full bg-green-500" title="Completed"></div>
                  )}
                  {game.playStatus === "in_progress" && (
                    <div className="w-3 h-3 rounded-full bg-yellow-500" title="In Progress"></div>
                  )}
                  {game.playStatus === "abandoned" && (
                    <div className="w-3 h-3 rounded-full bg-red-500" title="Abandoned"></div>
                  )}
                </div>
              )}
              
              {/* Rating badge */}
              {game.personalRating && game.personalRating > 0 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-1 rounded flex items-center">
                  <Star className="w-3 h-3 mr-0.5 text-yellow-400" />
                  {game.personalRating}/10
                </div>
              )}
            </div>
            
            <div className="mt-2 px-1">
              <h3 className="font-medium text-sm text-white truncate">{game.title}</h3>
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-gray-400">
                  {game.releaseDate ? game.releaseDate.split('-')[0] : ""}
                </div>
                {game.platforms && game.platforms.length > 0 && (
                  <div className="text-xs text-gray-400 truncate max-w-[70%] text-right">
                    {game.platforms.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}