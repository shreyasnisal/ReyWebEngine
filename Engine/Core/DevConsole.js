"use strict";

import Clock from "/Engine/Core/Clock.js";
import Stopwatch from "/Engine/Core/Stopwatch.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import AABB2 from "/Engine/Math/AABB2.js";
import Vec2 from "/Engine/Math/Vec2.js";

import {CullMode, DepthMode} from "/Engine/Renderer/Renderer.js";
import * as StringUtils from "/Engine/Core/StringUtils.js";


export class DevConsoleConfig
{
    constructor(eventSystem, renderer, camera, fontFilePath, overlayColor = new Rgba8(0, 0, 0, 200), linesToShow = 50.5, fontAspect = 0.7)
    {
        this.m_eventSystem = eventSystem;
        this.m_renderer = renderer;
        this.m_camera = camera;
        this.m_fontFilePath = fontFilePath;
        this.m_overlayColor = overlayColor;
        this.m_linesToShow = linesToShow;
        this.m_fontAspect = fontAspect;
    }
}

export class DevConsoleMode
{
    static HIDDEN = "HIDDEN";
    static OPENFULL = "OPENFULL";
}

class DevConsoleLine
{
    constructor(color, text, frameNumber, timestamp, showTimestampAndFrameNumber = false)
    {
        this.m_color = color;
        this.m_text = text;
        this.m_frameNumber = frameNumber;
        this.m_timestamp = timestamp;
        this.m_showTimestampAndFrameNumber = showTimestampAndFrameNumber;
    }

    toString()
    {
        let lineText = "";
        if (this.m_showTimestampAndFrameNumber)
        {
            lineText += this.m_timestamp + " (Frame #" + this.m_frameNumber + "): ";
        }
        lineText += this.m_text;
        return lineText;
    }
}

export default class DevConsole
{
    static INFO_MAJOR = Rgba8.GREEN;
    static INFO_MINOR = Rgba8.WHITE;
    static WARNING = Rgba8.YELLOW;
    static ERROR = Rgba8.RED;

    constructor(config)
    {
        this.m_config = config;

        // Initialize variables
        this.m_mode = DevConsoleMode.HIDDEN;
        this.m_blinkingCaretTimer = null;
        this.m_linesToShow = this.m_config.m_linesToShow;
        this.m_frameNumber = 0;
        this.m_isCaretVisible = false;
        this.m_lines = [];
        this.m_command = "";
        this.m_caretPosition = 0;
        this.m_caretBlinkTimer = new Stopwatch(0.5);
        this.m_commandHistory = [];
        this.m_commandHistoryIndex = -1;
        this.m_verticalPosition = 0;
        this.m_commandEcho = true;
    }

    Startup()
    {
        this.m_caretBlinkTimer.Start();

        window.addEventListener("keydown", (keyEvent) => this.HandleCharacterPressed(keyEvent));
        window.addEventListener("keydown", (keyEvent) => this.HandleKeyPressed(keyEvent));

        this.m_config.m_eventSystem.SubscribeEventCallbackFunction("help", this.Event_Help, "Displays a list of all available commands");
        this.m_config.m_eventSystem.SubscribeEventCallbackFunction("echo", this.Event_Echo, "Displays messages on the console");
        this.m_config.m_eventSystem.SubscribeEventCallbackFunction("clear", this.Event_Clear, "Clears the console");
        this.m_config.m_eventSystem.SubscribeEventCallbackFunction("exit", this.Event_Exit, "Exits the console");
        this.m_config.m_eventSystem.SubscribeEventCallbackFunction("@echo", this.Event_EchoSpecial, "Special command to set console command echo");
    }

    BeginFrame()
    {
        this.m_frameNumber++;
        while (this.m_caretBlinkTimer.DecrementDurationIfElapsed())
        {
            this.m_isCaretVisible = !this.m_isCaretVisible;
        }
    }

    Render(bounds, rendererOverride = null)
    {
        let renderer = this.m_config.m_renderer;
        if (rendererOverride != null)
        {
            renderer = rendererOverride;
        }

        renderer.CreateOrGetBitmapFont(this.m_config.m_fontFilePath).then(font =>
        {
            switch (this.m_mode)
            {
                case DevConsoleMode.HIDDEN:
                {
                    return;
                }
                case DevConsoleMode.OPENFULL:
                {
                    this.Render_OpenFull(bounds, renderer, font, this.m_config.m_fontAspect);
                }
            }
        });
    }

    Render_OpenFull(bounds, renderer, font, fontAspect)
    {
        const devConsoleVerts = [];
        const devConsoleTextVerts = [];

        renderer.BeginCamera(this.m_config.m_camera);
        {
            VertexUtils.AddPCUVertsForAABB2(devConsoleVerts, bounds, this.m_config.m_overlayColor);

            const lineHeight = (this.m_config.m_camera.GetOrthoTopRight().y - this.m_config.m_camera.GetOrthoBottomLeft().y) / this.m_linesToShow;
            const numLines = this.m_lines.length;

            VertexUtils.AddPCUVertsForLineSegment2D(devConsoleVerts, new Vec2(bounds.m_mins.x, bounds.m_mins.y + lineHeight * 2.0), new Vec2(bounds.m_maxs.x, bounds.m_mins.y + lineHeight * 2.0), lineHeight * 0.1, Rgba8.DODGER_BLUE);
            font.AddVertsForTextInBox2D(devConsoleTextVerts, new AABB2(bounds.m_mins.GetSum(new Vec2((this.m_config.m_camera.GetOrthoTopRight().x - this.m_config.m_camera.GetOrthoBottomLeft().x) * 0.01, lineHeight * 0.3)), new Vec2(bounds.m_maxs.x, bounds.m_mins.y + lineHeight * 1.3)), lineHeight, this.m_command, Rgba8.DODGER_BLUE, fontAspect);

            if (this.m_isCaretVisible)
            {
                let caretPositionText = "";
                for (let commandCharacterIndex = 0; commandCharacterIndex <= this.m_command.length; commandCharacterIndex++)
                {
                    if (commandCharacterIndex === this.m_caretPosition)
                    {
                        caretPositionText += "_";
                        continue;
                    }
                    caretPositionText += " ";
                }
                font.AddVertsForTextInBox2D(devConsoleTextVerts, new AABB2(bounds.m_mins.GetSum(new Vec2((this.m_config.m_camera.GetOrthoTopRight().x - this.m_config.m_camera.GetOrthoBottomLeft().x) * 0.01, lineHeight * 0.3)), new Vec2(bounds.m_maxs.x, bounds.m_mins.y + lineHeight * 1.3)), lineHeight, caretPositionText, Rgba8.RED, fontAspect);
            }

            for (let lineIndex = 0; lineIndex < numLines; lineIndex++)
            {
                const lineBounds = new AABB2(new Vec2(bounds.m_mins.x + (this.m_config.m_camera.GetOrthoTopRight().x - this.m_config.m_camera.GetOrthoBottomLeft().x) * 0.01, bounds.m_mins.y + lineHeight * 1.1 * (numLines - lineIndex + 1)), new Vec2(bounds.m_maxs.x, bounds.m_mins.y + 2.0 + lineHeight * 0.9 * (numLines - lineIndex + 2)));
                if (lineBounds.m_mins.y > bounds.m_maxs.y)
                {
                    break;
                }
                if (lineBounds.m_mins.y < bounds.m_mins + lineHeight * 2.0)
                {
                    continue;
                }
                const lineText = this.m_lines[lineIndex].toString();
                font.AddVertsForTextInBox2D(devConsoleTextVerts, new AABB2(lineBounds.m_mins.GetSum(new Vec2(1.0, -1.0).GetScaled(lineHeight * 0.1)), lineBounds.m_maxs.GetSum(new Vec2(1.0, -1.0).GetScaled(lineHeight * 0.1))), lineHeight, lineText, Rgba8.BLACK, fontAspect);
                font.AddVertsForTextInBox2D(devConsoleTextVerts, lineBounds, lineHeight, lineText, this.m_lines[lineIndex].m_color, fontAspect);
            }
        }

        renderer.SetDepthMode(DepthMode.DISABLED);
        renderer.SetCullMode(CullMode.BACK);
        renderer.SetModelConstants();

        renderer.BindTexture(null);
        renderer.DrawVertexArray(devConsoleVerts);

        renderer.BindTexture(font.GetTexture());
        renderer.DrawVertexArray(devConsoleTextVerts);

        renderer.EndCamera(this.m_config.m_camera);
    }

    EndFrame()
    {
    }

    Shutdown()
    {
    }

    Execute(commandText)
    {
        if (this.m_commandEcho)
        {
            this.AddLine("");
            this.AddLine(commandText);
        }

        const commandLines = [];
        const numCommandLines = StringUtils.SplitStringOnDelimiter(commandLines, commandText, '\n');
        for (let commandIndex = 0; commandIndex < numCommandLines; commandIndex++)
        {
            const commandNameAndArgs = [];
            const numArgs = StringUtils.SplitStringOnDelimiter(commandNameAndArgs, commandLines[commandIndex], ' ');
            let commandName = commandNameAndArgs[0];
            commandName = commandName.toLowerCase();

            if (commandName === "echo")
            {
                const eventArgs = [];
                let echoArg = "";
                if (numArgs === 1)
                {
                    return;
                }
                for (let argIndex = 1; argIndex < numArgs; argIndex++)
                {
                    if (commandNameAndArgs[argIndex] === "/help")
                    {
                        eventArgs["help"] = true;
                        this.m_config.m_eventSystem.FireEvent(commandName, eventArgs);
                        return;
                    }

                    echoArg += commandNameAndArgs[argIndex] + " ";
                }
                echoArg = echoArg.slice(0, echoArg.length - 1);
                eventArgs["EchoArg"] = echoArg;
                this.m_config.m_eventSystem.FireEvent(commandName, eventArgs);
                return;
            }

            if (commandName === "@echo")
            {
                const eventArgs = [];
                let echoArg = "";
                if (numArgs === 1)
                {
                    return;
                }
                for (let argIndex = 1; argIndex < numArgs; argIndex++)
                {
                    if (commandNameAndArgs[argIndex] === "off")
                    {
                        eventArgs["specialCommand"] = "off";
                    }
                    else if (commandNameAndArgs[argIndex] === "on")
                    {
                        eventArgs["specialCommand"] = "on";
                    }
                }

                this.m_config.m_eventSystem.FireEvent(commandName, eventArgs);
                return;
            }

            const eventArgs = [];
            for (let argIndex = 1; argIndex < numArgs; argIndex++)
            {
                const keyValuePair = [];
                StringUtils.SplitStringOnDelimiter(keyValuePair, commandNameAndArgs[argIndex], '=');
                if (keyValuePair.length === 1)
                {
                    keyValuePair.push(true);
                }

                eventArgs[keyValuePair[0]] = keyValuePair[1];
            }
            this.m_config.m_eventSystem.FireEvent(commandName, eventArgs);
        }
    }

    GetMode()
    {
        return this.m_mode;
    }

    SetMode(mode)
    {
        this.m_mode = mode;
    }

    ToggleMode(mode)
    {
        if (this.m_mode === mode)
        {
            this.m_mode = DevConsoleMode.HIDDEN;
        }
        else
        {
            this.m_mode = mode;
        }
    }

    AddLine(text, color = DevConsole.INFO_MINOR, showTimestampAndFrameNumber = false)
    {
        const devConsoleLine = new DevConsoleLine(color, text, this.m_frameNumber, Clock.SystemClock.GetTotalSeconds(), showTimestampAndFrameNumber);
        this.m_lines.push(devConsoleLine);
    }

    HandleCharacterPressed(keyEvent)
    {
        if (this.m_mode === DevConsoleMode.HIDDEN)
        {
            return;
        }

        if (keyEvent.key.length !== 1 || keyEvent.ctrlKey || keyEvent.altKey || keyEvent.metaKey)
        {
            return;
        }

        this.m_command = [this.m_command.slice(0, this.m_caretPosition), keyEvent.key, this.m_command.slice(this.m_caretPosition)].join('');
        this.m_caretPosition++;
        this.m_caretBlinkTimer.Restart();
        keyEvent.stopImmediatePropagation();
    }

    HandleKeyPressed(keyEvent)
    {
        if (this.m_mode === DevConsoleMode.HIDDEN)
        {
            return;
        }

        if (keyEvent.code === "Backspace")
        {
            if (this.m_caretPosition === 0)
            {
                return;
            }
            this.m_command = [this.m_command.slice(0, this.m_caretPosition - 1), this.m_command.slice(this.m_caretPosition)].join('');
            this.m_caretPosition--;
        }
        else if (keyEvent.code === "Delete")
        {
            if (this.m_caretPosition === this.m_command.length)
            {
                return;
            }
            this.m_command = [this.m_command.slice(0, this.m_caretPosition), this.m_command.slice(this.m_caretPosition + 1)].join('');
        }
        else if (keyEvent.code === "ArrowLeft")
        {
            if (this.m_caretPosition === 0)
            {
                return;
            }
            this.m_caretPosition--;
        }
        else if (keyEvent.code === "ArrowRight")
        {
            if (this.m_caretPosition === this.m_command.length)
            {
                return;
            }
            this.m_caretPosition++;
        }
        else if (keyEvent.code === "ArrowDown")
        {
            if (this.m_commandHistoryIndex === this.m_commandHistory.length - 1)
            {
                return;
            }
            this.m_commandHistoryIndex++;
            this.m_command = this.m_commandHistory[this.m_commandHistoryIndex];
            this.m_caretPosition = this.m_command.length;
        }
        else if (keyEvent.code === "ArrowUp")
        {
            if (this.m_commandHistoryIndex <= 0)
            {
                return;
            }
            this.m_commandHistoryIndex--;
            this.m_command = this.m_commandHistory[this.m_commandHistoryIndex];
            this.m_caretPosition = this.m_command.length;
        }
        else if (keyEvent.code === "Enter")
        {
            this.Execute(this.m_command);
            this.m_commandHistory.push(this.m_command);
            this.m_commandHistoryIndex = this.m_commandHistory.length;
            this.m_command = "";
            this.m_caretPosition = 0;
        }
        else if (keyEvent.code === "End")
        {
            this.m_caretPosition = this.m_command.length;
        }
        else if (keyEvent.code === "Home")
        {
            this.m_caretPosition = 0;
        }

        this.m_caretBlinkTimer.Restart();
    }

    Event_Echo = (eventArgs) =>
    {
        const help = eventArgs["help"];
        if (help)
        {
            this.AddLine("Displays messages on the console");
            this.AddLine("Example Usage: > echo Hello, World!");
            return true;
        }

        const stringToEcho = eventArgs["EchoArg"];
        this.AddLine(stringToEcho);
        return true;
    }

    Event_Help = (eventArgs) =>
    {
        if (this.m_mode === DevConsoleMode.HIDDEN)
        {
            return;
        }

        const help = eventArgs["help"];
        if (help)
        {
            this.AddLine("You need help on the help command? You should get help!", DevConsole.WARNING);
            return true;
        }

        this.m_config.m_eventSystem.ListAllCommands();
    }

    Event_Clear = (eventArgs) =>
    {
        const help = eventArgs["help"];
        if (help)
        {
            this.AddLine("Clears the console. No parameters, nothing...");
            return true;
        }

        this.m_lines = [];
        return true;
    }

    Event_Exit = (eventArgs) =>
    {
        const help = eventArgs["help"];
        if (help)
        {
            this.AddLine("Exits the console (not the app).");
            return true;
        }

        this.SetMode(DevConsoleMode.HIDDEN);
        return true;
    }

    Event_EchoSpecial = (eventArgs) =>
    {
        const specialCommand = eventArgs["specialCommand"];

        if (specialCommand === "off")
        {
            this.m_commandEcho = false;
        }
        else if (specialCommand === "on")
        {
            this.m_commandEcho = true;
        }

        return true;
    }
}
