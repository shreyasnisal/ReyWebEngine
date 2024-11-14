"use strict";

import {g_app, SCREEN_SIZE_Y} from "/Sandbox/Framework/GameCommon.js";
import {
    g_renderer,
    g_input,
    g_console,
    g_eventSystem,
    g_debugRenderSystem,
    g_modelLoader, g_webXR, g_windowManager
} from "/Engine/Core/EngineCommon.js";

import * as FileUtils from "/Engine/Core/FileUtils.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import { XboxButtonID } from "/Engine/Input/XboxController.js";
import AABB3 from "/Engine/Math/AABB3.js";
import EulerAngles from "/Engine/Math/EulerAngles.js";
import Mat44 from "/Engine/Math/Mat44.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";
import Vec3 from "/Engine/Math/Vec3.js";
import Vec4 from "/Engine/Math/Vec4.js";

import Camera from "/Engine/Renderer/Camera.js";
import { BlendMode, CullMode, DepthMode, g_aspect, VertexType } from "/Engine/Renderer/Renderer.js";


export default class Game
{
    constructor()
    {
        // Initialize world camera
        this.m_worldCamera = new Camera();
        this.m_worldCamera.SetRenderBasis(Vec3.SKYWARD, Vec3.WEST, Vec3.NORTH);
        this.m_worldCamera.SetTransform(new Vec3(0.0, 0.0, 0.0));
        // Initialize screen camera
        this.m_screenCamera = new Camera();

        // Create a test cube
        this.m_testCubeVertexes = [];
        const BLF = new Vec3(-0.5, 0.5, -0.5);
        const BRF = new Vec3(-0.5, -0.5, -0.5);
        const TRF = new Vec3(-0.5, -0.5, 0.5);
        const TLF = new Vec3(-0.5, 0.5, 0.5);
        const BLB = new Vec3(0.5, 0.5, -0.5);
        const BRB = new Vec3(0.5, -0.5, -0.5);
        const TRB = new Vec3(0.5, -0.5, 0.5);
        const TLB = new Vec3(0.5, 0.5, 0.5);
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BRB, BLB, TLB, TRB, Rgba8.RED); // back face (+X)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BLF, BRF, TRF, TLF, Rgba8.CYAN); // front face (-X)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BLB, BLF, TLF, TLB, Rgba8.GREEN); // left face (+Y)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BRF, BRB, TRB, TRF, Rgba8.MAGENTA); // right face (-Y)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, TLF, TRF, TRB, TLB, Rgba8.BLUE); // top face (+Z)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BLB, BRB, BRF, BLF, Rgba8.YELLOW); // bottom face (-Z)
        this.m_cubePosition = new Vec3(3.0, 0.0, 0.0);
        this.m_cubeOrientation = new EulerAngles(0.0, 0.0, 0.0);

        this.m_playerPosition = new Vec3(0.0, 0.0, 1.0);
        this.m_playerOrientation = new EulerAngles();

        this.InitializeGrid();

        this.m_testTexture = null;
        g_renderer.CreateOrGetTextureFromFile("/Sandbox/Data/Images/Test_StbiFlippedAndOpenGL.png").then(texture => { this.m_testTexture = texture; });

        // Load BitmapFont
        this.m_squirrelFixedFont = null;
        g_renderer.CreateOrGetBitmapFont("/Sandbox/Data/Images/SquirrelFixedFont").then(font =>
        {
            this.m_squirrelFixedFont = font;
        });

        // Testing ModelLoader
        this.m_treeModel = null;
        g_modelLoader.CreateOrGetModelFromFile("/Sandbox/Data/Models/tree", new Mat44(Vec4.SOUTH, Vec4.SKYWARD, Vec4.WEST, Vec4.ZERO_TRANSLATION)).then(model => {
            this.m_treeModel = model;
        })
        this.m_treePosition = new Vec3(5.0, 0.0, 0.0);

        this.m_diffuseShader = null;
        g_renderer.CreateOrGetShaderFromFiles("Diffuse", "/Sandbox/Data/Shaders/Diffuse_Vertex", "/Sandbox/Data/Shaders/Diffuse_Fragment", VertexType.VERTEX_PCUTBN).then(shader => {
            this.m_diffuseShader = shader;
        });

        // Add helper messages
        g_debugRenderSystem.AddMessage("Esc to release mouse cursor (if locked)", -1.0, Rgba8.CYAN, Rgba8.CYAN);
        g_debugRenderSystem.AddMessage("TAB to open DevConsole", -1.0, Rgba8.YELLOW, Rgba8.YELLOW);

        // const vrButton = document.createElement("button");
        // vrButton.innerText = "VR Mode";
        // vrButton.addEventListener("click", async () => { await g_webXR.StartXRSession(g_app.RunFrame.bind(g_app)); });
        // const vrButtonContainer = document.getElementById("vrbutton-container");
        // vrButtonContainer.appendChild(vrButton);

        document.getElementById("id_canvas").addEventListener("click", () => { this.HandleCanvasClicked() });
    }

    HandleCanvasClicked()
    {
        if (g_webXR.IsVRSupported())
        {
            g_webXR.StartXRSession(g_app.RunFrame.bind(g_app));
        }
        else
        {
            g_input.SetCursorMode(true, true);
        }
    }

    InitializeGrid()
    {
        this.m_gridStaticVerts = [];
        const lineHalfThickness = 0.01;
        const line5HalfThickness = 0.02;
        const line0HalfThickness = 0.04;

        for (let y = -50; y <= 50; y++)
        {
            VertexUtils.AddPCUVertsForAABB3(this.m_gridStaticVerts, new AABB3(new Vec3(-50.0, y - lineHalfThickness, -lineHalfThickness), new Vec3(50.0, y + lineHalfThickness, lineHalfThickness)), Rgba8.WHITE);
        }

        for (let x = -50; x <= 50; x++)
        {
            VertexUtils.AddPCUVertsForAABB3(this.m_gridStaticVerts, new AABB3(new Vec3(x - lineHalfThickness, -50.0, -lineHalfThickness), new Vec3(x + lineHalfThickness, 50.0, lineHalfThickness)), Rgba8.WHITE);
        }
    }

    Update(deltaSeconds)
    {
        this.m_cubeOrientation.m_yawDegrees += 45.0 * deltaSeconds;
        this.m_cubeOrientation.m_pitchDegrees += 30.0 * deltaSeconds;
        this.HandleInput(deltaSeconds);
        this.UpdateCameras();
    }

    HandleInput(deltaSeconds)
    {
        // if (!g_webXR.IsVRSupported() && g_input.WasLMBJustPressed() && !g_input.IsCursorRelativeMode())
        // {
        //     g_input.SetCursorMode(true, true);
        // }

        this.HandleKeyboardInput(deltaSeconds);
        this.HandleControllerInput(deltaSeconds);
        this.HandleVRInput(deltaSeconds);
        this.m_playerOrientation.m_pitchDegrees = MathUtils.GetClamped(this.m_playerOrientation.m_pitchDegrees, -89.0, 89.0);
    }

    HandleKeyboardInput(deltaSeconds)
    {
        const MOVEMENT_SPEED = 4.0;

        const playerBasis = this.m_playerOrientation.GetAsVectors_iFwd_jLeft_kUp();
        const playerFwd = playerBasis[0];
        const playerLeft = playerBasis[1];
        const playerUp = playerBasis[2];

        if (g_input.IsKeyDown('W'))
        {
            this.m_playerPosition.Add(playerFwd.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('A'))
        {
            this.m_playerPosition.Add(playerLeft.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('S'))
        {
            this.m_playerPosition.Add(playerFwd.GetScaled(-MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('D'))
        {
            this.m_playerPosition.Add(playerLeft.GetScaled(-MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('Q'))
        {
            this.m_playerPosition.Add(Vec3.GROUNDWARD.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('E'))
        {
            this.m_playerPosition.Add(Vec3.SKYWARD.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }

        this.m_playerOrientation.m_yawDegrees += g_input.GetCursorClientDelta().x * 0.15;
        this.m_playerOrientation.m_pitchDegrees -= g_input.GetCursorClientDelta().y * 0.15;
    }

    HandleControllerInput(deltaSeconds)
    {
        const controller = g_input.GetController(0);
        if (controller == null)
        {
            return;
        }

        const MOVEMENT_SPEED = 4.0;
        const TURN_RATE = 90.0;

        const playerBasis = this.m_playerOrientation.GetAsVectors_iFwd_jLeft_kUp();
        const playerFwd = playerBasis[0];
        const playerLeft = playerBasis[1];
        const playerUp = playerBasis[2];

        const leftJoystick = controller.GetLeftStick();
        const rightJoystick = controller.GetRightStick();

        let velocityZ = 0.0;
        if (controller.IsButtonDown(XboxButtonID.LEFT_SHOULDER))
        {
            velocityZ -= 1.0;
        }
        if (controller.IsButtonDown(XboxButtonID.RIGHT_SHOULDER))
        {
            velocityZ += 1.0;
        }

        this.m_playerPosition.Add(playerFwd.GetScaled(leftJoystick.m_deadzoneCorrectedCartesianCoordinates.y * MOVEMENT_SPEED * deltaSeconds));
        this.m_playerPosition.Add(playerLeft.GetScaled(-leftJoystick.m_deadzoneCorrectedCartesianCoordinates.x * MOVEMENT_SPEED * deltaSeconds));
        this.m_playerPosition.Add(Vec3.SKYWARD.GetScaled(velocityZ * MOVEMENT_SPEED * deltaSeconds));

        this.m_playerOrientation.m_yawDegrees -= rightJoystick.m_deadzoneCorrectedCartesianCoordinates.x * TURN_RATE * deltaSeconds;
        this.m_playerOrientation.m_pitchDegrees -= rightJoystick.m_deadzoneCorrectedCartesianCoordinates.y * TURN_RATE * deltaSeconds;
    }

    HandleVRInput(deltaSeconds)
    {
        if (!g_webXR.m_initialized)
        {
            return;
        }

        const leftController = g_webXR.GetLeftController();
        const rightController = g_webXR.GetRightController();

        if (leftController == null || rightController == null)
        {
            return;
        }

        const MOVEMENT_SPEED = 4.0;
        const TURN_RATE = 90.0;

        const playerBasis = this.m_playerOrientation.GetAsVectors_iFwd_jLeft_kUp();
        const playerFwd = playerBasis[0];
        const playerLeft = playerBasis[1];
        const playerUp = playerBasis[2];

        this.m_playerPosition.Add(playerFwd.GetScaled(leftController.GetJoystick().m_deadzoneCorrectedCartesianCoordinates.y * MOVEMENT_SPEED * deltaSeconds));
        this.m_playerPosition.Add(playerLeft.GetScaled(-leftController.GetJoystick().m_deadzoneCorrectedCartesianCoordinates.x * MOVEMENT_SPEED * deltaSeconds));
        // this.m_playerPosition.Add(Vec3.SKYWARD.GetScaled(velocityZ * MOVEMENT_SPEED * deltaSeconds));

        // this.m_playerOrientation.m_yawDegrees -= rightJoystick.m_deadzoneCorrectedCartesianCoordinates.x * TURN_RATE * deltaSeconds;
        // this.m_playerOrientation.m_pitchDegrees -= rightJoystick.m_deadzoneCorrectedCartesianCoordinates.y * TURN_RATE * deltaSeconds;
    }

    UpdateCameras()
    {
        this.m_worldCamera.SetPerspectiveView(g_aspect, 90.0, 0.01, 100);
        this.m_worldCamera.SetTransform(this.m_playerPosition, this.m_playerOrientation);
        this.m_screenCamera.SetOrthoView(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y));
    }

    Render()
    {
        // g_renderer.ClearScreen(Rgba8.GRAY);

        const cubeTransform = Mat44.CreateTranslation3D(this.m_cubePosition);
        cubeTransform.Append(this.m_cubeOrientation.GetAsMatrix_iFwd_jLeft_kUp());

        // g_renderer.BeginCamera(this.m_worldCamera);
        {
            g_renderer.BindShader(null);
            g_renderer.SetBlendMode(BlendMode.OPAQUE);
            g_renderer.SetCullMode(CullMode.BACK);
            g_renderer.SetDepthMode(DepthMode.ENABLED);
            g_renderer.SetModelConstants(cubeTransform);
            g_renderer.BindTexture(null);
            g_renderer.DrawVertexArray(this.m_testCubeVertexes);

            if (this.m_treeModel != null && this.m_diffuseShader != null)
            {
                g_renderer.BindShader(this.m_diffuseShader);
                g_renderer.SetLightConstants(new Vec3(2.0, -1.0, -1.0).GetNormalized(), 0.9, 0.1);
                g_renderer.SetModelConstants(Mat44.CreateTranslation3D(this.m_treePosition));
                g_renderer.DrawVertexBuffer(this.m_treeModel.m_modelGroups[0].m_gpuMesh.m_vertexBuffer, this.m_treeModel.m_modelGroups[0].m_cpuMesh.m_vertexes.length);
            }
        }
        // g_renderer.EndCamera(this.m_worldCamera);
        this.RenderGrid();

        // g_debugRenderSystem.RenderWorld(this.m_worldCamera);
        // g_debugRenderSystem.RenderScreen(this.m_screenCamera);
    }

    RenderGrid()
    {
        // g_renderer.BeginCamera(this.m_worldCamera);
        {
            g_renderer.BindShader(null);
            g_renderer.SetBlendMode(BlendMode.OPAQUE);
            g_renderer.SetCullMode(CullMode.BACK);
            g_renderer.SetDepthMode(DepthMode.ENABLED);
            g_renderer.SetModelConstants();
            g_renderer.BindTexture(null);
            g_renderer.DrawVertexArray(this.m_gridStaticVerts);
        }
        // g_renderer.EndCamera(this.m_worldCamera);
    }
}