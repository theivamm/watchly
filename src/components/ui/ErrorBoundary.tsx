import { Component, type ReactNode } from "react";
import { logError } from "@/lib/telemetry";

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    logError("react", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-white">
        <div className="max-w-md">
          <h1 className="font-cinema text-5xl">Algo salió mal</h1>
          <p className="text-white/70 mt-4">Tuvimos un error inesperado. Ya quedó registrado para que lo revisemos.</p>
          <button type="button" onClick={() => location.reload()}
            className="mt-8 h-12 px-8 rounded-full bg-white text-[#111] text-sm font-extrabold hover:scale-[1.03] transition-transform">
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
