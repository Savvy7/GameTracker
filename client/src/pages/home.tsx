import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { GameGrid } from "@/components/game-grid";
import { searchGames } from "@/lib/api";

export default function Home() {
  const [search, setSearch] = useState("");
  
  const { data: games = [], isLoading } = useQuery({
    queryKey: ["/api/games", search],
    queryFn: () => search ? searchGames(search) : fetch("/api/games").then(r => r.json())
  });

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Games</h1>
        <Link href="/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Game
          </Button>
        </Link>
      </div>

      <div className="max-w-md mb-8">
        <SearchBar 
          value={search}
          onChange={setSearch}
        />
      </div>

      <GameGrid 
        games={games}
        isLoading={isLoading}
      />
    </div>
  );
}
