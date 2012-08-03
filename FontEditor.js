
var fontEditor;

function main()
{
    var strokesCanvas = document.getElementById("strokes_canvas");
    if(!strokesCanvas.getContext){return;}

    var glyphsCanvas = document.getElementById("glyphs_canvas");
    if(!glyphsCanvas.getContext){return;}

    var output = document.getElementById("output");
    var charcode = document.getElementById("charcode");

    fontEditor = new FontEditor(strokesCanvas, glyphsCanvas, charcode, output);
}

function eventPositionToElement(evt, element)
{
    var elmX = 0;
    var elmY = 0;
    while(element.offsetParent){
        elmX += element.offsetLeft;
        elmY += element.offsetTop;
        element = element.offsetParent;
    }
    return new Vector2(evt.pageX - elmX, evt.pageY - elmY);
}
    


// ---------------------------------------------------------------------------
// class FontEditor
// ---------------------------------------------------------------------------

function FontEditor()
{
    this.initialize.apply(this, arguments);
}

FontEditor.prototype = {
    initialize: function(strokesCanvas, glyphsCanvas, charcode, output)
    {
        this.SIZE_UNIT = 256;

        this.strokesCanvas = strokesCanvas;
        this.glyphsCanvas = glyphsCanvas;
        this.charcode = charcode;
        this.output = output;

        this.strokesCanvasCtx = strokesCanvas.getContext("2d");
        this.glyphsCanvasCtx = glyphsCanvas.getContext("2d");

        this.glyphs = new Array();
        this.glyphsChar = new Array();
        this.strokes = new Array();

        this.initMouseHandler();
    },

    initMouseHandler: function()
    {
        var self = this;
        this.strokesCanvas.addEventListener("mousedown", function(e){self.onMouseDown(e);}, false);
        this.strokesCanvas.addEventListener("mouseup", function(e){self.onMouseUp(e);}, false);
        this.strokesCanvas.addEventListener("mousemove", function(e){self.onMouseMove(e);}, false);
    },


    onMouseDown: function(e)
    {
        var pos = eventPositionToElement(e, this.strokesCanvas);
        this.lastPoint = pos;
        this.lastVector = null;

        // begin stroke.
        this.currentStroke = new Array();
        this.addStrokePoint(pos);
    },

    onMouseUp: function(e)
    {
        this.lastPoint = null;

        // end stroke.
        if(this.currentStroke){
            this.addStrokePoint(eventPositionToElement(e, this.strokesCanvas));

            this.strokes.push(this.currentStroke);
            this.currentStroke = null;
        }
    },

    onMouseMove: function(e)
    {
        if(this.lastPoint == null){
            return;
        }
        
        var pos1 = this.lastPoint;
        var pos0 = eventPositionToElement(e, this.strokesCanvas);

        var v01 = pos0.subtract(pos1);
        var v01len = v01.length();
        if(v01len < 10){
            return;
        }
        var v01unit = v01.multiply(1.0/v01len);



        if(this.lastVector){
            if(Math.abs(this.lastVector.perpdot(v01unit)) > 0.2){
                this.addStrokePoint(pos0);
                this.lastVector = v01unit;
            }
        }
        else{
            this.lastVector = v01unit;
        }
        

        this.lastPoint = pos0;
    },


    addStrokePoint: function(pos)
    {
        this.currentStroke.push(pos.clone());

        if(this.currentStroke.length >= 2){
            var curr = this.currentStroke[this.currentStroke.length-1];
            var prev = this.currentStroke[this.currentStroke.length-2];
            var ctx = this.strokesCanvasCtx;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
        }
    },


    undoStroke: function()
    {
        if(this.currentStroke){
            return;
        }

        if(this.strokes.length <= 0){
            return;
        }

        this.strokes.pop();
        this.paintStrokesCanvas();
    },


    clearStrokes: function()
    {
        if(this.currentStroke){
            return;
        }

        this.strokes = new Array();
        this.paintStrokesCanvas();
    },
    

    paintGlyph: function(ctx, strokes, x, y, w, h)
    {
        if(!ctx || !strokes){
            return;
        }
        
        var si;
        for(si = 0; si < strokes.length; si++){
            var stroke = strokes[si];
            if(stroke.length < 2){
                continue;
            }

            ctx.beginPath();
            ctx.moveTo(stroke[0].x * w / this.SIZE_UNIT + x, stroke[0].y * h / this.SIZE_UNIT + y);

            var pi;
            for(pi = 1; pi < stroke.length; pi++){
                ctx.lineTo(stroke[pi].x * w / this.SIZE_UNIT + x, stroke[pi].y * h / this.SIZE_UNIT + y);
            }
            ctx.stroke();
        }
        
    },
    

    paintStrokesCanvas: function()
    {
        var ctx = this.strokesCanvasCtx;
        ctx.clearRect(0, 0, this.strokesCanvas.width, this.strokesCanvas.height);

        this.paintGlyph(ctx, this.strokes, 0, 0, this.strokesCanvas.width, this.strokesCanvas.height);
    },



    paintGlyphsCanvas: function()
    {
        var ctx = this.glyphsCanvasCtx;
        ctx.clearRect(0, 0, this.glyphsCanvas.width, this.glyphsCanvas.height);

        var countX = 16;
        var countY = 16;
        var stepX = this.glyphsCanvas.width / countX;
        var stepY = this.glyphsCanvas.height / countY;

        var gi;
        for(gi = 0; gi < this.glyphs.length; gi++){
            this.paintGlyph(
                    ctx, this.glyphs[gi],
                    (gi % countX) * stepX,
                    Math.floor(gi / countX) * stepY,
                    stepX,
                    stepY);
        }
        
    },

    
    registerGlyph: function()
    {
        if(this.charcode.value.length < 1){
            alert("character code is empty.");
            return;
        }
        

        this.glyphs.push(this.strokes);
        this.glyphsChar.push(this.charcode.value.charAt(0));
        this.charcode.value = "";
        this.paintGlyphsCanvas();

        this.strokes = new Array();
        this.paintStrokesCanvas();
    },


    outputGlyphsText: function()
    {
        var txt = "";
        txt += "{";
        var gi;
        for(gi = 0; gi < this.glyphs.length; gi++){
            var strokes = this.glyphs[gi];

            if(gi != 0){
                txt += ",";
            }
            txt += "\n";

            txt += "'" + this.glyphsChar[gi] + "':"

            txt += "[";
            var si;
            for(si = 0; si < strokes.length; si++){
                var points = strokes[si];
                if(si != 0){
                    txt += ",";
                }
                
                txt += "[";
                var pi;
                for(pi = 0; pi < points.length; pi++){
                    if(pi != 0){
                        txt += ",";
                    }
                    txt += points[pi].x.toString(10) + "," + points[pi].y.toString(10);
                }
                txt += "]";
            }
            txt += "]";
        }
        txt += "\n";
        txt += "}";
        
        //
        this.output.textContent = txt;
    }
    
    
    
}

