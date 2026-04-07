import React, { Component, ErrorInfo, ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class StorefrontErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Storefront Crash Caught:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen pt-32 pb-24 flex items-center justify-center bg-background px-4">
          <div className="max-w-xl w-full glass-strong rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/10 blur-[100px] pointer-events-none" />
            
            <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-8 border border-destructive/20 shadow-inner">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            
            <h1 className="font-heading text-3xl font-black mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-8">
              We encountered an unexpected error while rendering this page. Our team has been notified.
            </p>
            
            <div className="glass p-4 rounded-xl text-left bg-black/5 dark:bg-black/40 border border-border/50 mb-10 overflow-auto max-h-32 shadow-inner">
              <p className="font-mono text-xs text-destructive/80 font-medium">
                {this.state.error?.message || "Unknown rendering error."}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => window.location.reload()} className="h-12 px-8 rounded-xl font-bold gap-2">
                <RefreshCw className="w-4 h-4" /> Try Again
              </Button>
              <Button asChild variant="outline" className="h-12 px-8 rounded-xl font-bold gap-2">
                <Link to="/"><Home className="w-4 h-4" /> Back to Home</Link>
              </Button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
