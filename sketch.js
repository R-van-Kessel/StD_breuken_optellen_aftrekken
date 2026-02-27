/* ======================
   GLOBAL STYLE
====================== */
/* ===== DEVICE DETECT & SCALE (ADD AT TOP) ===== */


let SCALE_FACTOR = 1;

/* ===== SAFE CURSOR (NO p5 dependency) ===== */
let showHandCursor = false;

const style = document.createElement('style');
style.textContent = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: #0e1621;
  font-family: Arial, sans-serif;
  padding: 10px 10px 50px;
}

button {
  height: 38px;
  cursor: pointer;
  transition: transform .2s ease, opacity .2s ease;
}

button:hover { transform: scale(1.15); }
button:active { transform: scale(0.95); }

.nav {
  display: flex;
  gap: 5px;
  padding: 5px;
  flex-wrap: nowrap;
  justify-content: center;
  position: relative;
  z-index: 1000;
  width: 100%;
  overflow-x: auto;
}

.nav a {
  color: white;
  text-decoration: none;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,.15);
  font-weight: bold;
  font-size: 17px;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 40px;
  text-align: center;
}
.nav a:hover { background: rgba(255,255,255,.5); }

@media (max-width: 768px) {
  body {
    padding: 2px 2px 20px;
  }
  
  .nav {
    gap: 3px;
    padding: 3px;
    margin-bottom: 5px;
  }
  
  .nav a {
    padding: 4px 6px;
    font-size: 10px;
  }
}
`;
document.head.appendChild(style);

/* viewport */
let meta = document.querySelector('meta[name="viewport"]');
if (!meta) {
  meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
  document.head.appendChild(meta);
} else {
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
}
function setCursor(type) {
  document.body.style.cursor = type;
}

/* =====================================
   NAVIGATIEBALK INSTELLEN
===================================== */

// Voeg navigatiebalk toe aan de pagina

function createNavigation() {
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.innerHTML = `
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon">🏠 Home</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/rekenen.html">➗ Rekenen</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas1.html">📘 Klas 1</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas2.html">📗 Klas 2</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas3.html">📙 Klas 3</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/overig.html">🎓 Overig</a>
  `;
  document.body.prepend(nav);
  
// Extra fix voor mobiele clicks
  setTimeout(() => {
    nav.querySelectorAll('a').forEach(link => {
      link.style.pointerEvents = 'auto';
      link.style.touchAction = 'manipulation';
      link.addEventListener('touchend', (e) => {
        e.stopPropagation();
        window.location.href = link.href;
      }, { passive: false });
    });
  }, 100);
}
  
// SPATIE BLOKKERING 
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.keyCode === 32) {
        // Alleen toestaan als we in de dino game zitten EN niet game over
        if (showDinoGame && dinoGame && !dinoGame.gameOver) {
            e.preventDefault();
            e.stopPropagation();
            dinoGame.dino.jump();
        } else if (showDinoGame && dinoGame && dinoGame.gameOver) {
            // Tijdens game over: blokkeer spatie volledig
            e.preventDefault();
            e.stopPropagation();
        } else {
            // Buiten game: blokkeer spatie ook
            e.preventDefault();
            e.stopPropagation();
        }
    }
}, true);


/* =====================================
   GRID & LAYOUT INSTELLINGEN
===================================== */


// Grid
const COLS = 5;
const ROWS = 5; //extra rij voor buttons
const CELL_SIZE = 140;
const MARGIN = 200;

// Verticale ruimte boven grid
const TITLE_SPACE = -200;      // ← hoogte grid
const BUTTON_HEIGHT = 40;   // Hoogte van knoppenrij


// TITEL INSTELLINGEN
const TITLE_TEXT = 'Summon the Dragon';
const TITLE_LINK = 'https://r-van-kessel.github.io/Summon_the_Dragon/index.html';
const TITLE_SIZE = 30;
const TITLE_COLOR = [255, 200, 100];
const TITLE_Y = 30;   // titel hoger/lager

// ONDERTITEL INSTELLINGEN
const SUBTITLE_TEXT = 'Los alle sommen op om de draak op te roepen!';
const SUBTITLE_SIZE = 14;
const SUBTITLE_COLOR = [255, 200, 100];
const SUBTITLE_Y = 70;   // subtitle afstand

const DINO_ZONE = {
    xRatio: 0.98,   
    yRatio: 0.47,   
    wRatio: 0.01,   
    hRatio: 0.01    
};

// DRAAK ACHTERGROND INSTELLINGEN - HIER KUN JE AANPASSEN!
const DRAGON_SCALE_X = 0.9;    // ← Horizontale schaal: 1.0=normaal, 1.5=breder, 0.5=smaller
const DRAGON_SCALE_Y = 0.9;    // ← Verticale schaal: 1.0=normaal, 1.5=hoger, 0.5=korter
const DRAGON_X_OFFSET = 50;     // ← Horizontaal: negatief=links, positief=rechts (bijv. -100 of 150)
const DRAGON_Y_OFFSET = -80;     // ← Verticaal: negatief=omhoog, positief=omlaag (bijv. -50 of 100)
const DRAGON_OPACITY = 250;    // ← Transparantie: 0=onzichtbaar, 255=volledig zichtbaar, 150=half
const DRAGON_BLUR = true;     // ← true = achtergrond wazig, false = scherp

// ============================================

let blocks = [];
let draggingBlock = null;
let offsetX = 0;
let offsetY = 0;

// Canvas buttons (geen HTML buttons meer)
let canvasButtons = [];

let isChecked = false;
let correctCount = 0;
let isFlashing = false;
let flashCounter = 0;

let dinoGame = null;
let showDinoGame = false;
let totalGamesPlayed = 0;
let dinoGameCount = 0;
let dinoImage = null;
let backgroundImage = null;
let bgLoaded = false;

class CanvasButton {
  constructor(x, y, w, h, label, color, action) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.color = color;
    this.action = action;
    this.hovered = false;
    this.hoverProgress = 0;  // ← NIEUW
  }
  
  draw() {
  push();
  
  // Hover effect met scale en lift
  if (this.hoverProgress > 0) {
    let lift = -4 * this.hoverProgress;  // Kleinere lift dan blokjes
    let scaleAmount = 1 + 0.10 * this.hoverProgress;  // 10% groter
    
    translate(this.x + this.w / 2, this.y + this.h / 2 + lift);
    scale(scaleAmount);
    translate(-this.w / 2, -this.h / 2);
    
    // Schaduw effect
    drawingContext.shadowBlur = 15 * this.hoverProgress;
    drawingContext.shadowColor = 'rgba(0,0,0,0.4)';
    drawingContext.shadowOffsetY = 3 * this.hoverProgress;
  }
  
  // Button kleur met hover brightening
  if (this.hoverProgress > 0) {
    let brighten = 30 * this.hoverProgress;
    fill(
      red(this.color) + brighten, 
      green(this.color) + brighten, 
      blue(this.color) + brighten
    );
  } else {
    fill(this.color);
  }
  
  noStroke();
  
  // Teken button (relatieve positie als getransformeerd)
  if (this.hoverProgress > 0) {
    rect(0, 0, this.w, this.h, 8);
  } else {
    rect(this.x, this.y, this.w, this.h, 8);
  }
  
  // Reset schaduw
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;
  
  // Tekst
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(IS_MOBILE ? 12 : 16);
  textStyle(BOLD);
  
  if (this.hoverProgress > 0) {
    text(this.label, this.w / 2, this.h / 2);
  } else {
    text(this.label, this.x + this.w / 2, this.y + this.h / 2);
  }
  
  pop();
}
  
  isClicked(mx, my) {
    return mx > this.x && mx < this.x + this.w && 
           my > this.y && my < this.y + this.h;
  }
  
  checkHover(mx, my) {
  this.hovered = this.isClicked(mx, my);
  
  // Smooth hover animatie
  const target = this.hovered ? 1 : 0;
  this.hoverProgress = lerp(this.hoverProgress, target, 0.15);
  }
}

 
class Dino {
  constructor() {
    this.x = MARGIN + (COLS * CELL_SIZE) / 4;
    this.y = 0;
    this.width = 50;
    this.height = 53;
    this.vy = 0;
    this.gravity = 0.8;
    this.jumpPower = -15;
    this.onGround = true;
    this.onPlatform = false;
    this.legFrame = 0;

    // ===== INVINCIBLE STATUS =====
    this.invincible = false;
    this.invincibleUntil = 0;

    // ===== INSTELBAAR =====
    this.invincibleDuration = 3000; //aanpassen invisible tijd van 3 sec
    this.invincibleFlickerSpeed = 100;
  }

  activateInvincible() {
    this.invincible = true;
    this.invincibleUntil = millis() + this.invincibleDuration;
  }

  update() {
    // fps-safe timer
    if (this.invincible && millis() > this.invincibleUntil) {
      this.invincible = false;
    }

    this.vy += this.gravity;
    this.y += this.vy;

    // Check of op de grond (en niet op een platform)
    if (this.y >= 0 && !this.onPlatform) {
      this.y = 0;
      this.vy = 0;
      this.onGround = true;
    }
    
    // Bij vallen voorbij grondlevel, reset platform status
    if (this.y > 0) {
      this.onPlatform = false;
    }
    
    if (this.onGround && frameCount % 6 === 0) {
      this.legFrame = (this.legFrame + 1) % 2;
    }
  }

  jump() {
    if (this.onGround) {
      if (this.onPlatform) {
        this.vy = this.jumpPower * 1.2;
        this.onPlatform = false;
      } else {
        this.vy = this.jumpPower;
      }
      this.onGround = false;
    }
  }

  draw(gameY) {
    push();

    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    let drawY = groundY + this.y;

    // Schaduw onder voeten
    fill(0, 0, 0, 40);
    noStroke();
    ellipse(this.x + this.width / 2, drawY + this.height + 2, this.width * 0.6, 10); 

    // Knipperen dragon logica
    let flickerOn = true;
    if (this.invincible) {
      flickerOn = (millis() % (this.invincibleFlickerSpeed * 2)) < this.invincibleFlickerSpeed;
    }

    if (flickerOn) {
      if (dinoImage) {
        imageMode(CORNER);
        image(dinoImage, this.x, drawY, this.width, this.height);
      } else {
        textAlign(CENTER, CENTER);
        textSize(this.height);
        text('🦖', this.x + this.width / 2, drawY + this.height / 2);
      }
    }

    pop();
  }

  getBottom(gameY) {
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    return groundY + this.y + this.height;
  }

  getTop(gameY) {
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    return groundY + this.y;
  }
}

//Diamant parameters//
class Orb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.collected = false;
  }

  update() {
    this.y += sin(frameCount * 0.1) * 0.5;
  }

  draw() {
    if (!this.collected) {
      push();
      translate(this.x, this.y);
      
      // Rotatie voor sparkle effect
      rotate(frameCount * 0.02);
      
      // Buitenste diamant (glow)
      fill(34, 2, 97, 100);
      noStroke();
      beginShape();
      vertex(0, -this.radius * 1.3);
      vertex(this.radius * 0.8, 0);
      vertex(0, this.radius * 1.3);
      vertex(-this.radius * 0.8, 0);
      endShape(CLOSE);
      
      // Binnenste diamant (helder)
      fill(7, 165, 255);
      stroke(0);
      strokeWeight(2);
      beginShape();
      vertex(0, -this.radius);
      vertex(this.radius * 0.6, 0);
      vertex(0, this.radius);
      vertex(-this.radius * 0.6, 0);
      endShape(CLOSE);
      
      // Glans facetten
      fill(255, 255, 255, 180);
      noStroke();
      beginShape();
      vertex(0, -this.radius);
      vertex(this.radius * 0.3, -this.radius * 0.3);
      vertex(0, 0);
      vertex(-this.radius * 0.3, -this.radius * 0.3);
      endShape(CLOSE);
      
      // Kleine sparkles
      fill(255, 255, 255, 200);
      ellipse(this.radius * 0.4, -this.radius * 0.4, 3);
      ellipse(-this.radius * 0.3, this.radius * 0.3, 2);
      
      pop();
    }
  }

  hits(dino, gameY) {
    let dinoBottom = dino.getBottom(gameY);
    let dinoTop = dino.getTop(gameY);
    let dinoRight = dino.x + dino.width;
    let dinoLeft = dino.x;

    let closestX = constrain(this.x, dinoLeft, dinoRight);
    let closestY = constrain(this.y, dinoTop, dinoBottom);
    let dx = this.x - closestX;
    let dy = this.y - closestY;

    return dx * dx + dy * dy < this.radius * this.radius;
  }
}

class Obstacle {
  constructor(type, xPos) {
    this.type = type;
    this.x = xPos;
    this.scored = false;

    if (type === 'low') {
      this.width = 100;
      this.height = 40;
      this.isPlatform = false;
    } else if (type === 'high') {
      this.width = 25;
      this.height = 80;
      this.isPlatform = false;
    } else {
      this.width = 150;
      this.height = 15;
      this.isPlatform = true;

      this.hasOrb = random() < 0.3; //verhouding diamantjes binnen 30% platforms//

      if (this.hasOrb) {
        let platformY = CELL_SIZE + 25;
        this.orb = new Orb(
          this.x + this.width * 1.5, //aanpassen x waarde diamant//
          platformY - 80
        );
      } else {
        this.orb = null;
      }
    }
  }

  update(speed) {
    this.x -= speed;
    if (this.orb) this.orb.x -= speed;
  }

  draw(gameY) {
    push();
    if (this.isPlatform) {
      fill(229, 244, 58);
      stroke(139, 69, 19);
      strokeWeight(2);
      let platformY = gameY + (CELL_SIZE + 25);
      rect(this.x, platformY, this.width, this.height, 4);

      if (this.orb && !this.orb.collected) {
        this.orb.y = platformY - 80;
        this.orb.draw();
      }
    } else {
      fill(231, 76, 60);
      noStroke();
      let obsY = gameY + (CELL_SIZE * 2) - this.height;
      rect(this.x, obsY, this.width, this.height);
    }
    pop();
  }

  hits(dino, gameY) {
    if (this.isPlatform) {
      let platformTop = gameY + CELL_SIZE + 25;
      let platformBottom = platformTop + this.height;
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);
      
      let horizontalOverlap = dino.x + dino.width > this.x && dino.x < this.x + this.width;
      
      // Landen op platform (vanaf boven)
      if (dino.vy >= 0 && 
          dinoBottom >= platformTop - 5 && 
          dinoBottom <= platformTop + 5 &&
          horizontalOverlap) {
        
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformTop - groundY;
        dino.vy = 0;
        dino.onGround = true;
        dino.onPlatform = true;
      }
      
      // Raken platform van onderen
      if (dino.vy < 0 && 
          dinoTop <= platformBottom + 5 && 
          dinoTop >= platformTop &&
          horizontalOverlap) {
        
        dino.vy = 0;
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformBottom - groundY;
      }

      // Orb collection
      if (this.hasOrb && !this.orb.collected) {
        if (this.orb.hits(dino, gameY)) {
          this.orb.collected = true;
          dino.activateInvincible();
        }
      }
      
      return false;
    } else {
      // Raken normale obstakels
      let obsTop = gameY + (CELL_SIZE * 2) - this.height;
      let obsBottom = gameY + (CELL_SIZE * 2);
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);

      if (dino.x + dino.width > this.x &&
          dino.x < this.x + this.width &&
          dinoBottom > obsTop &&
          dinoTop < obsBottom) {
        return true;
      }
    }
    return false;
  }

  isOffScreen() {
    return this.x + this.width < MARGIN;
  }
}

class DinoGame {
  constructor() {
    this.dino = new Dino();
    this.obstacles = [];
    this.gameOver = false;
    this.score = 0;
    this.gameSpeed = 6;
    this.spawnTimer = 0;
    this.gamesPlayed = 0;
    this.maxGames = 3;
    this.gameOverTimer = 0;
  }

  reset() {
    this.dino = new Dino();
    this.obstacles = [];
    this.spawnTimer = 0;
    this.gameOver = false;
    this.gameOverTimer = 0;

    if (this.gamesPlayed >= this.maxGames) {
      this.score = 0;
      this.gameSpeed = 6;
      this.gamesPlayed = 0;
    }
  }

  spawnObstacles() {
    let rand = random();
    if (rand < 0.4) {
      this.obstacles.push(new Obstacle('low', MARGIN + COLS * CELL_SIZE));
    } else if (rand < 0.7) {
      this.obstacles.push(new Obstacle('high', MARGIN + COLS * CELL_SIZE));
    } else {
      let platform = new Obstacle('platform', MARGIN + COLS * CELL_SIZE);
      this.obstacles.push(platform);
      let followUp = new Obstacle(random() < 0.5 ? 'low' : 'high', MARGIN + COLS * CELL_SIZE + 250);
      this.obstacles.push(followUp);
    }
  }

  update(gameY) {
    if (this.gameOver) {
      this.gameOverTimer++;
      if (this.gameOverTimer >= 120) {
        if (this.gamesPlayed < this.maxGames) {
          this.reset();
        }
      }
      return;
    }

    this.dino.update();

    this.spawnTimer++;
    let spawnInterval = max(40, 80 - floor(this.score / 5) * 5);
    if (this.spawnTimer > spawnInterval) {
      this.spawnObstacles();
      this.spawnTimer = 0;
    }

    // Eerst check platforms, dan obstakels
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.update(this.gameSpeed);

      // Platform raken (eindigt game niet)
      if (obs.isPlatform) {
        obs.hits(this.dino, gameY);
      }

      // Obstakel raken (beeindigd game tenzij je invincible bent)
      if (!obs.isPlatform && obs.hits(this.dino, gameY)) {
        if (!this.dino.invincible) {
          this.gameOver = true;
          this.gamesPlayed++;
          this.gameOverTimer = 0;
        }
      }

      if (!obs.scored && !obs.isPlatform && obs.x + obs.width < this.dino.x) {
        obs.scored = true;
        this.score++;
      }

      if (obs.isOffScreen()) {
        this.obstacles.splice(i, 1);
      }
    }

    if (frameCount % 180 === 0) {
      this.gameSpeed = min(this.gameSpeed + 0.5, 15);
    }
  }

  draw(gameY) {
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);
    drawingContext.clip();

    fill(135, 206, 235);
    noStroke();
    rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);

    fill(139, 69, 19);
    rect(MARGIN, gameY + (CELL_SIZE * 2) - 10, COLS * CELL_SIZE, 10);

    for (let obs of this.obstacles) {
      obs.draw(gameY);
    }

    this.dino.draw(gameY);
    drawingContext.restore();

    fill(51);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(16);
    textStyle(BOLD);
    text('Score: ' + this.score, MARGIN + 10, gameY + 10);

    textSize(14);
    textStyle(NORMAL);
    fill(85);
    text('Games: ' + this.gamesPlayed + '/' + this.maxGames, MARGIN + 10, gameY + 30);
    text('Speed: ' + nf(this.gameSpeed, 1, 1), MARGIN + 10, gameY + 50);

    if (this.gameOver) {
      fill(0, 0, 0, 180);
      rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);

      fill(255);
      textAlign(CENTER, CENTER);
      textSize(28);
      textStyle(BOLD);
      text('GAME OVER!', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE - 20);

      textSize(18);
      textStyle(NORMAL);
      text('Score: ' + this.score, MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 10);
      text('Komt er nog een dragon?', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 35);

      if (this.gamesPlayed >= this.maxGames) {
        fill(243, 156, 18);
        textSize(18);
        textStyle(BOLD);
        text('Nee, klik nu op rode reset knop!', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 65);
      }
    }
    pop();
  }
}

  
function resetGame() {
    showDinoGame = false;
    dinoGame = null;
    generateQuestions();
}

function showInfo() {
    let overlay = document.createElement('div');
    overlay.id = 'infoOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    document.body.appendChild(overlay);
    
    let popup = document.createElement('div');
    popup.id = 'infoPopup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 3px solid #333;
        border-radius: 10px;
        padding: 30px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    popup.innerHTML = `
        <h2 style="color: #fb0427; margin-top: 0;">
        Summon the Dragon
        </h2><br>
        <p style="color: #0E0E0E; line-height: 1.2;">
            <strong>Doel:<br></strong> Los alle 10 sommen correct op en speel de Dragon game!</ol><br><br>
            <strong>Hoe speel je:</strong>
            <ol style="color: #0909B4; margin: 5px 0;">
                <li>Sleep blauwe somblokjes naar de juiste oranje antwoorden.</li>
                <li>Klik "Nakijken" om je antwoorden te controleren.</li>
                <li>Klik op "Score" om de feedback op je resultaten te bekijken.</li>
                <li>Bij een score van 10/10 start de Dragon game automatisch! </li>
            </ol><br> 
            <strong>Dragon Game:</strong><li> Spring met spatie of muisklik.</li>
<li>Spring op de hoge gele trampolines en kom er met een grote boog uit door een snelle dubbelklik!</li>
<li>Pak de draaiende diamantjes om 3 seconden lang dwars door de hindernissen te kunnen lopen</li>
            <li>Na 3 game-overs komt er een volledige reset.</li>
            <ol style="color: #F44336; margin: 5px 0;">
            </ol><br>
            <strong>Reset:<br></strong> Klik "Reset" voor nieuwe sommen.
            </ol>
        </p>
        <button id="closeBtn" style="
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        ">Sluiten</button>
    `;
    
    document.body.appendChild(popup);
    
    let closeBtn = document.getElementById('closeBtn');
    
    // CLICK event
    closeBtn.addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });
    
    // TOUCH event voor mobiel
    closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        popup.remove();
        overlay.remove();
    });
    
    // Overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            popup.remove();
            overlay.remove();
        }
    });
    
    // Overlay touch voor mobiel
    overlay.addEventListener('touchend', function(e) {
        if (e.target === overlay) {
            e.preventDefault();
            popup.remove();
            overlay.remove();
        }
    });
}

function showScoreFeedback() {
    if (!isChecked) {
        return;
    }
    
    let feedbackTitle = '';
    let feedbackText = '';
    let feedbackColor = '';
    
    if (correctCount === 0) {
        feedbackTitle = '😢 Oeps! 0/10';
        feedbackText = 'Nog geen enkele som goed! Kijk of je uitleg kunt krijgen voor deze sommen en reken ze dan eerst op papier uit!';
        feedbackColor = '#e74c3c';
    } else if (correctCount <= 3) {
        feedbackTitle = '😕 Begin is er! ' + correctCount + '/10';
        feedbackText = 'Je hebt er al één,twee of drie goed! Reken de sommen uit op papier en controleer je antwoord, dan gaat het vast beter!';
        feedbackColor = '#e67e22';
    } else if (correctCount <= 5) {
        feedbackTitle = '🙂 Halfway! ' + correctCount + '/10';
        feedbackText = 'Je bent al (bijna) halverwege! Goed gedaan, maar je kunt beter! Blijf geconcentreerd en blijf oefenen totdat je het foutloos kunt!';
        feedbackColor = '#f39c12';
    } else if (correctCount <= 7) {
        feedbackTitle = '😊 Goed bezig! ' + correctCount + '/10';
        feedbackText = 'Wow, meer dan de helft goed! Jij kunt dit! Let op slordigheidsfoutjes dan mag jij straks ook de Dragon game spelen!';
        feedbackColor = '#3498db';
    } else if (correctCount <= 9) {
        feedbackTitle = '🤩 Bijna perfect! ' + correctCount + '/10';
        feedbackText = 'Fantastisch! Je hebt ze bijna allemaal goed. Nog even opletten bij de laatste sommen en dan roep je de draak op!';
        feedbackColor = '#2ecc71';
    } else if (correctCount <= 10) {
        feedbackTitle = '🤩 Perfect! ' + correctCount + '/10';
        feedbackText = 'Dragon Master! De sommen maak je foutloos maar wat is je highscore bij de Dragon game?';
        feedbackColor = '#FFC107';
    }
    
    let overlay = document.createElement('div');
    overlay.id = 'scoreOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    document.body.appendChild(overlay);
    
    let popup = document.createElement('div');
    popup.id = 'scorePopup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 3px solid ${feedbackColor};
        border-radius: 10px;
        padding: 30px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    popup.innerHTML = `
        <h2 style="margin-top: 0; color: ${feedbackColor};">
            ${feedbackTitle}
        </h2>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
            ${feedbackText}
        </p>
        <button id="closeFeedbackBtn" style="
            background-color: ${feedbackColor};
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        ">Sluiten</button>
    `;
    
    document.body.appendChild(popup);
    
    let closeBtn = document.getElementById('closeFeedbackBtn');
    
    // CLICK event
    closeBtn.addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });
    
    // TOUCH event voor mobiel
    closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        popup.remove();
        overlay.remove();
    });
    
    // Overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            popup.remove();
            overlay.remove();
        }
    });
    
    // Overlay touch voor mobiel
    overlay.addEventListener('touchend', function(e) {
        if (e.target === overlay) {
            e.preventDefault();
            popup.remove();
            overlay.remove();
        }
    });
}


// ============================================
// GEMENGDE GETALLEN OPTELLEN/AFTREKKEN FUNCTIE
// ============================================
function generateCompoundFractionQuestion() {
  // Kies willekeurig optellen (+) of aftrekken (-)
  let operation = random() < 0.5 ? '+' : '-';
  
  // Genereer eerste gemengd getal: heel getal + breuk
  let whole1 = floor(random(0, 6));      // 0 tot 5
  let den1 = floor(random(2, 13));       // noemer 2-12
  let num1 = floor(random(1, den1));     // teller < noemer (1 tot den1-1)
  
  // Genereer tweede gemengd getal
  let whole2 = floor(random(0, 6));      // 0 tot 5
  let den2 = floor(random(2, 13));       // noemer 2-12
  let num2 = floor(random(1, den2));     // teller < noemer (1 tot den2-1)
  
  // Converteer naar onechte breuken voor berekening
  let improperNum1 = whole1 * den1 + num1;
  let improperNum2 = whole2 * den2 + num2;
  
  // Bereken antwoord: a/b ± c/d
  let answerNumerator;
  if (operation === '+') {
    answerNumerator = (improperNum1 * den2) + (improperNum2 * den1);
  } else {
    answerNumerator = (improperNum1 * den2) - (improperNum2 * den1);
    // Zorg dat antwoord positief blijft
    if (answerNumerator < 0) {
      // Wissel de getallen om
      [whole1, whole2] = [whole2, whole1];
      [num1, num2] = [num2, num1];
      [den1, den2] = [den2, den1];
      [improperNum1, improperNum2] = [improperNum2, improperNum1];
      answerNumerator = (improperNum1 * den2) - (improperNum2 * den1);
    }
  }
  let answerDenominator = den1 * den2;
  
  // Vereenvoudig
  function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
  }
  
  let divisor = gcd(abs(answerNumerator), answerDenominator);
  let simplifiedNum = answerNumerator / divisor;
  let simplifiedDen = answerDenominator / divisor;
  
  // Converteer antwoord terug naar gemengd getal
  let answerWhole = floor(simplifiedNum / simplifiedDen);
  let answerFracNum = simplifiedNum % simplifiedDen;
  
  // Maak vraag string
  let part1 = whole1 > 0 ? whole1 + ' ' + num1 + '/' + den1 : num1 + '/' + den1;
  let part2 = whole2 > 0 ? whole2 + ' ' + num2 + '/' + den2 : num2 + '/' + den2;
  let questionText = part1 + ' ' + operation + ' ' + part2;
  
  // Maak antwoord string
  let answerText;
  if (answerFracNum === 0) {
    answerText = answerWhole.toString();  // Alleen heel getal
  } else if (answerWhole > 0) {
    answerText = answerWhole + ' ' + answerFracNum + '/' + simplifiedDen;  // Gemengd
  } else {
    answerText = answerFracNum + '/' + simplifiedDen;  // Alleen breuk
  }
  
  return {
    question: questionText,
    answer: answerText,
    explanation: questionText + ' = ' + answerText
  };
}

function generateQuestions() {
    blocks = [];
    isChecked = false;
    correctCount = 0;
       
    
    let questions = [];
    let answers = [];
    
    // Genereer 10 samengestelde breuk vragen
    for (let i = 0; i < 10; i++) {
        let q = generateCompoundFractionQuestion();
        questions.push({
            text: q.question + ' = ?',  // ← Vraag zonder %
            answer: q.answer,            // ← Antwoord als string "3/4"
            answerNum: q.answerNum,
            answerDen: q.answerDen
        });
        answers.push({
            text: q.answer,              // ← Antwoord breuk
            answer: q.answer
        });
    }
    
    // Shuffle antwoorden
    for (let i = answers.length - 1; i > 0; i--) {
        let j = floor(random(0, i + 1));
        let temp = answers[i];
        answers[i] = answers[j];
        answers[j] = temp;
    }
    
    // Plaats vraagblokken 
    let questionIndex = 0;
    for (let row = 1; row < 3; row++) {
        for (let col = 0; col < COLS; col++) {
            if (questionIndex < 10) {
                blocks.push({
                    text: questions[questionIndex].text,
                    answer: questions[questionIndex].answer,
                    x: MARGIN + col * CELL_SIZE,
                    y: MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE,
                    col: col,
                    row: row,
                    startCol: col,
                    startRow: row,
                    isQuestion: true,
                    isDragging: false,
                    isPlaced: false,
                    isCorrect: null,
                    isHovered: false, //hoverparameters// 
                    hoverProgress: 0,
                });
                questionIndex++;
            }
        }
    }
    
    // Plaats antwoordblokken 
    let answerIndex = 0;
    for (let row = 3; row < 5; row++) {
        for (let col = 0; col < COLS; col++) {
            if (answerIndex < 10) {
                blocks.push({
                    text: answers[answerIndex].text,
                    answer: answers[answerIndex].answer,
                    x: MARGIN + col * CELL_SIZE,
                    y: MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE,
                    col: col,
                    row: row,
                    isQuestion: false,
                    isCorrect: null,
                    isHovered: false, //hoverparameters// 
                    hoverProgress: 0,
                });
                answerIndex++;
            }
        }
    }
}
function checkAnswers() {
    isChecked = true;
    correctCount = 0;
    
    for (let block of blocks) block.isCorrect = null;
    
    for (let questionBlock of blocks) {
        if (questionBlock.isQuestion) {
            let answerBlock = null;
            for (let block of blocks) {
                if (!block.isQuestion && block.col === questionBlock.col && block.row === questionBlock.row) {
                    answerBlock = block;
                    break;
                }
            }
            if (answerBlock && questionBlock.answer === answerBlock.answer) {
                questionBlock.isCorrect = true;
                answerBlock.isCorrect = true;
                correctCount++;
            } else {
                questionBlock.isCorrect = false;
                if (answerBlock) answerBlock.isCorrect = false;
            }
        }
    }
    
    // Score button update gebeurt automatisch in draw()
    
    if (correctCount === 10) {
        isFlashing = true;
        flashCounter = 0;
        
        // Verander score button kleur naar goud
        if (canvasButtons.length > 1) {
            canvasButtons[1].color = color(255, 215, 0); // Goud
        }
    } else {
        // Reset naar paars als niet alle correct
        if (canvasButtons.length > 1) {
            canvasButtons[1].color = color(156, 39, 176); // Paars
        }
    }
}
function setup() {
    // EERST navigatie maken
    createNavigation();
    
    // Bereken optimale schaalfactor voor mobiel
    IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Bereken optimale schaalfactor voor mobiel
    if (IS_MOBILE) {
        let baseCanvasWidth = COLS * CELL_SIZE + MARGIN * 2;
        let baseCanvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;
        
        let availableWidth = window.innerWidth - 20; // 10px marge links en rechts
        let availableHeight = window.innerHeight - 150; // Ruimte voor navigatie en marges
        
        let scaleByWidth = availableWidth / baseCanvasWidth;
        let scaleByHeight = availableHeight / baseCanvasHeight;
        
        // Gebruik de kleinste schaal zodat alles past
        SCALE_FACTOR = Math.min(scaleByWidth, scaleByHeight);
        SCALE_FACTOR = constrain(SCALE_FACTOR, 0.3, 1.2); // Minimum 30%, maximum 120%
    } else {
        SCALE_FACTOR = 1;
    }
    
        
    // Maak een wrapper voor ALLES
    let wrapper = createDiv();
    wrapper.style('display', 'flex');
    wrapper.style('flex-direction', 'column');
    wrapper.style('align-items', 'center');
    wrapper.style('width', '100%');
        
    // Canvas container
    let container = createDiv();
    container.parent(wrapper);
    container.style('position', 'relative');
    container.style('display', 'inline-block');
    
    let canvasWidth = COLS * CELL_SIZE + MARGIN * 2;
    let canvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;

    let cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent(container);

    // voorkom mobiel scrollen/zoomen
    cnv.elt.style.touchAction = 'none';  
    cnv.elt.style.userSelect = 'none';
  
        
    // Laad achtergrond
    loadImage('background_dragon.png', 
      (img) => { backgroundImage = img; bgLoaded = true; },
      () => {
        loadImage('background_dragon.png', 
          (img) => { backgroundImage = img; bgLoaded = true; }
        );
      }
    );
 
    // Laad dino
    loadImage('dino.png', (img) => { dinoImage = img; });
    
    generateQuestions();
    
    // Maak canvas buttons in rij 0
let btnW = IS_MOBILE ? 75 : 90;  // Buttons breder op mobiel
let btnH = IS_MOBILE ? 35 : 38;  // Buttons hoger op mobiel
let btnY = MARGIN + TITLE_SPACE + BUTTON_HEIGHT + 80;
let btnGap = IS_MOBILE ? 15 : 50;  // Meer gap op mobiel voor betere verdeling

// Bereken totale breedte van alle buttons
let totalWidth = btnW * 3 + (btnW + 20) + btnGap * 3;

// Op mobiel: als ze niet passen, maak ze smaller
if (IS_MOBILE && totalWidth > width - 40) {
    let availableWidth = width - 40; // 20px marge aan beide kanten
    btnGap = 10;
    btnW = (availableWidth - (btnGap * 3) - 20) / 4; // 4 buttons, 1 is breder
}
    let startX = (width - totalWidth) / 2; 
  
    canvasButtons = [
      new CanvasButton(
        startX, 
        btnY, 
        btnW, 
        btnH, 
        'Nakijken', 
        color(76, 175, 80), 
        checkAnswers
      ),
      new CanvasButton(
        startX + btnW + btnGap, 
        btnY, 
        btnW + 20, 
        btnH, 
        'Score: 0/10', 
        color(156, 39, 176), 
        showScoreFeedback
      ),
      new CanvasButton(
        startX + (btnW + btnGap) * 2 + 20, 
        btnY, 
        btnW, 
        btnH, 
        'Reset', 
        color(244, 67, 54), 
        resetGame
      ),
      new CanvasButton(
        startX + (btnW + btnGap) * 3 + 20, 
        btnY, 
        btnW, 
        btnH, 
        'ℹ Info', 
        color(3, 169, 244), 
        showInfo
      )
    ];
    
    // Achtergrondkleur
    document.body.style.backgroundColor = '#0e1621';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
}
 
  function draw() {
   
    // ====== ACHTERGROND TEKENEN ======
    // ALTIJD eerst de donkere achtergrond
    background(14, 22, 33);  
    
    if (bgLoaded && backgroundImage) {
        push();
        
        // Bereken geschaalde dimensies met aparte X en Y schaal
        let scaledW = width * DRAGON_SCALE_X;
        let scaledH = height * DRAGON_SCALE_Y;
        
        // Bereken positie (center + offset)
        let imgX = (width - scaledW) / 2 + DRAGON_X_OFFSET;
        let imgY = (height - scaledH) / 2 + DRAGON_Y_OFFSET;
        
        // Pas transparantie toe
        tint(255, DRAGON_OPACITY);
        
        // Teken de draak
        imageMode(CORNER);
        image(backgroundImage, imgX, imgY, scaledW, scaledH);
        
        noTint();
        
        // Optionele blur overlay
        if (DRAGON_BLUR) {
            fill(14, 22, 33, 100);
            noStroke();
            rect(0, 0, width, height);
        }
        
        pop();
    }
    
   
    // ====== TITEL EN ONDERTITEL TEKENEN ======
    push();
    // TITEL (klikbaar)
    fill(TITLE_COLOR[0], TITLE_COLOR[1], TITLE_COLOR[2]);
    textAlign(CENTER, TOP);
    textSize(TITLE_SIZE);
    textStyle(BOLD);

    // Bereken titleWidth NA textSize
    let titleWidth = textWidth(TITLE_TEXT);
    let titleX = width / 2;
    let isHoveringTitle = mouseX > titleX - titleWidth/2 && 
                          mouseX < titleX + titleWidth/2 && 
                          mouseY > TITLE_Y && 
                          mouseY < TITLE_Y + TITLE_SIZE;

    text(TITLE_TEXT, width / 2, TITLE_Y);

    // SUBTITLE
    fill(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2]);
    textSize(SUBTITLE_SIZE);
    textStyle(NORMAL);
    text(SUBTITLE_TEXT, width / 2, SUBTITLE_Y);
    pop();
    
    // ====== GRID TEKENEN ======
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = MARGIN + col * CELL_SIZE;
            const y = MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
            if (showDinoGame && (row === 1 || row === 2)) continue;
            if (row >= 3) {
                fill(200, 220, 200, 0);  // Groen vakje (antwoorden)
            } else {
                fill(220, 220, 200, 0);  // ← TRANSPARANT!
            }
            stroke(100, 100, 100, 0);
            strokeWeight(2);
            rect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }   
    
    // ====== HOVER DETECTIE VOOR BLOKKEN ======
    for (let block of blocks) {
        block.isHovered = false;

        if (
            !IS_MOBILE &&
            !showDinoGame &&
            block.isQuestion &&
            block.row >= 1 && block.row < 3 &&
            !draggingBlock &&
            mouseX >= block.x &&
            mouseX <= block.x + CELL_SIZE &&
            mouseY >= block.y &&
            mouseY <= block.y + CELL_SIZE
        ) {
            block.isHovered = true;
        }

        const target = block.isHovered ? 1 : 0;
        block.hoverProgress = lerp(block.hoverProgress, target, 0.15);
    }

    // ====== BLOKKEN TEKENEN ======
    for (let block of blocks) {
        if (!block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 1 || block.row === 2)) continue;
            drawBlock(block);
        }
    }

    for (let block of blocks) {
        if (block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 1 || block.row === 2)) continue;
            drawBlock(block);
        }
    }
  
    // ====== FLASHING EFFECT ======
    if (isFlashing) {
        flashCounter++;
        if (flashCounter % 20 < 10) {
            fill(255, 255, 0, 150);
            noStroke();
            rect(0, 0, width, height);
        }
        if (flashCounter > 100) {
            isFlashing = false;
            flashCounter = 0;
            
            // Check of er al games gespeeld zijn OF een game actief is
            if (totalGamesPlayed >= 1 || dinoGame !== null) {
                // Doe niets, de game is al actief
                // Zorg dat de game weer zichtbaar wordt
                showDinoGame = true;
            } else {
                // Start alleen de game als er nog geen games gespeeld zijn
                showDinoGame = true;
                dinoGame = new DinoGame();
            }
        }
    }
    
    // ====== DINO GAME TEKENEN ======
    
    if (showDinoGame && dinoGame) {
        const gameY = MARGIN + CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE; // +CELL_SIZE voor rij 0 buttons
        dinoGame.update(gameY);
        dinoGame.draw(gameY);
    }


    // ====== DRAGGING BLOCK ======
    if (draggingBlock) {
        drawBlock(draggingBlock);
    }
    
    // ====== CANVAS BUTTONS TEKENEN ======
for (let btn of canvasButtons) {
    // Update hover voor alle buttons (ook op mobiel voor smooth fade-out)
    if (!draggingBlock) {
        btn.checkHover(mouseX, mouseY);
    } else {
        btn.hoverProgress = lerp(btn.hoverProgress, 0, 0.15);
    }
    btn.draw();
}
    
    // Update score button label
    if (canvasButtons.length > 1) {
        canvasButtons[1].label = 'Score: ' + correctCount + '/10';
    }
  
    // ====== CURSOR LOGICA (ALTIJD ALS LAATSTE) ======
    showHandCursor = false;
    
    // Hover over canvas buttons
    if (!showDinoGame && !draggingBlock) {
        for (let btn of canvasButtons) {
            if (btn.isClicked(mouseX, mouseY)) {
                showHandCursor = true;
                break;
            }
        }
    }

    // Hover over blauwe vraagblokken
    if (!showDinoGame && !showHandCursor) {
        for (let block of blocks) {
            if (
                block.isQuestion &&
                block.row >= 1 && block.row < 3 &&
                mouseX >= block.x &&
                mouseX <= block.x + CELL_SIZE &&
                mouseY >= block.y &&
                mouseY <= block.y + CELL_SIZE
            ) {
                showHandCursor = true;
                break;
            }
        }
    }
    
    // ====== CURSOR (ALTIJD LAATSTE) ======
    if (draggingBlock) {
        showHandCursor = true;
    }

    if (!IS_MOBILE) {
        setCursor(showHandCursor ? 'pointer' : 'default');
    } else {
        setCursor('default');
    }
}

function drawBlock(block) {
  push();
    
    // Hover effect alleen voor vraagblokken
    if (block.isQuestion && block.hoverProgress > 0) {
        let lift = -6 * block.hoverProgress;
        let scaleAmount = 1 + 0.15 * block.hoverProgress;
        
        translate(block.x + CELL_SIZE / 2, block.y + CELL_SIZE / 2 + lift);
        scale(scaleAmount);
        translate(-CELL_SIZE / 2, -CELL_SIZE / 2);
        
        // Schaduw effect
        drawingContext.shadowBlur = 20 * block.hoverProgress;
        drawingContext.shadowColor = 'rgba(0,0,0,0.5)';
        drawingContext.shadowOffsetY = 4 * block.hoverProgress;
    }
    
    // Bepaal kleur
    if (isChecked && block.isCorrect !== null) {
        if (block.isCorrect) {
            fill(100, 200, 100);  //kleur antwoord goed
        } else {
            fill(250, 100, 100);  //kleur antwoord fout
        }
    } else if (block.isQuestion) {
        fill(100, 150, 250);   //kleur vraagblokjes
    } else {
        fill(255, 200, 100);   //kleur antwoordblokjes
    }
   // Teken blokje (gebruik relatieve positie als getransformeerd)
    stroke(50, 100, 200);
    strokeWeight(3);
    if (block.isQuestion && block.hoverProgress > 0) {
        rect(5, 5, CELL_SIZE - 10, CELL_SIZE - 10, 5);
    } else {
        rect(block.x + 5, block.y + 5, CELL_SIZE - 10, CELL_SIZE - 10, 5);
    }
    
    // Reset schaduw
    drawingContext.shadowBlur = 0;
    drawingContext.shadowOffsetY = 0;
    
    // TEKST TEKENEN
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    
    // Bepaal base positie voor tekenen
    let baseX = (block.isQuestion && block.hoverProgress > 0) ? CELL_SIZE / 2 : block.x + CELL_SIZE / 2;
    let baseY = (block.isQuestion && block.hoverProgress > 0) ? CELL_SIZE / 2 : block.y + CELL_SIZE / 2;
    
    // Check of de tekst breuken bevat
    if (block.text.includes('/')) {
        // Split de tekst in delen
        let parts = block.text.split(' ');
        
        // Schat de totale breedte
        let estimatedWidth = 0;
        for (let part of parts) {
            if (!isNaN(part) && !part.includes('/')) estimatedWidth += 15;  // heel getal
            else if (part.includes('/')) estimatedWidth += 20;              // breuk
            else if (part === '+' || part === '-') estimatedWidth += 15;    // operator
            else if (part === '=' || part === '?') estimatedWidth += 15;    // equals/vraagteken
        }
        
        // Start positie
        let startX = baseX - estimatedWidth / 2 + 5;
        
        for (let i = 0; i < parts.length; i++) {
            let part = parts[i];
            
            if (!isNaN(part) && !part.includes('/') && part !== '') {
                // Heel getal van gemengd getal
                textSize(14);
                text(part, startX, baseY);
                startX += 15;
                
            } else if (part.includes('/')) {
                // BREUK met horizontale streep
                let [num, den] = part.split('/');
                
                textSize(13);
                fill(0);
                noStroke();
                text(num, startX, baseY - 10);  // Teller
                
                // Breukstreep
                stroke(0);
                strokeWeight(2);
                line(startX - 7, baseY, startX + 7, baseY);
                noStroke();
                
                fill(0);
                text(den, startX, baseY + 10);  // Noemer
                
                startX += 20;
                
            } else if (part === '+') {
                textSize(16);
                fill(0);
                text('+', startX, baseY);
                startX += 20;  // Afstand na plus-teken
    
            } else if (part === '-') {
            // Teken een lange horizontale lijn voor het min-teken
                stroke(0);
                strokeWeight(1.5);  // Dikte van de streep (aanpasbaar)
                let lineLength = 8;  // Lengte van de streep (aanpasbaar: 8-20)
                line(startX - lineLength/2, baseY, startX + lineLength/2, baseY);
                noStroke();
                startX += 20;  // Afstand na min-teken (aanpasbaar)
                
            } else if (part === '=') {
                textSize(16);
                fill(0);
                text('=', startX, baseY);
                startX += 15;
                
            } else if (part === '?') {
                textSize(16);
                fill(0);
                text('?', startX, baseY);
                startX += 15;
            }
        }
    } else {
        // Gewone tekst zonder breuken
        textSize(14);
        fill(0);
        text(block.text, baseX, baseY);
    }
    
    pop();
}

function mousePressed() {
  
let zoneX = width  * DINO_ZONE.xRatio;
let zoneY = height * DINO_ZONE.yRatio;
let zoneW = width  * DINO_ZONE.wRatio;
let zoneH = height * DINO_ZONE.hRatio;

  if (
    mouseX > zoneX &&
    mouseX < zoneX + zoneW &&
    mouseY > zoneY &&
    mouseY < zoneY + zoneH
) {
    
    showDinoGame = true;
    dinoGame = new DinoGame();
    isFlashing = false;
    return false;
}

  pointerDown(mouseX, mouseY);
  return false;
}

function mouseDragged() {
  pointerMove(mouseX, mouseY);
  return false;
}

function mouseReleased() {
  pointerUp();
  return false;
}

function touchStarted() {
  if (touches.length > 0) {
    pointerDown(touches[0].x, touches[0].y);
  }
  return false;
}

function touchMoved() {
  if (touches.length > 0) {
    pointerMove(touches[0].x, touches[0].y);
  }
  return false;
}

function touchEnded() {
  pointerUp();
  return false;
}

    
function pointerDown(px, py) {
  showHandCursor = false;
  
  // Check canvas button clicks EERST
  for (let btn of canvasButtons) {
    if (btn.isClicked(px, py)) {
      btn.action();
      return false;
    }
  }

  // Dino jump
  if (showDinoGame && dinoGame && !dinoGame.gameOver) {
    dinoGame.dino.jump();
    return false;
  }
  // Block drag
  if (!showDinoGame) {
    for (let i = blocks.length - 1; i >= 0; i--) {
      let block = blocks[i];
      if (
        block.isQuestion &&
        block.row < 3 &&
        px > block.x && px < block.x + CELL_SIZE &&
        py > block.y && py < block.y + CELL_SIZE
      ) {
        draggingBlock = block;
        offsetX = px - block.x;
        offsetY = py - block.y;
        block.isDragging = true;
        isChecked = false;
        showHandCursor = true;
        break;
      }
    }
  }
}

function pointerMove(px, py) {
  
    
  if (draggingBlock) {
    draggingBlock.x = px - offsetX;
    draggingBlock.y = py - offsetY;
    showHandCursor = true;
  }
}

function pointerUp() {
  if (!draggingBlock) return;

  draggingBlock.isDragging = false;
  snapBlock(draggingBlock);
  draggingBlock = null;
    }
function snapBlock(block) {
  // Bereken dichtstbijzijnde gridpositie
  let col = Math.round((block.x - MARGIN) / CELL_SIZE);
  let row = Math.round((block.y - MARGIN - BUTTON_HEIGHT - TITLE_SPACE) / CELL_SIZE);

  // Clamp binnen grid
  col = constrain(col, 0, COLS - 1);
  row = constrain(row, 0, ROWS - 1);

  // Check of er al een ander vraagblok op deze positie staat
  for (let other of blocks) {
    if (other !== block && other.isQuestion && other.col === col && other.row === row) {
      // Er staat al een blok hier, ga terug naar startpositie
      col = block.startCol;
      row = block.startRow;
      break;
    }
  }

  // Nieuwe vaste positie
  block.col = col;
  block.row = row;

  block.x = MARGIN + col * CELL_SIZE;
  block.y = MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
}
