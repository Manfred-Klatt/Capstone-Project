// Clean SoundManager implementation for OGG files
const SoundManager = {
  enabled: false,
  hasUserInteracted: false,
  sounds: {},
  
  // Sound file configurations - optimized OGG files with WAV fallbacks
  soundConfigs: {
    'correct': '/sounds/correct.ogg',
    'game-over': '/sounds/game-over.ogg',
    'start-game': '/sounds/start-game.ogg',
    'high-score': '/sounds/high-score.ogg',
    'toggle-on': '/sounds/toggle-on.ogg',
    'toggle-off': '/sounds/toggle-off.ogg'
  },
  
  // Initialize the sound manager
  init: function() {
    try {
      // Load sound preference from localStorage
      const savedPreference = localStorage.getItem('acnh_sound_enabled');
      if (savedPreference !== null) {
        this.enabled = savedPreference === 'true';
      }
      
      // Initialize audio elements
      this.initAudioElements();
      
      // Update UI
      this.updateToggleUI();
      
      console.log('SoundManager initialized with OGG files:', {
        enabled: this.enabled,
        soundConfigs: this.soundConfigs
      });
      
      return this;
    } catch (error) {
      console.error('Error initializing SoundManager:', error);
      return this;
    }
  },
  
  // Initialize audio elements
  initAudioElements: function() {
    try {
      for (const [soundId, src] of Object.entries(this.soundConfigs)) {
        const audioElement = document.getElementById(`${soundId}-sound`);
        if (audioElement) {
          this.sounds[soundId] = audioElement;
          console.log(`Initialized sound: ${soundId}`);
        } else {
          console.warn(`Audio element not found: ${soundId}-sound`);
        }
      }
    } catch (error) {
      console.error('Error initializing audio elements:', error);
    }
  },
  
  // Play a sound by ID
  play: function(soundId) {
    try {
      // Check if sound is enabled and user has interacted
      if (!this.enabled || !this.hasUserInteracted) {
        const reason = !this.enabled ? 'sound is disabled' : 'no user interaction yet';
        console.log(`Sound playback prevented: ${reason}`);
        return Promise.resolve(false);
      }
      
      // Get the sound element
      const sound = this.sounds[soundId];
      if (!sound) {
        console.error(`Sound not found: ${soundId}. Available sounds:`, Object.keys(this.sounds));
        return Promise.resolve(false);
      }
      
      // Reset and prepare for playback
      sound.currentTime = 0;
      sound.volume = 0.5;
      
      // Try to play the sound
      const playPromise = sound.play();
      
      if (playPromise !== undefined) {
        return playPromise
          .then(() => {
            console.log(`Sound playback started successfully: ${soundId}`);
            return true;
          })
          .catch(error => {
            console.error(`Error playing sound ${soundId}:`, error);
            return false;
          });
      }
      
      // For browsers that don't return a promise
      console.log(`Playback started (legacy browser): ${soundId}`);
      return Promise.resolve(true);
      
    } catch (error) {
      console.error(`Unexpected error playing sound ${soundId}:`, error);
      return Promise.resolve(false);
    }
  },
  
  // Toggle sound on/off
  toggle: function(event) {
    try {
      if (event) event.preventDefault();
      
      // Mark that user has interacted with sound controls
      this.hasUserInteracted = true;
      
      // Toggle the enabled state
      this.enabled = !this.enabled;
      
      // Save preference to localStorage
      localStorage.setItem('acnh_sound_enabled', this.enabled.toString());
      
      // Update the UI
      this.updateToggleUI();
      
      // Play appropriate toggle sound
      const soundToPlay = this.enabled ? 'toggle-on' : 'toggle-off';
      this.play(soundToPlay);
      
      console.log('Sound toggled:', {
        enabled: this.enabled,
        soundPlayed: soundToPlay
      });
      
    } catch (error) {
      console.error('Error in sound toggle:', error);
      this.updateToggleUI();
    }
  },
  
  // Update toggle UI
  updateToggleUI: function() {
    try {
      const soundToggle = document.getElementById('sound-toggle');
      if (soundToggle) {
        let icon = soundToggle.querySelector('img, span');
        if (!icon) {
          icon = document.createElement('span');
          soundToggle.appendChild(icon);
        }
        
        if (icon.tagName === 'SPAN') {
          icon.textContent = this.enabled ? '🔊' : '🔇';
        }
        
        soundToggle.title = this.enabled ? 'Mute sound' : 'Unmute sound';
      }
      
      // Update mobile toggle as well
      const soundToggleMobile = document.getElementById('sound-toggle-mobile');
      if (soundToggleMobile) {
        const img = soundToggleMobile.querySelector('img');
        if (img) {
          img.src = this.enabled ? 'images/speaker.png' : 'images/speaker-mute.png';
          img.alt = this.enabled ? 'Sound On' : 'Sound Off';
        }
      }
      
    } catch (error) {
      console.error('Error updating sound toggle UI:', error);
    }
  }
};
