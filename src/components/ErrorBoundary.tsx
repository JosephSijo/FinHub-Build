import { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex items-center justify-center p-6">
                    <Card className="max-w-md w-full p-8 bg-slate-900 border-white/10 text-center space-y-6 rounded-[32px]">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">System Glitch Detected</h2>
                            <p className="text-slate-500 font-bold text-sm">
                                The connection to this component was interrupted. This usually happens during background updates.
                            </p>
                        </div>
                        {this.state.error && (
                            <pre className="text-[10px] bg-black/40 p-3 rounded-xl text-rose-400/80 overflow-x-auto text-left font-mono">
                                {this.state.error.message}
                            </pre>
                        )}
                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-2xl gap-2 h-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Page
                        </Button>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
