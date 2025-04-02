import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/sidebar";
import { Filters } from "@/components/filters";
import { Header } from "@/components/header";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import Home from "@/pages/home";
import AddGame from "@/pages/add-game";
import GameDetails from "@/pages/game-details";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import FriendsPage from "@/pages/friends-page";

function Router() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Check if current page is a fullscreen page
  const isFullScreenPage = ["/add", "/auth"].includes(location);
  
  // Render fullscreen pages without layout
  if (isFullScreenPage) {
    return (
      <Switch>
        <Route path="/add" component={AddGame} />
        <Route path="/auth" component={AuthPage} />
      </Switch>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-black">
      <Header 
        search={search}
        onSearchChange={setSearch}
        filterActive={filtersVisible}
        toggleFilters={() => setFiltersVisible(!filtersVisible)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - fixed width */}
        <Sidebar className="w-56 flex-shrink-0" />
        
        {/* Main content - flexible width */}
        <main className="flex-1 overflow-y-auto bg-gray-900">
          <Switch>
            {/* Public routes */}
            <Route path="/" component={() => <Home search={search} />} />
            <Route path="/games/:id" component={GameDetails} />
            
            {/* Protected routes */}
            <ProtectedRoute path="/profile" component={ProfilePage} />
            <ProtectedRoute path="/friends" component={FriendsPage} />
            
            {/* Game library filter routes */}
            <ProtectedRoute path="/recent" component={() => <Home search={search} />} />
            <ProtectedRoute path="/installed" component={() => <Home search={search} />} />
            <ProtectedRoute path="/active" component={() => <Home search={search} />} />
            <ProtectedRoute path="/favorites" component={() => <Home search={search} />} />
            <ProtectedRoute path="/completed" component={() => <Home search={search} />} />
            <ProtectedRoute path="/abandoned" component={() => <Home search={search} />} />
            <ProtectedRoute path="/stats" component={() => <Home search={search} />} />
            
            {/* Friends library route */}
            <ProtectedRoute path="/friends/:friendId/games" component={() => <Home search={search} />} />
            
            <Route component={NotFound} />
          </Switch>
        </main>
        
        {/* Filters sidebar - conditionally rendered */}
        {filtersVisible && (
          <Filters 
            className="w-72 flex-shrink-0"
            onApplyFilters={(filters) => {
              console.log("Filters applied:", filters);
              // TODO: Apply filters to the games list
            }}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;