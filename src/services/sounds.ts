import { Audio } from 'expo-av';

let completionSound: Audio.Sound | null = null;
let celebrationSound: Audio.Sound | null = null;

export async function initializeSounds() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    completionSound = new Audio.Sound();
    celebrationSound = new Audio.Sound();

    await completionSound.loadAsync(require('@/assets/sounds/chime.mp3'));
    await celebrationSound.loadAsync(require('@/assets/sounds/celebration.mp3'));
  } catch (error) {
    console.error('Failed to initialize sounds:', error);
  }
}

export async function playCompletionChime() {
  try {
    if (completionSound) {
      await completionSound.setPositionAsync(0);
      await completionSound.playAsync();
    }
  } catch (error) {
    console.error('Failed to play completion chime:', error);
  }
}

export async function playCelebrationSound() {
  try {
    if (celebrationSound) {
      await celebrationSound.setPositionAsync(0);
      await celebrationSound.playAsync();
    }
  } catch (error) {
    console.error('Failed to play celebration sound:', error);
  }
}

export async function unloadSounds() {
  try {
    if (completionSound) await completionSound.unloadAsync();
    if (celebrationSound) await celebrationSound.unloadAsync();
  } catch (error) {
    console.error('Failed to unload sounds:', error);
  }
}
