
export default class NumberRange
{
    constructor(min = 0, max = 0)
    {
        this.m_min = min;
        this.m_max = max;
    }

    IsOnRange(value)
    {
        return (value > this.m_min && value < this.m_max);
    }

    IsOverlappingWith(otherFloatRange)
    {
        return (
            this.IsOnRange(otherFloatRange.m_min) ||
            this.IsOnRange(otherFloatRange.m_max) ||
            otherFloatRange.IsOnRange(this.m_min) ||
            otherFloatRange.IsOnRange(this.m_max)
        );
    }

    Assign(copyFloatRange)
    {
        this.m_min = copyFloatRange.m_min;
        this.m_max = copyFloatRange.m_max;
    }

    Equals(otherFloatRange)
    {
        return (this.m_min === otherFloatRange.m_min && this.m_max === otherFloatRange.m_max);
    }

    NotEquals(otherFloatRange)
    {
        return (this.m_min !== otherFloatRange.m_min || this.m_max !== otherFloatRange.m_max);
    }
}