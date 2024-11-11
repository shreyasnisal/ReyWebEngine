"use strict";

import { g_renderer } from "/Engine/Core/EngineCommon.js";
import GPUMesh from "/Engine/Core/Models/GPUMesh.js";
import Model, { ModelGroup } from "/Engine/Core/Models/Model.js";
import * as FileUtils from "/Engine/Core/FileUtils.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import * as StringUtils from "/Engine/Core/StringUtils.js";

import Mat44 from "/Engine/Math/Mat44.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";
import Vec3 from "/Engine/Math/Vec3.js";
import Vertex_PCUTBN from "/Engine/Core/Vertex_PCUTBN.js";


export class ModelLoaderConfig
{
    constructor()
    {
    }
}

export default class ModelLoader
{
    constructor(config)
    {
        this.m_models = [];
    }

    Startup() {}

    BeginFrame() {}

    EndFrame() {}

    Shutdown() {}

    async CreateOrGetModelFromFile(fileNameWithNoExtension, transform = Mat44.IDENTITY)
    {
        const existingModel = this.GetModelFromName(fileNameWithNoExtension);
        if (existingModel)
        {
            return existingModel;
        }
        return await this.CreateModelFromFile(fileNameWithNoExtension, transform);
    }

    GetModelFromName(name)
    {
        for (let modelIndex = 0; modelIndex < this.m_models.length; modelIndex++)
        {
            if (this.m_models[modelIndex].m_name === name)
            {
                return this.m_models[modelIndex];
            }
        }
    }

    async CreateModelFromFile(fileNameWithNoExtension, transform = Mat44.IDENTITY)
    {
        const fileName = fileNameWithNoExtension + ".obj";

        const positions = [];
        const normals = [];
        const textureCoords = [];
        const materialColorMap = {};
        await this.LoadMaterialFile(materialColorMap, fileNameWithNoExtension);

        return new Promise(resolve => {
            FileUtils.ReadToString(fileName).then(fileContents => {
                const lines = [];
                const numLines = StringUtils.SplitStringOnDelimiter(lines, fileContents, '\n', true);
                for (let lineIndex = 0; lineIndex < numLines; lineIndex++)
                {
                    const lineComponents = [];
                    StringUtils.SplitStringOnDelimiter(lineComponents, lines[lineIndex], ' ', true);

                    if (lineComponents[0] === "v")
                    {
                        let vertexPosition = new Vec3(parseFloat(lineComponents[1]), parseFloat(lineComponents[2]), parseFloat(lineComponents[3]));
                        vertexPosition = transform.TransformPosition3D(vertexPosition);
                        positions.push(vertexPosition);
                    }
                    else if (lineComponents[0] === "vn")
                    {
                        let vertexNormal = new Vec3(parseFloat(lineComponents[1]), parseFloat(lineComponents[2]), parseFloat(lineComponents[3]));
                        vertexNormal = transform.TransformVectorQuantity3D(vertexNormal);
                        normals.push(vertexNormal);
                    }
                    else if (lineComponents[0] === "vt")
                    {
                        const uvCoords = new Vec2(parseFloat(lineComponents[1]), parseFloat(lineComponents[2]));
                        textureCoords.push(uvCoords);
                    }
                }

                let currentColor = Rgba8.WHITE;
                const groups = [];
                let currentModelGroup = new ModelGroup();
                let vertexes = [];

                for (let lineIndex = 0; lineIndex < numLines; lineIndex++)
                {
                    lines[lineIndex] = StringUtils.TrimString(lines[lineIndex]);
                    const lineComponents = [];
                    const numVertexes = StringUtils.SplitStringOnDelimiter(lineComponents, lines[lineIndex], ' ', true);

                    if (lineComponents[0] === "usemtl")
                    {
                        lineComponents[1] = StringUtils.TrimString(lineComponents[1]);
                        currentColor = materialColorMap[lineComponents[1]];
                    }
                    else if (lineComponents[0] === "g")
                    {
                        if (currentModelGroup.m_name !== "")
                        {
                            let cpuMeshName = fileNameWithNoExtension;
                            cpuMeshName += "_" + currentModelGroup.m_name;
                            currentModelGroup.m_cpuMesh.m_name = cpuMeshName;
                            currentModelGroup.m_cpuMesh.m_vertexes = vertexes;
                            currentModelGroup.m_gpuMesh = new GPUMesh(currentModelGroup.m_cpuMesh, g_renderer);
                            vertexes = [];
                            groups.push(currentModelGroup);
                        }
                        currentModelGroup = new ModelGroup(lineComponents[1]);
                    }
                    else if (lineComponents[0] === "f")
                    {
                        let vertexInfo = [];
                        StringUtils.SplitStringOnDelimiter(vertexInfo, lineComponents[1], '/');
                        let vertexPosition = Vec3.ZERO;
                        let vertexUVCoords = Vec2.ZERO;
                        let vertexNormal = Vec3.ZERO;
                        let vertexPosIndex = parseInt(vertexInfo[0]) - 1;
                        vertexPosition = positions[vertexPosIndex];
                        let uvCoordsIndex = parseInt(vertexInfo[1]) - 1;
                        vertexUVCoords = textureCoords[uvCoordsIndex];
                        let vertexNormalIndex = parseInt(vertexInfo[2]) - 1;
                        vertexNormal = normals[vertexNormalIndex];
                        vertexes.push(new Vertex_PCUTBN(vertexPosition, currentColor, vertexUVCoords, Vec3.ZERO, Vec3.ZERO, vertexNormal));

                        vertexInfo = [];
                        StringUtils.SplitStringOnDelimiter(vertexInfo, lineComponents[2], '/');
                        vertexPosIndex = parseInt(vertexInfo[0]) - 1;
                        vertexPosition = positions[vertexPosIndex];
                        uvCoordsIndex = parseInt(vertexInfo[1]) - 1;
                        vertexUVCoords = textureCoords[uvCoordsIndex];
                        vertexNormalIndex = parseInt(vertexInfo[2]) - 1;
                        vertexNormal = normals[vertexNormalIndex];
                        vertexes.push(new Vertex_PCUTBN(vertexPosition, currentColor, vertexUVCoords, Vec3.ZERO, Vec3.ZERO, vertexNormal));

                        vertexInfo = [];
                        StringUtils.SplitStringOnDelimiter(vertexInfo, lineComponents[3], '/');
                        vertexPosIndex = parseInt(vertexInfo[0]) - 1;
                        vertexPosition = positions[vertexPosIndex];
                        uvCoordsIndex = parseInt(vertexInfo[1]) - 1;
                        vertexUVCoords = textureCoords[uvCoordsIndex];
                        vertexNormalIndex = parseInt(vertexInfo[2]) - 1;
                        vertexNormal = normals[vertexNormalIndex];
                        vertexes.push(new Vertex_PCUTBN(vertexPosition, currentColor, vertexUVCoords, Vec3.ZERO, Vec3.ZERO, vertexNormal));

                        for (let vertexIndex = 3; vertexIndex < numVertexes - 1; vertexIndex++)
                        {
                            vertexInfo = [];
                            StringUtils.SplitStringOnDelimiter(vertexInfo, lineComponents[2], '/');
                            vertexPosIndex = parseInt(vertexInfo[0]) - 1;
                            vertexPosition = positions[vertexPosIndex];
                            uvCoordsIndex = parseInt(vertexInfo[1]) - 1;
                            vertexUVCoords = textureCoords[uvCoordsIndex];
                            vertexNormalIndex = parseInt(vertexInfo[2]) - 1;
                            vertexNormal = normals[vertexNormalIndex];
                            vertexes.push(new Vertex_PCUTBN(vertexPosition, currentColor, vertexUVCoords, Vec3.ZERO, Vec3.ZERO, vertexNormal));
                        }
                    }
                }

                let cpuMeshName = fileNameWithNoExtension;
                cpuMeshName += "_" + currentModelGroup.m_name;
                currentModelGroup.m_name = cpuMeshName;
                currentModelGroup.m_cpuMesh.m_vertexes = vertexes;
                currentModelGroup.m_gpuMesh = new GPUMesh(currentModelGroup.m_cpuMesh, g_renderer);
                groups.push(currentModelGroup);

                const newModel = new Model(fileNameWithNoExtension, groups);
                this.m_models.push(newModel);

                resolve(newModel);
            });
        });
    }

    LoadMaterialFile(out_materialColorMap, fileNameWithNoExtension)
    {
        const mtlFilename = fileNameWithNoExtension + ".mtl";
        return new Promise(resolve => {
           FileUtils.ReadToString(mtlFilename).then(fileContents => {
              const lines = [];
              const numLines = StringUtils.SplitStringOnDelimiter(lines, fileContents, '\n', true);
              let currentMtlName = "";
              for (let lineIndex = 0; lineIndex < numLines; lineIndex++)
              {
                  const lineComponents = [];
                  StringUtils.SplitStringOnDelimiter(lineComponents, lines[lineIndex], ' ');
                  if (lineComponents[0] === "newmtl")
                  {
                      if (out_materialColorMap[currentMtlName] == null)
                      {
                          out_materialColorMap[currentMtlName] = Rgba8.WHITE;
                      }

                      currentMtlName = lineComponents[1];
                      currentMtlName = StringUtils.TrimString(currentMtlName);
                  }
                  else if (lineComponents[0] === "Kd")
                  {
                      let redFloatStr = lineComponents[1];
                      let greenFloatStr = lineComponents[2];
                      let blueFloatStr = lineComponents[3];
                      redFloatStr = StringUtils.TrimString(redFloatStr);
                      greenFloatStr = StringUtils.TrimString(greenFloatStr);
                      blueFloatStr = StringUtils.TrimString(blueFloatStr);
                      const materialColor = new Rgba8();
                      materialColor.r = MathUtils.RoundDownToInt(parseFloat(redFloatStr) * 255.0);
                      materialColor.g = MathUtils.RoundDownToInt(parseFloat(greenFloatStr) * 255.0);
                      materialColor.b = MathUtils.RoundDownToInt(parseFloat(blueFloatStr) * 255.0);

                      out_materialColorMap[currentMtlName] = materialColor;
                  }
              }

               if (out_materialColorMap[currentMtlName] == null)
               {
                   out_materialColorMap[currentMtlName] = Rgba8.WHITE;
               }

               resolve();
           });
        });
    }
}
