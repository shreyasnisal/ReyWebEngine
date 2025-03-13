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
        sound.controls = false;
        sound.crossOrigin = "anonymous";

        return sound;
    }

    PlaySound(sound, isLooped = false, volume = 1.0, speed = 1.0, paused = false)
    {
        sound.loop = isLooped;
        sound.volume = volume;
        sound.playbackRate = speed;
        if (paused)
        {
            sound.pause();
        }
        sound.play();
    }
}
