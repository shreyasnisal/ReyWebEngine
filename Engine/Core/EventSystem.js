"use strict";

import { g_console } from "/Engine/Core/EngineCommon.js";
import DevConsole from "/Engine/Core/DevConsole.js";


export class EventSystemConfig
{
    constructor()
    {
    }
}

class EventSubscription
{
    constructor(callback, helpText)
    {
        this.m_callback = callback;
        this.m_helpText = helpText;
    }
}

export default class EventSystem
{
    constructor(config)
    {
        this.m_config = config;
        this.m_subscriptionListByName = [];
    }

    Startup()
    {
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

    SubscribeEventCallbackFunction(eventName, callback, helpText = "")
    {
        const eventSubscription = new EventSubscription(callback, helpText);

        if (this.m_subscriptionListByName[eventName] == null)
        {
            this.m_subscriptionListByName[eventName] = [];
        }

        this.m_subscriptionListByName[eventName].push(eventSubscription);
    }

    UnsubscribeEventCallbackFunction(eventName, callback)
    {
        for (let subscriberIndex = 0; subscriberIndex < this.m_subscriptionListByName[eventName].length; subscriberIndex++)
        {
            if (this.m_subscriptionListByName[eventName][subscriberIndex] === callback)
            {
                this.m_subscriptionListByName[eventName].splice(subscriberIndex, 1);
            }
        }
    }

    FireEvent(eventName, args)
    {
        if (this.m_subscriptionListByName[eventName] == null)
        {
            g_console.AddLine(eventName + " is not recognized as a command", DevConsole.ERROR);
            return;
        }

        for (let subscriberIndex = 0; subscriberIndex < this.m_subscriptionListByName[eventName].length; subscriberIndex++)
        {
            const callbackReturn = this.m_subscriptionListByName[eventName][subscriberIndex].m_callback(args);
            if (typeof callbackReturn === "boolean" && callbackReturn)
            {
                break;
            }
        }
    }

    ListAllCommands()
    {
        for (let key in this.m_subscriptionListByName)
        {
            g_console.AddLine(key + ":\t\t\t\t\t" + this.m_subscriptionListByName[key][0].m_helpText, DevConsole.INFO_MAJOR);
        }
    }
}
