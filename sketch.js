function preload() {
  soundFormats('mp3', 'wav');
  try {
    heartbeatSound = loadSound('assets/heartbeat.mp3');
    breakSound = loadSound('assets/break.mp3');
    myFont = loadFont('assets/deutsch.ttf');
  } catch (e) {
    console.log('Some assets not loaded - continuing without assets');
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  // Create reset button - positioned at center top where instruction text was
  resetButton = createButton('Reset');
  resetButton.position(10, 10);
  resetButton.mousePressed(resetArtwork);
  resetButton.style('padding', '10px 20px');
  resetButton.style('font-size', '18px');
  resetButton.style('font-family', 'Helvetica');
  resetButton.style('background-color', 'rgba(210, 35, 47, 1)');
  resetButton.style('color', 'white');
  resetButton.style('border', 'none');
  resetButton.style('cursor', 'pointer');
  resetButton.style('border-radius', '5px');
  resetButton.hide(); // Hide until freedom state

  // Start ambient sound
  if (ambientOppressed && ambientOppressed.isLoaded()) {
    ambientOppressed.loop();
    ambientOppressed.setVolume(0.3);
  }
}

let heartScale = 1;
let tension = 0;
let targetTension = 0;
let heartbeatPhase = 0;
let lastBeatTime = 0;
let beatInterval = 2000;

// states
let state = 'oppressed'; // 'oppressed', 'breaking', 'whiteFlash', 'fadeIn', 'freedom'
let resetButton;
let freedomTime = 0;
let breakingStartTime = 0;
let whiteFlashStart = 0;
let fadeInStart = 0;

// sound
let heartbeatSound;
let ambientOppressed;
let ambientFreedom;
let breakSound;

let myFont;

function draw() {
  // Handle state transitions
  if (state === 'oppressed' || state === 'breaking') {
    drawOppressedState();
  } else if (state === 'whiteFlash') {
    drawWhiteFlash();
  } else if (state === 'fadeIn') {
    drawFadeIn();
  } else if (state === 'freedom') {
    drawFreedomState();
  }

  // instruction
  if (state === 'oppressed' || state === 'breaking') {
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    textFont(myFont);
    text("Click mouse fast to break free", width / 2, height / 2 - 300);
  }

  // credits
  fill(state === 'freedom' || state === 'fadeIn' ? 0 : 255);
  textAlign(LEFT, BASELINE);
  textFont('Helvetica');
  textSize(11);
  text("Sound effects by BRVHRTZ, DRAGON-STUDIO from Pixabay", 10, height - 10);
}

function drawOppressedState() {
  let bgBrightness = 20 + tension * 15;
  background(bgBrightness, bgBrightness - 5, bgBrightness + 5);

  // Only update tension if not in breaking state
  if (state !== 'breaking') {
    tension = lerp(tension, targetTension, 0.1);
    if (!mouseIsPressed) {
      targetTension = max(0, targetTension - 0.02);
    }
  }

  // Check if breaking threshold reached
  if (tension > 2 && state === 'oppressed') {
    state = 'breaking';
    breakingStartTime = millis();
    scatteredBeads = [];
    fallingCross = null;
    if (breakSound && breakSound.isLoaded()) {
      breakSound.play();
    }
  }

  // heartbeat timing based on tension
  let effectiveTension = state === 'breaking' ? 2 : tension;
  beatInterval = map(effectiveTension, 0, 2, 2000, 400);

  let currentTime = millis();
  if (currentTime - lastBeatTime > beatInterval) {
    lastBeatTime = currentTime;
    heartbeatPhase = 0;

    // Play heartbeat sound
    if (heartbeatSound && heartbeatSound.isLoaded) {
      heartbeatSound.play();
      heartbeatSound.setVolume(map(effectiveTension, 0, 2, 0.3, 0.8));
    }
  }

  let beatProgress = (currentTime - lastBeatTime) / beatInterval;
  let beat;

  if (beatProgress < 0.15) {
    beat = sin(beatProgress * PI / 0.15) * 0.15;
  } else if (beatProgress < 0.35) {
    beat = sin((beatProgress - 0.15) * PI / 0.2 + PI) * 0.08;
  } else {
    beat = 0;
  }

  let beatAmplitude = 0.08 + effectiveTension * 0.475;
  heartScale = 1 + beat * beatAmplitude;

  drawAmbientGlow();

  push();
  translate(width / 2, height / 2);
  scale(heartScale);
  drawHeart();

  if (state === 'breaking') {
    drawBreakingRosary();
    // Wait 3 seconds then trigger white flash
    if (millis() - breakingStartTime > 3000) {
      state = 'whiteFlash';
      whiteFlashStart = millis();
    }
  } else {
    drawRosary();
  }
  pop();
}

// white fade out
function drawWhiteFlash() {
  let elapsed = millis() - whiteFlashStart;
  let flashDuration = 1200; // Slightly shorter since we have fade-in now

  if (elapsed < flashDuration * 0.5) {
    // Fade to white
    let whiteness = map(elapsed, 0, flashDuration * 0.5, 20, 255);
    background(whiteness);
  } else if (elapsed < flashDuration) {
    // Hold white
    background(255);
  } else {
    // Switch to fade-in state
    state = 'fadeIn';
    fadeInStart = millis();

    // Switch ambient sound
    if (ambientOppressed && ambientOppressed.isLoaded()) {
      ambientOppressed.stop();
    }
    if (ambientFreedom && ambientFreedom.isLoaded()) {
      ambientFreedom.loop();
      ambientFreedom.setVolume(0.4);
    }
  }
}

// fade in transition
function drawFadeIn() {
  let elapsed = millis() - fadeInStart;
  let fadeInDuration = 2000; // 2 seconds fade-in
  let progress = constrain(elapsed / fadeInDuration, 0, 1);

  // Ease out for smoother feel
  let easedProgress = 1 - pow(1 - progress, 3);

  // Background fades from white to freedom color
  let bg = lerpColor(color(255), color(245, 235, 240), easedProgress);
  background(bg);

  // Heartbeat (calm)
  let currentTime = millis();
  beatInterval = 800;

  if (currentTime - lastBeatTime > beatInterval) {
    lastBeatTime = currentTime;
    if (heartbeatSound && heartbeatSound.isLoaded()) {
      heartbeatSound.play();
      heartbeatSound.setVolume(0.5 * easedProgress);
    }
  }

  let beatProgress = (currentTime - lastBeatTime) / beatInterval;
  let beat;
  if (beatProgress < 0.15) {
    beat = sin(beatProgress * PI / 0.15) * 0.15;
  } else if (beatProgress < 0.35) {
    beat = sin((beatProgress - 0.15) * PI / 0.2 + PI) * 0.08;
  } else {
    beat = 0;
  }
  heartScale = 1 + beat * 0.15 * easedProgress;

  // Fade in rays first (they're in the background)
  if (easedProgress > 0.1) {
    let rayAlpha = map(easedProgress, 0.1, 0.7, 0, 1);
    rayAlpha = constrain(rayAlpha, 0, 1);
    drawSpiralRainbowRays(rayAlpha);
  }

  // Fade in glow
  if (easedProgress > 0.2) {
    let glowAlpha = map(easedProgress, 0.2, 0.8, 0, 1);
    glowAlpha = constrain(glowAlpha, 0, 1);
    drawFreedomGlow(glowAlpha);
  }

  // Fade in heart
  if (easedProgress > 0.3) {
    let heartAlpha = map(easedProgress, 0.3, 1, 0, 1);
    heartAlpha = constrain(heartAlpha, 0, 1);

    push();
    translate(width / 2, height / 2);
    scale(heartScale);
    drawHealthyHeartWithAlpha(heartAlpha);
    pop();
  }

  // Transition complete
  if (progress >= 1) {
    state = 'freedom';
    freedomTime = millis();
    resetButton.show();
  }
}

function drawFreedomState() {
  background(245, 235, 240);

  // healthy heartbeat
  let currentTime = millis();
  beatInterval = 800; // Calm, steady beat

  if (currentTime - lastBeatTime > beatInterval) {
    lastBeatTime = currentTime;
    if (heartbeatSound && heartbeatSound.isLoaded()) {
      heartbeatSound.play();
      heartbeatSound.setVolume(0.5);
    }
  }

  let beatProgress = (currentTime - lastBeatTime) / beatInterval;
  let beat;
  if (beatProgress < 0.15) {
    beat = sin(beatProgress * PI / 0.15) * 0.15;
  } else if (beatProgress < 0.35) {
    beat = sin((beatProgress - 0.15) * PI / 0.2 + PI) * 0.08;
  } else {
    beat = 0;
  }
  heartScale = 1 + beat * 0.15;

  drawSpiralRainbowRays(1);
  drawFreedomGlow(1);

  // healthy heart
  push();
  translate(width / 2, height / 2);
  scale(heartScale);
  drawHealthyHeart();
  pop();
}

// spiral rainbow rays
function drawSpiralRainbowRays(alpha) {
  push();
  translate(width / 2, height / 2);

  // Rainbow colors without red: orange, yellow, green, cyan, blue, violet
  let rainbowColors = [
    color(255, 165, 0),   // orange
    color(255, 220, 50),  // yellow
    color(100, 200, 100), // green
    color(50, 200, 200),  // cyan
    color(100, 150, 255), // blue
    color(180, 100, 255)  // violet
  ];

  let numRays = 6;
  let time = millis() * 0.0003; // Slow rotation

  for (let i = 0; i < numRays; i++) {
    let baseAngle = (TWO_PI / numRays) * i + time;
    let nextAngle = (TWO_PI / numRays) * (i + 1) + time;

    let col = rainbowColors[i % rainbowColors.length];

    // Draw filled wedge with spiral curve
    noStroke();
    fill(red(col), green(col), blue(col), 40 * alpha);

    beginShape();
    vertex(0, 0);

    // Spiral edge 1
    for (let r = 0; r <= 1; r += 0.05) {
      let dist = r * max(width, height);
      let spiralOffset = r * 0.3; // Spiral amount
      let angle = baseAngle + spiralOffset;
      let x = cos(angle) * dist;
      let y = sin(angle) * dist;
      vertex(x, y);
    }

    // Outer arc
    let maxDist = max(width, height);
    for (let a = 0; a <= 1; a += 0.1) {
      let angle = lerp(baseAngle + 0.3, nextAngle + 0.3, a);
      vertex(cos(angle) * maxDist, sin(angle) * maxDist);
    }

    // Spiral edge 2 (back to center)
    for (let r = 1; r >= 0; r -= 0.05) {
      let dist = r * max(width, height);
      let spiralOffset = r * 0.3;
      let angle = nextAngle + spiralOffset;
      let x = cos(angle) * dist;
      let y = sin(angle) * dist;
      vertex(x, y);
    }

    endShape(CLOSE);
  }

  pop();
}

// Freedom glow with alpha parameter
function drawFreedomGlow(alpha) {
  push();
  translate(width / 2, height / 2);

  // Warm golden glow
  for (let i = 5; i > 0; i--) {
    fill(255, 215, 100, 8 * (i / 5) * alpha);
    noStroke();
    ellipse(0, 0, 500 * (i / 5), 500 * (i / 5));
  }

  // Inner bright glow
  fill(255, 240, 200, (80 + sin(millis() * 0.002) * 10) * alpha);
  ellipse(0, 0, 350, 350);

  pop();
}

function drawHealthyHeart() {
  let base = color(255, 59, 71);
  let highlight = color(255, 150, 150);

  noStroke();
  fill(base);
  beginShape();
  vertex(0, -130);
  bezierVertex(100, -200, 220, -40, 0, 160);
  bezierVertex(-220, -40, -100, -200, 0, -130);
  endShape(CLOSE);

  // Inner glow
  fill(255, 100, 110, 100);
  beginShape();
  vertex(0, -110);
  bezierVertex(70, -150, 140, -40, 0, 130);
  bezierVertex(-140, -40, -70, -150, 0, -110);
  endShape(CLOSE);

  // Bright glow
  fill(255, 200, 200, 60);
  beginShape();
  vertex(0, -135);
  bezierVertex(105, -205, 225, -45, 0, 165);
  bezierVertex(-225, -45, -105, -205, 0, -135);
  endShape(CLOSE);

  // Golden highlights
  fill(255, 240, 150, 80);
  ellipse(-50, -50, 30, 50);
}

// Reset
function resetArtwork() {
  state = 'resetting';
  resetButton.hide();

  // Fade animation
  let fadeProgress = 0;
  let fadeInterval = setInterval(() => {
    fadeProgress += 0.02;
    background(0, 0, 0, fadeProgress * 255);

    if (fadeProgress >= 1) {
      clearInterval(fadeInterval);

      // Reset all variables
      tension = 0;
      targetTension = 0;
      heartScale = 1;
      scatteredBeads = [];
      transitionProgress = 0;
      state = 'oppressed';

      // Switch assets back
      if (ambientFreedom && ambientFreedom.isLoaded()) {
        ambientFreedom.stop();
      }
      if (ambientOppressed && ambientOppressed.isLoaded()) {
        ambientOppressed.loop();
        ambientOppressed.setVolume(0.3);
      }
    }
  }, 50);
}

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
  if (state === 'oppressed') {
    targetTension = min(2.5, targetTension + 0.25);

    // Play rope tightening sound
    if (ropeSound && ropeSound.isLoaded() && tension > 0.5) {
      ropeSound.play();
      ropeSound.setVolume(0.4);
    }
  }
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
let fallingCross = null; // NEW: separate cross physics

function drawBreakingRosary() {
  // initialize scattered beads once
  if (scatteredBeads.length === 0) {
    for (let i = 0; i < 50; i++) {
      let angle = random(TWO_PI);
      scatteredBeads.push({
        x: random(-100, 100),
        y: random(-80, 80),
        vx: cos(angle) * random(3, 10),
        vy: sin(angle) * random(3, 10) - 2,
        size: i % 6 === 0 ? 12 : 7,
        rotation: random(TWO_PI),
        rotationSpeed: random(-0.2, 0.2)
      });
    }

    fallingCross = {
      x: 0,
      y: 120,
      vx: random(-2, 2),
      vy: -3,
      rotation: 0,
      rotationSpeed: random(-0.15, 0.15)
    };
  }

  let elapsed = millis() - breakingStartTime;
  let fadeProgress = map(elapsed, 0, 3000, 1, 0);
  fadeProgress = constrain(fadeProgress, 0, 1);

  // draw and update scattering beads
  noStroke();
  for (let bead of scatteredBeads) {
    bead.x += bead.vx;
    bead.y += bead.vy;
    bead.vy += 0.3; // gravity
    bead.rotation += bead.rotationSpeed;

    if (fadeProgress > 0) {
      push();
      translate(bead.x, bead.y);
      rotate(bead.rotation);

      // bead shadow
      fill(50, 50, 50, fadeProgress * 200);
      ellipse(2, 2, bead.size, bead.size);

      // main bead
      fill(217, 217, 217, fadeProgress * 255);
      ellipse(0, 0, bead.size, bead.size);

      // highlight
      fill(255, fadeProgress * 150);
      ellipse(-bead.size * 0.2, -bead.size * 0.2, bead.size * 0.3, bead.size * 0.3);
      pop();
    }
  }

  // falling cross
  if (fallingCross && fadeProgress > 0) {
    fallingCross.x += fallingCross.vx;
    fallingCross.y += fallingCross.vy;
    fallingCross.vy += 0.3; // gravity - same as beads
    fallingCross.rotation += fallingCross.rotationSpeed;

    push();
    translate(fallingCross.x, fallingCross.y);
    rotate(fallingCross.rotation);

    // Cross shadow
    fill(30, 30, 40, fadeProgress * 200);
    rect(-3 + 2, -15 + 2, 6, 30);
    rect(-10 + 2, -5 + 2, 20, 6);

    // Cross base
    fill(100, 100, 120, fadeProgress * 255);
    rect(-3, -15, 6, 30);
    rect(-10, -5, 20, 6);

    // Cross highlight
    fill(150, 150, 170, fadeProgress * 255);
    rect(-2, -15, 2, 28);

    pop();
  }
}

// NEW: Healthy heart with alpha for fade-in
function drawHealthyHeartWithAlpha(alpha) {
  let base = color(255, 59, 71);

  noStroke();
  fill(red(base), green(base), blue(base), 255 * alpha);
  beginShape();
  vertex(0, -130);
  bezierVertex(100, -200, 220, -40, 0, 160);
  bezierVertex(-220, -40, -100, -200, 0, -130);
  endShape(CLOSE);

  // Inner glow
  fill(255, 100, 110, 100 * alpha);
  beginShape();
  vertex(0, -110);
  bezierVertex(70, -150, 140, -40, 0, 130);
  bezierVertex(-140, -40, -70, -150, 0, -110);
  endShape(CLOSE);

  // Bright glow
  fill(255, 200, 200, 60 * alpha);
  beginShape();
  vertex(0, -135);
  bezierVertex(105, -205, 225, -45, 0, 165);
  bezierVertex(-225, -45, -105, -205, 0, -135);
  endShape(CLOSE);

  // Golden highlights
  fill(255, 240, 150, 80 * alpha);
  ellipse(-50, -50, 30, 50);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Reposition reset button on window resize
  resetButton.position(10, 10);
}