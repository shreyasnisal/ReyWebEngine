"use strict";


export class WindowManagerConfig
{
    constructor(eventSystem)
    {
        this.m_eventSystem = eventSystem;
    }
}

export default class WindowManager
{
    constructor(config)
    {
        this.m_config = config;
        this.m_hasFocus = false;
        this.m_canvas = document.getElementById("id_canvas");
    }

    Startup()
    {
        window.addEventListener("keydown", (keyEvent) => this.HandleKeyDown(keyEvent));
        window.addEventListener("keyup", (keyEvent) => this.HandleKeyUp(keyEvent));
        window.addEventListener("mousemove", (mouseEvent) => this.HandleMouseMove(mouseEvent));
        window.addEventListener("mousedown", (mouseEvent) => this.HandleMouseButtonDown(mouseEvent));
        window.addEventListener("mouseup", (mouseEvent) => this.HandleMouseButtonUp(mouseEvent));

        document.onpointerlockchange = (pointerLockEvent) => { this.SetFocus(document.pointerLockElement ? true : false); }
    }

    BeginFrame()
    {
    }

    EndFrame()
    {
    }

    Shutdown()
    {
    }

    HandleKeyUp(keyEvent)
    {
        if (this.m_hasFocus)
        {
            keyEvent.preventDefault();
        }
        else
        {
            keyEvent.stopImmediatePropagation();
        }
    }

    HandleKeyDown(keyEvent)
    {
        if (this.m_hasFocus)
        {
            keyEvent.preventDefault();
        }
        else
        {
            keyEvent.stopImmediatePropagation();
        }
    }

    HandleMouseMove(mouseEvent)
    {
        if (this.m_hasFocus)
        {
            mouseEvent.preventDefault();
        }
        else
        {
            mouseEvent.stopImmediatePropagation();
        }
    }

    HandleMouseButtonDown(mouseEvent)
    {
        if (this.m_hasFocus)
        {
            mouseEvent.preventDefault();
        }
        else
        {
            mouseEvent.stopImmediatePropagation();
        }
    }

    HandleMouseButtonUp(mouseEvent)
    {
        if (this.m_hasFocus)
        {
            mouseEvent.preventDefault();
        }
        else
        {
            mouseEvent.stopImmediatePropagation();
        }
    }

    SetFocus(focus)
    {
        this.m_hasFocus = focus;
    }
}
