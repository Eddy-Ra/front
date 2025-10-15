import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Ajoutez Navigate
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import MailsAEnvoyer from "./pages/MailsAEnvoyer";
import EnvoiMasse from "./pages/EnvoiMasse";
import MailsReponses from "./pages/MailsReponses";
import MailsRelance from "./pages/MailsRelance";
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";
import Register from './pages/Register';
import VerifyCode from './pages/VerifyCode';
import GoogleCallback from './pages/GoogleCallback';
import VerifyEmail from './pages/VerifyEmail';

const queryClient = new QueryClient();

// Composant pour protéger les routes privées
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/google-callback" element={<GoogleCallback />} />
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} /> {/* Corrigé */}
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> {/* Protégé */}
          <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
          <Route path="/mails-a-envoyer" element={<ProtectedRoute><MailsAEnvoyer /></ProtectedRoute>} />
          <Route path="/envoi-masse" element={<ProtectedRoute><EnvoiMasse /></ProtectedRoute>} />
          <Route path="/mails-reponses" element={<ProtectedRoute><MailsReponses /></ProtectedRoute>} />
          <Route path="/mails-relance" element={<ProtectedRoute><MailsRelance /></ProtectedRoute>} />
          <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} /> {/* Protégé */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;