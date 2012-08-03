
function Vector2()
{
    this.initialize.apply(this, arguments);
}

Vector2.prototype = {
    initialize: function(x, y)
    {
        this.x = x;
        this.y = y;
    },

    clone: function()
    {
        return new Vector2(this.x, this.y);
    },

    lengthSq: function()
    {
        return this.x*this.x + this.y*this.y;
    },

    length: function()
    {
        return Math.sqrt(this.lengthSq());
    },

    add: function(rhs)
    {
        return new Vector2(this.x + rhs.x, this.y + rhs.y);
    },
    
    subtract: function(rhs)
    {
        return new Vector2(this.x - rhs.x, this.y - rhs.y);
    },

    multiply: function(k)
    {
        return new Vector2(this.x * k, this.y * k);
    },

    dot: function(rhs)
    {
        return this.x * rhs.x + this.y * rhs.y;
    },

    perpdot: function(rhs)
    {
        return this.x * rhs.y - this.y * rhs.x;
    },

    distanceFrom: function(v)
    {
        return this.subtract(v).length();
    }
}
