import { g_renderer } from "../../Sandbox/Framework/GameCommon.js"

import Rgba8 from "../../Engine/Core/Rgba8.js"
import Vertex_PCU from "../../Engine/Core/Vertex_PCU.js"
import Mat44 from "../../Engine/Math/Mat44.js"
import Vec2 from "../../Engine/Math/Vec2.js"
import Vec3 from "../../Engine/Math/Vec3.js"
import Camera from "../../Engine/Renderer/Camera.js"
import { g_viewportHeight, g_viewportWidth } from "../../Engine/Renderer/Renderer.js"
import * as MathUtils from "../../Engine/Math/MathUtils.js"

export default class App
{
    constructor()
    {
        this.m_worldCamera = new Camera();
        // this.m_worldCamera.SetOrthoView(new Vec2(0, 0), new Vec2(g_viewportWidth, g_viewportHeight));
        this.m_worldCamera.SetOrthoView(new Vec2(0, 0), new Vec2(200, 100));
        this.m_previousFrameTime = Math.floor(Date.now() / 1000);
    }

    Startup()
    {
        g_renderer.Startup();
    }

    Run()
    {
        setInterval(()=> this.RunFrame(), 16);
    }

    RunFrame()
    {
        const deltaSeconds = 1 / 60;

        this.BeginFrame();
        this.Update(deltaSeconds);
        this.Render();
        this.EndFrame();
    }

    BeginFrame()
    {
    }

    Update(deltaSeconds)
    {

    }

    Render()
    {
        const vertexesToDraw = [
            new Vertex_PCU(new Vec3(4, 50, 0), new Rgba8(255, 0, 255), Vec2.ZERO),
            new Vertex_PCU(new Vec3(0, 54, 0), new Rgba8(255, 255, 0), Vec2.ZERO),
            new Vertex_PCU(new Vec3(0, 46, 0), new Rgba8(0, 255, 255), Vec2.ZERO),
        ];

        g_renderer.BeginCamera(this.m_worldCamera);
        g_renderer.ClearScreen(new Rgba8(0, 0, 0));
        g_renderer.SetModelConstants(Mat44.CreateTranslation2D(new Vec2(10.0, 0.0), Rgba8.WHITE));
        g_renderer.DrawVertexArray(vertexesToDraw);
        g_renderer.EndCamera(this.m_worldCamera);
    }

    EndFrame()
    {

    }

    Shutdown()
    {

    }
}