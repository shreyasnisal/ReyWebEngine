
export function TrimString(stringToTrim)
{
    return stringToTrim.trim();
}

export function SplitStringOnDelimiter(out_splitStrings, originalString, delimiter, removeEmpty = false)
{
    const splitStrings = originalString.split(delimiter);
    let numSplits = 0;

    for (let splitStringIndex = 0; splitStringIndex < splitStrings.length; splitStringIndex++)
    {
        if (removeEmpty && splitStrings[splitStringIndex] === "")
        {
            continue;
        }

        out_splitStrings.push(splitStrings[splitStringIndex]);
        numSplits++;
    }

    return numSplits;
}
