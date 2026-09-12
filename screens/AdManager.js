import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

const REWARDED_VIDEO_ID = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-5022889398292450/5390000963';
const COOLDOWN_TIME_MS = 10 * 60 * 1000; 

class AdManager {
  constructor() {
    this.rewarded = null;
    this.isLoaded = false;
    this.lastShownTime = 0;
    this.onAdClosedCallback = null;
  }

  setupListeners() {
    if (!this.rewarded) return;

    this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      this.isLoaded = true;
    });

    this.rewarded.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
      this.isLoaded = false;
      console.warn('AdMob Loading Error Encountered:', error.message);
      
      if (this.onAdClosedCallback) {
        this.onAdClosedCallback();
        this.onAdClosedCallback = null;
      }

      setTimeout(() => {
        if (this.rewarded) this.rewarded.load();
      }, 30000);
    });

    this.rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log(`User earned reward: ${reward.amount} ${reward.type}`);
    });

    this.rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      this.isLoaded = false;
      if (this.rewarded) this.rewarded.load(); 
      
      if (this.onAdClosedCallback) {
        this.onAdClosedCallback();
        this.onAdClosedCallback = null;
      }
    });
  }

  initialize() {
    if (!this.rewarded) {
      this.rewarded = RewardedAd.createForAdRequest(REWARDED_VIDEO_ID, {
        requestNonPersonalizedAdsOnly: true,
      });
      this.setupListeners();
    }
    
    this.rewarded.load();
  }

  isTimerExpired() {
    const currentTime = Date.now();
    const timeSinceLastAd = currentTime - this.lastShownTime;
    return timeSinceLastAd >= COOLDOWN_TIME_MS;
  }

  isAdReady() {
    return this.isLoaded && this.rewarded !== null;
  }

  showAdIfEligible(onAdClosedAction) {
    if (this.isTimerExpired() && this.isAdReady()) {
      this.onAdClosedCallback = onAdClosedAction;
      
      try {
        this.rewarded.show();
        this.lastShownTime = Date.now(); 
        return true; 
      } catch (runtimeError) {
        console.error('AdMob Crash intercepted during playback attempt:', runtimeError);
        this.isLoaded = false;
        if (this.rewarded) this.rewarded.load(); 
        return false; 
      }
    }
    return false; 
  }
}

export const adManagerInstance = new AdManager();