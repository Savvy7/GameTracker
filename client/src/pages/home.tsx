import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Plus } from "lucide-react";
import { GameList } from "@/components/game-list";
import { searchGames } from "@/lib/api";

interface HomeProps {
  search?: string;
}

export default function Home({ search = "" }: HomeProps) {
  const [, navigate] = useLocation();

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["/api/games", search],
    queryFn: () => search ? searchGames(search) : fetch("/api/games").then(r => r.json())
  });

  // Add floating action button for adding new games
  return (
    <div className="relative h-full">
      <div className="p-4">
        <GameList 
          games={games}
          isLoading={isLoading}
        />
      </div>

      {/* Floating action button */}
      <Link href="/add">
        <button className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors">
          <Plus className="h-6 w-6" />
        </button>
      </Link>
    </div>
  );
}