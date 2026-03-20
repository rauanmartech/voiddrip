import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminArea from "./pages/AdminArea.tsx";

// Route-level code splitting — these bundles only load when the user navigates there
const About = lazy(() => import("./pages/About.tsx"));
const Accessories = lazy(() => import("./pages/Accessories.tsx"));
const Collection = lazy(() => import("./pages/Collection.tsx"));

// Minimal page loader shown during lazy chunk fetch
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-y border-foreground rounded-full animate-spin" />
  </div>
);

// Global QueryClient with sensible caching defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 min — data is fresh, no background refetch
      gcTime: 1000 * 60 * 30,     // 30 min — keep in memory after unmount
      retry: 2,                    // 2 retries on network error
      refetchOnWindowFocus: false, // Don't spam API on tab switch
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/acessorios" element={<Accessories />} />
            <Route path="/colecao" element={<Collection />} />
            <Route path="/admin" element={<AdminArea />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
