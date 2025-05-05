/**
 * SoundEffects - A modern utility for managing UI sound effects
 * Handles sound preloading, playing, and managing sound settings
 */

// Import sound assets
import clickSound from '../assets/sounds/click.mp3';
import hoverSound from '../assets/sounds/hover.mp3';
import successSound from '../assets/sounds/success.mp3';
import errorSound from '../assets/sounds/error.mp3';
import notificationSound from '../assets/sounds/notification.mp3';
import switchSound from '../assets/sounds/switch.mp3';

// Sound effect constants
const SOUNDS = {
  CLICK: 'click',
  HOVER: 'hover',
  SUCCESS: 'success',
  ERROR: 'error',
  NOTIFICATION: 'notification',
  SWITCH: 'switch'
};

// Sound file mapping
const SOUND_FILES = {
  [SOUNDS.CLICK]: clickSound,
  [SOUNDS.HOVER]: hoverSound,
  [SOUNDS.SUCCESS]: successSound,
  [SOUNDS.ERROR]: errorSound,
  [SOUNDS.NOTIFICATION]: notificationSound,
  [SOUNDS.SWITCH]: switchSound
};

// Default volume settings
const DEFAULT_VOLUMES = {
  [SOUNDS.CLICK]: 0.5,
  [SOUNDS.HOVER]: 0.3,
  [SOUNDS.SUCCESS]: 0.6,
  [SOUNDS.ERROR]: 0.6,
  [SOUNDS.NOTIFICATION]: 0.7,
  [SOUNDS.SWITCH]: 0.5
};

class SoundEffectsManager {
  constructor() {
    this.initialized = false;
    this.enabled = true;
    this.volumes = { ...DEFAULT_VOLUMES };
    this.audioElements = {};
    this.lastPlayed = {};
    this.debounceTime = 50; // ms
    
    // Try to load user preferences
    this.loadPreferences();
  }

  /**
   * Initialize the sound effects system
   */
  init() {
    if (this.initialized) return;
    
    // Create audio elements for each sound
    Object.entries(SOUND_FILES).forEach(([key, file]) => {
      const audio = new Audio(file);
      audio.preload = 'auto';
      audio.volume = this.volumes[key] || 0.5;
      this.audioElements[key] = audio;
    });
    
    this.initialized = true;
    console.log('Sound effects system initialized');
  }

  /**
   * Preload all sound effects for better performance
   */
  preload() {
    if (!this.initialized) this.init();
    
    // Preload all sounds by quickly playing them at 0 volume
    Object.entries(this.audioElements).forEach(([key, audio]) => {
      const originalVolume = audio.volume;
      audio.volume = 0;
      audio.play().catch(() => {}); // Ignore autoplay errors
      audio.pause();
      audio.currentTime = 0;
      audio.volume = originalVolume;
    });
  }

  /**
   * Play a sound effect
   * @param {string} sound - The sound to play
   * @param {number} volumeModifier - Optional volume modifier (0-1)
   * @returns {Promise} Promise that resolves when the sound finishes
   */
  play(sound, volumeModifier = 1) {
    if (!this.initialized) this.init();
    if (!this.enabled) return Promise.resolve();
    
    // Convert to lowercase to make it case-insensitive
    sound = sound.toLowerCase();
    
    // Check if the sound exists
    const soundKey = Object.keys(SOUNDS).find(
      key => SOUNDS[key].toLowerCase() === sound
    );
    
    if (!soundKey) {
      console.warn(`Sound '${sound}' not found`);
      return Promise.resolve();
    }
    
    const actualSound = SOUNDS[soundKey];
    
    // Debounce sound playing to prevent rapid repeat plays
    const now = Date.now();
    if (this.lastPlayed[actualSound] && now - this.lastPlayed[actualSound] < this.debounceTime) {
      return Promise.resolve();
    }
    this.lastPlayed[actualSound] = now;
    
    // Clone the audio to allow overlapping sounds
    const audio = this.audioElements[actualSound].cloneNode();
    audio.volume = this.volumes[actualSound] * volumeModifier;
    
    return audio.play().catch(err => {
      console.warn(`Error playing sound effect: ${err.message}`);
    });
  }

  /**
   * Enable or disable all sounds
   * @param {boolean} enabled - Whether sounds should be enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('sound_effects_enabled', JSON.stringify(enabled));
  }

  /**
   * Check if sound effects are enabled
   * @returns {boolean} Whether sound effects are enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Set the volume for a specific sound
   * @param {string} sound - The sound to adjust
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(sound, volume) {
    if (volume < 0 || volume > 1) {
      console.warn('Volume must be between 0 and 1');
      return;
    }
    
    sound = sound.toLowerCase();
    const soundKey = Object.keys(SOUNDS).find(
      key => SOUNDS[key].toLowerCase() === sound
    );
    
    if (!soundKey) {
      console.warn(`Sound '${sound}' not found`);
      return;
    }
    
    const actualSound = SOUNDS[soundKey];
    this.volumes[actualSound] = volume;
    
    if (this.audioElements[actualSound]) {
      this.audioElements[actualSound].volume = volume;
    }
    
    // Save preferences
    this.savePreferences();
  }

  /**
   * Reset all sound volumes to defaults
   */
  resetVolumes() {
    this.volumes = { ...DEFAULT_VOLUMES };
    
    Object.entries(this.volumes).forEach(([sound, volume]) => {
      if (this.audioElements[sound]) {
        this.audioElements[sound].volume = volume;
      }
    });
    
    // Save preferences
    this.savePreferences();
  }

  /**
   * Save user sound preferences to localStorage
   */
  savePreferences() {
    try {
      const preferences = {
        enabled: this.enabled,
        volumes: this.volumes
      };
      localStorage.setItem('sound_effects_preferences', JSON.stringify(preferences));
    } catch (err) {
      console.warn('Failed to save sound preferences:', err);
    }
  }

  /**
   * Load user sound preferences from localStorage
   */
  loadPreferences() {
    try {
      // Load global enabled setting
      const enabled = localStorage.getItem('sound_effects_enabled');
      if (enabled !== null) {
        this.enabled = JSON.parse(enabled);
      }
      
      // Load detailed preferences
      const preferencesStr = localStorage.getItem('sound_effects_preferences');
      if (preferencesStr) {
        const preferences = JSON.parse(preferencesStr);
        if (preferences.enabled !== undefined) {
          this.enabled = preferences.enabled;
        }
        if (preferences.volumes) {
          this.volumes = {
            ...DEFAULT_VOLUMES,
            ...preferences.volumes
          };
        }
      }
    } catch (err) {
      console.warn('Failed to load sound preferences:', err);
      // Fallback to defaults
      this.enabled = true;
      this.volumes = { ...DEFAULT_VOLUMES };
    }
  }
  
  /**
   * Get exported sound effect constants
   */
  getSounds() {
    return { ...SOUNDS };
  }
}

// Create singleton instance
const SoundEffects = new SoundEffectsManager();

// Export both the instance and sound constants
export { SOUNDS };
export default SoundEffects;