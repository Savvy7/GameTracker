import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { ensureAuthenticated } from "./auth";
import { User } from "@shared/schema";

export function setupFriendshipRoutes(app: Express): void {
  // Get all friends
  app.get("/api/friends", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get all accepted friendships
      const friendships = await storage.getFriendships(userId);
      
      // Map friendships to friend user data
      const friendIds = friendships.map(friendship => 
        friendship.userId === userId ? friendship.friendId : friendship.userId
      );
      
      // Get user data for each friend
      const friends = await Promise.all(
        friendIds.map(async (friendId) => {
          const friend = await storage.getUser(friendId);
          if (!friend) return null;
          
          // Return only public user data
          return {
            id: friend.id,
            username: friend.username,
            displayName: friend.displayName,
            avatarUrl: friend.avatarUrl,
            bio: friend.bio,
            createdAt: friend.createdAt,
          };
        })
      );
      
      // Filter out any null values from deleted users
      res.json(friends.filter(Boolean));
    } catch (error: any) {
      console.error("Error getting friends:", error);
      res.status(500).json({ message: error.message || "Failed to get friends" });
    }
  });
  
  // Get pending friend requests
  app.get("/api/friends/pending", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get all pending friendships
      const pendingFriendships = await storage.getPendingFriendships(userId);
      
      // Separate incoming and outgoing requests
      const incomingRequests = [];
      const outgoingRequests = [];
      
      for (const friendship of pendingFriendships) {
        // Incoming request: other user initiated, current user is friendId
        if (friendship.userId !== userId && friendship.status === "pending") {
          const sender = await storage.getUser(friendship.userId);
          if (sender) {
            incomingRequests.push({
              id: sender.id,
              username: sender.username,
              displayName: sender.displayName,
              avatarUrl: sender.avatarUrl,
              createdAt: sender.createdAt,
            });
          }
        }
        
        // Outgoing request: current user initiated, other user is friendId
        if (friendship.userId === userId && friendship.status === "pending") {
          const recipient = await storage.getUser(friendship.friendId);
          if (recipient) {
            outgoingRequests.push({
              id: recipient.id,
              username: recipient.username,
              displayName: recipient.displayName,
              avatarUrl: recipient.avatarUrl,
              createdAt: recipient.createdAt,
            });
          }
        }
      }
      
      res.json({
        incoming: incomingRequests,
        outgoing: outgoingRequests,
      });
    } catch (error: any) {
      console.error("Error getting pending friend requests:", error);
      res.status(500).json({ message: error.message || "Failed to get friend requests" });
    }
  });
  
  // Send friend request
  app.post("/api/friends", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { friendId } = req.body;
      
      // Make sure friendId is a number
      const friendIdNum = parseInt(friendId, 10);
      if (isNaN(friendIdNum)) {
        return res.status(400).json({ message: "Invalid friend ID" });
      }
      
      // Cannot add self as friend
      if (friendIdNum === userId) {
        return res.status(400).json({ message: "Cannot add yourself as a friend" });
      }
      
      // Check if friend exists
      const friend = await storage.getUser(friendIdNum);
      if (!friend) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if friendship already exists
      const existingFriendships = await storage.getFriendships(userId);
      const existingFriendship = existingFriendships.find(fs => 
        (fs.userId === userId && fs.friendId === friendIdNum) || 
        (fs.userId === friendIdNum && fs.friendId === userId)
      );
      
      if (existingFriendship) {
        return res.status(400).json({ message: "Friendship already exists" });
      }
      
      // Check for pending requests
      const pendingFriendships = await storage.getPendingFriendships(userId);
      const pendingRequest = pendingFriendships.find(fs =>
        (fs.userId === userId && fs.friendId === friendIdNum) ||
        (fs.userId === friendIdNum && fs.friendId === userId)
      );
      
      if (pendingRequest) {
        // If other user already sent a request, auto-accept it
        if (pendingRequest.userId === friendIdNum) {
          const updatedFriendship = await storage.updateFriendship(
            pendingRequest.userId,
            pendingRequest.friendId,
            "accepted"
          );
          
          return res.status(200).json({ 
            message: "Friend request accepted", 
            friendship: updatedFriendship 
          });
        }
        
        return res.status(400).json({ message: "Friend request already sent" });
      }
      
      // Create new friendship
      const friendship = await storage.createFriendship({
        userId,
        friendId: friendIdNum,
        status: "pending",
      });
      
      res.status(201).json({ message: "Friend request sent", friendship });
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: error.message || "Failed to send friend request" });
    }
  });
  
  // Accept friend request
  app.patch("/api/friends/:friendId/accept", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const friendId = parseInt(req.params.friendId, 10);
      
      if (isNaN(friendId)) {
        return res.status(400).json({ message: "Invalid friend ID" });
      }
      
      // Find the pending request (where the friend is the sender)
      const pendingFriendships = await storage.getPendingFriendships(userId);
      const pendingRequest = pendingFriendships.find(fs =>
        fs.userId === friendId && fs.friendId === userId && fs.status === "pending"
      );
      
      if (!pendingRequest) {
        return res.status(404).json({ message: "Friend request not found" });
      }
      
      // Update friendship status to accepted
      const updatedFriendship = await storage.updateFriendship(
        friendId,
        userId,
        "accepted"
      );
      
      if (!updatedFriendship) {
        return res.status(404).json({ message: "Friendship not found" });
      }
      
      res.json({ message: "Friend request accepted", friendship: updatedFriendship });
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: error.message || "Failed to accept friend request" });
    }
  });
  
  // Reject friend request
  app.patch("/api/friends/:friendId/reject", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const friendId = parseInt(req.params.friendId, 10);
      
      if (isNaN(friendId)) {
        return res.status(400).json({ message: "Invalid friend ID" });
      }
      
      // Find the pending request (where the friend is the sender)
      const pendingFriendships = await storage.getPendingFriendships(userId);
      const pendingRequest = pendingFriendships.find(fs =>
        fs.userId === friendId && fs.friendId === userId && fs.status === "pending"
      );
      
      if (!pendingRequest) {
        return res.status(404).json({ message: "Friend request not found" });
      }
      
      // Update friendship status to rejected
      const updatedFriendship = await storage.updateFriendship(
        friendId,
        userId,
        "rejected"
      );
      
      if (!updatedFriendship) {
        return res.status(404).json({ message: "Friendship not found" });
      }
      
      res.json({ message: "Friend request rejected", friendship: updatedFriendship });
    } catch (error: any) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({ message: error.message || "Failed to reject friend request" });
    }
  });
  
  // Cancel friend request
  app.delete("/api/friends/:friendId/cancel", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const friendId = parseInt(req.params.friendId, 10);
      
      if (isNaN(friendId)) {
        return res.status(400).json({ message: "Invalid friend ID" });
      }
      
      // Find and delete the pending request that the user sent
      const result = await storage.deleteFriendship(userId, friendId);
      
      if (!result) {
        return res.status(404).json({ message: "Friend request not found" });
      }
      
      res.json({ message: "Friend request cancelled" });
    } catch (error: any) {
      console.error("Error cancelling friend request:", error);
      res.status(500).json({ message: error.message || "Failed to cancel friend request" });
    }
  });
  
  // Remove friend
  app.delete("/api/friends/:friendId", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const friendId = parseInt(req.params.friendId, 10);
      
      if (isNaN(friendId)) {
        return res.status(400).json({ message: "Invalid friend ID" });
      }
      
      // Get all friendships to find the one to delete
      const friendships = await storage.getFriendships(userId);
      const friendship = friendships.find(fs =>
        (fs.userId === userId && fs.friendId === friendId) ||
        (fs.userId === friendId && fs.friendId === userId)
      );
      
      if (!friendship) {
        return res.status(404).json({ message: "Friendship not found" });
      }
      
      // Delete the friendship
      let result;
      if (friendship.userId === userId) {
        result = await storage.deleteFriendship(userId, friendId);
      } else {
        result = await storage.deleteFriendship(friendId, userId);
      }
      
      if (!result) {
        return res.status(404).json({ message: "Failed to remove friend" });
      }
      
      res.json({ message: "Friend removed successfully" });
    } catch (error: any) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: error.message || "Failed to remove friend" });
    }
  });
  
  // Search users
  app.get("/api/users/search", ensureAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 3) {
        return res.status(400).json({ message: "Search query must be at least 3 characters" });
      }
      
      // Get all users (not efficient for a real app, but works for demo)
      const allUsers = await storage.getAllUsers();
      
      // Filter users by username or display name containing the query
      const matchingUsers = allUsers.filter((user: User) => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        (user.displayName && user.displayName.toLowerCase().includes(query.toLowerCase()))
      );
      
      // Return public user data only
      const publicUsers = matchingUsers.map((user: User) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      }));
      
      res.json(publicUsers);
    } catch (error: any) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: error.message || "Failed to search users" });
    }
  });
  
  // Get friend's game library
  app.get("/api/friends/:friendId/games", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const friendId = parseInt(req.params.friendId, 10);
      
      if (isNaN(friendId)) {
        return res.status(400).json({ message: "Invalid friend ID" });
      }
      
      // Check if the users are friends
      const friendships = await storage.getFriendships(userId);
      const areFriends = friendships.some(fs =>
        (fs.userId === userId && fs.friendId === friendId) ||
        (fs.userId === friendId && fs.friendId === userId)
      );
      
      if (!areFriends) {
        return res.status(403).json({ message: "You must be friends to view their game library" });
      }
      
      // Get the friend's games
      const games = await storage.getGames(friendId);
      
      res.json(games);
    } catch (error: any) {
      console.error("Error getting friend's games:", error);
      res.status(500).json({ message: error.message || "Failed to get friend's game library" });
    }
  });
}