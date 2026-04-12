import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminArea from "./pages/AdminArea.tsx";
import { CartProvider } from "./contexts/CartContext.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { WishlistProvider } from "./contexts/WishlistContext.tsx";
import { CartDrawer } from "./components/CartDrawer.tsx";


// Route-level code splitting
const About = lazy(() => import("./pages/About.tsx"));
const Accessories = lazy(() => import("./pages/Accessories.tsx"));
const Collection = lazy(() => import("./pages/Collection.tsx"));
const Favorites = lazy(() => import("./pages/Favorites.tsx"));
const ProductDetails = lazy(() => import("./pages/ProductDetails.tsx"));
const Checkout = lazy(() => import("./pages/Checkout.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Success = lazy(() => import("./pages/Success.tsx"));
const Failure = lazy(() => import("./pages/Failure.tsx"));
const Pending = lazy(() => import("./pages/Pending.tsx"));
const Orders = lazy(() => import("./pages/Orders.tsx"));

// Minimal page loader
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-y border-foreground rounded-full animate-spin" />
  </div>
);

// Global QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CartDrawer />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/sobre" element={<About />} />
                  <Route path="/acessorios" element={<Accessories />} />
                  <Route path="/colecao" element={<Collection />} />
                  <Route path="/favoritos" element={<Favorites />} />
                  <Route path="/produto/:id" element={<ProductDetails />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/perfil" element={<Profile />} />
                  <Route path="/success" element={<Success />} />
                  <Route path="/failure" element={<Failure />} />
                  <Route path="/pending" element={<Pending />} />
                  <Route path="/pedidos" element={<Orders />} />
                  <Route path="/admin" element={<AdminArea />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
