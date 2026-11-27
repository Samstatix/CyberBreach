"use client";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth/AuthProvider";
import App from "../app/App";

/**
 * Mountable CyberBreach feature module.
 * Standalone Vite uses basename="/"; the CollabCircle Next.js catch-all
 * route mounts the same module with basename="/cybersecurity".
 */
export function CyberBreachModule({basename="/cybersecurity"}:{basename?:string}){
 return <div className="cyberbreach-root">
  <AuthProvider><BrowserRouter basename={basename}><App/></BrowserRouter></AuthProvider>
 </div>;
}
