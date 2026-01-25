import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";
import "@toast-ui/editor/dist/toastui-editor.css";
import "prismjs/themes/prism-tomorrow.css";
import "./styles/editor-dark.css"; // ✅ 추가

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
