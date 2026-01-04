import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Welcome } from "@/pages/Welcome";
import { SignUp } from "@/pages/SignUp";
import { Onboarding1 } from "@/pages/Onboarding1";
import { Onboarding2 } from "@/pages/Onboarding2";
import { Onboarding3 } from "@/pages/Onboarding3";
import { Onboarding4 } from "@/pages/Onboarding4";
import { Onboarding5 } from "@/pages/Onboarding5";
import { SafeToSpend } from "@/pages/SafeToSpend";
import { BudgetSetup } from "@/pages/BudgetSetup";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Welcome} />
      <Route path="/signup" component={SignUp} />
      <Route path="/onboarding1" component={Onboarding1} />
      <Route path="/onboarding2" component={Onboarding2} />
      <Route path="/onboarding3" component={Onboarding3} />
      <Route path="/onboarding4" component={Onboarding4} />
      <Route path="/onboarding5" component={Onboarding5} />
      <Route path="/safe-to-spend" component={SafeToSpend} />
      <Route path="/budget-setup" component={BudgetSetup} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
