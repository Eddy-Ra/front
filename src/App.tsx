import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ConfirmRegistration from "./pages/ConfirmRegistration";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import MailsAEnvoyer from "./pages/MailsAEnvoyer";
import EnvoiMasse from "./pages/EnvoiMasse";
import MailsReponses from "./pages/MailsReponses";
import MailsRelance from "./pages/MailsRelance";
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/confirm-registration" element={<ConfirmRegistration />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/mails-a-envoyer" element={<MailsAEnvoyer />} />
            <Route path="/envoi-masse" element={<EnvoiMasse />} />
            <Route path="/mails-reponses" element={<MailsReponses />} />
            <Route path="/mails-relance" element={<MailsRelance />} />
            <Route path="/parametres" element={<Parametres />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
