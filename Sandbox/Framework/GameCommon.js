
import App from "../../Sandbox/Framework/App.js"

import Renderer, { RenderConfig } from "../../Engine/Renderer/Renderer.js"
import InputSystem, { InputSystemConfig } from "../../Engine/Input/InputSystem.js";

export const g_app = new App();

const renderConfig = new RenderConfig();
export const g_renderer = new Renderer(renderConfig);

const inputSystemConfig = new InputSystemConfig();
export const g_input = new InputSystem(inputSystemConfig);

export const SCREEN_SIZE_Y = 800.0;
