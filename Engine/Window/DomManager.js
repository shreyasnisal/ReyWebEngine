"use strict";


export function GetElementByID(elementID)
{
    return document.getElementById(elementID);
}

export function GetElementsByClass(classname)
{
    return document.getElementsByClassName(classname);
}

export function GetFirstElementByClass(classname)
{
    return document.getElementsByClassName(classname)[0];
}
