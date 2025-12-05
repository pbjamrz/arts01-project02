function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
}

let heartScale = 1;
let tension = 0;
let targetTension = 0;
let heartbeatPhase = 0;
let lastBeatTime = 0;
let beatInterval = 2000;

function draw() {
  let bgBrightness = 20 + tension * 15;
  background(bgBrightness, bgBrightness - 5, bgBrightness + 5);

  // update tension
  // 0 = loose, 1 = tight, 2+ = breaking
  tension = lerp(tension, targetTension, 0.1);
  if (!mouseIsPressed) {
    targetTension = max(0, targetTension - 0.02);
  }

  // heartbeat timing based on tension
  // low tension = slow dying beats (2000ms)
  // high tension = rapid panicked beats (400ms)
  beatInterval = map(tension, 0, 2, 2000, 400);

  let currentTime = millis();
  if (currentTime - lastBeatTime > beatInterval) {
    lastBeatTime = currentTime;
    heartbeatPhase = 0; // reset beat cycle
  }

  // natural heartbeat: quick contraction, slower relaxation
  let beatProgress = (currentTime - lastBeatTime) / beatInterval;
  let beat;

  if (beatProgress < 0.15) {
    // Quick contraction (systole)
    beat = sin(beatProgress * PI / 0.15) * 0.15;
  } else if (beatProgress < 0.35) {
    // Quick relaxation
    beat = sin((beatProgress - 0.15) * PI / 0.2 + PI) * 0.08;
  } else {
    // Rest period (diastole)
    beat = 0;
  }

  // scale increases with tension
  let beatAmplitude = 0.08 + tension * 0.475;
  heartScale = 1 + beat * beatAmplitude;

  drawAmbientGlow();

  push();
  translate(width / 2, height / 2);
  scale(heartScale);
  drawHeart();
  drawRosary();
  pop();

  // debug info
  fill(255);
  textSize(12);
  text(`Tension: ${tension.toFixed(2)} | Interval: ${beatInterval.toFixed(0)}ms | Click to increase`, 10, 20);
}

// ambient lighting and glow
function drawAmbientGlow() {
  push();
  translate(width / 2, height / 2);

  // dull red glow that intensifies with tension
  let glowAlpha = 5 + tension * 20;
  let glowSize = 400 + tension * 200;

  // outer glow
  for (let i = 4; i > 0; i--) {
    fill(139, 0, 23, glowAlpha * (i / 4));
    noStroke();
    ellipse(0, 0, glowSize * (i / 4), glowSize * (i / 4));
  }

  // pulsing light with heartbeat
  let pulseAlpha = glowAlpha * 0.5 * heartScale;
  fill(200, 50, 60, pulseAlpha);
  ellipse(0, 0, 300, 300);

  pop();
}

function mousePressed() {
  targetTension = min(2.5, targetTension + 0.25);
}

// --------- HEART --------- //
function drawHeart() {
  // colors - get brighter with tension
  let brightness = tension * 15;
  let base = color(109 + brightness, 0, 23 + brightness);
  let mid = color(138 + brightness, 0, 34 + brightness, 114);

  // main shape 
  push();
  noStroke();
  fill(base);
  beginShape();
  vertex(0, -130);
  bezierVertex(100, -200, 220, -40, 0, 160);
  bezierVertex(-220, -40, -100, -200, 0, -130);
  endShape(CLOSE);
  pop();

  // inner coloring 
  push();
  noStroke();
  fill(mid);
  beginShape();
  vertex(0, -110);
  bezierVertex(70, -150, 140, -40, 0, 130);
  bezierVertex(-140, -40, -70, -150, 0, -110);
  endShape(CLOSE);
  pop();

  // glow
  push();
  noStroke();
  fill(255, 60, 80, 10 + tension * 15);
  beginShape();
  vertex(0, -135);
  bezierVertex(105, -205, 225, -45, 0, 165);
  bezierVertex(-225, -45, -105, -205, 0, -135);
  endShape(CLOSE);
  pop();

  // highlight
  push();
  noStroke();
  fill(255, 10 + tension * 5);
  ellipse(-50, -50, 30, 50);
  pop();
}

// --------- HEART END --------- //

// --------- ROSARY --------- //
function drawRosary() {
  let beadColor = color(217, 217, 217);
  let chainColor = color(100, 100, 120);
  let numBeads = 18;

  // breaking state
  if (tension > 2) {
    drawBreakingRosary();
    return;
  }

  stroke(chainColor);
  strokeWeight(2);
  noFill();

  // draw two diagonal chains in X pattern
  for (let strand = 0; strand < 2; strand++) {
    beginShape();

    for (let i = 0; i <= numBeads; i++) {
      let t = i / numBeads;

      let x, y;
      if (strand === 0) {
        // top-left to bot-right
        x = map(t, 0, 1, -130, 100);
        y = map(t, 0, 1, -110, 80);
      } else {
        // top-right to bot-left
        x = map(t, 0, 1, 130, -100);
        y = map(t, 0, 1, -110, 80);
      }

      curveVertex(x, y);
    }

    endShape();

    // draw beads along each strand
    noStroke();
    for (let i = 0; i <= numBeads; i++) {
      let t = i / numBeads;

      let x, y;
      if (strand === 0) {
        // top-left to bot-right
        x = map(t, 0, 1, -120, 90);
        y = map(t, 0, 1, -100, 70);
      } else {
        // top-right to bot-left
        x = map(t, 0, 1, 120, -90);
        y = map(t, 0, 1, -100, 70);
      }

      if (i === 10 || i === 11) {
        x = 0;
        y = 0;
      }

      // larger bead every 6th bead
      let isLarge = i % 6 === 0;
      let beadSize = isLarge ? 12 : 7;

      // bead shadow
      fill(50);
      ellipse(x + 2, y + 2, beadSize, beadSize);

      // bead base
      fill(beadColor);
      ellipse(x, y, beadSize, beadSize);

      // bead highlight
      fill(255, 150);
      ellipse(x - beadSize * 0.2, y - beadSize * 0.2, beadSize * 0.3, beadSize * 0.3);
    }

    stroke(chainColor);
    strokeWeight(2);
    noFill();
  }

  // draw chain hanging down to cross
  stroke(chainColor);
  strokeWeight(2);
  line(0, 5, 0, 120);

  // beads
  noStroke();
  for (let i = 0; i < 5; i++) {
    let x, y;
    x = 0;
    y = map(i, 0, 5, 20, 100);

    // larger bead every 6th bead
    let isLarge = i === 0 || i === 4;
    let beadSize = isLarge ? 12 : 7;

    // bead shadow
    fill(50);
    ellipse(x + 2, y + 2, beadSize, beadSize);

    // main bead
    fill(beadColor);
    ellipse(x, y, beadSize, beadSize);

    // bead highlight
    fill(255, 150);
    ellipse(x - beadSize * 0.2, y - beadSize * 0.2, beadSize * 0.1, beadSize * 0.1);
  }

  // cross ---------
  push();
  translate(0, 120);

  // cross base
  fill(100, 100, 120);
  rect(-3, -15, 6, 30);
  rect(-10, -5, 20, 6);

  // cross highlight
  fill(150, 150, 170);
  rect(-2, -15, 2, 28);

  pop();
}
// --------- ROSARY END --------- //

// --------- ANIMATION: ROSARY BREAKING --------- //
let scatteredBeads = [];
function drawBreakingRosary() {
  // initialize scattered beads once
  if (scatteredBeads.length === 0) {
    for (let i = 0; i < 50; i++) {
      let angle = random(TWO_PI);
      scatteredBeads.push({
        x: 0,
        y: 0,
        vx: cos(angle) * random(3, 10),
        vy: sin(angle) * random(3, 10) - 2,
        size: i % 6 === 0 ? 12 : 7,
        life: 10.0
      });
    }
  }

  // draw and update scattering beads
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

  // cross falling
  if (scatteredBeads[0].life > 0) {
    push();
    translate(0, 120);
    rotate((1 - scatteredBeads[0].life) * TWO_PI);
    fill(100, 100, 120, scatteredBeads[0].life * 255);
    rect(-3, -15, 6, 30);
    rect(-10, -5, 20, 6);
    pop();
  }
}