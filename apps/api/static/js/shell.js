import { Sidebar } from "./components/Sidebar.js";
import { TopBar } from "./components/TopBar.js";

export function mountShell(active) {
  document.getElementById("sidebar").appendChild(Sidebar(active));
  document.getElementById("topbar").appendChild(TopBar());
}
