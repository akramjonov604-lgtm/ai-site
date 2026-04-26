import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme";
import { ThreeBackground } from "@/components/ThreeBackground";
import { Navbar } from "@/components/Navbar";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Chat from "@/pages/chat";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import CLUI from "@/pages/clui";
import Help from "@/pages/help";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const APP_ROUTES = new Set([
  "/chat",
  "/settings",
  "/notifications",
  "/clui",
  "/help",
  "/admin",
]);

function AppShell() {
  const [location] = useLocation();
  // Don't show the marketing 3D background / navbar on app pages —
  // they need a clean, focused UI.
  const isChromeRoute = !APP_ROUTES.has(location);

  return (
    <>
      {isChromeRoute && <ThreeBackground />}
      {isChromeRoute && <Navbar />}
      <main className="relative min-h-screen">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/chat" component={Chat} />
          <Route path="/settings" component={Settings} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/clui" component={CLUI} />
          <Route path="/help" component={Help} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppShell />
          </WouterRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
