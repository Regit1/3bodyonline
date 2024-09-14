const WIDTH = 1000;
const HEIGHT = 600;
const AU = 1.49 * Math.pow(10, 11); // Astronomical Unit in meters
const SCALE = 100 / AU; // Scale for drawing (1 AU = 175 pixels)
const TIMESTEP = 90000; // 1 day in seconds

let sun, earth, earth2;
let startTime;
let simulationRunning = false;

function setup() {
    createCanvas(WIDTH, HEIGHT);
    noLoop(); // Stop the draw loop until the simulation starts
}

function draw() {
    background(0);

    if (simulationRunning) {
        // Calculate distances
        const d1 = dist(earth.x, earth.y, earth2.x, earth2.y);
        const d2 = dist(sun.x, sun.y, earth2.x, earth2.y);
        const d3 = dist(earth.x, earth.y, sun.x, sun.y);

        if (d1 < 0.2 * AU || d2 < 0.2 * AU || d3 < 0.2 * AU) {
            console.log("Star Collision");
            endSimulation("Star Collision");
            return;
        }

        if (d1 > 7 * AU || d2 > 7 * AU || d3 > 7 * AU) {
            console.log("Star Ejected");
            endSimulation("Star Ejected");
            return;
        }

        // Update and draw planets
        sun.updatePosition([earth, earth2]);
        earth.updatePosition([sun, earth2]);
        earth2.updatePosition([sun, earth]);

        sun.draw();
        earth.draw();
        earth2.draw();

        // Update the elapsed time display
        updateElapsedTime();
    }
}

function startSimulation() {
    // Figure-8 Orbit Initial Conditions
    const scaleFactor = 1e11; // To scale distances to a similar order as AU

    // Initialize planets with the new values for Figure-8 orbit
    sun = new Planet(0.97000436 * scaleFactor, -0.24308753 * scaleFactor, 10, 'yellow', 2.989 * Math.pow(10, 30), 0, true);
    sun.x_vel = 0.466203685 * scaleFactor / 3e7;
    sun.y_vel = 0.43236573 * scaleFactor / 3e7;

    earth = new Planet(-0.97000436 * scaleFactor, 0.24308753 * scaleFactor, 16, 'red', 2.989 * Math.pow(10, 30), 0);
    earth.x_vel = 0.466203685 * scaleFactor / 3e7;
    earth.y_vel = 0.43236573 * scaleFactor / 3e7;

    earth2 = new Planet(0, 0, 28, 'white', 2.989 * Math.pow(10, 30), 0);
    earth2.x_vel = -0.93240737 * scaleFactor / 3e7;
    earth2.y_vel = -0.86473146 * scaleFactor / 3e7;

    startTime = millis(); // Record the start time
    simulationRunning = true;
    loop(); // Start the draw loop
}

function endSimulation(reason) {
    simulationRunning = false;
    noLoop(); // Stop the draw loop
    let elapsedTimeMs = millis() - startTime; // Elapsed time in milliseconds
    let elapsedTimeSec = elapsedTimeMs / 1000; // Convert milliseconds to seconds
    let daysElapsed = elapsedTimeSec * 263.5; // Convert seconds to days

    document.getElementById('elapsed-time').textContent = `Simulation ended: ${reason}. Elapsed Time: ${elapsedTimeSec.toFixed(2)} seconds (${daysElapsed.toFixed(2)} days)`;
}

function updateElapsedTime() {
    if (simulationRunning) {
        let elapsedTimeMs = millis() - startTime;
        let elapsedTimeSec = elapsedTimeMs / 1000;
        let daysElapsed = elapsedTimeSec * 263.5;
        document.getElementById('elapsed-time').textContent = `Elapsed Time: ${elapsedTimeSec.toFixed(2)} seconds (${daysElapsed.toFixed(2)} days)`;
    }
}

class Planet {
    constructor(x, y, radius, color, mass, charge, isSun = false) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.mass = mass;
        this.charge = charge;
        this.orbit = [];
        this.sun = isSun;
        this.distance_to_sun = 0;
        this.x_vel = 0;
        this.y_vel = 0;
    }

    draw() {
        fill(this.color);
        let x = this.x * SCALE + WIDTH / 2;
        let y = this.y * SCALE + HEIGHT / 2;

        // Draw orbit path
        if (this.orbit.length > 1) {
            noFill();
            stroke(255);
            strokeWeight(2);
            beginShape();
            for (let [px, py] of this.orbit) {
                let screenX = px * SCALE + WIDTH / 2;
                let screenY = py * SCALE + HEIGHT / 2;
                vertex(screenX, screenY);
            }
            endShape();
        }

        // Draw the planet
        ellipse(x, y, this.radius * 2);
    }

    attraction(other) {
        let other_x = other.x;
        let other_y = other.y;
        let distance_x = other_x - this.x;
        let distance_y = other_y - this.y;
        let distance = Math.sqrt(distance_x ** 2 + distance_y ** 2);

        if (other.sun) {
            this.distance_to_sun = distance;
        }

        let forceg = (6.67428e-11) * this.mass * other.mass / Math.pow(distance, 2);
        let theta = Math.atan2(distance_y, distance_x);
        let force_xg = Math.cos(theta) * forceg;
        let force_yg = Math.sin(theta) * forceg;

        let forcec = (9.0e9) * this.charge * other.charge / Math.pow(distance, 2);
        let force_xc = Math.cos(theta) * forcec;
        let force_yc = Math.sin(theta) * forcec;

        return [force_xc + force_xg, force_yc + force_yg];
    }

    updatePosition(planets) {
        let total_fx = 0;
        let total_fy = 0;
        for (let planet of planets) {
            if (this === planet) continue;
            let [fx, fy] = this.attraction(planet);
            total_fx += fx;
            total_fy += fy;
        }

        this.x_vel += total_fx / this.mass * TIMESTEP;
        this.y_vel += total_fy / this.mass * TIMESTEP;
        this.x += this.x_vel * TIMESTEP;
        this.y += this.y_vel * TIMESTEP;
        this.orbit.push([this.x, this.y]);
    }
}
