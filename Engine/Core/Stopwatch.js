"use strict";

export default class Stopwatch
{
    constructor(duration, clock = Clock.SystemClock)
    {
        this.m_clock = clock;
        this.m_duration = duration;
        this.m_startTime = -1.0;
    }

    Start()
    {
        this.m_startTime = this.m_clock.GetTotalSeconds();
    }

    Restart()
    {
        if (this.m_startTime !== -1.0)
        {
            this.m_startTime = this.m_clock.GetTotalSeconds();
        }
    }

    Stop()
    {
        this.m_startTime = -1.0;
    }

    GetElapsedTime()
    {
        if (this.m_startTime === -1.0)
        {
            return 0.0;
        }
        return this.m_clock.GetTotalSeconds() - this.m_startTime;
    }

    GetElapsedFraction()
    {
        if (this.m_duration === 0.0)
        {
            return 0.0;
        }
        return this.GetElapsedTime() / this.m_duration;
    }

    IsStopped()
    {
        return (this.m_startTime === -1.0);
    }

    HasDurationElapsed()
    {
        return ((this.GetElapsedTime() > this.m_duration) && !this.IsStopped());
    }

    DecrementDurationIfElapsed()
    {
        if (this.HasDurationElapsed())
        {
            this.m_startTime += this.m_duration;
            return true;
        }
        return false;
    }
}
