import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SolarProvider } from "@/context/SolarContext";
import { Navbar } from "@/components/Navbar";
import Dashboard from "./pages/Dashboard";
import DataIngestion from "./pages/DataIngestion";
import Analysis from "./pages/Analysis";
import History from "./pages/History";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SolarProvider>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-[1600px] p-4 lg:p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/ingestion" element={<DataIngestion />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SolarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
