
import App from "../../Sandbox/Framework/App.js"

import Vec2 from "../../Engine/Math/Vec2.js";
import Camera from "../../Engine/Renderer/Camera.js";
import Renderer, {g_viewportWidth, g_viewportHeight, g_aspect, RenderConfig} from "../../Engine/Renderer/Renderer.js"
import InputSystem, { InputSystemConfig } from "../../Engine/Input/InputSystem.js";
import DevConsole, { DevConsoleConfig } from "../../Engine/Core/DevConsole.js"

export const g_app = new App();

const renderConfig = new RenderConfig();
export const g_renderer = new Renderer(renderConfig);

const inputSystemConfig = new InputSystemConfig();
export const g_input = new InputSystem(inputSystemConfig);

const devConsoleCamera = new Camera();
devConsoleCamera.SetOrthoView(Vec2.ZERO, new Vec2(g_aspect, 1.0));
const devConsoleConfig = new DevConsoleConfig(g_renderer, devConsoleCamera, "../../Sandbox/Data/Images/SquirrelFixedFont");
export const g_console = new DevConsole(devConsoleConfig);

export const SCREEN_SIZE_Y = 800.0;
