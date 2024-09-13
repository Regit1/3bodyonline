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
            endSimulation();
            return;
        }

        if (d1 > 7 * AU || d2 > 7 * AU || d3 > 7 * AU) {
            console.log("Star Ejected");
            endSimulation();
            return;
        }

        // Update and draw planets
        sun.updatePosition([sun, earth, earth2]);
        earth.updatePosition([sun, earth, earth2]);
        earth2.updatePosition([sun, earth, earth2]);

        sun.draw();
        earth.draw();
        earth2.draw();

        // Update the elapsed time display
        updateElapsedTime();
    }
}

function startSimulation() {
    // Get values from the input fields
    const sunX = parseFloat(document.getElementById('sun-x').value);
    const sunY = parseFloat(document.getElementById('sun-y').value);
    const earthX = parseFloat(document.getElementById('earth-x').value);
    const earthY = parseFloat(document.getElementById('earth-y').value);
    const earth2X = parseFloat(document.getElementById('earth2-x').value);
    const earth2Y = parseFloat(document.getElementById('earth2-y').value);

    // Get velocity values from the input fields
    const sunXVel = parseFloat(document.getElementById('sun-x-vel').value);
    const sunYVel = parseFloat(document.getElementById('sun-y-vel').value);
    const earthXVel = parseFloat(document.getElementById('earth-x-vel').value);
    const earthYVel = parseFloat(document.getElementById('earth-y-vel').value);
    const earth2XVel = parseFloat(document.getElementById('earth2-x-vel').value);
    const earth2YVel = parseFloat(document.getElementById('earth2-y-vel').value);

    // Initialize planets with the new values
    sun = new Planet(sunX, sunY, 10, 'yellow', 2.989 * Math.pow(10, 30), 0);
    sun.y_vel = sunYVel;
    sun.x_vel = sunXVel;

    earth = new Planet(earthX, earthY, 16, 'red', 2.989 * Math.pow(10, 30), 0);
    earth.x_vel = earthXVel;
    earth.y_vel = earthYVel;

    earth2 = new Planet(earth2X, earth2Y, 28, 'white', 2.989 * Math.pow(10, 30), 0);
    earth2.x_vel = earth2XVel;
    earth2.y_vel = earth2YVel;

    startTime = millis(); // Record the start time
    simulationRunning = true;
    loop(); // Start the draw loop
}

function endSimulation() {
    simulationRunning = false;
    noLoop(); // Stop the draw loop
    let elapsedTimeMs = millis() - startTime; // Elapsed time in milliseconds
    let elapsedTimeSec = elapsedTimeMs / 1000; // Convert milliseconds to seconds
    let daysElapsed = elapsedTimeSec * 263.5; // Convert seconds to days

    document.getElementById('elapsed-time').textContent = `Elapsed Time: ${elapsedTimeSec.toFixed(2)} seconds (${daysElapsed.toFixed(2)} days)`;
}

function updateElapsedTime() {
    if (simulationRunning) {
        let elapsedTimeMs = millis() - startTime;
        let elapsedTimeSec = elapsedTimeMs / 1000;
        document.getElementById('elapsed-time').textContent = `Elapsed Time: ${elapsedTimeSec.toFixed(2)} seconds`;
    }
}

class Planet {
    constructor(x, y, radius, color, mass, charge) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.mass = mass;
        this.charge = charge;
        this.orbit = [];
        this.sun = false;
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
