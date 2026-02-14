import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

export type SoundType = 'success' | 'error' | 'click';

const PREMIUM_SOUNDS: Record<SoundType, number | string> = {
    success: require('../../assets/sounds/success.mp3'),
    error: require('../../assets/sounds/error.mp3'),
    click: require('../../assets/sounds/click.mp3'),
};

class AudioService {
    private isSoundEnabled: boolean = true;
    private isHapticEnabled: boolean = true;
    private players: Partial<Record<SoundType, AudioPlayer>> = {};
    private isFetching: Partial<Record<SoundType, boolean>> = {};
    private isReady: boolean = false;

    constructor() {
        this.init();
    }

    async init() {
        if (this.isReady) return;
        try {
            // expo-audio doesn't require audio mode setup for basic playback
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
        if (this.players[type] || this.isFetching[type]) return;

        this.isFetching[type] = true;
        try {
            const player = createAudioPlayer(PREMIUM_SOUNDS[type]);
            this.players[type] = player;
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

            let player = this.players[type];

            if (!player) {
                // Create player on demand
                player = createAudioPlayer(PREMIUM_SOUNDS[type]);
                this.players[type] = player;
            }

            // Reset to beginning and play
            player.seekTo(0);
            player.play();
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
