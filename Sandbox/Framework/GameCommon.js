
import App from "../../Sandbox/Framework/App.js"

import Vec2 from "../../Engine/Math/Vec2.js";
import Camera from "../../Engine/Renderer/Camera.js";
import Renderer, {g_viewportWidth, g_viewportHeight, g_aspect, RenderConfig} from "../../Engine/Renderer/Renderer.js"
import InputSystem, { InputSystemConfig } from "../../Engine/Input/InputSystem.js";
import DevConsole, { DevConsoleConfig } from "../../Engine/Core/DevConsole.js"
import { g_input, g_console } from "../../Engine/Core/EngineCommon.js";

export const g_app = new App();

export const SCREEN_SIZE_Y = 800.0;
