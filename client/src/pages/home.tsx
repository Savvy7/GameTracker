
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { SearchBar } from "@/components/search-bar";
import { GameList } from "@/components/game-list";
import { Sidebar } from "@/components/sidebar";
import { Filters } from "@/components/filters";
import { searchGames } from "@/lib/api";

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState<number | null>(null);

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["/api/games", search],
    queryFn: () => search ? searchGames(search) : fetch("/api/games").then(r => r.json())
  });

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex">
        <div className="w-72 border-r border-border bg-card">
          <div className="p-4">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <GameList 
            games={games} 
            isLoading={isLoading}
            selectedId={selectedGame}
            onSelect={setSelectedGame}
          />
        </div>
        <div className="flex-1 relative">
          {selectedGame ? (
            <GameDetails id={selectedGame} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a game to view details
            </div>
          )}
        </div>
        <Filters className="w-64 border-l border-border" />
      </div>
    </div>
  );
}
