import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfileStore } from "@/hooks/useProfile";
import { BottomNav } from "@/components/BottomNav";
import { ScrollToTop } from "@/components/ScrollToTop";
import { DynamicPwaBranding } from "@/components/DynamicPwaBranding";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Profiles from "./pages/Profiles";
import Index from "./pages/Index";
import Generate from "./pages/Generate";
import Confirmation from "./pages/Confirmation";
import Exercises from "./pages/Exercises";
import Results from "./pages/Results";
import Credits from "./pages/Credits";
import Admin from "./pages/Admin";
import Install from "./pages/Install";
import SessionReview from "./pages/SessionReview";
import NotFound from "./pages/NotFound";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const profileId = useProfileStore((s) => s.activeProfileId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!profileId) return <Navigate to="/perfis" replace />;

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <DynamicPwaBranding />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/perfis" element={<Profiles />} />
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/gerar" element={<RequireAuth><Generate /></RequireAuth>} />
            <Route path="/confirmacao" element={<RequireAuth><Confirmation /></RequireAuth>} />
            <Route path="/exercicios" element={<RequireAuth><Exercises /></RequireAuth>} />
            <Route path="/resultado" element={<RequireAuth><Results /></RequireAuth>} />
            <Route path="/creditos" element={<Credits />} />
            <Route path="/instalar" element={<Install />} />
            <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
