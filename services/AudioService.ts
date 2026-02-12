import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export type SoundType = 'success' | 'error' | 'click';

const PREMIUM_SOUNDS: Record<SoundType, any> = {
    success: require('../assets/sounds/success.mp3'),
    error: require('../assets/sounds/error.mp3'),
    click: require('../assets/sounds/click.mp3'),
};

class AudioService {
    private isSoundEnabled: boolean = true;
    private isHapticEnabled: boolean = true;
    private sounds: Partial<Record<SoundType, Audio.Sound>> = {};
    private isFetching: Partial<Record<SoundType, boolean>> = {};
    private isReady: boolean = false;

    constructor() {
        this.init();
    }

    async init() {
        if (this.isReady) return;
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                staysActiveInBackground: false,
                playThroughEarpieceAndroid: false,
            });
            this.isReady = true;
            this.preloadSounds();
        } catch (e) {
            // console.error('AudioService: Init Error', e);
        }
    }

    private async preloadSounds() {
        for (const type of Object.keys(PREMIUM_SOUNDS) as SoundType[]) {
            this.loadSound(type);
        }
    }

    private async loadSound(type: SoundType) {
        if (this.sounds[type] || this.isFetching[type]) return;

        this.isFetching[type] = true;
        try {
            const { sound } = await Audio.Sound.createAsync(
                PREMIUM_SOUNDS[type],
                { shouldPlay: false, volume: 1.0 }
            );
            this.sounds[type] = sound;
        } catch (e) {
            // console.warn(`AudioService: Load Fail ${type}`, e);
        } finally {
            this.isFetching[type] = false;
        }
    }

    setSoundEnabled(enabled: boolean) {
        this.isSoundEnabled = enabled;
    }

    setHapticEnabled(enabled: boolean) {
        this.isHapticEnabled = enabled;
    }

    async playSound(type: SoundType) {
        if (!this.isSoundEnabled) return;

        try {
            // Ensure ready
            if (!this.isReady) await this.init();

            let sound = this.sounds[type];

            if (sound) {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    await sound.replayAsync();
                    return;
                }
                delete this.sounds[type];
            }

            // Direct play as fallback
            const result = await Audio.Sound.createAsync(
                PREMIUM_SOUNDS[type],
                { shouldPlay: true, volume: 1.0 }
            );
            this.sounds[type] = result.sound;
        } catch (error) {
            console.warn(`AudioService: Play Error ${type}`, error);
        }
    }

    async triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light') {
        if (!this.isHapticEnabled) return;
        try {
            switch (type) {
                case 'light': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
                case 'medium': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
                case 'heavy': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
                case 'selection': await Haptics.selectionAsync(); break;
                case 'success': await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
                case 'warning': await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
                case 'error': await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
            }
        } catch (e) { }
    }

    feedback(type: SoundType) {
        this.playSound(type);
        if (type === 'success') this.triggerHaptic('success');
        else if (type === 'error') this.triggerHaptic('error');
        else if (type === 'click') this.triggerHaptic('light');
    }
}

export default new AudioService();
