import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
      igdbId: game.igdbId,
    });
    setSearch("");
  };

  return (
    <div className="container px-8 py-8 mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Add New Game</h1>

      <div className="mb-8">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search for a game..."
        />

        {search && (
          <div className="mt-4 space-y-4">
            {isSearching ? (
              <p className="text-muted-foreground">Searching...</p>
            ) : searchResults.length > 0 ? (
              searchResults.map((game: any) => (
                <Card
                  key={game.igdbId}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => selectGame(game)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    {game.cover ? (
                      <img
                        src={game.cover}
                        alt={game.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-muted rounded flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">No Cover</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{game.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {game.releaseDate}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground">No games found</p>
            )}
          </div>
        )}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Game"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}