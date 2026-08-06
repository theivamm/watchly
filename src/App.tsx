import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/app/auth-context";
import AppShell from "@/components/layout/AppShell";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ConfirmEmailPage from "@/pages/ConfirmEmailPage";
import RecoverPasswordPage from "@/pages/RecoverPasswordPage";
import UpdatePasswordPage from "@/pages/UpdatePasswordPage";
import OnboardingPage from "@/pages/OnboardingPage";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import LibraryPage from "@/pages/LibraryPage";
import ListsPage from "@/pages/ListsPage";
import ListDetailPage from "@/pages/ListDetailPage";
import PublicProfilePage from "@/pages/PublicProfilePage";
import PublicDNAPage from "@/pages/PublicDNAPage";
import DNAPage from "@/pages/DNAPage";
import ProfileSettingsPage from "@/pages/ProfileSettingsPage";
import AccountSettingsPage from "@/pages/AccountSettingsPage";
import RoadmapPage from "@/pages/RoadmapPage";
import NotFoundPage from "@/pages/NotFoundPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}

function LegacyProfileRedirect() {
  const { username } = useParams();
  return <Navigate to={`/perfil/${username}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/roadmap" element={<RoadmapPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/registro" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/confirmar-email" element={<ConfirmEmailPage />} />
      <Route path="/recuperar-password" element={<RecoverPasswordPage />} />
      <Route path="/actualizar-password" element={<UpdatePasswordPage />} />

      {/* Public profiles */}
      <Route path="/perfil/:username" element={<PublicProfilePage />} />
      <Route path="/perfil/:username/adn" element={<PublicDNAPage />} />
      <Route path="/@:username" element={<LegacyProfileRedirect />} />

      {/* Private with AppShell */}
      <Route element={<PrivateRoute><AppShell /></PrivateRoute>}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/adn" element={<DNAPage />} />
        <Route path="/buscar" element={<SearchPage />} />
        <Route path="/biblioteca" element={<LibraryPage />} />
        <Route path="/listas" element={<ListsPage />} />
        <Route path="/listas/:id" element={<ListDetailPage />} />
        <Route path="/configuracion/perfil" element={<ProfileSettingsPage />} />
        <Route path="/configuracion/cuenta" element={<AccountSettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
