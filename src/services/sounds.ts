import { Audio } from 'expo-av';

let completionSound: Audio.Sound | null = null;
let celebrationSound: Audio.Sound | null = null;
let completionLoaded = false;
let celebrationLoaded = false;

export async function initializeSounds() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    completionSound = new Audio.Sound();
    await completionSound.loadAsync(require('@/assets/sounds/chime.mp3'));
    completionLoaded = true;
  } catch {
    completionLoaded = false;
  }

  try {
    celebrationSound = new Audio.Sound();
    await celebrationSound.loadAsync(require('@/assets/sounds/celebration.mp3'));
    celebrationLoaded = true;
  } catch {
    celebrationLoaded = false;
  }
}

export async function playCompletionChime() {
  if (!completionSound || !completionLoaded) return;
  try {
    await completionSound.setPositionAsync(0);
    await completionSound.playAsync();
  } catch {
    // sound unavailable — silently skip
  }
}

export async function playCelebrationSound() {
  if (!celebrationSound || !celebrationLoaded) return;
  try {
    await celebrationSound.setPositionAsync(0);
    await celebrationSound.playAsync();
  } catch {
    // sound unavailable — silently skip
  }
}

export async function unloadSounds() {
  try {
    if (completionSound) await completionSound.unloadAsync();
    if (celebrationSound) await celebrationSound.unloadAsync();
  } catch {
    // ignore
  }
}
