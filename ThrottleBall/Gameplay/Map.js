"use strict";

import {WORLD_SIZE_X, WORLD_SIZE_Y} from "/ThrottleBall/Framework/GameCommon.js";
import Ball from "/ThrottleBall/Gameplay/Ball.js";
import Car from "/ThrottleBall/Gameplay/Car.js";

import {g_input, g_renderer} from "/Engine/Core/EngineCommon.js";

import Rgba8 from "/Engine/Core/Rgba8.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";
import {
    AreVelocitiesDiverging2D,
    DoDiscAndOBB2Overlap, GetDistance2D,
    GetNearestPointOnOBB2, GetProjectedLength2D,
    GetProjectedOnto2D, IsPointInsideDisc2D,
    PushDiscAndOBB2OutOffEachOther, PushOBB2OutOfEachOther
} from "/Engine/Math/MathUtils.js";


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

        // DebugFlags
        this.m_drawDebug = true;
        this.m_disableFieldRendering = false;
    }

    Update()
    {
        this.HandleDevCheats();

        // Update Entities
        this.UpdateCars();
        this.m_ball.Update();

        // Push Entities out of each other
        this.HandleCarsVsBallCollisions();
        this.HandleCarVsCarCollisions();

        // Push Entities out of world
        this.PushCarsIntoField();
        this.PushBallIntoField();
    }

    HandleDevCheats()
    {
        if (g_input.WasKeyJustPressed("F1"))
        {
            this.m_drawDebug = !this.m_drawDebug;
        }
        if (g_input.WasKeyJustPressed("F2"))
        {
            this.m_disableFieldRendering = !this.m_disableFieldRendering;
        }
    }

    UpdateCars()
    {
        for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
        {
            this.m_cars[carIndex].Update();
        }
    }

    HandleCarsVsBallCollisions()
    {
        for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
        {
            const car = this.m_cars[carIndex];
            this.HandleCarVsBallCollision(car, this.m_ball);
        }
    }

    HandleCarVsBallCollision(car, ball)
    {
        const carBounds = car.GetBounds();
        const impactPointOnCar = GetNearestPointOnOBB2(ball.m_position, carBounds);
        if (!IsPointInsideDisc2D(impactPointOnCar, ball.m_position, Ball.RADIUS))
        {
            return;
        }

        const dispCarCenterToImpactPoint = impactPointOnCar.GetDifference(car.m_position);
        const impactPointDistanceFromCenterAlongCarFrame = GetProjectedLength2D(dispCarCenterToImpactPoint, carBounds.m_iBasisNormal);
        const impactPointFractionFromCenterAlongCarFrame = impactPointDistanceFromCenterAlongCarFrame / Car.FRAME_LENGTH;
        const impactFrontWeight = impactPointFractionFromCenterAlongCarFrame + 0.5;
        const impactBackWeight = 1.0 - impactFrontWeight;

        const pushDistance = Ball.RADIUS - GetDistance2D(impactPointOnCar, ball.m_position) * 0.5;
        const pushDirectionForBall = ball.m_position.GetDifference(impactPointOnCar).GetNormalized();

        ball.m_position.Add(pushDirectionForBall.GetScaled(pushDistance));
        car.m_frontAxlePosition.Add(pushDirectionForBall.GetScaled(-impactFrontWeight * pushDistance));
        car.m_backAxlePosition.Add(pushDirectionForBall.GetScaled(-impactBackWeight * pushDistance));

        const carImpactPointVelocity = car.m_frontAxleVelocity.GetScaled(impactFrontWeight).GetSum(car.m_backAxleVelocity.GetScaled(impactBackWeight));

        const collisionElasticity = Car.ELASTICITY * Ball.ELASTICITY;

        const ballMomentum = ball.m_velocity.GetScaled(Ball.MASS);
        const carImpactPointMomentum = carImpactPointVelocity.GetScaled(Car.MASS);
        const centerOfMassVelocity = ballMomentum.GetSum(carImpactPointMomentum).GetScaled(1.0 / (Ball.MASS + Car.MASS));

        const ballVelocityInCoMFrame = ball.m_velocity.GetDifference(centerOfMassVelocity);
        const carImpactPointVelocityInCoMFrame = carImpactPointVelocity.GetDifference(centerOfMassVelocity);
        const ballMomentumInCoMFrame = ballVelocityInCoMFrame.GetScaled(Ball.MASS);
        const carImpactPointMomentumInCoMFrame = carImpactPointVelocityInCoMFrame.GetScaled(Car.MASS);

        const directionBallToCarImpactPoint = impactPointOnCar.GetDifference(ball.m_position).GetNormalized();

        const ballNormalMomentumInCoMFrame = GetProjectedOnto2D(ballMomentumInCoMFrame, directionBallToCarImpactPoint);
        const ballTangentMomentumInCoMFrame = ballMomentumInCoMFrame.GetDifference(ballNormalMomentumInCoMFrame);

        const carImpactPointNormalMomentumInCoMFrame = GetProjectedOnto2D(carImpactPointMomentumInCoMFrame, directionBallToCarImpactPoint.GetScaled(-1.0));
        const carImpactPointTangentMomentumInCoMFrame = carImpactPointMomentumInCoMFrame.GetDifference(carImpactPointNormalMomentumInCoMFrame);

        if (AreVelocitiesDiverging2D(ball.m_velocity, carImpactPointVelocity, directionBallToCarImpactPoint))
        {
            return true;
        }

        const ballFinalNormalMomentumInCoMFrame = new Vec2(carImpactPointNormalMomentumInCoMFrame.x, carImpactPointNormalMomentumInCoMFrame.y).GetScaled(collisionElasticity);
        const ballFinalMomentumInCoMFrame = ballTangentMomentumInCoMFrame.GetSum(ballFinalNormalMomentumInCoMFrame);
        const ballFinalVelocityInCoMFrame = ballFinalMomentumInCoMFrame.GetScaled(1.0 / Ball.MASS);
        const ballFinalVelocity = ballFinalVelocityInCoMFrame.GetSum(centerOfMassVelocity);
        ball.m_velocity.x = ballFinalVelocity.x;
        ball.m_velocity.y = ballFinalVelocity.y;

        const carImpactPointFinalNormalMomentumInCoMFrame = new Vec2(ballNormalMomentumInCoMFrame.x, ballNormalMomentumInCoMFrame.y).GetScaled(collisionElasticity);
        const carImpactPointFinalMomentumInCoMFrame = carImpactPointTangentMomentumInCoMFrame.GetSum(carImpactPointFinalNormalMomentumInCoMFrame);
        const carImpactPointFinalVelocityInCoMFrame = carImpactPointFinalMomentumInCoMFrame.GetScaled(1.0 / Car.MASS);
        const carImpactPointFinalVelocity = carImpactPointFinalVelocityInCoMFrame.GetSum(centerOfMassVelocity);
        // mobileBoxVelocity.x = mobileBoxFinalVelocity.x;
        // mobileBoxVelocity.y = mobileBoxFinalVelocity.y;
        car.m_frontAxleVelocity = carImpactPointFinalVelocity.GetScaled(impactFrontWeight);
        car.m_backAxleVelocity = carImpactPointFinalVelocity.GetScaled(impactBackWeight);

        car.PerformFrameCorrectionAndUpdatePosition();
    }

    HandleCarVsCarCollisions()
    {
        for (let car1Index = 0; car1Index < this.m_cars.length - 1; car1Index++)
        {
            for (let car2Index = car1Index + 1; car2Index < this.m_cars.length; car2Index++)
            {
                const car1 = this.m_cars[car1Index];
                const car2 = this.m_cars[car2Index];
                const car1Bounds = car1.GetBounds();
                const car2Bounds = car2.GetBounds();
                PushOBB2OutOfEachOther(car1Bounds, car2Bounds);
                car1.m_frontAxlePosition = car1Bounds.m_center.GetSum(car1.GetForwardNormal().GetScaled(Car.FRAME_LENGTH * 0.5));
                car1.m_backAxlePosition = car1Bounds.m_center.GetDifference(car1.GetForwardNormal().GetScaled(Car.FRAME_LENGTH * 0.5));
                car2.m_frontAxlePosition = car2Bounds.m_center.GetSum(car2.GetForwardNormal().GetScaled(Car.FRAME_LENGTH * 0.5));
                car2.m_backAxlePosition = car2Bounds.m_center.GetDifference(car2.GetForwardNormal().GetScaled(Car.FRAME_LENGTH * 0.5));
                car1.PerformFrameCorrectionAndUpdatePosition();
                car2.PerformFrameCorrectionAndUpdatePosition();
            }
        }
    }

    PushCarsIntoField()
    {
        for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
        {
            const car = this.m_cars[carIndex];

            const cornerPoints = car.GetBounds().GetCornerPoints();
            for (let cornerIndex = 0; cornerIndex < cornerPoints.length; cornerIndex++)
            {
                const cornerPoint = cornerPoints[cornerIndex];
                if (cornerPoint.x > WORLD_SIZE_X)
                {
                    cornerPoint.x = WORLD_SIZE_X;
                }
                if (cornerPoint.x < 0.0)
                {
                    cornerPoint.x = 0.0;
                }
                if (cornerPoint.y > WORLD_SIZE_Y)
                {
                    cornerPoint.y = WORLD_SIZE_Y;
                }
                if (cornerPoint.y < 0.0)
                {
                    cornerPoint.y = 0.0;
                }
            }

            car.m_frontAxlePosition = cornerPoints[1].GetSum(cornerPoints[2]).GetScaled(0.5);
            car.m_backAxlePosition = cornerPoints[0].GetSum(cornerPoints[3]).GetScaled(0.5);
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
        if (this.m_disableFieldRendering)
        {
            return;
        }

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
