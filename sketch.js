const G = 6.67428e-11; // Gravitational constant
const MASS = 2.989e30; // Mass of each body
const TIMESTEP = 90000; // 1 day in seconds

let sun, earth, earth2;
let planets = [];
let startTime;
let simulationRunning = false;
let scaleFactor = 1e11; // Initial scale factor
let zoomLevel = 1;
let panX = 0, panY = 0;

function setup() {
    createCanvas(windowWidth, windowHeight);
    noLoop();
    setupInitialConditions();
    createButtons();
}

function setupInitialConditions() {
    sun = new Planet(0.97000436, -0.24308753, 0.466203685, 0.43236573, 10, 'yellow', true);
    earth = new Planet(-0.97000436, 0.24308753, 0.466203685, 0.43236573, 16, 'red');
    earth2 = new Planet(0, 0, -0.93240737, -0.86473146, 28, 'white');
    planets = [sun, earth, earth2];
}

function createButtons() {
    let startButton = createButton('Start Simulation');
    startButton.position(10, 10);
    startButton.mousePressed(startSimulation);

    let resetButton = createButton('Reset Simulation');
    resetButton.position(140, 10);
    resetButton.mousePressed(resetSimulation);

    let zoomInButton = createButton('Zoom In');
    zoomInButton.position(270, 10);
    zoomInButton.mousePressed(() => zoomLevel *= 1.1);

    let zoomOutButton = createButton('Zoom Out');
    zoomOutButton.position(340, 10);
    zoomOutButton.mousePressed(() => zoomLevel /= 1.1);
}

function draw() {
    background(0);
    translate(width / 2 + panX, height / 2 + panY);
    scale(zoomLevel);

    if (simulationRunning) {
        updatePlanets();
        checkCollisionOrEjection();
        updateElapsedTime();
    }

    planets.forEach(planet => planet.draw());
}

function updatePlanets() {
    planets.forEach(planet => planet.updatePosition(planets));
}

function checkCollisionOrEjection() {
    const d1 = dist(earth.x, earth.y, earth2.x, earth2.y);
    const d2 = dist(sun.x, sun.y, earth2.x, earth2.y);
    const d3 = dist(earth.x, earth.y, sun.x, sun.y);

    if (d1 < 0.1 || d2 < 0.1 || d3 < 0.1) {
        endSimulation("Star Collision");
    } else if (d1 > 10 || d2 > 10 || d3 > 10) {
        endSimulation("Star Ejected");
    }
}

function startSimulation() {
    setupInitialConditions();
    startTime = millis();
    simulationRunning = true;
    loop();
}

function resetSimulation() {
    setupInitialConditions();
    simulationRunning = false;
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    document.getElementById('elapsed-time').textContent = 'Elapsed Time: 0.00 seconds (0.00 days)';
    redraw();
}

function endSimulation(reason) {
    simulationRunning = false;
    noLoop();
    let elapsedTimeMs = millis() - startTime;
    let elapsedTimeSec = elapsedTimeMs / 1000;
    let daysElapsed = elapsedTimeSec * TIMESTEP / 86400;
    document.getElementById('elapsed-time').textContent = `Simulation ended: ${reason}. Elapsed Time: ${elapsedTimeSec.toFixed(2)} seconds (${daysElapsed.toFixed(2)} days)`;
}

function updateElapsedTime() {
    let elapsedTimeMs = millis() - startTime;
    let elapsedTimeSec = elapsedTimeMs / 1000;
    let daysElapsed = elapsedTimeSec * TIMESTEP / 86400;
    document.getElementById('elapsed-time').textContent = `Elapsed Time: ${elapsedTimeSec.toFixed(2)} seconds (${daysElapsed.toFixed(2)} days)`;
}

class Planet {
    constructor(x, y, vx, vy, radius, color, isSun = false) {
        this.x = x * scaleFactor;
        this.y = y * scaleFactor;
        this.vx = vx * scaleFactor / 3e7;
        this.vy = vy * scaleFactor / 3e7;
        this.radius = radius;
        this.color = color;
        this.mass = MASS;
        this.sun = isSun;
        this.trail = [];
    }

    draw() {
        // Draw trail
        stroke(this.color);
        strokeWeight(1);
        noFill();
        beginShape();
        for (let pos of this.trail) {
            vertex(pos.x, pos.y);
        }
        endShape();

        // Draw planet
        fill(this.color);
        noStroke();
        ellipse(this.x, this.y, this.radius * 2);
    }

    attraction(other) {
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        let distance = sqrt(dx * dx + dy * dy);
        let force = G * this.mass * other.mass / (distance * distance);
        let theta = atan2(dy, dx);
        return [force * cos(theta), force * sin(theta)];
    }

    updatePosition(planets) {
        let fx = 0, fy = 0;
        for (let planet of planets) {
            if (planet !== this) {
                let [ffx, ffy] = this.attraction(planet);
                fx += ffx;
                fy += ffy;
            }
        }

        let ax = fx / this.mass;
        let ay = fy / this.mass;

        this.vx += ax * TIMESTEP;
        this.vy += ay * TIMESTEP;
        this.x += this.vx * TIMESTEP;
        this.y += this.vy * TIMESTEP;

        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 1000) this.trail.shift();
    }
}

function mouseDragged() {
    panX += mouseX - pmouseX;
    panY += mouseY - pmouseY;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
