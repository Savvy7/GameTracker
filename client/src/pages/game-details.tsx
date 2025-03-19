import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getGame, deleteGame, updateGame } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useDebounce } from "@/hooks/use-debounce";

export default function GameDetails() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const id = parseInt(window.location.pathname.split("/games/")[1]);
  const [review, setReview] = useState("");
  const debouncedReview = useDebounce(review, 500);

  const { data: game, isLoading } = useQuery({
    queryKey: [`/api/games/${id}`],
    queryFn: () => getGame(id),
  });

  useEffect(() => {
    if (game?.review) {
      setReview(game.review);
    }
  }, [game?.review]);

  useEffect(() => {
    if (debouncedReview !== game?.review) {
      updateMutation.mutate({
        id,
        data: { review: debouncedReview },
      });
    }
  }, [debouncedReview]);

  const deleteMutation = useMutation({
    mutationFn: deleteGame,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Game deleted from your collection",
      });
      navigate("/");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateGame(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${id}`] });
      toast({
        title: "Success",
        description: "Game updated successfully",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container px-8 py-8 mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4" />
          <div className="h-64 bg-muted rounded mb-4" />
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container px-8 py-8 mx-auto">
        <h1 className="text-2xl font-bold mb-4">Game not found</h1>
        <Button onClick={() => navigate("/")}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container px-8 py-8 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{game.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/games/${id}/edit`)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate(id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          {game.cover ? (
            <img
              src={game.cover}
              alt={game.title}
              className="w-full rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">No Cover</span>
            </div>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Game Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Play Status</p>
                <Select
                  value={game.playStatus}
                  onValueChange={(value) =>
                    updateMutation.mutate({
                      id,
                      data: { playStatus: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Personal Rating
                </p>
                <Select
                  value={game.personalRating?.toString() || ""}
                  onValueChange={(value) =>
                    updateMutation.mutate({
                      id,
                      data: { personalRating: parseInt(value) },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        <span className="text-muted-foreground">Not Rated</span>
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(11)].map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i}/10
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {game.releaseDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Release Date</p>
                  <p>{game.releaseDate}</p>
                </div>
              )}

              {game.platforms && game.platforms.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {game.platforms.map((platform) => (
                      <Badge key={platform} variant="secondary">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {game.genres && game.genres.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {game.genres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {game.summary && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Summary</p>
                  <p className="text-pretty">{game.summary}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Review</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write your review here..."
                className="w-full min-h-[200px] p-4 rounded-md border bg-background resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}