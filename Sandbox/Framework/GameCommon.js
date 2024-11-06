import App from "../../Sandbox/Framework/App.js"

import Renderer, { RenderConfig } from "../../Engine/Renderer/Renderer.js"

export const g_app = new App();

const renderConfig = new RenderConfig();
export const g_renderer = new Renderer(renderConfig);