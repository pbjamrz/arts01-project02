function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
}

let heartScale = 1;
let tension = 0; // 0 = loose, 1 = tight, 2+ = breaking
let targetTension = 0;
let heartbeatPhase = 0;

function draw() {
  background(20);

  // Update tension (smooth decay when not clicking)
  tension = lerp(tension, targetTension, 0.1);
  if (!mouseIsPressed) {
    targetTension = max(0, targetTension - 0.02);
  }

  // Heartbeat animation
  heartbeatPhase += 0.05 + tension * 0.1;
  let beat = sin(heartbeatPhase) * 0.05 * (1 + tension * 0.5);
  heartScale = 1 + beat;

  push();
  translate(width / 2, height / 2);

  // Draw rosary behind heart
  drawRosary();

  // Draw heart on top
  scale(heartScale);
  drawHeart();
  pop();

  // Debug info
  fill(255);
  textSize(12);
  text(`Tension: ${tension.toFixed(2)} | Click to increase`, 10, 20);
}

function mousePressed() {
  targetTension = min(2.5, targetTension + 0.15);
}

// --------- ROSARY --------- //
function drawRosary() {
  let beadColor = color(217, 217, 217);
  let chainColor = color(100, 100, 120);

  // Calculate coil parameters based on tension
  let loops = 2.5 - tension * 0.5; // tightens with tension
  let radius = 180 - tension * 40; // shrinks inward
  let numBeads = 50;

  // Breaking state - beads scatter
  if (tension > 2) {
    drawBreakingRosary();
    return;
  }

  // Draw chain segments
  stroke(chainColor);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let i = 0; i < numBeads; i++) {
    let t = i / numBeads;
    let angle = t * TWO_PI * loops;
    let r = radius * (0.8 + 0.2 * sin(angle * 3)); // organic variation
    let x = cos(angle) * r;
    let y = sin(angle) * r - 20; // offset to wrap around heart
    curveVertex(x, y);
  }
  endShape();

  // Draw beads
  noStroke();
  for (let i = 0; i < numBeads; i++) {
    let t = i / numBeads;
    let angle = t * TWO_PI * loops;
    let r = radius * (0.8 + 0.2 * sin(angle * 3));
    let x = cos(angle) * r;
    let y = sin(angle) * r - 20;

    // Larger bead every 10th bead (Our Father beads)
    let isLarge = i % 10 === 0;
    let beadSize = isLarge ? 12 : 7;

    // Bead shadow
    fill(50);
    ellipse(x + 2, y + 2, beadSize, beadSize);

    // Main bead
    fill(beadColor);
    ellipse(x, y, beadSize, beadSize);

    // Bead highlight
    fill(255, 150);
    ellipse(x - beadSize * 0.2, y - beadSize * 0.2, beadSize * 0.3, beadSize * 0.3);
  }

  // Draw cross at bottom
  drawCross(0, radius + 60);
}

// Beads scatter when breaking free
let scatteredBeads = [];
function drawBreakingRosary() {
  // Initialize scattered beads once
  if (scatteredBeads.length === 0) {
    for (let i = 0; i < 50; i++) {
      let angle = random(TWO_PI);
      scatteredBeads.push({
        x: 0,
        y: 0,
        vx: cos(angle) * random(3, 8),
        vy: sin(angle) * random(3, 8),
        size: i % 10 === 0 ? 12 : 7,
        life: 1.0
      });
    }
  }

  // Update and draw scattered beads
  noStroke();
  for (let bead of scatteredBeads) {
    bead.x += bead.vx;
    bead.y += bead.vy;
    bead.vy += 0.2; // gravity
    bead.life -= 0.01;

    if (bead.life > 0) {
      fill(217, 217, 217, bead.life * 255);
      ellipse(bead.x, bead.y, bead.size, bead.size);
    }
  }
}

function drawCross(x, y) {
  push();
  translate(x, y);

  fill(100, 100, 120);
  noStroke();

  // Vertical beam
  rect(-3, -15, 6, 30);
  // Horizontal beam
  rect(-10, -5, 20, 6);

  // Metallic highlight
  fill(150, 150, 170);
  rect(-2, -15, 2, 28);

  pop();
}

// --------- HEART --------- //
function drawHeart() {
  // colors
  let base = color("#6d0017");     // deep crimson
  let mid = color("#8a002272");     // mid red
  let dark = color("#1a0006");     // shadow
  let glow = color(255, 60, 80, 20); // faint pulse halo

  // main shape ---------
  push();
  noStroke();
  fill(base);

  beginShape();
  vertex(0, -130);  // top center indentation

  // lobes
  bezierVertex(100, -200, 220, -40, 0, 160);
  bezierVertex(-220, -40, -100, -200, 0, -130);

  endShape(CLOSE);
  pop();

  // inner shading ---------
  push();
  noStroke();
  fill(mid);
  beginShape();
  vertex(0, -110);
  bezierVertex(70, -150, 140, -40, 0, 130);
  bezierVertex(-140, -40, -70, -150, 0, -110);
  endShape(CLOSE);
  pop();

  // highlight ---------
  push();
  noStroke();
  fill(255, 10); // translucent white
  ellipse(-50, -50, 30, 50);
  pop();
}