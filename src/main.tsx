import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register push notification service worker
if ("serviceWorker" in navigator) {
  const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const isPreview = window.location.hostname.includes("id-preview--") || window.location.hostname.includes("lovableproject.com");
  if (!isInIframe && !isPreview) {
    navigator.serviceWorker.register("/sw-push.js").catch(err => console.log("SW registration failed:", err));
  }
}
