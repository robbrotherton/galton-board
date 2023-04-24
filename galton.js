// https://codesandbox.io/s/github/rjoxford/MatterJSGaltonBoard
// https://www.tylermw.com/plinko-statistics-insights-from-the-bean-machine/


let width = 700;
let height = 700;
let x0 = x_start = width / 2;

// ball properties
const ballRadius = size = 4;
let y_start = 0;
let y_peg_start = 50;
let gap_between_pegs_and_buckets = ballRadius * 2;
let generation_speed = 20;
let nBalls = _total = 900;

// peg board properties
let rows = 18;
let pegGap = 6.5 * ballRadius;
let pegRadius = 0.5 * ballRadius;
let xGap = pegGap;
let yGap = 0.6 * xGap;
let pegAngle = 0; // Math.PI / 4;

// funnel properties
const funnelTostartGap = -yGap * 0.5;
const funnelWallLength = 600;
const funnelAngle = Math.PI / 3;
const funnelOpening = 5 * ballRadius;

// physics properties
let restitution = 0.6;
let friction = 0.01;
let frictionAir = 0.048;
let frictionStatic = 0;


// for the norml curve

let intervalId;


var {Engine, Render, Runner, 
    Composite, Composites, Common, 
    MouseConstraint, Mouse, Events, 
    World, Bodies, Body} = Matter;

let engine, render, runner, world;



function initialize() {
    // create engine
    engine = Engine.create({
        enableSleeping: true
    }),
        world = engine.world;
    
    // create renderer
    render = Render.create({
        element: document.getElementById("board"),
        engine: engine,
        options: {
            width: width,
            height: height,
            background: "#ffffff",
            wireframes: false,
            showSleeping: false
        }
    });
    Render.run(render);

    // engine.gravity.y = 1;
    // engine.timing.timeScale = 1;
    
    // create runner
    runner = Runner.create();
    Runner.run(runner, engine);
    render.canvas.addEventListener("mousedown", reset);
    render.canvas.position = "absolute";
}



// Create top funnel
let leftBumper_x =  x_start - (funnelWallLength * Math.cos(funnelAngle) + funnelOpening) / 2;
let rightBumper_x = x_start + (funnelWallLength * Math.cos(funnelAngle) + funnelOpening) / 2;
let bumper_y = y_peg_start - ((funnelWallLength * Math.sin(funnelAngle)) / 2 + funnelTostartGap);
console.log(bumper_y)

let createFunnel = () => {

        let leftBumper = Bodies.rectangle(leftBumper_x, bumper_y, funnelWallLength, 3, {
            restitution,
            friction: 0,
            frictionStatic: 0,
            isStatic: true
        });
        Matter.Body.rotate(leftBumper, funnelAngle);

        let rightBumper = Bodies.rectangle(rightBumper_x, bumper_y, funnelWallLength, 3, {
            restitution: 0.6,
            friction: 0,
            frictionStatic: 0,
            isStatic: true
        });
        Matter.Body.rotate(rightBumper, -funnelAngle);

        Matter.Composite.add(world, [leftBumper, rightBumper]);
}


function make_balls() {

    let total = _total;
    clearInterval(intervalId);

    intervalId = setInterval(() => {
        let balls = [];
        if (total-- > 0) {
            const circle = Bodies.circle(x0 + (-0.5 + Math.random()) * 1, -20, size, {
                label: "circle",
                friction: 0.001,
                restitution,
                // mass: 0.1,
                slop: 0.05,
                density: 0.1,
                frictionAir,
                sleepThreshold: Infinity,
                render: {
                    fillStyle: d3.schemeCategory10[total % 10]
                }
            });
            // Matter.Events.on(circle, "sleepStart", () => {
            //     Matter.Body.setStatic(circle, true);
            // });
            
            Matter.Composite.add(world, circle);
        }
    }, generation_speed);
}

let existingBalls = () => {
    return world.bodies.filter((body) => body.label === "circle");
  };

const makeStaticInterval = setInterval(() => {
    existingBalls().forEach(function(ball) {
      let ballHeight = ball.position.y;
      let ballSpeed = ball.speed;
      let minHeight = 350; // height - (floorHeight + wallHeight);
      if (ballHeight > minHeight && ballSpeed < 0.02) {
        // ball.render.opacity = 0.5;
        Body.setStatic(ball, true);
      }
    });
  }, 200);


function make_pegs() {
    const pegs = [];
    const spacingY = size*4;
    const spacingX = size*4;
    var i, j, lastI;
    for (i = 0; i < rows; i++) {
        for (j = 1; j < i; j++) {
            pegs.push(
                // Bodies.rectangle(
                Bodies.circle(
                    x_start + (j * xGap - i * (xGap / 2)),
                    y_peg_start + i * yGap,
                    ballRadius * 0.5,
                    // ballRadius * 1.2,
                    // 2,
                    {
                        angle: pegAngle,
                        isStatic: true,
                        friction: 0,
                        frictionStatic: 0,
                        render: {
                            fillStyle: "#000000"
                        },
                    chamfer: {
                        radius: [size * 0.2, size * 0.2, 0, 0]
                    }
        })
            );
        }
        lastI = i;
    }
    // bins
    for (i = 0; i < rows; i++) {
        Matter.Composite.add(
            world,
            Bodies.rectangle(

                x_start - (rows - 1) * (xGap / 2) + i * xGap,
                y_peg_start + rows * yGap + gap_between_pegs_and_buckets + (height-(y_peg_start + rows * yGap))/2,
                4,
                (height-(y_peg_start + rows * yGap)),
                {
                    isStatic: true,
                    density: 1000,
                    mass: 1000,
                    slop: 0,
                    render: {
                        fillStyle: "#000000",
                        visible: true
                    },
                    chamfer: {
                        radius: [size * 0.4, size * 0.4, 0, 0]
                    }
                }
            )
        );
    }
    // ground
    Matter.Composite.add(
        world,
        Bodies.rectangle(400, height, 1000, 10, {
            isStatic: true,
            render: {
                fillStyle: "#000000",
                visible: true
            }
        })
    );


    World.add(world, pegs);
}

const canvas = d3.select("#overlay")
.append("canvas")
.attr("id", "overlay")
.attr("position", "absolute")
.attr("width", width)
.attr("height", height);

const ctx = canvas.node().getContext('2d');
canvas.on("mousedown", reset);

function drawNormalDistribution() {

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, height);

    var values = jStat(-4, 4, 210)[0]
    for (var i in values) {
        let value = values[i];
        let density = jStat.normal.pdf(value, 0, 0.9);
        ctx.lineTo((value + 4)*(width/8), height-(density*810));
        ctx.stroke();
    }

}

function reset() {
    Composite.clear(world);
    Engine.clear(engine);
    Render.stop(render);
    Runner.stop(runner);
    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.textures = {};
    console.log('reset clicked');
    
    initialize();
    make_pegs();
    make_balls();
    createFunnel();
    drawNormalDistribution();
}


//

initialize();
make_pegs();
make_balls();
createFunnel();
drawNormalDistribution();

