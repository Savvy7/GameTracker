import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { insertGameSchema, type InsertGame } from "@shared/schema";
import { createGame, searchIGDB } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { SearchBar } from "@/components/search-bar";
import { useDebounce } from "@/hooks/use-debounce";

export default function AddGame() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/igdb/search", debouncedSearch],
    queryFn: () => debouncedSearch ? searchIGDB(debouncedSearch) : Promise.resolve([]),
    enabled: debouncedSearch.length > 0,
  });

  const form = useForm<InsertGame>({
    resolver: zodResolver(insertGameSchema),
    defaultValues: {
      title: "",
      platforms: [],
      genres: [],
      cover: "",
      releaseDate: "",
      rating: 0,
      summary: "",
      igdbId: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Game added to your collection",
      });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add game",
        variant: "destructive",
      });
    },
  });

  const selectGame = (game: any) => {
    form.reset({
      title: game.title,
      cover: game.cover,
      releaseDate: game.releaseDate,
      platforms: game.platforms,
      genres: game.genres,
      rating: game.rating,
      summary: game.summary,
      developer: game.developer,
      publisher: game.publisher,
      tags: game.tags,
      igdbId: game.igdbId,
    });
    setSearch("");
    
    // Auto-submit the form after selecting a game
    mutation.mutate({
      title: game.title,
      cover: game.cover,
      releaseDate: game.releaseDate,
      platforms: game.platforms,
      genres: game.genres,
      rating: game.rating,
      summary: game.summary,
      developer: game.developer,
      publisher: game.publisher,
      tags: game.tags || [],
      igdbId: game.igdbId,
      playStatus: "not_started",
      personalRating: 0,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="h-12 bg-black flex items-center border-b border-gray-800 px-4">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to library
        </button>
        <h1 className="text-xl font-semibold mx-auto">Add New Game</h1>
        <div className="w-[72px]"></div> {/* Spacer to center title */}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto w-full">
        <div className="mb-8 w-full max-w-lg mx-auto">
          <h2 className="text-lg font-medium mb-4">Search for a game to add to your library</h2>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by game title..."
          />
        </div>

        {search && (
          <div className="space-y-2 max-w-lg mx-auto">
            {isSearching ? (
              <div className="p-4 bg-gray-800 rounded-md flex justify-center">
                <p className="text-gray-400">Searching IGDB...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <p className="text-sm text-gray-400 mb-2">Select a game to add:</p>
                {searchResults.map((game: any) => (
                  <div
                    key={game.igdbId}
                    className="p-3 bg-gray-800/60 hover:bg-gray-800 rounded-md cursor-pointer transition-colors flex items-center gap-4"
                    onClick={() => selectGame(game)}
                  >
                    {game.cover ? (
                      <img
                        src={game.cover}
                        alt={game.title}
                        className="w-12 h-16 object-cover rounded-sm"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-gray-700 rounded-sm flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Cover</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{game.title}</h3>
                      <div className="flex gap-4 text-sm text-gray-400">
                        {game.releaseDate && <span>{game.releaseDate.split('-')[0]}</span>}
                        {game.platforms && game.platforms.length > 0 && (
                          <span className="truncate max-w-[200px]">{game.platforms.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-4 bg-gray-800 rounded-md flex justify-center">
                <p className="text-gray-400">No games found. Try another search term.</p>
              </div>
            )}
          </div>
        )}
        
        {mutation.isPending && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <p className="text-white">Adding game to your library...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}