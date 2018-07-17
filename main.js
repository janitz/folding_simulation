
//classes
class Color{
    constructor(h=0, s=100, l=50){
        this.h=h;
        this.s=s;
        this.l=l;
        this.checkLimits();
    }

    checkLimits(){
       this.h += 3600;
       this.h %= 360;
    }

    readString(str){
        if (str !== ""){
            this.h=parseFloat(/\d*(\.?\d+)(?=,)/.exec(str)[0]);
            this.s=parseFloat(/\d*(\.?\d+)(?=%,)/.exec(str)[0]);
            this.l=parseFloat(/\d*(\.?\d+)(?=%\))/.exec(str)[0]);
        }
    }

    fadeTo(col, percent){
        if(percent<0)percent=0;
        if(percent>100)percent=100;
        
        this.checkLimits();
        col.checkLimits();
        let hDiff = col.h - this.h;
        if (hDiff > 180) hDiff -=360;
        if (hDiff < -180) hDiff += 360;

        let sDiff = col.s - this.s;
        let lDiff = col.l - this.l;

        let h = (this.h + 3600 + (hDiff * percent / 100)) % 360;
        let s = this.s + (sDiff * percent / 100);
        let l = this.l + (lDiff * percent / 100);
    
        return new Color(h,s,l);
    }

    toString(){
        return "hsl("+this.h+","+this.s+"%,"+this.l+"%)";
    }
}
class Point {
    constructor(x=0, y=0, z=0){
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotateY(0);
        this.convert2d();
    }

    getPerspectiveDistance(){
        let x = this.xRot - perspective.x;
        let y = this.yRot - perspective.y;
        let z = this.zRot - perspective.z;
        return (x * x) + (y * y) + (z * z);
    }

    add(p){
        this.x += p.x
        this.y += p.y
        this.z += p.z        
    }

    rotateY(angle){
        let rad = angle * Math.PI / 180;
        let cos = Math.cos(rad);
        let sin = Math.sin(rad);

        let xOffset = (falt.width / 2)
        let x = this.x - xOffset;

        this.xRot = xOffset + (cos * x) - (sin * this.z);
        this.yRot = this.y;
        this.zRot = xOffset + (sin * x) + (cos * this.z);
    }

     convert2d(){
        let x,y,z;    
        x = this.xRot - perspective.x;
        y = this.yRot - perspective.y;
        z = this.zRot - perspective.z;
        this.x2d = perspective.x - (x * perspective.z / z);
        this.y2d = perspective.y - (y * perspective.z / z);
    }

}
class Path {
    constructor(points, number = 0){
        this.points = [];
        points.forEach((point) => {
            this.addPoint(new Point(point[0], point[1], point[2]));
        });
        this.number = number;
    }

    addPoint(point){
        this.points[this.points.length] = point;
    }

    getZOrderValue(){
        let z = 0;    
        let count = 0;
        this.points.forEach( (point) => {
               count++;
               z += point.getPerspectiveDistance(); 
            });
        return z / count;
    }

    drawPath(ctx) {
        ctx.fillStyle = colors[this.number].toString();
        ctx.beginPath();
        let point = this.points[this.points.length - 1];
        ctx.moveTo(point.x2d, point.y2d);
        this.points.forEach( (point) => {
            ctx.lineTo(point.x2d, point.y2d);
        });
        ctx.stroke();
        ctx.fill();
    }
}
class Figure {
    constructor(){
        this.paths = [];
    }

    addPath(points, number){
        this.paths[this.paths.length] = new Path(points, number);
    }

    sortZ(){
        this.paths.sort( (path1, path2) => {
            return path2.getZOrderValue() - path1.getZOrderValue();
        });
    }  
    
    drawFigure(angle, clear){
        if(clear)ctx.clearRect(0, 0, falt.width, falt.height)
        
        this.paths.forEach( (path) => {
            path.points.forEach( (point) => {
                point.rotateY(angle);                
                point.convert2d();
            });
        });
        
        this.sortZ();

        this.paths.forEach( (path) => {
            path.drawPath(ctx);
        });
    }    
}

//html elements
let falt = getById("falt");

//3d viewer elements
let ctx = falt.getContext("2d");
let perspective = {
    x:falt.width/2, 
    y:0, 
    z:-1000};
let bg = generateGrid();
let fig = generateFigure(150, 67, 46, 90);
let currentRotation = 0;
let colors = [];
let speed = 200;

//inputs
let r_k = getById("k")
let r_a = getById("a")
let r_c = getById("c")
let p_k = getById("p_k")
let p_a = getById("p_a")
let p_c = getById("p_c")


//run the thing
init();
loop();
function rangeChange(){
    fig = generateFigure(150, r_a.value, r_c.value, r_k.value)
    p_a.innerHTML = r_a.value
    p_c.innerHTML = r_c.value
    p_k.innerHTML = r_k.value    
}

function init(){
    colors[0]= new Color(20,100,50);     
    colors[1]= new Color(120,100,50);     
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgb(0,0,0)";
}

function loop(){
    requestAnimationFrame(loop);
    currentRotation += 0.5;
    if(currentRotation > 360) currentRotation -= 360; 
    bg.drawFigure(currentRotation, true);
    fig.drawFigure(currentRotation, false);
}

//functions
function generateFigure(h1,a,c,k){
    let fig = new Figure();
    
    let h1Dyn = Math.cos((k / 2) * Math.PI / 180) * h1;
    let t1Dyn = Math.sin((k / 2) * Math.PI / 180) * h1; //z(k)

    let aka = h1 / Math.tan(a * Math.PI / 180);  

    fig.addPath([[0,0,0],[-2*h1,0,0],[-2*h1,-h1Dyn,-t1Dyn],[-aka,-h1Dyn,-t1Dyn]],0)
    fig.addPath([[0,0,0],[-2*h1,0,0],[-2*h1,-h1Dyn,t1Dyn],[-aka,-h1Dyn,t1Dyn]],0)

    let b = (180 - a - c)
    let hyp = h1 / Math.sin(a * Math.PI / 180)
    let h2 = Math.sin(b * Math.PI / 180) * hyp
    let akb = h2 / Math.tan(b * Math.PI / 180)  //ak(b,h2)
    let hypDyn = Math.sqrt((aka * aka) + (h1Dyn * h1Dyn))    

    let aDyn = Math.atan(h1Dyn / aka) * 180 / Math.PI
    let bDyn = Math.acos(akb / hypDyn) * 180 / Math.PI
    let cDyn = 180 - aDyn - bDyn
    if(a > 90)cDyn-=180

    let h2Dyn = Math.sqrt((hypDyn * hypDyn) - (akb * akb))

    let sincDyn = Math.sin(cDyn * Math.PI / 180) * h1 * 2
    let coscDyn = Math.cos(cDyn * Math.PI / 180) * h1 * 2
    let sinh2_90Dyn = Math.sin((cDyn + 90) * Math.PI / 180) * h2Dyn
    let cosh2_90Dyn = Math.cos((cDyn + 90) * Math.PI / 180) * h2Dyn
    

    fig.addPath([[0,0,0],[-aka,-h1Dyn,-t1Dyn],[coscDyn + cosh2_90Dyn, -(sincDyn + sinh2_90Dyn),-t1Dyn],[coscDyn,-sincDyn,0]],1)    
    fig.addPath([[0,0,0],[-aka,-h1Dyn,t1Dyn],[coscDyn + cosh2_90Dyn, -(sincDyn + sinh2_90Dyn),t1Dyn],[coscDyn,-sincDyn,0]],1)

    fig.paths.forEach( (path) => {
        path.points.forEach( (point) => {
            point.add(new Point(falt.width/2,falt.height/4*3,0));
        });
    });
    return fig;
}


function generateGrid(){
    let fig = new Figure();
        
    fig.addPath([[0,0,400],[500,0,400]],0)
    fig.addPath([[0,0,400],[-500,0,400]],0)
    fig.addPath([[0,0,300],[500,0,300]],0)
    fig.addPath([[0,0,300],[-500,0,300]],0)
    fig.addPath([[0,0,200],[500,0,200]],0)
    fig.addPath([[0,0,200],[-500,0,200]],0)
    fig.addPath([[0,0,100],[500,0,100]],0)
    fig.addPath([[0,0,100],[-500,0,100]],0)    
    fig.addPath([[0,0,0],[500,0,0]],0)
    fig.addPath([[0,0,0],[-500,0,0]],0)
    fig.addPath([[0,0,-100],[500,0,-100]],0)
    fig.addPath([[0,0,-100],[-500,0,-100]],0)
    fig.addPath([[0,0,-200],[500,0,-200]],0)
    fig.addPath([[0,0,-200],[-500,0,-200]],0)
    fig.addPath([[0,0,-300],[500,0,-300]],0)
    fig.addPath([[0,0,-300],[-500,0,-300]],0)
    fig.addPath([[0,0,-400],[500,0,-400]],0)
    fig.addPath([[0,0,-400],[-500,0,-400]],0)


    fig.addPath([[400,0,0],[400,0,500]],0)
    fig.addPath([[400,0,0],[400,0,-500]],0)
    fig.addPath([[300,0,0],[300,0,500]],0)
    fig.addPath([[300,0,0],[300,0,-500]],0)
    fig.addPath([[200,0,0],[200,0,500]],0)
    fig.addPath([[200,0,0],[200,0,-500]],0)
    fig.addPath([[100,0,0],[100,0,500]],0)
    fig.addPath([[100,0,0],[100,0,-500]],0)
    fig.addPath([[0,0,0],[0,0,500]],0)
    fig.addPath([[0,0,0],[0,0,-500]],0)
    fig.addPath([[-100,0,0],[-100,0,500]],0)
    fig.addPath([[-100,0,0],[-100,0,-500]],0)
    fig.addPath([[-200,0,0],[-200,0,500]],0)
    fig.addPath([[-200,0,0],[-200,0,-500]],0)
    fig.addPath([[-300,0,0],[-300,0,500]],0)
    fig.addPath([[-300,0,0],[-300,0,-500]],0)
    fig.addPath([[-400,0,0],[-400,0,500]],0)
    fig.addPath([[-400,0,0],[-400,0,-500]],0)

    fig.paths.forEach( (path) => {
        path.points.forEach( (point) => {
            point.add(new Point(falt.width/2,falt.height/4*3,0));
        });
    });
    return fig;
}

function getById(str){
    return document.getElementById(str);
}

