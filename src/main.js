// Import modules
import { Game } from './game.js';
import { AudioManager } from './audio.js';
import { DatabaseManager } from './database.js';

// DOM Elements
const launchScreen = document.getElementById('launch-screen');
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const continueBtn = document.getElementById('continue-btn');
const startGameBtn = document.getElementById('start-game-btn');
const playerNameInput = document.getElementById('player-name');
const shipOptions = document.querySelectorAll('.ship-option');
const pauseBtn = document.getElementById('pause-btn');
const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const gameOverScreen = document.getElementById('game-over');
const tryAgainBtn = document.getElementById('try-again-btn');
const gameOverMenuBtn = document.getElementById('game-over-menu-btn');
const victoryScreen = document.getElementById('victory-screen');
const playAgainBtn = document.getElementById('play-again-btn');
const victoryMenuBtn = document.getElementById('victory-menu-btn');
const finalScoreDisplay = document.getElementById('final-score');
const victoryScoreDisplay = document.getElementById('victory-score');
const playerDisplay = document.getElementById('player-display');
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const livesContainer = document.getElementById('lives-container');
const canvas = document.getElementById('game-canvas');
const highScoreDisplay = document.getElementById('high-score-display');
const highScoreNameDisplay = document.getElementById('high-score-name');
const highScoresList = document.getElementById('high-scores-list');
const soundToggleBtn = document.getElementById('sound-toggle');

// Mobile control elements
const moveLeftBtn = document.getElementById('move-left');
const moveRightBtn = document.getElementById('move-right');
const fireBtn = document.getElementById('fire-btn');

// Game variables
let game = null;
let audioManager = null;
let dbManager = null;
let selectedShip = 1;
let playerName = 'Space Defender';
let isMobileDevice = false;
let highScore = 0;
let highScoreName = '';
let previousHighScores = [];
let soundEnabled = true;

// Maximum number of high scores to display
const MAX_HIGH_SCORES = 3;

// Check if device is mobile
function checkMobile() {
  isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  
  // Show mobile controls if on mobile device
  document.querySelector('.mobile-controls').style.display = isMobileDevice ? 'block' : 'none';
}

// Load high scores from local storage and Supabase
async function loadHighScores() {
  // Load current high score from local storage first
  const savedHighScore = localStorage.getItem('spaceAttackersHighScore');
  const savedHighScoreName = localStorage.getItem('spaceAttackersHighScoreName');
  
  if (savedHighScore) {
    highScore = parseInt(savedHighScore);
  }
  
  if (savedHighScoreName) {
    highScoreName = savedHighScoreName;
  }
  
  // Load previous high scores from local storage
  const savedPreviousScores = localStorage.getItem('spaceAttackersPreviousScores');
  
  if (savedPreviousScores) {
    previousHighScores = JSON.parse(savedPreviousScores);
  }
  
  // Load sound preference
  const savedSoundPreference = localStorage.getItem('spaceAttackersSoundEnabled');
  if (savedSoundPreference !== null) {
    soundEnabled = savedSoundPreference === 'true';
    updateSoundToggleButton();
  }
  
  // Try to load high scores from Supabase
  if (dbManager) {
    try {
      const onlineScores = await dbManager.getTopHighScores(MAX_HIGH_SCORES + 1);
      
      if (onlineScores && onlineScores.length > 0) {
        // Update the current high score if the top online score is higher
        if (onlineScores[0].score > highScore) {
          highScore = onlineScores[0].score;
          highScoreName = onlineScores[0].player_name;
          
          // Also update local storage
          localStorage.setItem('spaceAttackersHighScore', highScore);
          localStorage.setItem('spaceAttackersHighScoreName', highScoreName);
        }
        
        // Update previous high scores list with online scores (excluding the top one)
        previousHighScores = onlineScores.slice(1, MAX_HIGH_SCORES + 1).map(score => ({
          score: score.score,
          name: score.player_name,
          date: new Date(score.date).toLocaleDateString()
        }));
        
        // Update local storage with these scores
        localStorage.setItem('spaceAttackersPreviousScores', JSON.stringify(previousHighScores));
      }
    } catch (error) {
      console.error('Error loading high scores from database:', error);
    }
  }
  
  updateHighScoreDisplay();
  updatePreviousScoresDisplay();
}

// Save high score to local storage and Supabase
async function saveHighScore(score, name) {
  let isNewHighScore = false;
  
  // Check if this is a new high score
  if (score > highScore) {
    // If there was a previous high score, add it to the previous scores list
    if (highScore > 0) {
      addToPreviousScores(highScore, highScoreName);
    }
    
    // Update the current high score
    highScore = score;
    highScoreName = name;
    
    localStorage.setItem('spaceAttackersHighScore', highScore);
    localStorage.setItem('spaceAttackersHighScoreName', highScoreName);
    
    isNewHighScore = true;
  } else if (score > 0) {
    // If not a high score but still a positive score, add to previous scores
    addToPreviousScores(score, name);
  }
  
  // Save to Supabase if score is positive
  if (score > 0 && dbManager) {
    try {
      await dbManager.saveHighScore(name, score);
      console.log('Score saved to database:', score, name);
      
      // Refresh high scores from database
      await loadHighScores();
    } catch (error) {
      console.error('Error saving high score to database:', error);
      
      // Update displays with local data as fallback
      updateHighScoreDisplay();
      updatePreviousScoresDisplay();
    }
  } else {
    // Update displays with local data
    updateHighScoreDisplay();
    updatePreviousScoresDisplay();
  }
  
  return isNewHighScore;
}

// Add a score to the previous high scores list
function addToPreviousScores(score, name) {
  // Create a new score entry
  const newScore = {
    score: score,
    name: name,
    date: new Date().toLocaleDateString()
  };
  
  // Add to the list
  previousHighScores.push(newScore);
  
  // Sort by score (highest first)
  previousHighScores.sort((a, b) => b.score - a.score);
  
  // Keep only the top scores
  if (previousHighScores.length > MAX_HIGH_SCORES) {
    previousHighScores = previousHighScores.slice(0, MAX_HIGH_SCORES);
  }
  
  // Save to local storage
  localStorage.setItem('spaceAttackersPreviousScores', JSON.stringify(previousHighScores));
}

// Update high score display
function updateHighScoreDisplay() {
  if (highScoreDisplay && highScoreNameDisplay) {
    highScoreDisplay.textContent = highScore;
    highScoreNameDisplay.textContent = highScoreName || 'Nobody';
  }
}

// Update previous scores display
function updatePreviousScoresDisplay() {
  if (highScoresList) {
    // Clear the list
    highScoresList.innerHTML = '';
    
    // If no previous scores, show a message
    if (previousHighScores.length === 0) {
      const noScoresItem = document.createElement('li');
      noScoresItem.textContent = 'No previous scores yet';
      noScoresItem.classList.add('no-scores');
      highScoresList.appendChild(noScoresItem);
      return;
    }
    
    // Add each score to the list
    previousHighScores.forEach((scoreData, index) => {
      const scoreItem = document.createElement('li');
      scoreItem.classList.add('score-item');
      
      const rankSpan = document.createElement('span');
      rankSpan.classList.add('rank');
      rankSpan.textContent = `${index + 1}.`;
      
      const nameSpan = document.createElement('span');
      nameSpan.classList.add('name');
      nameSpan.textContent = scoreData.name;
      
      const scoreSpan = document.createElement('span');
      scoreSpan.classList.add('score');
      scoreSpan.textContent = `${scoreData.score} pts`;
      
      const dateSpan = document.createElement('span');
      dateSpan.classList.add('date');
      dateSpan.textContent = scoreData.date;
      
      scoreItem.appendChild(rankSpan);
      scoreItem.appendChild(nameSpan);
      scoreItem.appendChild(scoreSpan);
      scoreItem.appendChild(dateSpan);
      
      highScoresList.appendChild(scoreItem);
    });
  }
}

// Toggle sound on/off
function toggleSound() {
  soundEnabled = !soundEnabled;
  
  // Save preference to local storage
  localStorage.setItem('spaceAttackersSoundEnabled', soundEnabled);
  
  // Update button appearance
  updateSoundToggleButton();
  
  // Apply sound settings
  if (audioManager) {
    if (soundEnabled) {
      if (game && !game.paused && !game.gameOver && !game.victory) {
        audioManager.resumeMusic();
      }
    } else {
      audioManager.pauseMusic();
    }
  }
}

// Update sound toggle button appearance
function updateSoundToggleButton() {
  if (soundToggleBtn) {
    soundToggleBtn.innerHTML = soundEnabled ? 
      '<i class="fas fa-volume-up"></i>' : 
      '<i class="fas fa-volume-mute"></i>';
    
    soundToggleBtn.title = soundEnabled ? 'Mute Sound' : 'Enable Sound';
  }
}

// Enhanced scroll to top function with immediate and forced scrolling
function scrollToTop(immediate = false) {
  // First, try the smooth scroll
  window.scrollTo({
    top: 0,
    behavior: immediate ? 'auto' : 'smooth'
  });
  
  // For mobile devices, add a forced scroll after a short delay
  if (isMobileDevice) {
    setTimeout(() => {
      // Force scroll to top with auto behavior
      window.scrollTo(0, 0);
      
      // Additional fallback for iOS
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, immediate ? 0 : 100);
  }
}

// Initialize the game
async function init() {
  // Check if mobile device
  checkMobile();
  
  // Create database manager
  dbManager = new DatabaseManager();
  
  // Load high scores from local storage and Supabase
  await loadHighScores();
  
  // Show launch screen
  launchScreen.classList.add('active');
  
  // Create audio manager
  audioManager = new AudioManager();
  
  // Preload sounds
  audioManager.preloadSounds();
  
  // Set up event listeners
  setupEventListeners();
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
  
  // Initial UI setup
  updateLivesDisplay(3);
  
  // Add sound toggle button if it doesn't exist
  if (!soundToggleBtn && document.querySelector('.game-controls')) {
    const soundBtn = document.createElement('button');
    soundBtn.id = 'sound-toggle';
    soundBtn.className = 'control-btn';
    soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    soundBtn.title = 'Toggle Sound';
    soundBtn.addEventListener('click', toggleSound);
    
    document.querySelector('.game-controls').appendChild(soundBtn);
    updateSoundToggleButton();
  }
  
  // Force initial scroll to top
  scrollToTop(true);
}

// Set up event listeners
function setupEventListeners() {
  // Launch screen to main menu
  continueBtn.addEventListener('click', () => {
    launchScreen.classList.remove('active');
    mainMenu.classList.add('active');
    // Force immediate scroll to top when showing main menu
    scrollToTop(true);
    if (soundEnabled && audioManager) {
      audioManager.playSound('menuClick');
    }
  });
  
  // Ship selection
  shipOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove selected class from all options
      shipOptions.forEach(opt => opt.classList.remove('selected'));
      
      // Add selected class to clicked option
      option.classList.add('selected');
      
      // Update selected ship
      selectedShip = parseInt(option.dataset.ship);
      
      if (soundEnabled && audioManager) {
        audioManager.playSound('select');
      }
    });
  });
  
  // Start game button
  startGameBtn.addEventListener('click', startGame);
  
  // Pause button
  pauseBtn.addEventListener('click', () => {
    if (game) {
      game.pause();
      pauseMenu.classList.add('active');
      if (soundEnabled && audioManager) {
        audioManager.playSound('button');
      }
    }
  });
  
  // Resume button
  resumeBtn.addEventListener('click', () => {
    pauseMenu.classList.remove('active');
    if (game) {
      game.resume();
      if (soundEnabled && audioManager) {
        audioManager.playSound('button');
      }
    }
  });
  
  // Restart button
  restartBtn.addEventListener('click', () => {
    pauseMenu.classList.remove('active');
    if (game) {
      game.destroy();
    }
    startGame();
    if (soundEnabled && audioManager) {
      audioManager.playSound('button');
    }
  });
  
  // Menu button (from pause)
  menuBtn.addEventListener('click', () => {
    pauseMenu.classList.remove('active');
    if (game) {
      game.destroy();
    }
    gameScreen.classList.remove('active');
    mainMenu.classList.add('active');
    // Force immediate scroll to top when showing main menu
    scrollToTop(true);
    if (soundEnabled && audioManager) {
      audioManager.playSound('button');
      audioManager.stopMusic();
    }
  });
  
  // Try again button (from game over)
  tryAgainBtn.addEventListener('click', () => {
    gameOverScreen.classList.remove('active');
    startGame();
    if (soundEnabled && audioManager) {
      audioManager.playSound('button');
    }
  });
  
  // Menu button (from game over)
  gameOverMenuBtn.addEventListener('click', () => {
    gameOverScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    mainMenu.classList.add('active');
    // Force immediate scroll to top when showing main menu
    scrollToTop(true);
    if (soundEnabled && audioManager) {
      audioManager.playSound('button');
    }
  });
  
  // Play again button (from victory)
  playAgainBtn.addEventListener('click', () => {
    victoryScreen.classList.remove('active');
    startGame();
    if (soundEnabled && audioManager) {
      audioManager.playSound('button');
    }
  });
  
  // Menu button (from victory)
  victoryMenuBtn.addEventListener('click', () => {
    victoryScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    mainMenu.classList.add('active');
    // Force immediate scroll to top when showing main menu
    scrollToTop(true);
    if (soundEnabled && audioManager) {
      audioManager.playSound('button');
    }
  });
  
  // Sound toggle button
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', toggleSound);
  }
  
  // Keyboard controls
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  // Mobile controls
  if (isMobileDevice) {
    setupMobileControls();
  }
}

// Set up mobile touch controls
function setupMobileControls() {
  // Left button
  moveLeftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (game) {
      game.setControls({ ...game.controls, left: true });
    }
  });
  
  moveLeftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (game) {
      game.setControls({ ...game.controls, left: false });
    }
  });
  
  // Right button
  moveRightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (game) {
      game.setControls({ ...game.controls, right: true });
    }
  });
  
  moveRightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (game) {
      game.setControls({ ...game.controls, right: false });
    }
  });
  
  // Fire button
  fireBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (game) {
      game.setControls({ ...game.controls, fire: true });
    }
  });
  
  fireBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (game) {
      game.setControls({ ...game.controls, fire: false });
    }
  });
}

// Handle keyboard input
function handleKeyDown(e) {
  if (!game || game.paused || game.gameOver || game.victory) return;
  
  switch (e.key) {
    case 'ArrowLeft':
      game.setControls({ ...game.controls, left: true });
      break;
    case 'ArrowRight':
      game.setControls({ ...game.controls, right: true });
      break;
    case ' ':
      game.setControls({ ...game.controls, fire: true });
      break;
    case 'Escape':
      game.pause();
      pauseMenu.classList.add('active');
      break;
    case 'm': // Toggle sound with 'm' key
      toggleSound();
      break;
  }
}

function handleKeyUp(e) {
  if (!game) return;
  
  switch (e.key) {
    case 'ArrowLeft':
      game.setControls({ ...game.controls, left: false });
      break;
    case 'ArrowRight':
      game.setControls({ ...game.controls, right: false });
      break;
    case ' ':
      game.setControls({ ...game.controls, fire: false });
      break;
  }
}

// Handle window resize
function handleResize() {
  checkMobile();
  
  if (game) {
    game.handleResize();
  }
  
  // Show/hide mobile controls based on screen size
  document.querySelector('.mobile-controls').style.display = isMobileDevice ? 'block' : 'none';
}

// Start the game
function startGame() {
  // Get player name
  playerName = playerNameInput.value.trim() || 'Space Defender';
  
  // Hide main menu, show game screen
  mainMenu.classList.remove('active');
  gameScreen.classList.add('active');
  scrollToTop(true);
  
  // Update player display
  playerDisplay.textContent = playerName;
  
  // Create game instance
  game = new Game(
    canvas,
    playerName,
    selectedShip,
    soundEnabled ? audioManager : null, // Only pass audioManager if sound is enabled
    updateGameUI,
    handleGameOver,
    handleVictory
  );
  
  // Start background music if sound is enabled
  if (soundEnabled && audioManager) {
    audioManager.playMusic();
  }
}

// Update game UI
function updateGameUI(data) {
  scoreDisplay.textContent = data.score;
  levelDisplay.textContent = data.level;
  updateLivesDisplay(data.lives);
}

// Update lives display with ship icons
function updateLivesDisplay(lives) {
  // Clear current lives display
  livesContainer.innerHTML = '';
  
  // Add ship icons based on lives
  for (let i = 0; i < lives; i++) {
    const lifeShip = document.createElement('img');
    lifeShip.src = `https://i.postimg.cc/${selectedShip === 1 ? '0rr1QSb5' : selectedShip === 2 ? 'bdMc2vtx' : 'N5Hh8w6W'}/ship${selectedShip}.png`;
    lifeShip.classList.add('life-ship');
    livesContainer.appendChild(lifeShip);
  }
}

// Handle game over
async function handleGameOver(score) {
  // Make sure to destroy the game
  if (game) {
    game.destroy();
    game = null;
  }
  
  finalScoreDisplay.textContent = score;
  gameOverScreen.classList.add('active');
  scrollToTop(true);
  
  // Stop music
  if (audioManager) {
    audioManager.stopMusic();
  }
  
  // Check if this is a new high score
  const isNewHighScore = await saveHighScore(score, playerName);
  
  // If it's a new high score, show a message
  if (isNewHighScore) {
    const newHighScoreMessage = document.createElement('div');
    newHighScoreMessage.textContent = 'NEW HIGH SCORE!';
    newHighScoreMessage.classList.add('new-high-score');
    gameOverScreen.querySelector('.menu-box').insertBefore(
      newHighScoreMessage, 
      gameOverScreen.querySelector('.menu-box').children[2]
    );
  }
}

// Handle victory
async function handleVictory(score) {
  // Make sure to destroy the game
  if (game) {
    game.destroy();
    game = null;
  }
  
  victoryScoreDisplay.textContent = score;
  victoryScreen.classList.add('active');
  scrollToTop(true);
  
  // Stop music
  if (audioManager) {
    audioManager.stopMusic();
  }
  
  // Check if this is a new high score
  const isNewHighScore = await saveHighScore(score, playerName);
  
  // If it's a new high score, show a message
  if (isNewHighScore) {
    const newHighScoreMessage = document.createElement('div');
    newHighScoreMessage.textContent = 'NEW HIGH SCORE!';
    newHighScoreMessage.classList.add('new-high-score');
    victoryScreen.querySelector('.menu-box').insertBefore(
      newHighScoreMessage, 
      victoryScreen.querySelector('.menu-box').children[2]
    );
  }
}

// Initialize the game when the page loads
window.addEventListener('load', init);
