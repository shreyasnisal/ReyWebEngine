"use strict";

import * as MathUtils from "/Engine/Math/MathUtils.js";

export default class Clock
{
    static SystemClock = new Clock();
    static TickSystemClock()
    {
        Clock.SystemClock.Tick();
    }

    constructor(parent = null)
    {
        if (parent === null && Clock.SystemClock)
        {
            this.m_parent = Clock.SystemClock;
            Clock.SystemClock.AddChild(this);
        }
        else if (parent !== null)
        {
            this.m_parent = parent;
            parent.AddChild(this);
        }

        this.m_children = [];
        this.m_lastUpdatedTimeSeconds = 0.0;
        this.m_totalSeconds = 0.0;
        this.m_deltaSeconds = 0.0;
        this.m_frameCount = 0;
        this.m_timeScale = 1.0;
        this.m_isPaused = false;
        this.m_singleStepFrame = false;
        this.m_maxDeltaSeconds = 0.1;
    }

    IsPaused() { return this.m_isPaused; }
    Pause() { this.m_isPaused = true; }
    Unpause() { this.m_isPaused = false; }
    TogglePause() { this.m_isPaused = !this.m_isPaused; }
    SetTimeScale(timeScale) { this.m_timeScale = timeScale; }
    GetTimeScale() { return this.m_timeScale; }
    GetDeltaSeconds() { return this.m_deltaSeconds; }
    GetTotalSeconds() { return this.m_totalSeconds; }
    GetFrameCount() { return this.m_frameCount; }

    Reset()
    {
        this.m_totalSeconds = 0.0;
        this.m_deltaSeconds = 0.0;
        this.m_frameCount = 0;
        this.m_lastUpdatedTimeSeconds = Date.now() / 1000.0;
    }

    SingleStepFrame()
    {
        this.m_singleStepFrame = true;
    }

    AddChild(childClock)
    {
        this.m_children.push(childClock);
    }

    RemoveChild(childClock)
    {
        for (let childIndex = 0; childIndex < this.m_children.length; childIndex++)
        {
            if (this.m_children[childIndex] === childClock)
            {
                this.m_children.splice(childIndex, 1);
            }
        }
    }

    Tick()
    {
        const currentTimeSeconds = Date.now() / 1000.0;
        const deltaSeconds = MathUtils.GetClamped(currentTimeSeconds - this.m_lastUpdatedTimeSeconds, 0.0, this.m_maxDeltaSeconds);
        this.Advance(deltaSeconds);
        this.m_lastUpdatedTimeSeconds = currentTimeSeconds;
    }

    Advance(deltaSeconds)
    {
        if (this.m_singleStepFrame)
        {
            this.m_isPaused = false;
        }

        deltaSeconds *= this.m_timeScale;
        if (this.m_isPaused)
        {
            deltaSeconds *= 0.0;
        }

        this.m_totalSeconds += deltaSeconds;
        this.m_deltaSeconds = deltaSeconds;
        this.m_frameCount++;

        for (let childIndex = 0; childIndex < this.m_children.length; childIndex++)
        {
            this.m_children[childIndex].Advance(deltaSeconds);
        }

        if (this.m_singleStepFrame)
        {
            this.m_isPaused = true;
            this.m_singleStepFrame = false;
        }
    }
}
