"use strict";

import DevConsole, { DevConsoleConfig } from "/Engine/Core/DevConsole.js";
import EventSystem, { EventSystemConfig } from "/Engine/Core/EventSystem.js";
import ModelLoader, {ModelLoaderConfig} from "/Engine/Core/Models/ModelLoader.js";
import InputSystem, { InputSystemConfig } from "/Engine/Input/InputSystem.js";
import Vec2 from "/Engine/Math/Vec2.js";
import Camera from "/Engine/Renderer/Camera.js";
import Renderer, {g_aspect, RenderConfig} from "/Engine/Renderer/Renderer.js";
import WindowManager, { WindowManagerConfig } from "/Engine/Window/WindowManager.js";
import DebugRenderSystem, { DebugRenderConfig } from "/Engine/Renderer/DebugRenderSystem.js";


const eventSystemConfig = new EventSystemConfig();
export let g_eventSystem = new EventSystem(eventSystemConfig);

const windowManagerConfig = new WindowManagerConfig();
export const g_windowManager = new WindowManager(windowManagerConfig);

const renderConfig = new RenderConfig();
export const g_renderer = new Renderer(renderConfig);

const debugRenderConfig = new DebugRenderConfig(g_renderer, "/Sandbox/Data/Images/SquirrelFixedFont");
export const g_debugRenderSystem = new DebugRenderSystem(debugRenderConfig);

const inputSystemConfig = new InputSystemConfig(g_windowManager);
export const g_input = new InputSystem(inputSystemConfig);

const devConsoleCamera = new Camera();
devConsoleCamera.SetOrthoView(Vec2.ZERO, new Vec2(g_aspect, 1.0));
const devConsoleConfig = new DevConsoleConfig(g_eventSystem, g_renderer, devConsoleCamera, "/Sandbox/Data/Images/SquirrelFixedFont");
export const g_console = new DevConsole(devConsoleConfig);

const modelLoaderConfig = new ModelLoaderConfig();
export const g_modelLoader = new ModelLoader(modelLoaderConfig);

