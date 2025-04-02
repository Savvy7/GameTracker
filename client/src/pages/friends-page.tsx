import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  UserPlus, 
  Users, 
  User as UserIcon, 
  Clock, 
  Check, 
  X,
  Search,
  UserX,
  ExternalLink
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Friend types
interface Friend {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

interface FriendRequest {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface PendingRequests {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

// Function to get avatar fallback text
const getAvatarFallback = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export default function FriendsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get friends list
  const { data: friends = [], isLoading: isLoadingFriends } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/friends");
      if (!res.ok) {
        throw new Error("Failed to fetch friends");
      }
      return res.json();
    },
  });
  
  // Get pending friend requests
  const { data: pendingRequests = { incoming: [], outgoing: [] }, isLoading: isLoadingRequests } = useQuery<PendingRequests>({
    queryKey: ["/api/friends/pending"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/friends/pending");
      if (!res.ok) {
        throw new Error("Failed to fetch friend requests");
      }
      return res.json();
    },
  });
  
  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest("POST", "/api/friends", { friendId });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send friend request");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your request has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest("PATCH", `/api/friends/${friendId}/accept`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to accept friend request");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: "You are now friends with this user",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept request",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest("PATCH", `/api/friends/${friendId}/reject`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to reject friend request");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: "The friend request has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject request",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Cancel friend request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest("DELETE", `/api/friends/${friendId}/cancel`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to cancel friend request");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request cancelled",
        description: "Your friend request has been cancelled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel request",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest("DELETE", `/api/friends/${friendId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to remove friend");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend removed",
        description: "The user has been removed from your friends list",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove friend",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please log in to manage your friends.</p>
      </div>
    );
  }
  
  // Search user function - for now just shows a placeholder since we don't have a full user search in the API yet
  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 3) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 3 characters",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Search functionality",
      description: "User search will be implemented in a future update",
    });
  };
  
  // Function to view a friend's game library
  const viewFriendLibrary = (friendId: number) => {
    navigate(`/friends/${friendId}/games`);
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>
      </div>
      
      <Tabs defaultValue="all">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="all" className="relative">
              <Users className="mr-2 h-4 w-4" />
              All Friends
              <Badge className="ml-2 h-5 bg-blue-600">{friends.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              <Clock className="mr-2 h-4 w-4" />
              Pending
              {(pendingRequests.incoming.length + pendingRequests.outgoing.length > 0) && (
                <Badge className="ml-2 h-5 bg-red-600">
                  {pendingRequests.incoming.length + pendingRequests.outgoing.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="add">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Friend
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="mt-6">
          <TabsContent value="all">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Your Friends</CardTitle>
                <CardDescription>
                  View and manage your friends list
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingFriends ? (
                  <div className="flex justify-center py-8">
                    <p>Loading friends...</p>
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No friends yet</h3>
                    <p className="text-gray-400 mt-2">
                      Add some friends to see their profiles and game libraries
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {friends.map((friend) => (
                      <Card key={friend.id} className="bg-gray-700 border-gray-600">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={friend.avatarUrl || undefined} />
                              <AvatarFallback>
                                {getAvatarFallback(friend.displayName || friend.username)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-medium">
                                {friend.displayName || friend.username}
                              </h3>
                              <p className="text-sm text-gray-400">@{friend.username}</p>
                              {friend.bio && (
                                <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                                  {friend.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewFriendLibrary(friend.id)}
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Library
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            onClick={() => removeFriendMutation.mutate(friend.id)}
                          >
                            <UserX className="mr-2 h-3 w-3" />
                            Remove
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
                <CardDescription>
                  Manage incoming and outgoing friend requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="flex justify-center py-4">
                    <p>Loading requests...</p>
                  </div>
                ) : pendingRequests.incoming.length === 0 && pendingRequests.outgoing.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No pending requests</h3>
                    <p className="text-gray-400 mt-2">
                      You don't have any pending friend requests
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {pendingRequests.incoming.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Incoming Requests</h3>
                        <div className="space-y-4">
                          {pendingRequests.incoming.map((request) => (
                            <div 
                              key={request.id} 
                              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={request.avatarUrl || undefined} />
                                  <AvatarFallback>
                                    {getAvatarFallback(request.displayName || request.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {request.displayName || request.username}
                                  </p>
                                  <p className="text-sm text-gray-400">@{request.username}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => acceptRequestMutation.mutate(request.id)}
                                  disabled={acceptRequestMutation.isPending}
                                >
                                  <Check className="mr-1 h-4 w-4" />
                                  Accept
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => rejectRequestMutation.mutate(request.id)}
                                  disabled={rejectRequestMutation.isPending}
                                >
                                  <X className="mr-1 h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {pendingRequests.outgoing.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Outgoing Requests</h3>
                        <div className="space-y-4">
                          {pendingRequests.outgoing.map((request) => (
                            <div 
                              key={request.id} 
                              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={request.avatarUrl || undefined} />
                                  <AvatarFallback>
                                    {getAvatarFallback(request.displayName || request.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {request.displayName || request.username}
                                  </p>
                                  <p className="text-sm text-gray-400">@{request.username}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelRequestMutation.mutate(request.id)}
                                disabled={cancelRequestMutation.isPending}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Cancel
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Add Friend</CardTitle>
                <CardDescription>
                  Find and add new friends to your network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserSearch} className="mb-8">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by username..."
                        className="pl-9 bg-gray-700 border-gray-600"
                      />
                    </div>
                    <Button type="submit">Search</Button>
                  </div>
                </form>
                
                <Separator className="my-6" />
                
                <div className="text-center py-8">
                  <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">Find Friends</h3>
                  <p className="text-gray-400 mt-2 max-w-md mx-auto">
                    Search for friends by username to add them to your network. 
                    You'll be able to see their game libraries and activity.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}