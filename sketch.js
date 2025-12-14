// CSS styling (injected into DOM)
let style = document.createElement('style');
style.innerHTML = `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        width: 100vw;
        background-color: #f0f0f0;
        font-family: Arial, sans-serif;
        overflow: hidden;
    }
    
    canvas {
        display: block;
    }
    
    button {
        font-family: Arial, sans-serif;
        transition: all 0.2s ease;
    }
    
    button:hover {
        opacity: 0.9;
        transform: scale(1.05);
    }
    
    button:active {
        transform: scale(0.95);
    }
`;
document.head.appendChild(style);

// ============================================
// AANPASBARE VARIABELEN VOOR POSITIONERING
// ============================================

const COLS = 5;
const ROWS = 4;
const CELL_SIZE = 110;
const MARGIN = 400;

// TITEL RUIMTE - Verhoog dit getal voor meer ruimte bovenaan
const TITLE_SPACE = 60;  // ← Aanpassen: meer ruimte = hoger getal

// KNOP HOOGTE
const BUTTON_HEIGHT = 70;

// KNOP POSITIES (horizontaal verschuiving vanaf linker marge)
const BUTTON_1_X = 5;      // ← Nakijken knop
const BUTTON_2_X = 140;    // ← Score knop
const BUTTON_3_X = 300;    // ← Reset knop  
const BUTTON_4_X = 450;    // ← Info knop

// KNOP VERTICALE POSITIE (onder de titel)
const BUTTON_Y = 380;       // ← Aanpassen: hoger getal = lager op scherm

// TITEL INSTELLINGEN
const TITLE_TEXT = 'Summon the Dragon';
const TITLE_SIZE = 30;
const TITLE_COLOR = [102, 51, 153];
const TITLE_Y = 340;

// ONDERTITEL INSTELLINGEN
const SUBTITLE_TEXT = 'Los alle sommen op om de draak op te roepen!';
const SUBTITLE_SIZE = 12;
const SUBTITLE_COLOR = [80, 80, 80];
const SUBTITLE_Y = 375;

// DRAAK ACHTERGROND INSTELLINGEN - HIER KUN JE AANPASSEN!
const DRAGON_SCALE = 0.7;      // ← Schaal: 1.0=normaal, 1.5=50% groter, 2.0=dubbel, 0.8=kleiner
const DRAGON_X_OFFSET = 140;     // ← Horizontaal: negatief=links, positief=rechts (bijv. -100 of 150)
const DRAGON_Y_OFFSET = 20;     // ← Verticaal: negatief=omhoog, positief=omlaag (bijv. -50 of 100)
const DRAGON_OPACITY = 50;    // ← Transparantie: 0=onzichtbaar, 255=volledig zichtbaar, 150=half
const DRAGON_BLUR = true;     // ← true = achtergrond wazig, false = scherp

// ============================================

let blocks = [];
let draggingBlock = null;
let offsetX = 0;
let offsetY = 0;
let checkButton;
let resetButton;
let scoreButton;
let infoButton;
let isChecked = false;
let correctCount = 0;
let isFlashing = false;
let flashCounter = 0;

let dinoGame = null;
let showDinoGame = false;
let dinoGameCount = 0;
let dinoImage = null;
let backgroundImage = null;
let bgLoaded = false;

class Dino {
  constructor() {
    this.x = MARGIN + (COLS * CELL_SIZE) / 4;  // ← 25% van grid breedte
    this.y = 0;
    this.width = 50;
    this.height = 53;
    this.vy = 0;
    this.gravity = 0.8;
    this.jumpPower = -15;
    this.onGround = true;
    this.onPlatform = false;
    this.legFrame = 0;
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

  update() {
    this.vy += this.gravity;
    this.y += this.vy;

    if (this.y >= 0) {
      this.y = 0;
      this.vy = 0;
      this.onGround = true;
      this.onPlatform = false;
    }
    
    if (this.onGround && frameCount % 6 === 0) {
      this.legFrame = (this.legFrame + 1) % 2;
    }
  }

  draw(gameY) {
    push();
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    let drawY = groundY + this.y;
    
    fill(0, 0, 0, 40);
    noStroke();
    ellipse(this.x + this.width/2, drawY + this.height + 2, this.width * 0.8, 10);
    
    if (dinoImage) {
      imageMode(CORNER);
      image(dinoImage, this.x, drawY, this.width, this.height);
    } else {
      textAlign(CENTER, CENTER);
      textSize(this.height);
      text('🦖', this.x + this.width/2, drawY + this.height/2);
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
    } else if (type === 'platform') {
      this.width = 150;
      this.height = 15;
      this.isPlatform = true;
    }
  }

  update(speed) {
    this.x -= speed;
  }

  draw(gameY) {
    push();
    
    if (this.isPlatform) {
      fill(229, 244, 58);
      stroke(139, 69, 19);
      strokeWeight(2);
      let platformY = gameY + CELL_SIZE;
      rect(this.x, platformY, this.width, this.height, 4);
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
      let platformTop = gameY + CELL_SIZE;
      let platformBottom = gameY + CELL_SIZE + this.height;
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);
      
      let horizontalOverlap = dino.x + dino.width > this.x && dino.x < this.x + this.width;
      
      if (dino.vy >= 0 && 
          dinoBottom >= platformTop - 3 && 
          dinoBottom <= platformTop + 3 &&
          horizontalOverlap) {
        
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformTop - groundY;
        dino.vy = 0;
        dino.onGround = true;
        dino.onPlatform = true;
      }
      
      if (dino.vy < 0 && 
          dinoTop <= platformBottom + 5 && 
          dinoTop >= platformTop &&
          horizontalOverlap) {
        
        dino.vy = 0;
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformBottom - groundY;
      }
      
      return false;
    } else {
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
  }

  reset() {
    this.dino = new Dino();
    this.obstacles = [];
    this.spawnTimer = 0;
    this.gameOver = false;
    
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
    if (this.gameOver) return;

    this.dino.update();
    
    this.spawnTimer++;
    let spawnInterval = max(40, 80 - floor(this.score / 5) * 5);
    if (this.spawnTimer > spawnInterval) {
      this.spawnObstacles();
      this.spawnTimer = 0;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.update(this.gameSpeed);

      if (!obs.isPlatform && obs.hits(this.dino, gameY)) {
        this.gameOver = true;
        this.gamesPlayed++;
      } else if (obs.isPlatform) {
        obs.hits(this.dino, gameY);
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
      text('Klik muis', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 35);
      
      if (this.gamesPlayed >= this.maxGames) {
        fill(243, 156, 18);
        textSize(16);
        textStyle(BOLD);
        text('Volledige reset!', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 65);
      }
    }
    
    pop();
  }

  jump() {
    if (!this.gameOver) {
      this.dino.jump();
    } else {
      if (this.gamesPlayed >= this.maxGames) {
        showDinoGame = false;
        dinoGame = null;
        generateQuestions();
      } else {
        this.reset();
      }
    }
  }
}

function styleButton(btn, bgColor, padding) {
    btn.style('padding', padding);
    btn.style('font-size', '16px');
    btn.style('cursor', 'pointer');
    btn.style('background-color', bgColor);
    btn.style('color', 'white');
    btn.style('border', 'none');
    btn.style('border-radius', '8px');
    btn.style('position', 'fixed');
}

function updateButtonPositions() {
    let canvasWidth = COLS * CELL_SIZE + MARGIN * 2;
    let canvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;
    
    let x = (windowWidth - canvasWidth) / 2;
    let y = (windowHeight - canvasHeight) / 2;
    
    if (checkButton) checkButton.position(x + MARGIN + BUTTON_1_X, y + TITLE_SPACE + BUTTON_Y);
    if (scoreButton) scoreButton.position(x + MARGIN + BUTTON_2_X, y + TITLE_SPACE + BUTTON_Y);
    if (resetButton) resetButton.position(x + MARGIN + BUTTON_3_X, y + TITLE_SPACE + BUTTON_Y);
    if (infoButton) infoButton.position(x + MARGIN + BUTTON_4_X, y + TITLE_SPACE + BUTTON_Y);
}

function windowResized() {
    updateButtonPositions();
}

function setup() {
    let canvasWidth = COLS * CELL_SIZE + MARGIN * 2;
    let canvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;

    createCanvas(canvasWidth, canvasHeight);

    let canvas = document.querySelector('canvas');
    canvas.style.position = 'fixed';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';

    loadImage('background_dragon.png', 
      (img) => { backgroundImage = img; bgLoaded = true; },
      () => {
        loadImage('background_dragon.png', 
          (img) => { backgroundImage = img; bgLoaded = true; }
        );
      }
    );
    
    loadImage('dino.png', (img) => { dinoImage = img; });

    updateButtonPositions();

    checkButton = createButton('Nakijken');
    checkButton.mousePressed(checkAnswers);
    styleButton(checkButton, '#4CAF50', '10px 15px');

    scoreButton = createButton('Score: 0/10');
    styleButton(scoreButton, '#9C27B0', '10px 15px');
    scoreButton.style('cursor', 'default');

    resetButton = createButton('Reset');
    resetButton.mousePressed(resetGame);
    styleButton(resetButton, '#f44336', '10px 23px');

    infoButton = createButton('ℹ Info');
    infoButton.mousePressed(showInfo);
    styleButton(infoButton, '#03A9F4', '10px 30px');

    updateButtonPositions();
    
    setTimeout(() => {
        updateButtonPositions();
    }, 50);
    
    setTimeout(() => {
        updateButtonPositions();
    }, 200);

    generateQuestions();
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
    
    if (scoreButton && scoreButton.elt) {
        scoreButton.elt.textContent = 'Score: 0/10';
        scoreButton.style('background-color', '#9C27B0');
    }
    
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
    
    // Plaats vraagblokken (boven, rows 0-1)
    let questionIndex = 0;
    for (let row = 0; row < 2; row++) {
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
                    isCorrect: null
                });
                questionIndex++;
            }
        }
    }
    
    // Plaats antwoordblokken (onder, rows 2-3)
    let answerIndex = 0;
    for (let row = 2; row < ROWS; row++) {
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
                    isCorrect: null
                });
                answerIndex++;
            }
        }
    }
}

function draw() {
    if (bgLoaded && backgroundImage) {
        push();
        
        let scaledW = width * DRAGON_SCALE;
        let scaledH = height * DRAGON_SCALE;
        
        let imgX = (width - scaledW) / 2 + DRAGON_X_OFFSET;
        let imgY = (height - scaledH) / 2 + DRAGON_Y_OFFSET;
        
        tint(255, DRAGON_OPACITY);
        
        imageMode(CORNER);
        image(backgroundImage, imgX, imgY, scaledW, scaledH);
        
        noTint();
        
        if (DRAGON_BLUR) {
            fill(240, 240, 240, 100);
            noStroke();
            rect(0, 0, width, height);
        }
        
        pop();
    } else {
        background(240);
    }
  
    push();
    fill(TITLE_COLOR[0], TITLE_COLOR[1], TITLE_COLOR[2]);
    textAlign(CENTER, TOP);
    textSize(TITLE_SIZE);
    textStyle(BOLD);
    text(TITLE_TEXT, width / 2, TITLE_Y);

    fill(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2]);
    textSize(SUBTITLE_SIZE);
    textStyle(NORMAL);
    text(SUBTITLE_TEXT, width / 2, SUBTITLE_Y);
    pop();

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            let x = MARGIN + col * CELL_SIZE;
            let y = MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;

            if (showDinoGame && (row === 0 || row === 1)) continue;

            if (row >= 2) {
                fill(200, 220, 200, 0);
            } else {
                fill(220, 220, 200, 0);
            }

            stroke(100, 100, 100, 0);
            strokeWeight(2);
            rect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }

    for (let block of blocks) {
        if (!block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 0 || block.row === 1)) continue;
            drawBlock(block);
        }
    }

    for (let block of blocks) {
        if (block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 0 || block.row === 1)) continue;
            drawBlock(block);
        }
    }

    if (isFlashing) {
        flashCounter++;
        if (flashCounter % 20 < 10) {
            fill(255, 255, 0, 150);
            noStroke();
            rect(0, 0, width, height);
        }
        if (flashCounter > 100) {
            isFlashing = false;
            showDinoGame = true;
            dinoGame = new DinoGame();
        }
    }

    if (showDinoGame && dinoGame) {
        let gameY = MARGIN + BUTTON_HEIGHT + TITLE_SPACE;
        dinoGame.update(gameY);
        dinoGame.draw(gameY);
    }

    if (draggingBlock) {
        drawBlock(draggingBlock);
    }
}

function drawBlock(block) {
    if (isChecked && block.isCorrect !== null) {
        if (block.isCorrect) {
            fill(100, 200, 100);
        } else {
            fill(250, 100, 100);
        }
    } else if (block.isQuestion) {
        fill(100, 150, 250);
    } else {
        fill(255, 200, 100);
    }

    stroke(50, 100, 200);
    strokeWeight(3);
    rect(block.x + 5, block.y + 5, CELL_SIZE - 10, CELL_SIZE - 10, 5);

    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    
    // Check of de tekst breuken bevat
    if (block.text.includes('/')) {
        let centerY = block.y + CELL_SIZE / 2;
        
        // Schat de totale breedte van de tekst
        let estimatedWidth = 0;
        let parts = block.text.split(' ');
        for (let part of parts) {
            if (!isNaN(part) && !part.includes('/')) estimatedWidth += 12;  // heel getal
            else if (part.includes('/')) estimatedWidth += 20;              // breuk
            else if (part === '+' || part === '-') estimatedWidth += 12;    // operator
            else if (part === '=') estimatedWidth += 18;                    // equals
        }
        
        // Start in het midden minus helft van de breedte
        let startX = block.x + 4 + CELL_SIZE / 2 - estimatedWidth / 2; //+ 4 aangepast om eerste breuk verder naar rechts te krijgen
        
        for (let i = 0; i < parts.length; i++) {
            let part = parts[i];
            
            // Check of het een heel getal is (komt voor breuk)
            if (!isNaN(part) && !part.includes('/')) {
                // Heel getal van gemengd getal
                textSize(12);
                text(part, startX, centerY);
                startX += 15;
                
            } else if (part.includes('/')) {
                // BREUK tekenen
                let [num, den] = part.split('/');
                
                textSize(12);
                text(num, startX, centerY - 10);  // Teller
                
                stroke(255);
                strokeWeight(2);
                line(startX - 8, centerY, startX + 8, centerY);  // Breukstreep
                noStroke();
                
                text(den, startX, centerY + 10);  // Noemer
                
                startX += 20;
                
            } else if (part === '+' || part === '-') {
                // Plus of min teken
                textSize(12);
                text(part, startX, centerY);
                startX += 18;
                
            } else if (part === '=') {
                // Equals teken
                textSize(12);
                text('=', startX, centerY);
                startX += 18;
            }
        }
    } else {
        // Gewone tekst zonder breuken
        textSize(12);
        text(block.text, block.x + CELL_SIZE / 2, block.y + CELL_SIZE / 2);
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

    if (scoreButton && scoreButton.elt) {
        scoreButton.elt.textContent = 'Score: ' + correctCount + '/10';
    }

    if (correctCount === 10) {
        isFlashing = true;
        flashCounter = 0;
        if (scoreButton && scoreButton.elt) {
            scoreButton.style('background-color', '#FFD700');
        }
    }
}

function resetGame() {
    showDinoGame = false;
    dinoGame = null;
    generateQuestions();
}

function mousePressed() {
    if (document.getElementById('infoPopup')) return false;

    if (showDinoGame && dinoGame) {
        dinoGame.jump();
    }

    if (!showDinoGame) {
        for (let i = blocks.length - 1; i >= 0; i--) {
            let block = blocks[i];
            if (mouseX > block.x && mouseX < block.x + CELL_SIZE && mouseY > block.y && mouseY < block.y + CELL_SIZE) {
                if (block.isQuestion && !block.isDragging && block.row < 2) {
                    draggingBlock = block;
                    offsetX = mouseX - block.x;
                    offsetY = mouseY - block.y;
                    block.isDragging = true;
                    block.isCorrect = null;
                    isChecked = false;
                    break;
                }
            }
        }
    }
    return false;
}

function mouseDragged() {
    if (document.getElementById('infoPopup')) return false;
    if (draggingBlock) {
        draggingBlock.x = mouseX - offsetX;
        draggingBlock.y = mouseY - offsetY;
    }
    return false;
}
function mouseReleased() {
    if (document.getElementById('infoPopup')) return false;

    if (draggingBlock) {
        draggingBlock.isDragging = false;
        let snapped = false;
        for (let row = 2; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cellX = MARGIN + col * CELL_SIZE;
                const cellY = MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
                const centerX = draggingBlock.x + CELL_SIZE / 2;
                const centerY = draggingBlock.y + CELL_SIZE / 2;

                if (centerX > cellX && centerX < cellX + CELL_SIZE && centerY > cellY && centerY < cellY + CELL_SIZE) {
                    let occupied = false;
                    for (let other of blocks) {
                        if (other !== draggingBlock && other.isQuestion && other.col === col && other.row === row) {
                            occupied = true;
                            break;
                        }
                    }

                    if (!occupied) {
                        draggingBlock.x = cellX;
                        draggingBlock.y = cellY;
                        draggingBlock.col = col;
                        draggingBlock.row = row;
                        draggingBlock.isPlaced = true;
                        draggingBlock.startCol = col;
                        draggingBlock.startRow = row;
                        snapped = true;
                        break;
                    }
                }
            }
            if (snapped) break;
        }

        if (!snapped) {
            draggingBlock.x = MARGIN + draggingBlock.startCol * CELL_SIZE;
            draggingBlock.y = MARGIN + draggingBlock.startRow * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
            draggingBlock.col = draggingBlock.startCol;
            draggingBlock.row = draggingBlock.startRow;
            draggingBlock.isPlaced = false;
        }

        draggingBlock = null;
    }
    return false;
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
        <h2 style="color: #F44336; margin-top: 0;">Summon the Dragon</h2><br>
        <p style="color: #0E0E0E; line-height: 1.2;">
            <strong>Doel:<br></strong> Los alle 10 sommen correct op en speel de Dragon game!<br><br>
            <strong>Hoe speel je:</strong>
            <ol style="color: #0909B4; margin: 5px 0;">
                <li>Sleep blauwe somblokjes naar de juiste oranje antwoorden</li>
                <li>Klik "Nakijken" om je antwoorden te controleren</li>
                <li>Bij een score van 10/10 start de Dragon game automatisch! </li>
            </ol><br> 
            <strong>Dragon Game:<br></strong> Spring met spatie of muisklik.<br> Spring op de hoge gele trampolines voor extra boost!<br>
            Na 3 game-overs komt er een volledige reset.<br>
<ol style="color: #F44336; margin: 5px 0;">
            Highscore record = 36 (Sven)</ol><br>
            <strong>Reset:<br></strong> Klik "Reset" voor nieuwe sommen.
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

    document.getElementById('closeBtn').addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });

    overlay.addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });

    popup.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

function keyPressed() {
    if (showDinoGame && dinoGame) {
        if (key === ' ' || keyCode === 32) {
            dinoGame.jump();
            return false;
        }
    }
}
