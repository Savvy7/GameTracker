import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/sidebar";
import { Filters } from "@/components/filters";
import { Header } from "@/components/header";
import Home from "@/pages/home";
import AddGame from "@/pages/add-game";
import GameDetails from "@/pages/game-details";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Check if current page is add-game form or not
  const isAddGamePage = location === "/add";
  
  // Only show the layout on main pages, not on form pages
  if (isAddGamePage) {
    return (
      <Switch>
        <Route path="/add" component={AddGame} />
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
            <Route path="/" component={() => <Home search={search} />} />
            <Route path="/games/:id" component={GameDetails} />
            <Route component={NotFound} />
          </Switch>
        </main>
        
        {/* Filters sidebar - conditionally rendered */}
        {filtersVisible && (
          <Filters className="w-72 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;