"use strict";

export class AudioConfig
{
    constructor()
    {

    }
}

export default class AudioSystem
{
    constructor(config)
    {
        this.m_config = config;
    }

    Startup()
    {
        this.m_audioContext = window.AudioContext;
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

    CreateSound(soundFilePath, is3D = false)
    {
        const sound = new Audio(soundFilePath);
        sound.crossOrigin = "anonymous";

        return sound;
    }
}
