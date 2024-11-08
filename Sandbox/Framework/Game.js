"use strict";

import {g_renderer, g_input, g_console, SCREEN_SIZE_Y} from "../../Sandbox/Framework/GameCommon.js";

import * as StringUtils from "../../Engine/Core/StringUtils.js";
import * as VertexUtils from "../../Engine/Core/VertexUtils.js";
import Rgba8 from "../../Engine/Core/Rgba8.js";
import { XboxButtonID } from "../../Engine/Input/XboxController.js";
import AABB3 from "../../Engine/Math/AABB3.js";
import EulerAngles from "../../Engine/Math/EulerAngles.js";
import Mat44 from "../../Engine/Math/Mat44.js";
import * as MathUtils from "../../Engine/Math/MathUtils.js";
import Vec2 from "../../Engine/Math/Vec2.js";
import Vec3 from "../../Engine/Math/Vec3.js";
import BitmapFont from "../../Engine/Renderer/BitmapFont.js";
import Camera from "../../Engine/Renderer/Camera.js";
import {CullMode, DepthMode, g_aspect} from "../../Engine/Renderer/Renderer.js";


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
        this.m_cubePosition = new Vec3(2.0, 0.0, 0.0);
        this.m_cubeOrientation = new EulerAngles(0.0, 0.0, 0.0);

        this.m_playerPosition = Vec3.ZERO;
        this.m_playerOrientation = EulerAngles.ZERO;

        this.InitializeGrid();

        document.onpointerlockchange = () => this.HandlePointerLockChange();

        this.m_testTexture = null;
        g_renderer.CreateOrGetTextureFromFile("../../Sandbox/Data/Images/Test_StbiFlippedAndOpenGL.png").then(texture => { this.m_testTexture = texture; });

        this.m_hasFocus = false;

        // Load BitmapFont
        this.m_squirrelFixedFont = null;
        g_renderer.CreateOrGetBitmapFont("../../Sandbox/Data/Images/SquirrelFixedFont").then(font =>
        {
            this.m_squirrelFixedFont = font;
        });
    }

    HandlePointerLockChange()
    {
        if (document.pointerLockElement)
        {
            this.m_hasFocus = true;
        }
        else
        {
            this.m_hasFocus = false;
            g_input.SetCursorMode(false, false);
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
        if (g_input.WasLMBJustPressed() && !g_input.IsCursorRelativeMode())
        {
            g_input.SetCursorMode(true, true);
        }

        if (this.m_hasFocus)
        {
            if (g_input.WasKeyJustPressed('1'.charCodeAt()))
            {
                g_console.AddLine("Hello, World!");
            }

            this.HandleKeyboardInput(deltaSeconds);
            this.HandleControllerInput(deltaSeconds);
            this.m_playerOrientation.m_pitchDegrees = MathUtils.GetClamped(this.m_playerOrientation.m_pitchDegrees, -89.0, 89.0);
        }
    }

    HandleKeyboardInput(deltaSeconds)
    {
        const MOVEMENT_SPEED = 4.0;

        const playerBasis = this.m_playerOrientation.GetAsVectors_iFwd_jLeft_kUp();
        const playerFwd = playerBasis[0];
        const playerLeft = playerBasis[1];
        const playerUp = playerBasis[2];

        if (g_input.IsKeyDown('W'.charCodeAt()))
        {
            this.m_playerPosition.Add(playerFwd.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('A'.charCodeAt()))
        {
            this.m_playerPosition.Add(playerLeft.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('S'.charCodeAt()))
        {
            this.m_playerPosition.Add(playerFwd.GetScaled(-MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('D'.charCodeAt()))
        {
            this.m_playerPosition.Add(playerLeft.GetScaled(-MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('Q'.charCodeAt()))
        {
            this.m_playerPosition.Add(Vec3.GROUNDWARD.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('E'.charCodeAt()))
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

    UpdateCameras()
    {
        this.m_worldCamera.SetPerspectiveView(g_aspect, 90.0, 0.01, 100);
        this.m_worldCamera.SetTransform(this.m_playerPosition, this.m_playerOrientation);
        this.m_screenCamera.SetOrthoView(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y));
    }

    Render()
    {
        g_renderer.ClearScreen(new Rgba8(0, 0, 0));

        const cubeTransform = Mat44.CreateTranslation3D(this.m_cubePosition);
        cubeTransform.Append(this.m_cubeOrientation.GetAsMatrix_iFwd_jLeft_kUp());

        g_renderer.BeginCamera(this.m_worldCamera);
        {
            g_renderer.SetCullMode(CullMode.BACK);
            g_renderer.SetDepthMode(DepthMode.ENABLED);
            g_renderer.SetModelConstants(cubeTransform);
            g_renderer.BindTexture(null);
            g_renderer.DrawVertexArray(this.m_testCubeVertexes);
        }
        g_renderer.EndCamera(this.m_worldCamera);
        this.RenderGrid();

        const textVerts = [];
        g_renderer.BeginCamera(this.m_screenCamera);
        {
            if (this.m_squirrelFixedFont != null)
            {
                this.m_squirrelFixedFont.AddVertsForText2D(textVerts, new Vec2(0.0, 0.0), 20.0, "Hello, World!", Rgba8.MAGENTA, 1.0);
                g_renderer.SetCullMode(CullMode.BACK);
                g_renderer.SetDepthMode(DepthMode.DISABLED);
                g_renderer.SetModelConstants();
                g_renderer.BindTexture(this.m_squirrelFixedFont.GetTexture());
                g_renderer.DrawVertexArray(textVerts);
            }
        }
        g_renderer.EndCamera(this.m_screenCamera);
    }

    RenderGrid()
    {
        g_renderer.BeginCamera(this.m_worldCamera);
        {
            g_renderer.SetCullMode(CullMode.BACK);
            g_renderer.SetDepthMode(DepthMode.ENABLED);
            g_renderer.SetModelConstants();
            g_renderer.BindTexture(null);
            g_renderer.DrawVertexArray(this.m_gridStaticVerts);
        }
        g_renderer.EndCamera(this.m_worldCamera);
    }
}