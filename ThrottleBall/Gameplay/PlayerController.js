"use strict";

import { g_input } from "/Engine/Core/EngineCommon.js";
import { Team } from "/ThrottleBall/Framework/GameCommon.js";


export default class PlayerController
{
    constructor(playerID, team)
    {
        this.m_playerID = playerID;
        this.m_team = team;
    }

    SetCar(car)
    {
        this.m_car = car;
    }

    HandleMovementInput()
    {
        const gamepad = g_input.GetController(this.m_playerID);

        if (gamepad == null)
        {
            return;
        }

        const gas = gamepad.GetRightTrigger();
        this.m_car.AddGas(gas);

        const reverse = gamepad.GetLeftTrigger();
        this.m_car.AddReverse(reverse);

        const leftJoystick = gamepad.GetLeftStick();
        if (leftJoystick.GetDeadzoneCorrectedMagnitude() > 0.0)
        {
            const leftJoystickOrientation = gamepad.GetLeftStick().GetOrientationDegrees();
            this.m_car.TurnWheelsToOrientation(leftJoystickOrientation);
        }
        else
        {
            this.m_car.TurnWheelsToOrientation(this.m_car.GetOrientationDegrees());
        }
    }
}
