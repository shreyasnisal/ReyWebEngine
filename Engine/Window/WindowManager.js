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

        document.onpointerlockerror = () => this.HandlePointerLockError();
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
        if (keyEvent.code === "Escape")
        {
            this.SetFocus(false);
        }
        else
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
    }

    HandleMouseMove(mouseEvent)
    {
    }

    HandleMouseButtonDown(mouseEvent)
    {
    }

    HandleMouseButtonUp(mouseEvent)
    {
    }

    HandlePointerLockError()
    {
        this.m_canvas.requestPointerLock();
    }

    SetFocus(focus)
    {
        this.m_hasFocus = focus;
        if (focus)
        {
            this.m_canvas.requestPointerLock();
        }
        else
        {
            document.exitPointerLock();
        }
    }
}
