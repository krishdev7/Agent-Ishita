import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserConfigProvider } from "@/contexts/UserConfigContext";
import { MemoryProvider } from "@/contexts/MemoryContext";
import { ChatInterface } from "@/components/chat/ChatInterface";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={ChatInterface} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserConfigProvider>
        <MemoryProvider>
          <QueryClientProvider client={queryClient}>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </QueryClientProvider>
        </MemoryProvider>
      </UserConfigProvider>
    </ThemeProvider>
  );
}

export default App;
