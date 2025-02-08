"use strict";

import {WORLD_SIZE_X, WORLD_SIZE_Y} from "/ThrottleBall/Framework/GameCommon.js";
import Ball from "/ThrottleBall/Gameplay/Ball.js";
import Car from "/ThrottleBall/Gameplay/Car.js";

import { g_renderer } from "/Engine/Core/EngineCommon.js";

import Rgba8 from "/Engine/Core/Rgba8.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";


export default class Map
{
    constructor(game)
    {
        this.m_game = game;
        this.m_cars = [];
        this.m_ball = new Ball(this, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y).GetScaled(0.5));

        this.m_cars.push(new Car(this, new Vec2(WORLD_SIZE_X * 0.3, WORLD_SIZE_Y * 0.5), 0.0, this.m_game.m_players[0]));
        this.m_cars.push(new Car(this, new Vec2(WORLD_SIZE_X * 0.7, WORLD_SIZE_Y * 0.5), 180.0, this.m_game.m_players[1]));
        this.m_game.m_players[0].SetCar(this.m_cars[0]);
        this.m_game.m_players[1].SetCar(this.m_cars[1]);

        this.m_drawDebug = true;
    }

    Update()
    {
        // Update Entities
        this.UpdateCars();
        this.m_ball.Update();

        // Push Entities out of each other
        this.HandleCarVsBallCollisions();

        // Push Entities out of world
        this.PushCarsIntoField();
        this.PushBallIntoField();
    }

    UpdateCars()
    {
        for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
        {
            this.m_cars[carIndex].Update();
        }
    }

    HandleCarVsBallCollisions()
    {
        for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
        {
            const ballPositionBeforePush = new Vec2(this.m_ball.m_position.x, this.m_ball.m_position.y);
            if (MathUtils.PushDiscOutOfFixedOBB2(this.m_ball.m_position, Ball.RADIUS, this.m_cars[carIndex].GetBounds()))
            {
                const impulseDirection = this.m_ball.m_position.GetDifference(ballPositionBeforePush).GetNormalized();
                const impulseMagnitude = MathUtils.GetProjectedLength2D(this.m_cars[carIndex].m_frontAxleVelocity, impulseDirection) * Car.MASS;
                this.m_ball.AddImpulse(impulseDirection.GetScaled(impulseMagnitude));
            }
        }
    }

    HandleCarVsCarCollisions()
    {

    }

    PushCarsIntoField()
    {
        for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
        {
            const car = this.m_cars[carIndex];

            // Front axle position correction
            if (car.m_frontAxlePosition.x > WORLD_SIZE_X)
            {
                car.m_frontAxlePosition.x = WORLD_SIZE_X;
            }
            if (car.m_frontAxlePosition.x < 0.0)
            {
                car.m_frontAxlePosition.x = 0.0;
            }
            if (car.m_frontAxlePosition.y > WORLD_SIZE_Y)
            {
                car.m_frontAxlePosition.y = WORLD_SIZE_Y;
            }
            if (car.m_frontAxlePosition.y < 0.0)
            {
                car.m_frontAxlePosition.y = 0.0;
            }

            // Back axle position correction
            if (car.m_backAxlePosition.x > WORLD_SIZE_X)
            {
                car.m_backAxlePosition.x = WORLD_SIZE_X;
            }
            if (car.m_backAxlePosition.x < 0.0)
            {
                car.m_backAxlePosition.x = 0.0;
            }
            if (car.m_backAxlePosition.y > WORLD_SIZE_Y)
            {
                car.m_backAxlePosition.y = WORLD_SIZE_Y;
            }
            if (car.m_backAxlePosition.y < 0.0)
            {
                car.m_backAxlePosition.y = 0.0;
            }

            car.PerformFrameCorrectionAndUpdatePosition();
        }
    }

    PushBallIntoField()
    {
        if (this.m_ball.m_position.x + Ball.RADIUS > WORLD_SIZE_X)
        {
            this.m_ball.m_position.x = WORLD_SIZE_X - Ball.RADIUS;
            this.m_ball.m_velocity.x = -this.m_ball.m_velocity.x;
        }
        if (this.m_ball.m_position.x - Ball.RADIUS < 0.0)
        {
            this.m_ball.m_position.x = Ball.RADIUS;
            this.m_ball.m_velocity.x = -this.m_ball.m_velocity.x;
        }
        if (this.m_ball.m_position.y + Ball.RADIUS > WORLD_SIZE_Y)
        {
            this.m_ball.m_position.y = WORLD_SIZE_Y - Ball.RADIUS;
            this.m_ball.m_velocity.y = -this.m_ball.m_velocity.y;
        }
        if (this.m_ball.m_position.y - Ball.RADIUS < 0.0)
        {
            this.m_ball.m_position.y = Ball.RADIUS;
            this.m_ball.m_velocity.y = -this.m_ball.m_velocity.y;
        }
    }

    Render()
    {
        this.RenderField();
        this.RenderCars();
        this.m_ball.Render();
    }

    RenderField()
    {
        const fieldColor = new Rgba8(126, 217, 87);
        const fieldVerts = [];
        const fieldCenter = new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y).GetScaled(0.5);

        // Background
        VertexUtils.AddPCUVertsForAABB2(fieldVerts, this.m_game.m_worldCamera.GetOrthoBounds(), fieldColor);

        // Central Lines
        VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(WORLD_SIZE_X * 0.5, 0.0), new Vec2(WORLD_SIZE_X * 0.5, WORLD_SIZE_Y), 0.25);
        VertexUtils.AddPCUVertsForRing2D(fieldVerts, fieldCenter, 15.0, 0.4);
        VertexUtils.AddPCUVertsForDisc2D(fieldVerts, fieldCenter, 1.0);

        // Left Penalty Area
        VertexUtils.AddPCUVertsForArc2D(fieldVerts, new Vec2(WORLD_SIZE_X * 0.1, WORLD_SIZE_Y * 0.5), WORLD_SIZE_X * 0.01 + 15.0, 0.4, -55, 55);
        VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(0.0, WORLD_SIZE_Y * 0.2), new Vec2(WORLD_SIZE_X * 0.15, WORLD_SIZE_Y * 0.2), 0.25);
        VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(0.0, WORLD_SIZE_Y * 0.8), new Vec2(WORLD_SIZE_X * 0.15, WORLD_SIZE_Y * 0.8), 0.25);
        VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(WORLD_SIZE_X * 0.15, WORLD_SIZE_Y * 0.2), new Vec2(WORLD_SIZE_X * 0.15, WORLD_SIZE_Y * 0.8), 0.25);

        // Left Penalty Area
        VertexUtils.AddPCUVertsForArc2D(fieldVerts, new Vec2(WORLD_SIZE_X * 0.9, WORLD_SIZE_Y * 0.5), WORLD_SIZE_X * 0.01 + 15.0, 0.4, 125, 235);
        VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y * 0.2), new Vec2(WORLD_SIZE_X * 0.85, WORLD_SIZE_Y * 0.2), 0.25);
        VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y * 0.8), new Vec2(WORLD_SIZE_X * 0.85, WORLD_SIZE_Y * 0.8), 0.25);
        VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(WORLD_SIZE_X * 0.85, WORLD_SIZE_Y * 0.2), new Vec2(WORLD_SIZE_X * 0.85, WORLD_SIZE_Y * 0.8), 0.25);

        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(fieldVerts);
    }

    RenderCars()
    {
        for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
        {
            this.m_cars[carIndex].Render();
        }
    }
}
