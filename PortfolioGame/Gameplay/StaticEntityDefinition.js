"use strict";

import {g_modelLoader, g_renderer} from "/Engine/Core/EngineCommon.js";

import * as FileUtils from "/Engine/Core/FileUtils.js";
import Rgba8 from "/Engine/Core/Rgba8.js";

import AABB3 from "/Engine/Math/AABB3.js";
import EulerAngles from "/Engine/Math/EulerAngles.js";
import Mat44 from "/Engine/Math/Mat44.js";
import Vec3 from "/Engine/Math/Vec3.js";
import Vec4 from "/Engine/Math/Vec4.js";


export default class StaticEntityDefinition
{
    static s_staticEntityDefinitions = {};

    constructor(jsonObject)
    {
        this.m_name = jsonObject.name;
        this.m_mapImageColor = new Rgba8();
        this.m_mapImageColor.SetFromString(jsonObject.mapImageColor);
        if (jsonObject.texture == null || jsonObject.texture === "default")
        {
            this.m_texture = null;
        }
        else
        {
            g_renderer.CreateOrGetTextureFromFile(jsonObject.texture).then(texture =>
            {
                this.m_texture = texture;
            });
        }
        g_modelLoader.CreateOrGetModelFromFile(jsonObject.model, new Mat44(Vec4.SOUTH, Vec4.SKYWARD, Vec4.WEST, Vec4.ZERO_TRANSLATION)).then(model =>
        {
            this.m_model = model;
        });

        this.m_orientation = new EulerAngles();
        this.m_orientation.SetFromString(jsonObject.orientation);
        this.m_angularVelocity = new EulerAngles();
        this.m_angularVelocity.SetFromString(jsonObject.angularVelocity);

        this.m_scale = jsonObject.scale;

        this.m_bounds = new AABB3();
        this.m_bounds.SetFromString(jsonObject.bounds);
        this.m_position = new Vec3(0.0, 0.0, 0.0);
        this.m_position.SetFromString(jsonObject.position);
        const halfDimensions = this.m_bounds.GetDimensions().GetScaled(0.5 * this.m_scale);
        const orientationBasis = this.m_orientation.GetAsVectors_iFwd_jLeft_kUp();
        this.m_position.Add(orientationBasis[0].GetScaled(halfDimensions.x));
        this.m_position.Subtract(orientationBasis[1].GetScaled(halfDimensions.y));
    }

    static Initialize()
    {
        const jsonFilePath = "/PortfolioGame/Data/Definitions/StaticEntityDefinitions.json";
        FileUtils.ReadToString(jsonFilePath).then(fileContents =>
        {
           const parsedFileContents = JSON.parse(fileContents);
           for (let staticEntityDefIndex = 0; staticEntityDefIndex < parsedFileContents["StaticEntityDefinitions"].length; staticEntityDefIndex++)
           {
               const staticEntityDef = new StaticEntityDefinition(parsedFileContents["StaticEntityDefinitions"][staticEntityDefIndex]);
               StaticEntityDefinition.s_staticEntityDefinitions[staticEntityDef.m_name] = staticEntityDef;
           }
        });
    }
}
