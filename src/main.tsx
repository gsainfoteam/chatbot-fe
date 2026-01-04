import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Admin from "./Admin.tsx";

const root = createRoot(document.getElementById("root")!);

// URL 경로에 따라 다른 컴포넌트 렌더링
if (window.location.pathname === "/dashboard") {
  root.render(
    <StrictMode>
      <Admin />
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
