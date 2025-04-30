"use strict";

import {
    WORLD_SIZE_X,
    WORLD_SIZE_Y,
    SCREEN_SIZE_Y,
    Team,
    GetTimeStringFromSeconds, CAR_IMAGE_PATHS, TERTIARY_COLOR_VARIANT_DARK, GetTeamColor
} from "/ThrottleBall/Framework/GameCommon.js";
import Ball from "/ThrottleBall/Gameplay/Ball.js";
import Car from "/ThrottleBall/Gameplay/Car.js";
import Game, { GameState } from "/ThrottleBall/Framework/Game.js";
import Goal from "/ThrottleBall/Gameplay/Goal.js";

import {g_debugRenderSystem, g_input, g_renderer, g_audio} from "/Engine/Core/EngineCommon.js";

import Rgba8 from "/Engine/Core/Rgba8.js";
import Stopwatch from "/Engine/Core/Stopwatch.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import AABB2 from "/Engine/Math/AABB2.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";

import {g_aspect} from "/Engine/Renderer/Renderer.js";
import {PushOBB2OutOfEachOther} from "/Engine/Math/MathUtils.js";


export default class Map
{
    constructor(game)
    {
        this.m_game = game;
        this.m_cars = [];
        this.m_ball = new Ball(this, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y).GetScaled(0.5));

        this.InitializeCars();

        this.m_blueTeamGoal = new Goal(this, new Vec2(WORLD_SIZE_X * 0.02, WORLD_SIZE_Y * 0.5), 0.0, Team.BLUE);
        this.m_redTeamGoal = new Goal(this, new Vec2(WORLD_SIZE_X * 0.98, WORLD_SIZE_Y * 0.5), 180.0, Team.RED);

        this.m_isSuddenDeath = false;

        this.m_matchTimer = new Stopwatch(Game.MATCH_DURATION_SECONDS, this.m_game.m_clock);
        this.m_matchTimer.Start();

        this.m_clockBlinkTimer = new Stopwatch(1.0, this.m_game.m_clock);

        this.m_countdownTimer = new Stopwatch(3.0);
        setTimeout(() => {
            this.m_game.m_countdownTimerWidget.SetVisible(true);
            this.m_countdownTimer.Start();
            this.m_game.m_clock.Pause();
        }, this.m_game.m_transitionTimer.m_duration * 1000 + 100);

        // DebugFlags
        this.m_drawDebug = false;
        this.m_disableFieldRendering = false;
        this.m_disableBallCollisions = false;

        // SFX
        this.m_carVsBallSFX = "/ThrottleBall/Data/Audio/CarVsBall.ogg";
        this.m_ballBoundsSFX = "/ThrottleBall/Data/Audio/BallBounds.ogg";
        this.m_ballVsGoalPost = "/ThrottleBall/Data/Audio/BallVsGoalPost.ogg";
        this.m_goalScored = "/ThrottleBall/Data/Audio/GoalScored.ogg";
    }

    InitializeCars()
    {
        const numCars = this.m_game.m_players.length;

        let numCarsInBlueTeam = 0;
        let numCarsInRedTeam = 0;
        for (let carIndex = 0; carIndex < numCars; carIndex++)
        {
            if (this.m_game.m_players[carIndex] == null)
            {
                continue;
            }

            let carPosition = new Vec2();
            if (this.m_game.m_players[carIndex].m_team === Team.BLUE)
            {
                carPosition = this.GetCarPositionFromNumCarsInTeamAlreadySpawned(numCarsInBlueTeam, Team.BLUE);
                numCarsInBlueTeam++;
            }
            else if (this.m_game.m_players[carIndex].m_team === Team.RED)
            {
                carPosition = this.GetCarPositionFromNumCarsInTeamAlreadySpawned(numCarsInRedTeam, Team.RED);
                numCarsInRedTeam++;
            }

            const carOrientation = this.GetCarOrientationFromPosition(carPosition);

            this.m_cars.push(new Car(this, carPosition, carOrientation, this.m_game.m_players[carIndex], this.m_game.m_players[carIndex].m_team, CAR_IMAGE_PATHS[this.m_game.m_playerCarChoiceIndexes[carIndex]]));
            this.m_game.m_players[carIndex].SetCar(this.m_cars[carIndex]);
        }
    }

    GetCarPositionFromNumCarsInTeamAlreadySpawned(numCarsInTeamAlreadySpawned, team)
    {
        const carPosition = new Vec2();
        if (team === Team.BLUE)
        {
            carPosition.x = WORLD_SIZE_X * 0.3;
        }
        else if (team === Team.RED)
        {
            carPosition.x = WORLD_SIZE_X * 0.7;
        }

        if (numCarsInTeamAlreadySpawned === 0)
        {
            carPosition.y = WORLD_SIZE_Y * 0.5;
        }
        else if (numCarsInTeamAlreadySpawned === 1)
        {
            carPosition.y = WORLD_SIZE_Y * 0.75;
        }
        else if (numCarsInTeamAlreadySpawned === 2)
        {
            carPosition.y = WORLD_SIZE_Y * 0.25;
        }
        else if (numCarsInTeamAlreadySpawned === 3)
        {
            if (team === Team.BLUE)
            {
                carPosition.x = WORLD_SIZE_X * 0.15;
                carPosition.y = WORLD_SIZE_Y * 0.5;
            }
            else if (team === Team.RED)
            {
                carPosition.x = WORLD_SIZE_X * 0.85;
                carPosition.y = WORLD_SIZE_Y * 0.5;
            }
        }

        return carPosition;
    }

    GetCarOrientationFromPosition(carPosition)
    {
        const ballPosition = new Vec2(WORLD_SIZE_X * 0.5, WORLD_SIZE_Y * 0.5);
        const directionCarToBallPosition = ballPosition.GetDifference(carPosition).GetNormalized();
        return directionCarToBallPosition.GetOrientationDegrees();
    }

    HandleCountdown()
    {
        if (this.m_countdownTimer.GetRemainingSeconds() > 0)
        {
            this.m_game.m_countdownTimerWidget.SetText(this.m_countdownTimer.GetRemainingSeconds());
        }
        else
        {
            this.m_game.m_countdownTimerWidget.SetText("Go!");
        }
    }

    Update()
    {
        if (!this.m_countdownTimer.IsStopped())
        {
            this.HandleCountdown();

            if (this.m_countdownTimer.HasDurationElapsed())
            {
                this.m_countdownTimer.Stop();
                this.m_game.m_clock.Unpause();
                this.m_game.m_countdownTimerWidget.SetVisible(false);
            }
        }

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

        this.CheckMatchEnd();
        this.UpdateHUD();
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
        if (g_input.WasKeyJustPressed("F4"))
        {
            this.m_drawDebug = true;
            this.m_disableBallCollisions = true;

            this.m_ball.m_position = new Vec2(WORLD_SIZE_X * 0.5, WORLD_SIZE_Y * 0.5);
            this.m_ball.m_velocity = new Vec2(0.0, 0.0);

            let numCarsInBlueTeam = 0;
            let numCarsInRedTeam = 0;
            for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
            {
                if (this.m_cars[carIndex].m_team === Team.BLUE)
                {
                    this.m_cars[carIndex].m_position = this.GetCarPositionFromNumCarsInTeamAlreadySpawned(numCarsInBlueTeam, Team.BLUE);
                    this.m_cars[carIndex].m_position.Add(Vec2.SOUTH.GetScaled(5.0));
                    numCarsInBlueTeam++;
                }
                else if (this.m_cars[carIndex].m_team === Team.RED)
                {
                    this.m_cars[carIndex].m_position = this.GetCarPositionFromNumCarsInTeamAlreadySpawned(numCarsInRedTeam, Team.RED);
                    numCarsInRedTeam++;
                }
                const carOrientation = this.m_cars[carIndex].m_team === Team.BLUE ? 0.0 : 90.0;
                const carForwardNormal = Vec2.MakeFromPolarDegrees(carOrientation);
                this.m_cars[carIndex].m_acceleration = new Vec2(0.0, 0.0);
                this.m_cars[carIndex].m_frontAxlePosition = this.m_cars[carIndex].m_position.GetSum(carForwardNormal.GetScaled(Car.FRAME_LENGTH * 0.5));
                this.m_cars[carIndex].m_frontAxleVelocity = new Vec2(0.0, 0.0);
                this.m_cars[carIndex].m_backAxlePosition = this.m_cars[carIndex].m_position.GetDifference(carForwardNormal.GetScaled(Car.FRAME_LENGTH * 0.5));
                this.m_cars[carIndex].m_backAxleVelocity = new Vec2(0.0, 0.0);
            }
        }
        if (g_input.WasKeyJustPressed("F5"))
        {
            this.m_drawDebug = true;
            this.m_disableBallCollisions = true;

            this.m_ball.m_position = new Vec2(WORLD_SIZE_X * 0.5, WORLD_SIZE_Y * 0.5);
            this.m_ball.m_velocity = new Vec2(0.0, 0.0);

            let numCarsInBlueTeam = 0;
            let numCarsInRedTeam = 0;
            for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
            {
                if (this.m_cars[carIndex].m_team === Team.BLUE)
                {
                    this.m_cars[carIndex].m_position = this.GetCarPositionFromNumCarsInTeamAlreadySpawned(numCarsInBlueTeam, Team.BLUE);
                    this.m_cars[carIndex].m_position.Add(Vec2.NORTH.GetScaled(5.0));
                    numCarsInBlueTeam++;
                }
                else if (this.m_cars[carIndex].m_team === Team.RED)
                {
                    this.m_cars[carIndex].m_position = this.GetCarPositionFromNumCarsInTeamAlreadySpawned(numCarsInRedTeam, Team.RED);
                    numCarsInRedTeam++;
                }
                const carOrientation = this.m_cars[carIndex].m_team === Team.BLUE ? 0.0 : 90.0;
                const carForwardNormal = Vec2.MakeFromPolarDegrees(carOrientation);
                this.m_cars[carIndex].m_acceleration = new Vec2(0.0, 0.0);
                this.m_cars[carIndex].m_frontAxlePosition = this.m_cars[carIndex].m_position.GetSum(carForwardNormal.GetScaled(Car.FRAME_LENGTH * 0.5));
                this.m_cars[carIndex].m_frontAxleVelocity = new Vec2(0.0, 0.0);
                this.m_cars[carIndex].m_backAxlePosition = this.m_cars[carIndex].m_position.GetDifference(carForwardNormal.GetScaled(Car.FRAME_LENGTH * 0.5));
                this.m_cars[carIndex].m_backAxleVelocity = new Vec2(0.0, 0.0);
            }
        }

        if (this.m_drawDebug)
        {
            g_debugRenderSystem.AddMessage("Debug Draw (F1): " + (this.m_drawDebug ? "ON" : "OFF"), 0.0);
            g_debugRenderSystem.AddMessage("Field Rendering (F2): " + (this.m_disableFieldRendering ? "OFF" : "ON"), 0.0);
            g_debugRenderSystem.AddMessage("Ball Collisions (F3): " + (this.m_disableBallCollisions ? "OFF" : "ON"), 0.0);

            g_debugRenderSystem.AddMessage("Ball::ELASTICITY (Hold 0 + Up/Down)" + Ball.ELASTICITY.toFixed(2), 0.0);
            g_debugRenderSystem.AddMessage("Ball::ROLLING_FRICTION_COEFFICIENT (Hold 9 + Up/Down)" + Ball.ROLLING_FRICTION_COEFFICIENT.toFixed(2), 0.0);
            g_debugRenderSystem.AddMessage("Ball::MASS (Hold B + Up/Down)" + Ball.MASS.toFixed(2), 0.0);
            g_debugRenderSystem.AddMessage("Car::ELASTICITY (Hold 8 + Up/Down)" + Car.ELASTICITY.toFixed(2), 0.0);
            g_debugRenderSystem.AddMessage("Car::MAX_FRONT_WHEEL_ANGULAR_OFFSET (Hold 7 + Up/Down)" + Car.MAX_FRONT_WHEEL_ANGULAR_OFFSET.toFixed(2), 0.0);
            g_debugRenderSystem.AddMessage("Car::FRONT_WHEEL_TURN_RATE (Hold 6 + Up/Down)" + Car.FRONT_WHEEL_TURN_RATE.toFixed(2), 0.0);
            g_debugRenderSystem.AddMessage("Car::MASS (Hold C + Up/Down)" + Car.MASS.toFixed(2), 0.0);
            g_debugRenderSystem.AddMessage("Car::MAX_DECELERATION (Hold 5 + Up/Down)" + Car.MAX_DECELERATION.toFixed(2), 0.0);
            g_debugRenderSystem.AddMessage("Car::MAX_ACCELERATION (Hold 4 + Up/Down)" + Car.MAX_ACCELERATION.toFixed(2), 0.0);
            g_debugRenderSystem.AddMessage("Car::BACK_WHEEL_SLIDING_FRICTION_COEFFICIENT (Hold 3 + Up/Down)" + Car.BACK_WHEEL_SLIDING_FRICTION_COEFFICIENT.toFixed(2), 0.0);
            g_debugRenderSystem.AddMessage("Car::FRONT_WHEEL_SLIDING_FRICTION_COEFFICIENT (Hold 2 + Up/Down): " + Car.FRONT_WHEEL_SLIDING_FRICTION_COEFFICIENT.toFixed(2), 0.0);
            g_debugRenderSystem.AddMessage("Car::ROLLING_FRICTION_COEFFICIENT (Hold 1 + Up/Down): " + Car.ROLLING_FRICTION_COEFFICIENT.toFixed(2), 0.0);

            if (g_input.WasKeyJustPressed("UP_ARROW"))
            {
                if (g_input.IsKeyDown("1"))
                {
                    Car.ROLLING_FRICTION_COEFFICIENT += 0.01;
                }
                if (g_input.IsKeyDown("2"))
                {
                    Car.FRONT_WHEEL_SLIDING_FRICTION_COEFFICIENT += 0.01;
                }
                if (g_input.IsKeyDown("3"))
                {
                    Car.BACK_WHEEL_SLIDING_FRICTION_COEFFICIENT += 0.01;
                }
                if (g_input.IsKeyDown("4"))
                {
                    Car.MAX_ACCELERATION += 10.0;
                }
                if (g_input.IsKeyDown("5"))
                {
                    Car.MAX_DECELERATION += 10.0;
                }
                if (g_input.IsKeyDown("6"))
                {
                    Car.FRONT_WHEEL_TURN_RATE += 5.0;
                }
                if (g_input.IsKeyDown("7"))
                {
                    Car.MAX_FRONT_WHEEL_ANGULAR_OFFSET += 5.0;
                }
                if (g_input.IsKeyDown("8"))
                {
                    Car.ELASTICITY += 0.05;
                }
                if (g_input.IsKeyDown("9"))
                {
                    Ball.ROLLING_FRICTION_COEFFICIENT += 0.01;
                }
                if (g_input.IsKeyDown("0"))
                {
                    Ball.ELASTICITY += 0.05;
                }
                if (g_input.IsKeyDown("C"))
                {
                    Car.MASS += 10.0;
                }
                if (g_input.IsKeyDown("B"))
                {
                    Ball.MASS += 0.25;
                }
            }
            if (g_input.WasKeyJustPressed("DOWN_ARROW"))
            {
                if (g_input.IsKeyDown("1"))
                {
                    Car.ROLLING_FRICTION_COEFFICIENT -= 0.01;
                }
                if (g_input.IsKeyDown("2"))
                {
                    Car.FRONT_WHEEL_SLIDING_FRICTION_COEFFICIENT -= 0.01;
                }
                if (g_input.IsKeyDown("3"))
                {
                    Car.BACK_WHEEL_SLIDING_FRICTION_COEFFICIENT -= 0.01;
                }
                if (g_input.IsKeyDown("4"))
                {
                    Car.MAX_ACCELERATION -= 10.0;
                }
                if (g_input.IsKeyDown("5"))
                {
                    Car.MAX_DECELERATION -= 10.0;
                }
                if (g_input.IsKeyDown("6"))
                {
                    Car.FRONT_WHEEL_TURN_RATE -= 5.0;
                }
                if (g_input.IsKeyDown("7"))
                {
                    Car.MAX_FRONT_WHEEL_ANGULAR_OFFSET -= 5.0;
                }
                if (g_input.IsKeyDown("8"))
                {
                    Car.ELASTICITY -= 0.05;
                }
                if (g_input.IsKeyDown("9"))
                {
                    Ball.ROLLING_FRICTION_COEFFICIENT -= 0.01;
                }
                if (g_input.IsKeyDown("0"))
                {
                    Ball.ELASTICITY -= 0.05;
                }
                if (g_input.IsKeyDown("C"))
                {
                    Car.MASS -= 10.0;
                }
                if (g_input.IsKeyDown("B"))
                {
                    Ball.MASS -= 0.25;
                }
            }

            Car.ROLLING_FRICTION_COEFFICIENT = MathUtils.GetClamped(Car.ROLLING_FRICTION_COEFFICIENT, 0.0, 1.0);
            Car.FRONT_WHEEL_SLIDING_FRICTION_COEFFICIENT = MathUtils.GetClamped(Car.FRONT_WHEEL_SLIDING_FRICTION_COEFFICIENT, 0.0, 1.0);
            Car.BACK_WHEEL_SLIDING_FRICTION_COEFFICIENT = MathUtils.GetClamped(Car.BACK_WHEEL_SLIDING_FRICTION_COEFFICIENT, 0.0, 1.0);
            Car.MAX_ACCELERATION = MathUtils.GetClamped(Car.MAX_ACCELERATION, 0.0, 9999.0);
            Car.MAX_DECELERATION = MathUtils.GetClamped(Car.MAX_DECELERATION, 0.0, 9999.0);
            Car.FRONT_WHEEL_TURN_RATE = MathUtils.GetClamped(Car.FRONT_WHEEL_TURN_RATE, 0.0, 360.0);
            Car.MAX_FRONT_WHEEL_ANGULAR_OFFSET = MathUtils.GetClamped(Car.MAX_FRONT_WHEEL_ANGULAR_OFFSET, 0.0, 360.0);
            Car.ELASTICITY = MathUtils.GetClamped(Car.ELASTICITY, 0.0, 1.0);
            Ball.ROLLING_FRICTION_COEFFICIENT = MathUtils.GetClamped(Ball.ROLLING_FRICTION_COEFFICIENT, 0.0, 1.0);
            Ball.ELASTICITY = MathUtils.GetClamped(Ball.ELASTICITY, 0.0, 1.0);
            Car.MASS = MathUtils.GetClamped(Car.MASS, 0.0, 9999.0);
            Ball.MASS = MathUtils.GetClamped(Ball.MASS, 0.0, 9999.0);

            Car.ROLLING_FRICTION = Car.ROLLING_FRICTION_COEFFICIENT * 60.0;
            Car.FRONT_WHEEL_SLIDING_FRICTION = Car.FRONT_WHEEL_SLIDING_FRICTION_COEFFICIENT * 60.0;
            Car.BACK_WHEEL_SLIDING_FRICTION = Car.BACK_WHEEL_SLIDING_FRICTION_COEFFICIENT * 60.0;
            Ball.ROLLING_FRICTION = Ball.ROLLING_FRICTION_COEFFICIENT * 100.0;
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
        const impactPointOnCar = MathUtils.GetNearestPointOnOBB2(ball.m_position, carBounds);
        if (!MathUtils.IsPointInsideDisc2D(impactPointOnCar, ball.m_position, Ball.RADIUS))
        {
            return;
        }

        const dispCarCenterToImpactPoint = impactPointOnCar.GetDifference(car.m_position);
        const impactPointDistanceFromCenterAlongCarFrame = MathUtils.GetProjectedLength2D(dispCarCenterToImpactPoint, carBounds.m_iBasisNormal);
        const impactPointFractionFromCenterAlongCarFrame = impactPointDistanceFromCenterAlongCarFrame / Car.FRAME_LENGTH;
        const impactFrontWeight = impactPointFractionFromCenterAlongCarFrame + 0.5;
        const impactBackWeight = 1.0 - impactFrontWeight;

        const pushDistance = (Ball.RADIUS - MathUtils.GetDistance2D(impactPointOnCar, ball.m_position)) * 0.5;
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

        const ballNormalMomentumInCoMFrame = MathUtils.GetProjectedOnto2D(ballMomentumInCoMFrame, directionBallToCarImpactPoint);
        const ballTangentMomentumInCoMFrame = ballMomentumInCoMFrame.GetDifference(ballNormalMomentumInCoMFrame);

        const carImpactPointNormalMomentumInCoMFrame = MathUtils.GetProjectedOnto2D(carImpactPointMomentumInCoMFrame, directionBallToCarImpactPoint.GetScaled(-1.0));
        const carImpactPointTangentMomentumInCoMFrame = carImpactPointMomentumInCoMFrame.GetDifference(carImpactPointNormalMomentumInCoMFrame);

        if (MathUtils.AreVelocitiesDiverging2D(ball.m_velocity, carImpactPointVelocity, directionBallToCarImpactPoint))
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

        g_audio.PlaySound(this.m_carVsBallSFX, false, MathUtils.RangeMapClamped(ballNormalMomentumInCoMFrame.GetLength(), 0.0, Ball.MASS * 100.0, 0.0, 1.0));

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

                this.HandleCarVsCarCollision_v2(car1, car2);
            }
        }
    }

    // Best guess for what the problem is:
    // This currently exchanges the impact point velocities for the two cars
    // The correct version would be to only exchange the velocity along the collision normal
    HandleCarVsCarCollision_v2(car1, car2)
    {
        const car1Bounds = car1.GetBounds();
        const car2Bounds = car2.GetBounds();

        if (!MathUtils.DoOBB2Overlap(car1Bounds, car2Bounds))
        {
            return;
        }

        const car1Corners = car1Bounds.GetCornerPoints();
        const car2Corners = car2Bounds.GetCornerPoints();

        let numImpacts = 0;
        let numImpactsOnC1 = 0;
        let numImpactsOnC2 = 0;
        let sumAllOverlapPoints = new Vec2();
        let sumAllOverlapPointsOnC1 = new Vec2();
        let sumAllOverlapPointsOnC2 = new Vec2();

        for (let cornerIndex = 0; cornerIndex < 4; cornerIndex++)
        {
            if (MathUtils.IsPointInsideOBB2(car1Corners[cornerIndex], car2Bounds))
            {
                numImpacts++;
                numImpactsOnC1++;
                sumAllOverlapPoints = MathUtils.AddVec2(sumAllOverlapPoints, car1Corners[cornerIndex]);
                sumAllOverlapPointsOnC1 = MathUtils.AddVec2(sumAllOverlapPointsOnC1, car1Corners[cornerIndex]);
            }

            if (MathUtils.IsPointInsideOBB2(car2Corners[cornerIndex], car1Bounds))
            {
                numImpacts++;
                numImpactsOnC2++;
                sumAllOverlapPoints = MathUtils.AddVec2(sumAllOverlapPoints, car2Corners[cornerIndex]);
                sumAllOverlapPointsOnC2 = MathUtils.AddVec2(sumAllOverlapPointsOnC2, car2Corners[cornerIndex]);
            }
        }

        // Average all overlap points to get a single "fake" impact point
        const impactPoint = sumAllOverlapPoints.GetScaled(1.0 / numImpacts);
        const collisionNormal = MathUtils.GetCollisionNormalForOverlappingOBB2s(car1Bounds, car2Bounds);

        if (collisionNormal.x === 0.0 && collisionNormal.y === 0)
        {
            return;
        }

        const c1LeftNormal = car1Bounds.m_iBasisNormal.GetRotated90Degrees();
        const c1DeltaVel = MathUtils.SubtractVec2(car1.m_frontAxleVelocity, car1.m_backAxleVelocity);
        const c1AngularVel = MathUtils.DotProduct2D(c1DeltaVel, c1LeftNormal);
        const c1DispCenterToImpactPoint = MathUtils.SubtractVec2(impactPoint, car1Bounds.m_center);
        const c1CenterVel = MathUtils.AddVec2(car1.m_frontAxleVelocity, car1.m_backAxleVelocity).GetScaled(0.5);
        const c1VelAtImpactPoint = MathUtils.AddVec2(c1CenterVel, c1DispCenterToImpactPoint.GetRotated90Degrees().GetScaled(c1AngularVel));
        const c1NormalVelAtImpactPoint = MathUtils.GetProjectedOnto2D(c1VelAtImpactPoint, collisionNormal);
        const c1TangentVelAtImpactPoint = MathUtils.SubtractVec2(c1VelAtImpactPoint, c1NormalVelAtImpactPoint);

        const c2LeftNormal = car2Bounds.m_iBasisNormal.GetRotated90Degrees();
        const c2DeltaVel = MathUtils.SubtractVec2(car2.m_frontAxleVelocity, car2.m_backAxleVelocity);
        const c2AngularVel = MathUtils.DotProduct2D(c2DeltaVel, c2LeftNormal) / Car.FRAME_LENGTH;
        const c2DispCenterToImpactPoint = MathUtils.SubtractVec2(impactPoint, car2Bounds.m_center);
        const c2CenterVel = MathUtils.AddVec2(car2.m_frontAxleVelocity, car2.m_backAxleVelocity).GetScaled(0.5);
        const c2VelAtImpactPoint = MathUtils.AddVec2(c2CenterVel, c2DispCenterToImpactPoint.GetRotated90Degrees().GetScaled(c2AngularVel));
        const c2NormalVelAtImpactPoint = MathUtils.GetProjectedOnto2D(c2VelAtImpactPoint, collisionNormal.GetScaled(1.0));
        const c2TangentVelAtImpactPoint = MathUtils.SubtractVec2(c2VelAtImpactPoint, c2NormalVelAtImpactPoint);

        MathUtils.PushOBB2OutOfEachOther(car1Bounds, car2Bounds);
        car1.m_frontAxlePosition = MathUtils.AddVec2(car1Bounds.m_center, car1Bounds.m_iBasisNormal.GetScaled(car1Bounds.m_halfDimensions.x));
        car1.m_backAxlePosition = MathUtils.AddVec2(car1Bounds.m_center, car1Bounds.m_iBasisNormal.GetScaled(-car1Bounds.m_halfDimensions.x));
        car2.m_frontAxlePosition = MathUtils.AddVec2(car2Bounds.m_center, car2Bounds.m_iBasisNormal.GetScaled(car2Bounds.m_halfDimensions.x));
        car2.m_backAxlePosition = MathUtils.AddVec2(car2Bounds.m_center, car2Bounds.m_iBasisNormal.GetScaled(-car2Bounds.m_halfDimensions.x));

        car1.PerformFrameCorrectionAndUpdatePosition();
        car2.PerformFrameCorrectionAndUpdatePosition();

        if (MathUtils.AreVelocitiesDiverging2D(c1VelAtImpactPoint, c2VelAtImpactPoint, collisionNormal))
        {
            return;
        }

        const collisionElasticity = Car.ELASTICITY * Car.ELASTICITY;

        const c1FinalVelAtImpactPoint = MathUtils.AddVec2(c1TangentVelAtImpactPoint, c2NormalVelAtImpactPoint.GetScaled(collisionElasticity));
        const c2FinalVelAtImpactPoint = MathUtils.AddVec2(c2TangentVelAtImpactPoint, c1NormalVelAtImpactPoint.GetScaled(collisionElasticity));

        let c1FinalAngularVel = c1AngularVel + MathUtils.CrossProduct2D(c1DispCenterToImpactPoint, MathUtils.SubtractVec2(c1FinalVelAtImpactPoint, c1VelAtImpactPoint));
        c1FinalAngularVel /= Car.MASS;
        let c2FinalAngularVel = c2AngularVel + MathUtils.CrossProduct2D(c2DispCenterToImpactPoint, MathUtils.SubtractVec2(c2FinalVelAtImpactPoint, c2VelAtImpactPoint));
        c2FinalAngularVel /= Car.MASS;

        const c1FinalCenterVel = MathUtils.SubtractVec2(c1FinalVelAtImpactPoint, c1DispCenterToImpactPoint.GetScaled(c1FinalAngularVel));
        const c2FinalCenterVel = MathUtils.SubtractVec2(c2FinalVelAtImpactPoint, c2DispCenterToImpactPoint.GetScaled(c2FinalAngularVel));

        car1.m_frontAxleVelocity = MathUtils.AddVec2(c1FinalCenterVel, car1Bounds.m_iBasisNormal.GetRotated90Degrees().GetScaled(car1Bounds.m_halfDimensions.x * c1FinalAngularVel));
        car1.m_backAxleVelocity = MathUtils.AddVec2(c1FinalCenterVel, car1Bounds.m_iBasisNormal.GetRotated90Degrees().GetScaled(-car1Bounds.m_halfDimensions.x * c1FinalAngularVel));

        car2.m_frontAxleVelocity = MathUtils.AddVec2(c2FinalCenterVel, car2Bounds.m_iBasisNormal.GetRotated90Degrees().GetScaled(car2Bounds.m_halfDimensions.x * c2FinalAngularVel));
        car2.m_backAxleVelocity = MathUtils.AddVec2(c2FinalCenterVel, car2Bounds.m_iBasisNormal.GetRotated90Degrees().GetScaled(-car2Bounds.m_halfDimensions.x * c2FinalAngularVel));

    }

    HandleCarVsCarCollision(car1, car2)
    {
        const car1Bounds = car1.GetBounds();
        const car2Bounds = car2.GetBounds();

        if (!MathUtils.DoOBB2Overlap(car1Bounds, car2Bounds))
        {
            return;
        }

        const car1CornerPoints = car1Bounds.GetCornerPoints();
        const car2CornerPoints = car2Bounds.GetCornerPoints();

        let netImpactSignedDistanceFromCenterOnCar1 = 0.0;
        let netImpactSignedDistanceFromCenterOnCar2 = 0.0;

        let car1NetImpactPoint = new Vec2();
        let car2NetImpactPoint = new Vec2();

        let numImpacts = 0;

        for (let car1CornerPointIdx = 0; car1CornerPointIdx < car1CornerPoints.length; car1CornerPointIdx++)
        {
            if (MathUtils.IsPointInsideOBB2(car1CornerPoints[car1CornerPointIdx], car2Bounds))
            {
                const dispCar2CenterToImpactPoint = (car1CornerPoints[car1CornerPointIdx]).GetDifference(car2Bounds.m_center);
                const impactPointSignedDistanceFromCar2Center = MathUtils.GetProjectedLength2D(dispCar2CenterToImpactPoint, car2Bounds.m_iBasisNormal);
                netImpactSignedDistanceFromCenterOnCar2 += impactPointSignedDistanceFromCar2Center;

                const dispCar1CenterToImpactPoint = car1CornerPoints[car1CornerPointIdx].GetDifference(car1Bounds.m_center);
                const impactPointSignedDistanceFromCar1Center = MathUtils.GetProjectedLength2D(dispCar1CenterToImpactPoint, car1Bounds.m_iBasisNormal);
                netImpactSignedDistanceFromCenterOnCar1 += impactPointSignedDistanceFromCar1Center;

                const impactPointOnCar1 = car1CornerPoints[car1CornerPointIdx];
                car1NetImpactPoint.Add(impactPointOnCar1);

                // const impactPointOnCar2 = car2Bounds.m_center.GetSum(car2Bounds.m_iBasisNormal.GetScaled(impactPointSignedDistanceFromCar2Center)).GetSum(car2Bounds.m_iBasisNormal.GetRotated90Degrees().GetScaled(car2Bounds.m_halfDimensions.y));
                const impactPointOnCar2 = car2Bounds.m_center.GetSum(dispCar2CenterToImpactPoint);
                car2NetImpactPoint.Add(impactPointOnCar2);

                numImpacts++;
            }
        }

        for (let car2CornerPointIdx = 0; car2CornerPointIdx < car2CornerPoints.length; car2CornerPointIdx++)
        {
            if (MathUtils.IsPointInsideOBB2(car2CornerPoints[car2CornerPointIdx], car1Bounds))
            {
                const dispCar1CenterToImpactPoint = (car2CornerPoints[car2CornerPointIdx]).GetDifference(car1Bounds.m_center);
                const impactPointSignedDistanceFromCar1Center = MathUtils.GetProjectedLength2D(dispCar1CenterToImpactPoint, car1Bounds.m_iBasisNormal);
                netImpactSignedDistanceFromCenterOnCar1 += impactPointSignedDistanceFromCar1Center;

                const dispCar2CenterToImpactPoint = car2CornerPoints[car2CornerPointIdx].GetDifference(car2Bounds.m_center);
                const impactPointSignedDistanceFromCar2Center = MathUtils.GetProjectedLength2D(dispCar2CenterToImpactPoint, car2Bounds.m_iBasisNormal);
                netImpactSignedDistanceFromCenterOnCar2 += impactPointSignedDistanceFromCar2Center;

                const impactPointOnCar2 = car2CornerPoints[car2CornerPointIdx];
                car2NetImpactPoint.Add(impactPointOnCar2);

                // const impactPointOnCar1 = car1Bounds.m_center.GetSum(car1Bounds.m_iBasisNormal.GetScaled(impactPointSignedDistanceFromCar1Center)).GetSum(car1Bounds.m_iBasisNormal.GetRotated90Degrees().GetScaled(car1Bounds.m_halfDimensions.y));
                const impactPointOnCar1 = car1Bounds.m_center.GetSum(dispCar1CenterToImpactPoint);
                car1NetImpactPoint.Add(impactPointOnCar1);

                numImpacts++;
            }
        }

        let car1ImpactFrontWeight = 1.0;
        let car1ImpactBackWeight = 1.0;

        let car2ImpactFrontWeight = 1.0;
        let car2ImpactBackWeight = 1.0;

        if (numImpacts === 0)
        {
            const dispCar1ToCar2 = car2Bounds.m_center.GetDifference(car1Bounds.m_center);
            const isCar2InFrontOfCar1 = MathUtils.GetProjectedLength2D(dispCar1ToCar2.GetNormalized(), car1Bounds.m_iBasisNormal);
            const isCar1InFrontOfCar2 = MathUtils.GetProjectedLength2D(dispCar1ToCar2.GetNormalized().GetScaled(-1.0), car2Bounds.m_iBasisNormal);
            car1NetImpactPoint = car1Bounds.m_center.GetSum(car1Bounds.m_iBasisNormal.GetScaled(isCar2InFrontOfCar1 * car1Bounds.m_halfDimensions.x));
            car2NetImpactPoint = car2Bounds.m_center.GetSum(car2Bounds.m_iBasisNormal.GetScaled(isCar1InFrontOfCar2 * car2Bounds.m_halfDimensions.x));
        }
        else
        {
            netImpactSignedDistanceFromCenterOnCar1 /= numImpacts;
            netImpactSignedDistanceFromCenterOnCar2 /= numImpacts;
            car1NetImpactPoint.Scale(1.0 / numImpacts);
            car2NetImpactPoint.Scale(1.0 / numImpacts);
        }

        const impactPointFractionFromCenterAlongCar1Frame = netImpactSignedDistanceFromCenterOnCar1 / Car.FRAME_LENGTH;
        car1ImpactFrontWeight = impactPointFractionFromCenterAlongCar1Frame + 0.5;
        car1ImpactBackWeight = 1.0 - car1ImpactFrontWeight;

        const impactPointFractionFromCenterAlongCar2Frame = netImpactSignedDistanceFromCenterOnCar2 / Car.FRAME_LENGTH;
        car2ImpactFrontWeight = impactPointFractionFromCenterAlongCar2Frame + 0.5;
        car2ImpactBackWeight = 1.0 - car2ImpactFrontWeight;

        // Velocity correction
        const car1NetVelocity = car1.m_frontAxleVelocity.GetSum(car1.m_backAxleVelocity).GetScaled(0.5);
        const car2NetVelocity = car2.m_frontAxleVelocity.GetSum(car2.m_backAxleVelocity).GetScaled(0.5);

        const car1DirectionToImpactPoint = car1NetImpactPoint.GetDifference(car1Bounds.m_center).GetNormalized();
        const car2DirectionToImpactPoint = car2NetImpactPoint.GetDifference(car2Bounds.m_center).GetNormalized();

        MathUtils.PushOBB2OutOfEachOther(car1Bounds, car2Bounds);
        car1.m_frontAxlePosition = car1Bounds.m_center.GetSum(car1Bounds.m_iBasisNormal.GetScaled(Car.FRAME_LENGTH * 0.5));
        car1.m_backAxlePosition = car1Bounds.m_center.GetDifference(car1Bounds.m_iBasisNormal.GetScaled(Car.FRAME_LENGTH * 0.5));
        car2.m_frontAxlePosition = car2Bounds.m_center.GetSum(car2Bounds.m_iBasisNormal.GetScaled(Car.FRAME_LENGTH * 0.5));
        car2.m_backAxlePosition = car2Bounds.m_center.GetDifference(car2Bounds.m_iBasisNormal.GetScaled(Car.FRAME_LENGTH * 0.5));

        // if (MathUtils.AreVelocitiesDiverging2D(car1NetVelocity, car2NetVelocity, car1DirectionToImpactPoint))
        // {
        //     car1.PerformFrameCorrectionAndUpdatePosition();
        //     car2.PerformFrameCorrectionAndUpdatePosition();
        //     return;
        // }

        const car1FrontAxleVelocityNormalToImpact = MathUtils.GetProjectedOnto2D(car1.m_frontAxleVelocity, car1NetImpactPoint.GetDifference(car1.m_frontAxlePosition));
        const car1FrontAxleVelocityTangentToImpact = car1.m_frontAxleVelocity.GetDifference(car1FrontAxleVelocityNormalToImpact);

        const car1BackAxleVelocityNormalToImpact = MathUtils.GetProjectedOnto2D(car1.m_backAxleVelocity, car1NetImpactPoint.GetDifference(car1.m_backAxlePosition));
        const car1BackAxleVelocityTangentToImpact = car1.m_backAxleVelocity.GetDifference(car1BackAxleVelocityNormalToImpact);

        const car2FrontAxleVelocityNormalToImpact = MathUtils.GetProjectedOnto2D(car2.m_frontAxleVelocity, car2NetImpactPoint.GetDifference(car2.m_frontAxlePosition));
        const car2FrontAxleVelocityTangentToImpact = car2.m_frontAxleVelocity.GetDifference(car2FrontAxleVelocityNormalToImpact);

        const car2BackAxleVelocityNormalToImpact = MathUtils.GetProjectedOnto2D(car2.m_backAxleVelocity, car2NetImpactPoint.GetDifference(car2.m_backAxlePosition));
        const car2BackAxleVelocityTangentToImpact = car2.m_backAxleVelocity.GetDifference(car2BackAxleVelocityNormalToImpact);

        const car1BoneDirection = car1.m_frontAxlePosition.GetDifference(car1.m_backAxlePosition).GetNormalized();
        const car2BoneDirection = car2.m_frontAxlePosition.GetDifference(car2.m_backAxlePosition).GetNormalized();

        const car2FrontAxleVelocityContributingOnlyToTranslation = MathUtils.GetProjectedOnto2D(car2FrontAxleVelocityNormalToImpact, car1BoneDirection);
        const car2FrontAxleVelocityContributingToMomentOfInertia = car2FrontAxleVelocityNormalToImpact.GetDifference(car2FrontAxleVelocityContributingOnlyToTranslation);
        const car2BackAxleVelocityContributingOnlyToTranslation = MathUtils.GetProjectedOnto2D(car2BackAxleVelocityNormalToImpact, car1BoneDirection);
        const car2BackAxleVelocityContributingToMomentOfInertia = car2BackAxleVelocityNormalToImpact.GetDifference(car2BackAxleVelocityContributingOnlyToTranslation);

        const car1FrontAxleVelocityContributingOnlyToTranslation = MathUtils.GetProjectedOnto2D(car1FrontAxleVelocityNormalToImpact, car2BoneDirection);
        const car1FrontAxleVelocityContributingToMomentOfInertia = car1FrontAxleVelocityNormalToImpact.GetDifference(car1FrontAxleVelocityContributingOnlyToTranslation);
        const car1BackAxleVelocityContributingOnlyToTranslation = MathUtils.GetProjectedOnto2D(car1BackAxleVelocityNormalToImpact, car2BoneDirection);
        const car1BackAxleVelocityContributingToMomentOfInertia = car1BackAxleVelocityNormalToImpact.GetDifference(car1BackAxleVelocityContributingOnlyToTranslation);

        car1.m_frontAxleVelocity = car1FrontAxleVelocityTangentToImpact.GetSum(car2FrontAxleVelocityContributingToMomentOfInertia.GetScaled(car2ImpactFrontWeight)).GetSum(car2FrontAxleVelocityContributingOnlyToTranslation).GetSum(car2BackAxleVelocityContributingToMomentOfInertia.GetScaled(car2ImpactBackWeight)).GetSum(car2BackAxleVelocityContributingOnlyToTranslation).GetScaled(car1ImpactFrontWeight);
        car1.m_backAxleVelocity = car1BackAxleVelocityTangentToImpact.GetSum(car2BackAxleVelocityContributingToMomentOfInertia.GetScaled(car2ImpactFrontWeight)).GetSum(car2FrontAxleVelocityContributingOnlyToTranslation).GetSum(car2BackAxleVelocityContributingToMomentOfInertia.GetScaled(car2ImpactBackWeight)).GetSum(car2BackAxleVelocityContributingOnlyToTranslation).GetScaled(car1ImpactBackWeight);

        car2.m_frontAxleVelocity = car2FrontAxleVelocityTangentToImpact.GetSum(car1FrontAxleVelocityContributingToMomentOfInertia.GetScaled(car1ImpactFrontWeight)).GetSum(car1FrontAxleVelocityContributingOnlyToTranslation).GetSum(car1BackAxleVelocityContributingToMomentOfInertia.GetScaled(car1ImpactBackWeight)).GetSum(car1BackAxleVelocityContributingOnlyToTranslation).GetScaled(car2ImpactFrontWeight);
        car2.m_backAxleVelocity = car2BackAxleVelocityTangentToImpact.GetSum(car1FrontAxleVelocityContributingToMomentOfInertia.GetScaled(car1ImpactFrontWeight)).GetSum(car1FrontAxleVelocityContributingOnlyToTranslation).GetSum(car1BackAxleVelocityContributingToMomentOfInertia.GetScaled(car1ImpactBackWeight)).GetSum(car1BackAxleVelocityContributingOnlyToTranslation).GetScaled(car2ImpactBackWeight);

        car1.PerformFrameCorrectionAndUpdatePosition();
        car2.PerformFrameCorrectionAndUpdatePosition();
        car1.m_acceleration = new Vec2();
        car2.m_acceleration = new Vec2();
    }

    HandleBallVsGoalsCollision()
    {
        if (this.m_disableBallCollisions)
        {
            return;
        }

        this.HandleBallVsGoalCollision(this.m_ball, this.m_blueTeamGoal);
        this.HandleBallVsGoalCollision(this.m_ball, this.m_redTeamGoal);
    }

    HandleBallVsGoalCollision(ball, goal)
    {
        if (this.m_disableBallCollisions)
        {
            return;
        }

        const goalPostBounds = goal.GetGoalPostBounds();

        const nearestPointOnGoalPostBounds0 = MathUtils.GetNearestPointOnAABB2(ball.m_position, goalPostBounds[0]);
        const nearestPointOnGoalPostBounds1 = MathUtils.GetNearestPointOnAABB2(ball.m_position, goalPostBounds[1]);

        if (MathUtils.PushDiscOutOfFixedPoint2D(ball.m_position, Ball.RADIUS, nearestPointOnGoalPostBounds0))
        {
            const dispBallToNearestPoint = nearestPointOnGoalPostBounds0.GetDifference(ball.m_position);
            const ballNormalVelocity = MathUtils.GetProjectedOnto2D(ball.m_velocity, dispBallToNearestPoint);
            const ballTangentVelocity = ball.m_velocity.GetDifference(ballNormalVelocity);
            ballNormalVelocity.Scale(-Ball.ELASTICITY * Goal.POLE_ELASTICITY);
            ball.m_velocity = ballNormalVelocity.GetSum(ballTangentVelocity);
            g_audio.PlaySound(this.m_ballVsGoalPost, false, MathUtils.RangeMapClamped(ballNormalVelocity.GetLength(), 0.0, Ball.MASS * Ball.MAX_VELOCITY, 0.0, 1.0));
        }

        if (MathUtils.PushDiscOutOfFixedPoint2D(ball.m_position, Ball.RADIUS, nearestPointOnGoalPostBounds1))
        {
            const dispBallToNearestPoint = nearestPointOnGoalPostBounds1.GetDifference(ball.m_position);
            const ballNormalVelocity = MathUtils.GetProjectedOnto2D(ball.m_velocity, dispBallToNearestPoint);
            const ballTangentVelocity = ball.m_velocity.GetDifference(ballNormalVelocity);
            ballNormalVelocity.Scale(-Ball.ELASTICITY * Goal.POLE_ELASTICITY);
            ball.m_velocity = ballNormalVelocity.GetSum(ballTangentVelocity);
            g_audio.PlaySound(this.m_ballVsGoalPost, false, MathUtils.RangeMapClamped(ballNormalVelocity.GetLength(), 0.0, Ball.MASS * Ball.MAX_VELOCITY, 0.0, 1.0));
        }

        const goalBounds = goal.GetBounds();
        if (MathUtils.IsPointInsideAABB2(ball.m_position, goalBounds))
        {
            g_audio.PlaySound(this.m_goalScored);
            this.IncrementScoreForTeam(goal.m_team === Team.BLUE ? Team.RED : Team.BLUE);
            this.ResetCarsAndBall();

            if (this.m_matchTimer.GetRemainingSeconds() > 0)
            {
                this.m_game.m_clock.Pause();
                this.m_countdownTimer.Start();
                this.m_game.m_countdownTimerWidget.SetVisible(true);
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
            g_audio.PlaySound(this.m_ballBoundsSFX, false, MathUtils.RangeMapClamped(this.m_ball.m_velocity.GetLength(), 0.0, Ball.MASS * Ball.MAX_VELOCITY, 0.0, 1.0));
            this.m_ball.m_position.x = WORLD_SIZE_X - Ball.RADIUS;
            this.m_ball.m_velocity.x = -this.m_ball.m_velocity.x;
        }
        if (this.m_ball.m_position.x - Ball.RADIUS < 0.0)
        {
            g_audio.PlaySound(this.m_ballBoundsSFX, false, MathUtils.RangeMapClamped(this.m_ball.m_velocity.GetLength(), 0.0, Ball.MASS * Ball.MAX_VELOCITY, 0.0, 1.0));
            this.m_ball.m_position.x = Ball.RADIUS;
            this.m_ball.m_velocity.x = -this.m_ball.m_velocity.x;
        }
        if (this.m_ball.m_position.y + Ball.RADIUS > WORLD_SIZE_Y)
        {
            g_audio.PlaySound(this.m_ballBoundsSFX, false, MathUtils.RangeMapClamped(this.m_ball.m_velocity.GetLength(), 0.0, Ball.MASS * Ball.MAX_VELOCITY, 0.0, 1.0));
            this.m_ball.m_position.y = WORLD_SIZE_Y - Ball.RADIUS;
            this.m_ball.m_velocity.y = -this.m_ball.m_velocity.y;
        }
        if (this.m_ball.m_position.y - Ball.RADIUS < 0.0)
        {
            g_audio.PlaySound(this.m_ballBoundsSFX, false, MathUtils.RangeMapClamped(this.m_ball.m_velocity.GetLength(), 0.0, Ball.MASS * Ball.MAX_VELOCITY, 0.0, 1.0));
            this.m_ball.m_position.y = Ball.RADIUS;
            this.m_ball.m_velocity.y = -this.m_ball.m_velocity.y;
        }
    }

    Render()
    {
        this.RenderField();
        this.RenderShadows();
        this.RenderCars();
        this.m_ball.Render();
        this.RenderGoals();
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
        VertexUtils.AddPCUVertsForAABB2(fieldVerts, new AABB2(Vec2.ZERO, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y)), fieldColor);

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

    RenderShadows()
    {
        for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
        {
            this.m_cars[carIndex].RenderShadow();
        }
        this.m_ball.RenderShadow();
        this.m_blueTeamGoal.RenderShadow();
        this.m_redTeamGoal.RenderShadow();
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
        this.m_blueTeamGoal.Render();
        this.m_redTeamGoal.Render();
    }

    UpdateHUD()
    {
        if (g_aspect >= 1.85)
        {
            let isAnyCarOrBallUnderClockWidget = false;
            for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
            {
                if ((this.m_cars[carIndex].m_position.x > WORLD_SIZE_X * 0.5 - WORLD_SIZE_X * 0.15 / g_aspect) && (this.m_cars[carIndex].m_position.x < WORLD_SIZE_X * 0.5 + WORLD_SIZE_X * 0.3 / g_aspect) && (this.m_cars[carIndex].m_position.y < WORLD_SIZE_Y * 0.05))
                {
                    isAnyCarOrBallUnderClockWidget = true;
                    break;
                }
            }
            if ((this.m_ball.m_position.x > WORLD_SIZE_X * 0.5 - WORLD_SIZE_X * 0.15 / g_aspect) && (this.m_ball.m_position.x < WORLD_SIZE_X * 0.5 + WORLD_SIZE_X * 0.3 / g_aspect) && (this.m_ball.m_position.y < WORLD_SIZE_Y * 0.05))
            {
                isAnyCarOrBallUnderClockWidget = true;
            }

            if (isAnyCarOrBallUnderClockWidget)
            {
                this.m_game.m_timeWidget.SetBackgroundColor(new Rgba8(TERTIARY_COLOR_VARIANT_DARK.r, TERTIARY_COLOR_VARIANT_DARK.g, TERTIARY_COLOR_VARIANT_DARK.b, 195));
            }
            else
            {
                this.m_game.m_timeWidget.SetBackgroundColor(TERTIARY_COLOR_VARIANT_DARK);
            }
        }


        if (!this.m_isSuddenDeath)
        {
            this.m_game.m_timeWidget.SetText(GetTimeStringFromSeconds(this.m_matchTimer.GetRemainingSeconds()));
        }

        if (this.m_matchTimer.GetRemainingSeconds() <= 30.0 && this.m_clockBlinkTimer.IsStopped())
        {
            this.m_clockBlinkTimer.Start();
        }

        if (!this.m_clockBlinkTimer.IsStopped())
        {
            while (this.m_clockBlinkTimer.DecrementDurationIfElapsed())
            {
                if (this.m_game.m_timeWidget.m_color.Equals(Rgba8.WHITE))
                {
                    this.m_game.m_timeWidget.SetColor(Rgba8.RED);
                }
                else
                {
                    this.m_game.m_timeWidget.SetColor(Rgba8.WHITE);
                }
            }
        }
    }

    ResetCarsAndBall()
    {
        this.m_ball.m_position = new Vec2(WORLD_SIZE_X * 0.5, WORLD_SIZE_Y * 0.5);
        this.m_ball.m_velocity = new Vec2(0.0, 0.0);

        let numCarsInBlueTeam = 0;
        let numCarsInRedTeam = 0;
        for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
        {
            if (this.m_cars[carIndex].m_team === Team.BLUE)
            {
                this.m_cars[carIndex].m_position = this.GetCarPositionFromNumCarsInTeamAlreadySpawned(numCarsInBlueTeam, Team.BLUE);
                numCarsInBlueTeam++;
            }
            else if (this.m_cars[carIndex].m_team === Team.RED)
            {
                this.m_cars[carIndex].m_position = this.GetCarPositionFromNumCarsInTeamAlreadySpawned(numCarsInRedTeam, Team.RED);
                numCarsInRedTeam++;
            }
            const carOrientation = this.GetCarOrientationFromPosition(this.m_cars[carIndex].m_position);
            const carForwardNormal = Vec2.MakeFromPolarDegrees(carOrientation);
            this.m_cars[carIndex].m_acceleration = new Vec2(0.0, 0.0);
            this.m_cars[carIndex].m_frontAxlePosition = this.m_cars[carIndex].m_position.GetSum(carForwardNormal.GetScaled(Car.FRAME_LENGTH * 0.5));
            this.m_cars[carIndex].m_frontAxleVelocity = new Vec2(0.0, 0.0);
            this.m_cars[carIndex].m_backAxlePosition = this.m_cars[carIndex].m_position.GetDifference(carForwardNormal.GetScaled(Car.FRAME_LENGTH * 0.5));
            this.m_cars[carIndex].m_backAxleVelocity = new Vec2(0.0, 0.0);
        }
    }

    IncrementScoreForTeam(team)
    {
        if (team === Team.BLUE)
        {
            this.m_game.m_blueTeamScore++;
            this.m_game.m_blueTeamScoreWidget.SetText(this.m_game.m_blueTeamScore.toString());
        }
        else if (team === Team.RED)
        {
            this.m_game.m_redTeamScore++;
            this.m_game.m_redTeamScoreWidget.SetText(this.m_game.m_redTeamScore.toString());
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
            if (this.m_game.m_blueTeamScore === this.m_game.m_redTeamScore)
            {
                this.m_matchTimer.Stop();
                this.m_isSuddenDeath = true;
                this.m_game.m_timeWidget.SetText("Sudden Death!");
            }
            else
            {
                this.m_matchTimer.Stop();
                this.m_game.m_nextState = GameState.MATCH_END;
            }
        }
    }
}
