import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "bootstrap/dist/css/bootstrap.css";
import "./index.css";
import { AuthProvider } from "../contexts/AuthProvider.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);