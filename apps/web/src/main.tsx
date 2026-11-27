import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { CyberBreachModule } from "./integration/CyberBreachModule";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/academy.css";
import "./styles/labs.css";
import "./styles/auth.css";
import "./styles/platform.css";
import "./styles/progression.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
 <StrictMode><CyberBreachModule basename="/"/></StrictMode>
);
