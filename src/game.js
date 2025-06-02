import { ParticleSystem } from './particles.js';

export class Game {
  constructor(canvas, playerName, shipType, audioManager, updateUICallback, gameOverCallback, victoryCallback) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.playerName = playerName;
    this.shipType = shipType;
    this.audioManager = audioManager;
    this.updateUICallback = updateUICallback;
    this.gameOverCallback = gameOverCallback;
    this.victoryCallback = victoryCallback;
    
    // Game state
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.paused = false;
    this.victory = false;
    
    // Game settings
    this.maxLevel = 3;
    this.enemyRows = 4;
    this.enemiesPerRow = 8;
    this.enemyTypes = ['Red', 'Blue', 'Green', 'Black'];
    this.enemySpeed = 50; // Increased base speed from 30 to 50
    this.enemyFireRate = 0.09; // Further increased from 0.045 to 0.09 - doubled again
    this.barrierCount = 4;
    
    // Controls
    this.controls = {
      left: false,
      right: false,
      fire: false
    };
    
    // Game objects
    this.player = null;
    this.playerBullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.barriers = [];
    this.stars = [];
    this.motherShip = null;
    
    // Enemy movement
    this.enemyDirection = 1; // 1 for right, -1 for left
    this.enemyMoveTimer = 0;
    this.enemyMoveInterval = 400; // Reduced from 500 to 400 ms between enemy moves
    this.enemyStepSize = 15; // Increased horizontal movement amount from 10 to 15
    this.enemyDropAmount = 20; // Vertical drop amount when hitting edge
    
    // Mother ship settings
    this.motherShipTimer = 0;
    this.motherShipInterval = 15000; // 15 seconds between appearances
    this.motherShipSpeed = 100; // pixels per second
    this.motherShipPoints = 500; // points for destroying the mother ship
    
    // Particle systems
    this.explosionParticles = new ParticleSystem(this.canvas, this.ctx);
    
    // Timing
    this.lastTime = 0;
    this.playerFireTimer = 0;
    this.playerFireDelay = 300; // ms between shots
    
    // Animation frame
    this.animationFrameId = null;
    
    // UI dimensions
    this.uiHeight = 0; // Will be set in init
    
    // Background image
    this.backgroundImage = new Image();
    this.backgroundImage.src = 'https://i.postimg.cc/zvMkvPzd/moon-2048727-640.jpg';
    this.backgroundImageLoaded = false;
    this.backgroundImage.onload = () => {
      this.backgroundImageLoaded = true;
    };
    
    // Initialize the game
    this.init();
  }
  
  init() {
    // Set canvas size
    this.handleResize();
    
    // Get UI height for game area calculations
    const gameInfo = document.querySelector('.game-info');
    this.uiHeight = gameInfo ? gameInfo.offsetHeight : 0;
    
    // Create player
    this.createPlayer();
    
    // Create enemies
    this.createEnemies();
    
    // Create barriers
    this.createBarriers();
    
    // Create stars
    this.createStars();
    
    // Preload mother ship image
    this.motherShipImage = new Image();
    this.motherShipImage.src = 'https://i.postimg.cc/BQYNbpQ9/space-Ships-007.png';
    this.motherShipImage.onload = () => {
      this.motherShipImageLoaded = true;
    };
    
    // Start game loop
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  handleResize() {
    // Set canvas to full screen
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Get UI height for game area calculations
    const gameInfo = document.querySelector('.game-info');
    this.uiHeight = gameInfo ? gameInfo.offsetHeight : 0;
    
    // Recalculate game dimensions
    if (this.player) {
      this.player.x = this.canvas.width / 2 - this.player.width / 2;
      this.player.y = this.canvas.height - this.player.height - 20;
    }
    
    // Recreate barriers with new screen dimensions if they exist
    if (this.barriers.length > 0) {
      this.createBarriers();
    }
  }
  
  createPlayer() {
    const shipImage = new Image();
    shipImage.src = `https://i.postimg.cc/${this.shipType === 1 ? '0rr1QSb5' : this.shipType === 2 ? 'bdMc2vtx' : 'N5Hh8w6W'}/ship${this.shipType}.png`;
    
    // Calculate player size based on screen size
    const playerSize = Math.min(50, Math.max(30, window.innerWidth / 12));
    
    this.player = {
      x: this.canvas.width / 2 - playerSize / 2,
      y: this.canvas.height - playerSize - 20,
      width: playerSize,
      height: playerSize,
      speed: 300,
      image: shipImage,
      isLoaded: false
    };
    
    shipImage.onload = () => {
      this.player.isLoaded = true;
    };
  }
  
  createEnemies() {
    this.enemies = [];
    
    // Adjust difficulty based on level
    const rows = Math.min(this.enemyRows, this.level + 2);
    const speed = this.enemySpeed + (this.level - 1) * 15; // Increased level speed bonus from 10 to 15
    const fireRate = this.enemyFireRate * (1 + (this.level - 1) * 0.5);
    
    // Calculate enemy size based on screen size
    const enemySize = Math.min(40, Math.max(25, window.innerWidth / 15));
    const padding = Math.max(10, enemySize / 4);
    
    // Calculate starting position to center the grid
    const totalWidth = this.enemiesPerRow * (enemySize + padding) - padding;
    const startX = (this.canvas.width - totalWidth) / 2;
    const startY = this.uiHeight + 50; // Start below the UI area
    
    for (let row = 0; row < rows; row++) {
      const enemyType = this.enemyTypes[row % this.enemyTypes.length];
      const enemyImage = new Image();
      enemyImage.src = `https://i.postimg.cc/${enemyType === 'Red' ? 'vDP9rJYL' : enemyType === 'Blue' ? 'WDR0D02B' : enemyType === 'Green' ? '1gpwD4Xf' : 'fJLc1w2r'}/enemy-${enemyType}3.png`;
      
      for (let col = 0; col < this.enemiesPerRow; col++) {
        this.enemies.push({
          x: startX + col * (enemySize + padding),
          y: startY + row * (enemySize + padding),
          width: enemySize,
          height: enemySize,
          speed: speed,
          image: enemyImage,
          isLoaded: false,
          type: enemyType,
          points: (4 - row % 4) * 10 // Points based on row
        });
        
        enemyImage.onload = () => {
          this.enemies.forEach(enemy => {
            if (enemy.type === enemyType) {
              enemy.isLoaded = true;
            }
          });
        };
      }
    }
  }
  
  createMotherShip() {
    // Calculate mother ship size based on screen size
    const motherShipSize = Math.min(80, Math.max(50, window.innerWidth / 10));
    
    // Determine direction (50% chance for each direction)
    const direction = Math.random() < 0.5 ? 1 : -1; // 1 for right to left, -1 for left to right
    
    // Set starting position based on direction
    const startX = direction === 1 ? -motherShipSize : this.canvas.width;
    
    this.motherShip = {
      x: startX,
      y: this.uiHeight + 20, // Position just below the UI area
      width: motherShipSize,
      height: motherShipSize / 2, // Maintain aspect ratio
      speed: this.motherShipSpeed * direction,
      image: this.motherShipImage,
      isLoaded: this.motherShipImageLoaded,
      points: this.motherShipPoints
    };
    
    // Play mother ship sound
    if (this.audioManager) {
      this.audioManager.playSound('enemyShoot'); // Reuse existing sound for now
    }
  }
  
  createBarriers() {
    this.barriers = [];
    
    // Calculate barrier size based on screen size
    const screenWidth = this.canvas.width;
    const screenHeight = this.canvas.height;
    
    // Responsive barrier sizing
    const barrierSize = Math.min(60, Math.max(30, screenWidth / 10));
    
    // Calculate the available width for barriers (80% of screen width)
    const availableWidth = screenWidth * 0.8;
    
    // Calculate spacing between barriers to distribute them evenly
    // For 4 barriers, we need 3 spaces between them
    const spacing = (availableWidth - (this.barrierCount * barrierSize)) / (this.barrierCount - 1);
    
    // Calculate starting X position to center the barriers
    const startX = (screenWidth - availableWidth) / 2;
    
    // Calculate Y position based on screen height (positioned above player area)
    const y = screenHeight - Math.max(150, screenHeight * 0.25);
    
    const barrierTypes = ['Blue', 'Green', 'Red', 'Yellow'];
    
    for (let i = 0; i < this.barrierCount; i++) {
      const barrierType = barrierTypes[i % barrierTypes.length];
      const barrierImage = new Image();
      barrierImage.src = `https://i.postimg.cc/${barrierType === 'Blue' ? 'MMsG28XW' : barrierType === 'Green' ? 'fSJRMg0Y' : barrierType === 'Red' ? 'XGNvzvjH' : 'DWPZ6GT4'}/ufo${barrierType}.png`;
      
      this.barriers.push({
        x: startX + i * (barrierSize + spacing),
        y: y,
        width: barrierSize,
        height: barrierSize,
        health: 3,
        image: barrierImage,
        isLoaded: false,
        type: barrierType
      });
      
      barrierImage.onload = () => {
        this.barriers.forEach(barrier => {
          if (barrier.type === barrierType) {
            barrier.isLoaded = true;
          }
        });
      };
    }
  }
  
  createStars() {
    this.stars = [];
    const starCount = 100;
    
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 30 + 10,
        brightness: Math.random(),
        twinkleSpeed: Math.random() * 0.05 + 0.01
      });
    }
  }
  
  setControls(controls) {
    this.controls = { ...controls };
  }
  
  fireBullet() {
    // Check if player exists before firing
    if (!this.player) return;
    
    const now = performance.now();
    if (now - this.playerFireTimer > this.playerFireDelay) {
      this.playerFireTimer = now;
      
      this.playerBullets.push({
        x: this.player.x + this.player.width / 2 - 2,
        y: this.player.y,
        width: 4,
        height: 15,
        speed: 500,
        color: '#00ffff'
      });
      
      if (this.audioManager) {
        this.audioManager.playSound('playerShoot');
      }
    }
  }
  
  enemyFireBullet(enemy) {
    this.enemyBullets.push({
      x: enemy.x + enemy.width / 2 - 2,
      y: enemy.y + enemy.height,
      width: 4,
      height: 15,
      speed: 300,
      color: '#ff00ff'
    });
    
    if (this.audioManager) {
      this.audioManager.playSound('enemyShoot');
    }
  }
  
  update(deltaTime) {
    if (this.paused || this.gameOver || this.victory) return;
    
    // Update stars
    this.updateStars(deltaTime);
    
    // Update player
    this.updatePlayer(deltaTime);
    
    // Update enemies
    this.updateEnemies(deltaTime);
    
    // Update mother ship
    this.updateMotherShip(deltaTime);
    
    // Update bullets
    this.updateBullets(deltaTime);
    
    // Check collisions
    this.checkCollisions();
    
    // Update particles
    this.explosionParticles.update(deltaTime);
    
    // Check level completion
    this.checkLevelCompletion();
  }
  
  updateStars(deltaTime) {
    if (!this.stars) return;
    
    for (let star of this.stars) {
      // Move stars down
      star.y += star.speed * deltaTime / 1000;
      
      // Twinkle effect
      star.brightness += star.twinkleSpeed;
      if (star.brightness > 1) {
        star.brightness = 1;
        star.twinkleSpeed = -star.twinkleSpeed;
      } else if (star.brightness < 0.2) {
        star.brightness = 0.2;
        star.twinkleSpeed = -star.twinkleSpeed;
      }
      
      // Reset stars that go off screen
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }
    }
  }
  
  updatePlayer(deltaTime) {
    // Check if player exists before updating
    if (!this.player) return;
    
    // Move player based on controls
    if (this.controls.left) {
      this.player.x -= this.player.speed * deltaTime / 1000;
    }
    if (this.controls.right) {
      this.player.x += this.player.speed * deltaTime / 1000;
    }
    
    // Keep player within bounds
    if (this.player.x < 0) {
      this.player.x = 0;
    } else if (this.player.x > this.canvas.width - this.player.width) {
      this.player.x = this.canvas.width - this.player.width;
    }
    
    // Fire bullet if control is active
    if (this.controls.fire) {
      this.fireBullet();
    }
  }
  
  updateEnemies(deltaTime) {
    // Check if enemies array exists
    if (!this.enemies || this.enemies.length === 0) return;
    
    // Update enemy movement timer
    this.enemyMoveTimer += deltaTime;
    
    if (this.enemyMoveTimer >= this.enemyMoveInterval) {
      this.enemyMoveTimer = 0;
      
      // Check if any enemy would hit the edge
      let hitEdge = false;
      for (let enemy of this.enemies) {
        if ((this.enemyDirection > 0 && enemy.x + enemy.width + this.enemyStepSize > this.canvas.width) ||
            (this.enemyDirection < 0 && enemy.x - this.enemyStepSize < 0)) {
          hitEdge = true;
          break;
        }
      }
      
      // Move enemies
      for (let enemy of this.enemies) {
        if (hitEdge) {
          // Move down and change direction when hitting edge
          enemy.y += this.enemyDropAmount;
          // Direction will be changed after the loop
        } else {
          // Move horizontally
          enemy.x += this.enemyDirection * this.enemyStepSize;
        }
      }
      
      // Change direction if hit edge
      if (hitEdge) {
        this.enemyDirection *= -1;
        
        // Increase speed slightly when changing direction
        this.enemyMoveInterval = Math.max(100, this.enemyMoveInterval * 0.9); // Increased speed gain from 0.95 to 0.9
      }
    }
    
    // Enemy shooting - significantly increased fire rate
    for (let enemy of this.enemies) {
      if (Math.random() < this.enemyFireRate * (deltaTime / 1000) * (this.level * 0.5)) {
        this.enemyFireBullet(enemy);
      }
    }
    
    // Check if enemies reached the bottom
    if (this.player) {
      for (let enemy of this.enemies) {
        if (enemy.y + enemy.height > this.player.y) {
          this.endGame();
          return;
        }
      }
    }
  }
  
  updateMotherShip(deltaTime) {
    // Update mother ship timer
    this.motherShipTimer += deltaTime;
    
    // Create a new mother ship if timer exceeds interval and no mother ship exists
    if (this.motherShipTimer >= this.motherShipInterval && !this.motherShip) {
      this.createMotherShip();
      this.motherShipTimer = 0;
    }
    
    // Update mother ship position if it exists
    if (this.motherShip) {
      this.motherShip.x += this.motherShip.speed * deltaTime / 1000;
      
      // Remove mother ship if it goes off screen
      if ((this.motherShip.speed > 0 && this.motherShip.x > this.canvas.width) || 
          (this.motherShip.speed < 0 && this.motherShip.x + this.motherShip.width < 0)) {
        this.motherShip = null;
      }
    }
  }
  
  updateBullets(deltaTime) {
    // Update player bullets
    if (!this.playerBullets) return;
    
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.y -= bullet.speed * deltaTime / 1000;
      
      // Remove bullets that go off screen or hit the UI area
      if (bullet.y + bullet.height < this.uiHeight || bullet.y + bullet.height < 0) {
        this.playerBullets.splice(i, 1);
      }
    }
    
    // Update enemy bullets
    if (!this.enemyBullets) return;
    
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.y += bullet.speed * deltaTime / 1000;
      
      // Remove bullets that go off screen
      if (bullet.y > this.canvas.height) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }
  
  checkCollisions() {
    // Check if necessary arrays exist
    if (!this.playerBullets || !this.enemies || !this.barriers || !this.enemyBullets) return;
    
    // Player bullets vs enemies
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        
        if (this.checkCollision(bullet, enemy)) {
          // Create explosion
          this.explosionParticles.createExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            this.getColorFromEnemyType(enemy.type),
            30
          );
          
          // Remove bullet and enemy
          this.playerBullets.splice(i, 1);
          this.enemies.splice(j, 1);
          
          // Add score
          this.score += enemy.points;
          this.updateUICallback({
            score: this.score,
            level: this.level,
            lives: this.lives
          });
          
          // Play sound
          if (this.audioManager) {
            this.audioManager.playSound('enemyExplode');
          }
          
          break;
        }
      }
    }
    
    // Player bullets vs mother ship
    if (this.motherShip) {
      for (let i = this.playerBullets.length - 1; i >= 0; i--) {
        const bullet = this.playerBullets[i];
        
        if (this.checkCollision(bullet, this.motherShip)) {
          // Create large explosion
          this.explosionParticles.createExplosion(
            this.motherShip.x + this.motherShip.width / 2,
            this.motherShip.y + this.motherShip.height / 2,
            '#ff0000', // Red explosion for mother ship
            50 // Larger explosion
          );
          
          // Remove bullet and mother ship
          this.playerBullets.splice(i, 1);
          this.motherShip = null;
          
          // Add score
          this.score += this.motherShipPoints;
          this.updateUICallback({
            score: this.score,
            level: this.level,
            lives: this.lives
          });
          
          // Play special sound
          if (this.audioManager) {
            this.audioManager.playSound('enemyExplode');
          }
          
          break;
        }
      }
    }
    
    // Player bullets vs barriers
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      
      for (let barrier of this.barriers) {
        if (this.checkCollision(bullet, barrier)) {
          // Remove bullet
          this.playerBullets.splice(i, 1);
          break;
        }
      }
    }
    
    // Enemy bullets vs player
    if (this.player) {
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = this.enemyBullets[i];
        
        if (this.checkCollision(bullet, this.player)) {
          // Create explosion
          this.explosionParticles.createExplosion(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            '#00ffff',
            50
          );
          
          // Remove bullet
          this.enemyBullets.splice(i, 1);
          
          // Decrease lives
          this.lives--;
          this.updateUICallback({
            score: this.score,
            level: this.level,
            lives: this.lives
          });
          
          // Play sound
          if (this.audioManager) {
            this.audioManager.playSound('playerExplode');
          }
          
          // Check game over
          if (this.lives <= 0) {
            this.endGame();
            return;
          }
          
          break;
        }
      }
    }
    
    // Enemy bullets vs barriers
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      
      for (let j = this.barriers.length - 1; j >= 0; j--) {
        const barrier = this.barriers[j];
        
        if (this.checkCollision(bullet, barrier)) {
          // Remove bullet
          this.enemyBullets.splice(i, 1);
          
          // Decrease barrier health
          barrier.health--;
          
          // Create small explosion
          this.explosionParticles.createExplosion(
            bullet.x,
            bullet.y,
            this.getColorFromBarrierType(barrier.type),
            10
          );
          
          // Remove barrier if health is depleted
          if (barrier.health <= 0) {
            this.barriers.splice(j, 1);
            if (this.audioManager) {
              this.audioManager.playSound('barrierDestroy');
            }
          } else {
            if (this.audioManager) {
              this.audioManager.playSound('barrierHit');
            }
          }
          
          break;
        }
      }
    }
  }
  
  checkCollision(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }
  
  getColorFromEnemyType(type) {
    switch (type) {
      case 'Red': return '#ff0000';
      case 'Blue': return '#0000ff';
      case 'Green': return '#00ff00';
      case 'Black': return '#ff00ff';
      default: return '#ffffff';
    }
  }
  
  getColorFromBarrierType(type) {
    switch (type) {
      case 'Blue': return '#0088ff';
      case 'Green': return '#00ff88';
      case 'Red': return '#ff0088';
      case 'Yellow': return '#ffff00';
      default: return '#ffffff';
    }
  }
  
  checkLevelCompletion() {
    if (this.enemies && this.enemies.length === 0) {
      if (this.level >= this.maxLevel) {
        this.completeGame();
      } else {
        this.nextLevel();
      }
    }
  }
  
  nextLevel() {
    this.level++;
    this.updateUICallback({
      score: this.score,
      level: this.level,
      lives: this.lives
    });
    
    // Clear bullets
    this.playerBullets = [];
    this.enemyBullets = [];
    
    // Create new enemies
    this.createEnemies();
    
    // Create new barriers
    this.createBarriers();
    
    // Reset enemy movement parameters for new level
    this.enemyDirection = 1;
    this.enemyMoveTimer = 0;
    this.enemyMoveInterval = Math.max(300, 400 - (this.level - 1) * 70); // Increased speed for higher levels
    
    // Play level up sound
    if (this.audioManager) {
      this.audioManager.playSound('levelUp');
    }
  }
  
  completeGame() {
    this.victory = true;
    
    // Set game over state in audio manager
    if (this.audioManager) {
      this.audioManager.setGameOver(true);
      this.audioManager.playSound('victory');
    }
    
    // Cancel animation frame to stop the game loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.victoryCallback(this.score);
  }
  
  endGame() {
    this.gameOver = true;
    
    // Set game over state in audio manager
    if (this.audioManager) {
      this.audioManager.setGameOver(true);
      this.audioManager.playSound('gameOver');
    }
    
    // Cancel animation frame to stop the game loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.gameOverCallback(this.score);
  }
  
  draw() {
    // Check if game has been destroyed
    if (!this.canvas || !this.ctx) return;
    
    // Clear canvas
    this.ctx.fillStyle = '#000033';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background image if loaded
    if (this.backgroundImageLoaded) {
      // Draw the background with a pattern to cover the entire canvas
      const pattern = this.ctx.createPattern(this.backgroundImage, 'repeat');
      this.ctx.fillStyle = pattern;
      this.ctx.globalAlpha = 0.3; // Make it semi-transparent
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.globalAlpha = 1.0; // Reset alpha
    }
    
    // Draw stars
    this.drawStars();
    
    // Draw barriers
    this.drawBarriers();
    
    // Draw player
    this.drawPlayer();
    
    // Draw enemies
    this.drawEnemies();
    
    // Draw mother ship
    this.drawMotherShip();
    
    // Draw bullets
    this.drawBullets();
    
    // Draw particles
    this.explosionParticles.draw(this.ctx);
  }
  
  drawStars() {
    if (!this.stars) return;
    
    for (let star of this.stars) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  drawPlayer() {
    // Check if player exists before trying to draw
    if (!this.player) return;
    
    if (this.player.isLoaded) {
      this.ctx.drawImage(
        this.player.image,
        this.player.x,
        this.player.y,
        this.player.width,
        this.player.height
      );
    } else {
      // Fallback if image not loaded
      this.ctx.fillStyle = '#00ffff';
      this.ctx.fillRect(
        this.player.x,
        this.player.y,
        this.player.width,
        this.player.height
      );
    }
  }
  
  drawEnemies() {
    if (!this.enemies) return;
    
    for (let enemy of this.enemies) {
      if (enemy.isLoaded) {
        this.ctx.drawImage(
          enemy.image,
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height
        );
      } else {
        // Fallback if image not loaded
        this.ctx.fillStyle = this.getColorFromEnemyType(enemy.type);
        this.ctx.fillRect(
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height
        );
      }
    }
  }
  
  drawMotherShip() {
    if (!this.motherShip) return;
    
    if (this.motherShip.isLoaded) {
      this.ctx.drawImage(
        this.motherShip.image,
        this.motherShip.x,
        this.motherShip.y,
        this.motherShip.width,
        this.motherShip.height
      );
    } else {
      // Fallback if image not loaded
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(
        this.motherShip.x,
        this.motherShip.y,
        this.motherShip.width,
        this.motherShip.height
      );
    }
  }
  
  drawBarriers() {
    if (!this.barriers) return;
    
    for (let barrier of this.barriers) {
      if (barrier.isLoaded) {
        // Apply opacity based on health
        this.ctx.globalAlpha = barrier.health / 3;
        this.ctx.drawImage(
          barrier.image,
          barrier.x,
          barrier.y,
          barrier.width,
          barrier.height
        );
        this.ctx.globalAlpha = 1;
      } else {
        // Fallback if image not loaded
        this.ctx.fillStyle = this.getColorFromBarrierType(barrier.type);
        this.ctx.globalAlpha = barrier.health / 3;
        this.ctx.fillRect(
          barrier.x,
          barrier.y,
          barrier.width,
          barrier.height
        );
        this.ctx.globalAlpha = 1;
      }
    }
  }
  
  drawBullets() {
    // Draw player bullets
    if (this.playerBullets) {
      this.ctx.fillStyle = '#00ffff';
      for (let bullet of this.playerBullets) {
        this.ctx.fillRect(
          bullet.x,
          bullet.y,
          bullet.width,
          bullet.height
        );
      }
    }
    
    // Draw enemy bullets
    if (this.enemyBullets) {
      this.ctx.fillStyle = '#ff00ff';
      for (let bullet of this.enemyBullets) {
        this.ctx.fillRect(
          bullet.x,
          bullet.y,
          bullet.width,
          bullet.height
        );
      }
    }
  }
  
  gameLoop(timestamp) {
    // Check if game has been destroyed or is over
    if (this.gameOver || this.victory || !this.canvas) {
      return;
    }
    
    // Calculate delta time
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    // Update and draw
    this.update(deltaTime);
    this.draw();
    
    // Continue loop if game is not over
    if (!this.gameOver && !this.victory) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
  }
  
  pause() {
    this.paused = true;
    if (this.audioManager) {
      try {
        this.audioManager.pauseMusic();
      } catch (error) {
        console.error("Error pausing music:", error);
      }
    }
    
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  resume() {
    this.paused = false;
    this.lastTime = performance.now();
    if (this.audioManager) {
      try {
        this.audioManager.resumeMusic();
      } catch (error) {
        console.error("Error resuming music:", error);
      }
    }
    
    // Restart game loop
    if (!this.animationFrameId) {
      this.gameLoop(this.lastTime);
    }
  }
  
  destroy() {
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Clear game objects
    this.player = null;
    this.playerBullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.barriers = [];
    this.stars = [];
    this.motherShip = null;
    
    // Reset game state
    this.gameOver = false;
    this.paused = false;
    this.victory = false;
  }
}
