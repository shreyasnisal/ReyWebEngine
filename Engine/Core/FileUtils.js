"use strict";

export async function ReadToString(filePath)
{
    // Some obscure code to handle asynchronous file loading in JS
    return new Promise(resolve => {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
            resolve(event.target.result);
        }
        fetch(filePath).then(fetchedFile =>
        {
            fetchedFile.blob().then(fileBlob =>
            {
                fileReader.readAsText(fileBlob);
            })
        })
    });
}

