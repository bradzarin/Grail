import { mountShell } from "../shell.js";
import { icon } from "../icons.js";

mountShell("alerts");
document.getElementById("stub-icon").innerHTML = icon("alerts", 40);
