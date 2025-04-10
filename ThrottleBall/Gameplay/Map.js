"use strict";

import {
    WORLD_SIZE_X,
    WORLD_SIZE_Y,
    SCREEN_SIZE_Y,
    Team,
    GetTimeStringFromSeconds
} from "/ThrottleBall/Framework/GameCommon.js";
import Ball from "/ThrottleBall/Gameplay/Ball.js";
import Car from "/ThrottleBall/Gameplay/Car.js";
import {GameState} from "/ThrottleBall/Framework/Game.js";
import Goal from "/ThrottleBall/Gameplay/Goal.js";

import {g_debugRenderSystem, g_input, g_renderer, g_audio} from "/Engine/Core/EngineCommon.js";

import Rgba8 from "/Engine/Core/Rgba8.js";
import Stopwatch from "/Engine/Core/Stopwatch.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";
import {
    AreVelocitiesDiverging2D,
    DoDiscAndOBB2Overlap, DotProduct2D, GetDistance2D, GetNearestPointOnAABB2,
    GetNearestPointOnOBB2, GetProjectedLength2D,
    GetProjectedOnto2D, IsPointInsideDisc2D,
    PushDiscAndOBB2OutOffEachOther, PushOBB2OutOfEachOther
} from "/Engine/Math/MathUtils.js";

import {g_aspect} from "/Engine/Renderer/Renderer.js";


export default class Map
{
    constructor(game)
    {
        this.m_game = game;
        this.m_cars = [];
        this.m_ball = new Ball(this, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y).GetScaled(0.5));

        this.m_cars.push(new Car(this, new Vec2(WORLD_SIZE_X * 0.3, WORLD_SIZE_Y * 0.5), 0.0, this.m_game.m_players[0], Team.PINK));
        this.m_cars.push(new Car(this, new Vec2(WORLD_SIZE_X * 0.7, WORLD_SIZE_Y * 0.5), 180.0, this.m_game.m_players[1], Team.PURPLE));
        this.m_game.m_players[0].SetCar(this.m_cars[0]);
        this.m_game.m_players[1].SetCar(this.m_cars[1]);

        this.m_pinkTeamGoal = new Goal(this, new Vec2(WORLD_SIZE_X * 0.02, WORLD_SIZE_Y * 0.5), 0.0, Team.PINK);
        this.m_purpleTeamGoal = new Goal(this, new Vec2(WORLD_SIZE_X * 0.98, WORLD_SIZE_Y * 0.5), 180.0, Team.PURPLE);

        this.m_pinkTeamScore = 0;
        this.m_purpleTeamScore = 0;
        this.m_isSuddenDeath = false;

        this.m_matchTimer = new Stopwatch(300.0, this.m_game.m_clock);
        this.m_matchTimer.Start();

        // DebugFlags
        this.m_drawDebug = true;
        this.m_disableFieldRendering = false;
        this.m_disableBallCollisions = false;

        // SFX
        this.m_carVsBallSFX = g_audio.CreateSound("/ThrottleBall/Data/Audio/CarVsBall.ogg");
        this.m_ballBoundsSFX = g_audio.CreateSound("/ThrottleBall/Data/Audio/BallBounds.ogg");
        this.m_ballVsGoalPost = g_audio.CreateSound("/ThrottleBall/Data/Audio/BallVsGoalPost.ogg");
        this.m_goalScored = g_audio.CreateSound("/ThrottleBall/Data/Audio/GoalScored.ogg");
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
        this.HandleBallVsGoalsCollision();

        // Push Entities out of world
        this.PushCarsIntoField();
        this.PushBallIntoField();

        // Check for math end
        this.CheckMatchEnd();
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
        if (g_input.WasKeyJustPressed("F3"))
        {
            this.m_disableBallCollisions = !this.m_disableBallCollisions;
        }
        if (g_input.WasKeyJustPressed("1"))
        {
            this.ResetCarsAndBall();
        }
        if (g_input.WasKeyJustPressed("2"))
        {
            this.m_ball.m_position = new Vec2(WORLD_SIZE_X * 0.5, WORLD_SIZE_Y * 0.5);
            this.m_ball.m_velocity = new Vec2(0.0, 0.0);

            this.m_cars.pop();
            this.m_cars.pop();

            this.m_cars.push(new Car(this, new Vec2(WORLD_SIZE_X * 0.3, WORLD_SIZE_Y * 0.5), 0.0, this.m_game.m_players[0], Team.PINK));
            this.m_game.m_players[0].SetCar(this.m_cars[0]);

            this.m_cars.push(new Car(this, new Vec2(WORLD_SIZE_X * 0.7, WORLD_SIZE_Y * 0.45), 90.0, this.m_game.m_players[1], Team.PURPLE));
            this.m_game.m_players[1].SetCar(this.m_cars[1]);
        }
        if (g_input.WasKeyJustPressed("3"))
        {
            this.m_ball.m_position = new Vec2(WORLD_SIZE_X * 0.5, WORLD_SIZE_Y * 0.5);
            this.m_ball.m_velocity = new Vec2(0.0, 0.0);

            this.m_cars.pop();
            this.m_cars.pop();

            this.m_cars.push(new Car(this, new Vec2(WORLD_SIZE_X * 0.3, WORLD_SIZE_Y * 0.5), 0.0, this.m_game.m_players[0], Team.PINK));
            this.m_game.m_players[0].SetCar(this.m_cars[0]);

            this.m_cars.push(new Car(this, new Vec2(WORLD_SIZE_X * 0.7, WORLD_SIZE_Y * 0.55), 90.0, this.m_game.m_players[1], Team.PURPLE));
            this.m_game.m_players[1].SetCar(this.m_cars[1]);
        }

        g_debugRenderSystem.AddMessage("Debug Draw: " + (this.m_drawDebug ? "ON" : "OFF"), 0.0);
        g_debugRenderSystem.AddMessage("Field Rendering: " + (this.m_disableFieldRendering ? "OFF" : "ON"), 0.0);
        g_debugRenderSystem.AddMessage("Ball Collisions: " + (this.m_disableBallCollisions ? "OFF" : "ON"), 0.0);
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
        if (this.m_disableBallCollisions)
        {
            return;
        }

        for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
        {
            const car = this.m_cars[carIndex];
            this.HandleCarVsBallCollision(car, this.m_ball);
        }
    }

    HandleCarVsBallCollision(car, ball)
    {
        if (this.m_disableBallCollisions)
        {
            return;
        }

        const carBounds = car.GetBounds();
        const impactPointOnCar = GetNearestPointOnOBB2(ball.m_position, carBounds);
        if (!IsPointInsideDisc2D(impactPointOnCar, ball.m_position, Ball.RADIUS))
        {
            return;
        }

        g_audio.PlaySound(this.m_carVsBallSFX);

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

                // this.HandleCarVsCarCollision(car1, car2);

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

    HandleCarVsCarCollision(car1, car2)
    {
        const car1Bounds = car1.GetBounds();
        const car2Bounds = car2.GetBounds();
    }

    HandleBallVsGoalsCollision()
    {
        if (this.m_disableBallCollisions)
        {
            return;
        }

        this.HandleBallVsGoalCollision(this.m_ball, this.m_pinkTeamGoal);
        this.HandleBallVsGoalCollision(this.m_ball, this.m_purpleTeamGoal);
    }

    HandleBallVsGoalCollision(ball, goal)
    {
        if (this.m_disableBallCollisions)
        {
            return;
        }

        const goalPostBounds = goal.GetGoalPostBounds();

        const nearestPointOnGoalPostBounds0 = GetNearestPointOnAABB2(ball.m_position, goalPostBounds[0]);
        const nearestPointOnGoalPostBounds1 = GetNearestPointOnAABB2(ball.m_position, goalPostBounds[1]);

        if (MathUtils.PushDiscOutOfFixedPoint2D(ball.m_position, Ball.RADIUS, nearestPointOnGoalPostBounds0))
        {
            g_audio.PlaySound(this.m_ballVsGoalPost);

            const dispBallToNearestPoint = nearestPointOnGoalPostBounds0.GetDifference(ball.m_position);
            const ballNormalVelocity = MathUtils.GetProjectedOnto2D(ball.m_velocity, dispBallToNearestPoint);
            const ballTangentVelocity = ball.m_velocity.GetDifference(ballNormalVelocity);
            ballNormalVelocity.Scale(-Ball.ELASTICITY * Goal.POLE_ELASTICITY);
            ball.m_velocity = ballNormalVelocity.GetSum(ballTangentVelocity);
        }

        if (MathUtils.PushDiscOutOfFixedPoint2D(ball.m_position, Ball.RADIUS, nearestPointOnGoalPostBounds1))
        {
            g_audio.PlaySound(this.m_ballVsGoalPost);

            const dispBallToNearestPoint = nearestPointOnGoalPostBounds1.GetDifference(ball.m_position);
            const ballNormalVelocity = MathUtils.GetProjectedOnto2D(ball.m_velocity, dispBallToNearestPoint);
            const ballTangentVelocity = ball.m_velocity.GetDifference(ballNormalVelocity);
            ballNormalVelocity.Scale(-Ball.ELASTICITY * Goal.POLE_ELASTICITY);
            ball.m_velocity = ballNormalVelocity.GetSum(ballTangentVelocity);
        }

        const goalBounds = goal.GetBounds();
        if (MathUtils.IsPointInsideAABB2(ball.m_position, goalBounds))
        {
            g_audio.PlaySound(this.m_goalScored);
            this.IncrementScoreForTeam(goal.m_team === Team.PINK ? Team.PURPLE : Team.PINK);
            this.ResetCarsAndBall();
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
            g_audio.PlaySound(this.m_ballBoundsSFX);
            this.m_ball.m_position.x = WORLD_SIZE_X - Ball.RADIUS;
            this.m_ball.m_velocity.x = -this.m_ball.m_velocity.x;
        }
        if (this.m_ball.m_position.x - Ball.RADIUS < 0.0)
        {
            g_audio.PlaySound(this.m_ballBoundsSFX);
            this.m_ball.m_position.x = Ball.RADIUS;
            this.m_ball.m_velocity.x = -this.m_ball.m_velocity.x;
        }
        if (this.m_ball.m_position.y + Ball.RADIUS > WORLD_SIZE_Y)
        {
            g_audio.PlaySound(this.m_ballBoundsSFX);
            this.m_ball.m_position.y = WORLD_SIZE_Y - Ball.RADIUS;
            this.m_ball.m_velocity.y = -this.m_ball.m_velocity.y;
        }
        if (this.m_ball.m_position.y - Ball.RADIUS < 0.0)
        {
            g_audio.PlaySound(this.m_ballBoundsSFX);
            this.m_ball.m_position.y = Ball.RADIUS;
            this.m_ball.m_velocity.y = -this.m_ball.m_velocity.y;
        }
    }

    Render()
    {
        this.RenderField();
        this.RenderCars();
        this.m_ball.Render();
        this.RenderGoals();
        this.RenderHUD();
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

    RenderGoals()
    {
        this.m_pinkTeamGoal.Render();
        this.m_purpleTeamGoal.Render();
    }

    RenderHUD()
    {
        g_debugRenderSystem.AddScreenText(this.m_pinkTeamScore + " - " + this.m_purpleTeamScore, new Vec2(SCREEN_SIZE_Y * g_aspect  * 0.5, SCREEN_SIZE_Y), 20.0, new Vec2(0.5, 1.25), 0.0, Rgba8.MAGENTA, Rgba8.MAGENTA);
        if (!this.m_isSuddenDeath)
        {
            g_debugRenderSystem.AddScreenText(GetTimeStringFromSeconds(this.m_matchTimer.GetRemainingSeconds()), new Vec2(SCREEN_SIZE_Y * g_aspect  * 0.5, SCREEN_SIZE_Y - 20.0), 20.0, new Vec2(0.5, 1.25), 0.0, Rgba8.MAGENTA, Rgba8.MAGENTA);
        }
        else
        {
            g_debugRenderSystem.AddScreenText("Sudden Death!", new Vec2(SCREEN_SIZE_Y * g_aspect  * 0.5, SCREEN_SIZE_Y - 20.0), 20.0, new Vec2(0.5, 1.25), 0.0, Rgba8.MAGENTA, Rgba8.MAGENTA);
        }
    }

    ResetCarsAndBall()
    {
        this.m_ball.m_position = new Vec2(WORLD_SIZE_X * 0.5, WORLD_SIZE_Y * 0.5);
        this.m_ball.m_velocity = new Vec2(0.0, 0.0);

        this.m_cars.pop();
        this.m_cars.pop();

        this.m_cars.push(new Car(this, new Vec2(WORLD_SIZE_X * 0.3, WORLD_SIZE_Y * 0.5), 0.0, this.m_game.m_players[0], Team.PINK));
        this.m_game.m_players[0].SetCar(this.m_cars[0]);

        this.m_cars.push(new Car(this, new Vec2(WORLD_SIZE_X * 0.7, WORLD_SIZE_Y * 0.5), 180.0, this.m_game.m_players[1], Team.PURPLE));
        this.m_game.m_players[1].SetCar(this.m_cars[1]);
    }

    IncrementScoreForTeam(team)
    {
        if (team === Team.PINK)
        {
            this.m_pinkTeamScore++;
        }
        else if (team === Team.PURPLE)
        {
            this.m_purpleTeamScore++;
        }

        if (this.m_isSuddenDeath)
        {
            this.m_game.m_nextState = GameState.MATCH_END;
        }
    }

    CheckMatchEnd()
    {
        // Check for end of match
        if (this.m_matchTimer.HasDurationElapsed())
        {
            if (this.m_pinkTeamScore === this.m_purpleTeamScore)
            {
                this.m_matchTimer.Stop();
                this.m_isSuddenDeath = true;
            }
            else
            {
                this.m_matchTimer.Stop();
                this.m_game.m_nextState = GameState.MATCH_END;
            }
        }
    }
}
