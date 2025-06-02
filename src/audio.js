export class AudioManager {
  constructor() {
    this.sounds = {
      button: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-interface-click-1126.mp3'),
      select: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3'),
      playerShoot: new Audio('https://kcecameras.com/sounds/player-space-gun.mp3'), // Updated player firing gun
      enemyShoot: new Audio('https://kcecameras.com/sounds/enemy-space-gun.mp3'), // Updated enemy gun fire
      playerExplode: new Audio('https://kcecameras.com/sounds/player-ship-exploding.mp3'), // Updated player explosion
      enemyExplode: new Audio('https://kcecameras.com/sounds/enemy-ship-exploding.mp3'), // Updated enemy explosion
      barrierHit: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-ball-tap-2073.mp3'),
      barrierDestroy: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-explosion-impact-1702.mp3'),
      levelUp: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-bonus-229.mp3'),
      gameOver: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3'),
      victory: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
      menuClick: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-interface-click-1126.mp3')
    };
    
    // Updated game music URL
    this.music = new Audio('https://kcecameras.com/sounds/space-music-ambient.mp3'); 
    this.music.loop = true;
    this.music.volume = 0.5;
    
    // Reduce volume for certain sounds
    this.sounds.playerShoot.volume = 0.3;
    this.sounds.enemyShoot.volume = 0.1; // Reduced to half (from 0.2 to 0.1)
    this.sounds.barrierHit.volume = 0.3;
    
    // Game state tracking
    this.isGameOver = false;
  }
  
  preloadSounds() {
    // Preload all sounds
    for (let key in this.sounds) {
      const sound = this.sounds[key];
      sound.load();
      
      // Fix for mobile: play and immediately pause to enable audio
      sound.play().catch(e => {
        // Ignore errors - this is just for preloading
      }).finally(() => {
        sound.pause();
        sound.currentTime = 0;
      });
    }
    
    // Preload music
    this.music.load();
    this.music.play().catch(e => {
      // Ignore errors - this is just for preloading
    }).finally(() => {
      this.music.pause();
      this.music.currentTime = 0;
    });
  }
  
  playSound(name) {
    try {
      // Skip gameplay sounds if game is over (except for UI sounds and game over/victory sounds)
      if (this.isGameOver && 
          (name === 'playerShoot' || 
           name === 'enemyShoot' || 
           name === 'playerExplode' || 
           name === 'enemyExplode' ||
           name === 'barrierHit' ||
           name === 'barrierDestroy')) {
        return;
      }
      
      // Create a new audio instance to allow overlapping sounds
      const sound = this.sounds[name];
      if (sound) {
        // Clone the audio for overlapping sounds
        const soundClone = sound.cloneNode();
        
        // Play with error handling for mobile
        soundClone.play().catch(error => {
          console.log(`Error playing sound ${name}:`, error);
        });
      }
    } catch (error) {
      console.error(`Error in playSound(${name}):`, error);
    }
  }
  
  playMusic() {
    try {
      // Play background music with error handling
      this.music.currentTime = 0;
      const playPromise = this.music.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Error playing music:", error);
        });
      }
    } catch (error) {
      console.error("Error in playMusic():", error);
    }
  }
  
  pauseMusic() {
    try {
      if (!this.music.paused) {
        this.music.pause();
      }
    } catch (error) {
      console.error("Error in pauseMusic():", error);
    }
  }
  
  resumeMusic() {
    try {
      if (this.music.paused) {
        const playPromise = this.music.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Error resuming music:", error);
          });
        }
      }
    } catch (error) {
      console.error("Error in resumeMusic():", error);
    }
  }
  
  stopMusic() {
    try {
      this.music.pause();
      this.music.currentTime = 0;
    } catch (error) {
      console.error("Error in stopMusic():", error);
    }
  }
  
  setGameOver(isOver) {
    this.isGameOver = isOver;
  }
}
