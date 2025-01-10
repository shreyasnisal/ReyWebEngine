"use strict";

export function CreateVideoFromSource(sourceString, loop = false, muted = false)
{
    const video = document.createElement("video");
    video.src = sourceString;
    video.autoplay = false;
    video.loop = loop;
    video.crossOrigin = "anonymous";
    video.muted = muted;

    return video;
}
