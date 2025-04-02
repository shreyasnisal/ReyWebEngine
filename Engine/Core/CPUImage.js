"use strict";

import Rgba8 from "/Engine/Core/Rgba8.js";

import Vec2 from "/Engine/Math/Vec2.js";


export default class CPUImage
{
    constructor(imageSrc, loadCallback = null)
    {
        this.m_texelData = null;
        this.m_width = 0;
        this.m_height = 0;

        const image = new Image();
        image.src = imageSrc;
        image.crossOrigin = "anonymous";

        image.addEventListener("load", () => {
            this.m_width = image.width;
            this.m_height = image.height;

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.width = image.width;
            canvas.height = image.height;

            context.drawImage(image, 0, 0);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const texelData = imageData.data;

            this.m_texelData = [];
            for (let texelIndex = 0; texelIndex < texelData.length; texelIndex += 4)
            {
                this.m_texelData[texelIndex / 4] = new Rgba8(texelData[texelIndex], texelData[texelIndex + 1], texelData[texelIndex + 2], texelData[texelIndex + 3]);
            }

            if (loadCallback != null)
            {
                loadCallback(this);
            }
        });
    }

    GetTexelAtCoords(x, y)
    {
        const texelIndex = x + y * this.m_width;
        return this.m_texelData[texelIndex];
    }

    GetDimensions()
    {
        return new Vec2(this.m_width, this.m_height);
    }
}
