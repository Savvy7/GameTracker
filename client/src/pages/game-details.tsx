import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, ArrowLeft, Star, HardDrive, Clock, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    },
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-64 w-64 bg-gray-800 rounded" />
          <div className="h-4 bg-gray-800 rounded w-48 mt-4" />
          <div className="h-4 bg-gray-800 rounded w-32 mt-2" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-8">
        <div className="mb-4">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to library
          </button>
        </div>
        <h1 className="text-2xl font-bold">Game not found</h1>
      </div>
    );
  }

  const handlePlayStatusChange = (value: string) => {
    updateMutation.mutate({
      id,
      data: { playStatus: value }
    });
  };

  const handleRatingChange = (value: string) => {
    updateMutation.mutate({
      id,
      data: { personalRating: parseInt(value) }
    });
  };

  return (
    <div className="h-full">
      <div className="flex flex-col h-full">
        {/* Back button and actions */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to library
          </button>
          
          <div className="flex gap-2">
            <button 
              className="px-3 py-1.5 text-sm bg-transparent hover:bg-gray-800 rounded flex items-center"
              onClick={() => navigate(`/games/${id}/edit`)}
            >
              <Edit2 className="h-4 w-4 mr-1.5" />
              Edit
            </button>
            
            <button 
              className="px-3 py-1.5 text-sm bg-red-900/50 hover:bg-red-900 rounded flex items-center"
              onClick={() => deleteMutation.mutate(id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
        
        {/* Game details */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex mb-6">
              <div className="w-48 flex-shrink-0">
                {game.cover ? (
                  <img
                    src={game.cover}
                    alt={game.title}
                    className="w-full rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">No Cover</span>
                  </div>
                )}
                
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Play Status</p>
                    <Select
                      value={game.playStatus || "not_started"}
                      onValueChange={handlePlayStatusChange}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="abandoned">Abandoned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Personal Rating</p>
                    <Select
                      value={game.personalRating?.toString() || ""}
                      onValueChange={handleRatingChange}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue placeholder="Not Rated" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        {[...Array(11)].map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i === 0 ? "Not Rated" : `${i}/10`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="ml-6 flex-1">
                <h1 className="text-2xl font-bold mb-4">{game.title}</h1>
                
                <Tabs defaultValue="details">
                  <TabsList className="bg-gray-800">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details">
                    <div className="pt-4 space-y-4">
                      {game.developer && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Developer</p>
                          <p>{game.developer}</p>
                        </div>
                      )}
                      
                      {game.publisher && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Publisher</p>
                          <p>{game.publisher}</p>
                        </div>
                      )}
                      
                      {game.releaseDate && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Release Date</p>
                          <p>{game.releaseDate}</p>
                        </div>
                      )}
                      
                      {game.platforms && game.platforms.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Platforms</p>
                          <div className="flex flex-wrap gap-2">
                            {game.platforms.map((platform) => (
                              <Badge key={platform} variant="outline" className="bg-gray-800 text-white border-gray-700">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {game.genres && game.genres.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Genres</p>
                          <div className="flex flex-wrap gap-2">
                            {game.genres.map((genre) => (
                              <Badge key={genre} variant="outline" className="bg-gray-800 text-white border-gray-700">
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {game.tags && game.tags.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {game.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="bg-gray-800 text-white border-gray-700">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-8">
                        <div className="flex items-center">
                          <HardDrive className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">{game.installSize || 'Unknown'} size</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">{game.timeToComplete || 'Unknown'} to beat</span>
                        </div>
                      </div>
                      
                      {game.summary && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Summary</p>
                          <p className="text-sm">{game.summary}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="notes">
                    <div className="pt-4">
                      <p className="text-sm text-gray-400 mb-2">Your Review</p>
                      <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Write your review or notes here..."
                        className="w-full min-h-[200px] p-4 rounded bg-gray-800 border border-gray-700 text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}