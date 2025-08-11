// Simple Sound Manager Fix - Replace the broken SoundManager with this clean version

// Simple Sound Manager for OGG files
const SimpleSoundManager = {
  enabled: false,
  hasUserInteracted: false,
  sounds: {},
  
  init() {
    // Load sound preference
    const saved = localStorage.getItem('acnh_sound_enabled');
    this.enabled = saved === 'true';
    
    // Initialize audio elements
    const soundIds = ['correct', 'game-over', 'start-game', 'high-score', 'toggle-on', 'toggle-off'];
    soundIds.forEach(id => {
      const audio = document.getElementById(`${id}-sound`);
      if (audio) {
        this.sounds[id] = audio;
      }
    });
    
    console.log('SimpleSoundManager initialized with OGG files');
    return this;
  },
  
  play(soundId) {
    if (!this.enabled || !this.hasUserInteracted) return Promise.resolve(false);
    
    const sound = this.sounds[soundId];
    if (!sound) return Promise.resolve(false);
    
    try {
      sound.currentTime = 0;
      sound.volume = 0.5;
      const promise = sound.play();
      return promise || Promise.resolve(true);
    } catch (error) {
      console.error('Sound play error:', error);
      return Promise.resolve(false);
    }
  },
  
  toggle(event) {
    if (event) event.preventDefault();
    this.hasUserInteracted = true;
    this.enabled = !this.enabled;
    localStorage.setItem('acnh_sound_enabled', this.enabled.toString());
    
    // Update UI
    const toggle = document.getElementById('sound-toggle');
    if (toggle) {
      let icon = toggle.querySelector('span');
      if (!icon) {
        icon = document.createElement('span');
        toggle.appendChild(icon);
      }
      icon.textContent = this.enabled ? '🔊' : '🔇';
    }
    
    // Update mobile toggle
    const mobileToggle = document.getElementById('sound-toggle-mobile');
    if (mobileToggle) {
      const img = mobileToggle.querySelector('img');
      if (img) {
        img.src = this.enabled ? 'images/speaker.png' : 'images/speaker-mute.png';
      }
    }
    
    // Play toggle sound
    this.play(this.enabled ? 'toggle-on' : 'toggle-off');
  }
};

// Simple sound function for backward compatibility
function playSound(soundId) {
  const cleanId = soundId.replace('-sound', '');
  SimpleSoundManager.play(cleanId);
}

// Toggle function
function toggleSound(event) {
  SimpleSoundManager.toggle(event);
}

// Initialize
const soundManager = SimpleSoundManager.init();
