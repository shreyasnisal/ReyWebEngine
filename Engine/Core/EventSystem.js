"use strict";

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

    SubscribeEventCallbackFunction(eventName, callback, helpText)
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
        for (let subscriberIndex = 0; subscriberIndex < this.m_subscriptionListByName[eventName].length; subscriberIndex++)
        {
            const callbackReturn = this.m_subscriptionListByName[eventName][subscriberIndex].m_callback(args);
            if (typeof callbackReturn === "boolean" && callbackReturn)
            {
                break;
            }
        }
    }
}
