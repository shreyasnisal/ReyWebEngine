import { g_app } from "../../Sandbox/Framework/GameCommon.js";

export default function Main()
{
    g_app.RunFrame();
}

g_app.Startup();
requestAnimationFrame(Main);
g_app.Shutdown();
