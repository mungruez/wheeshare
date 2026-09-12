import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

const REWARDED_VIDEO_ID = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxxxxxxxxxxx/your-real-id';
const COOLDOWN_TIME_MS = 10 * 60 * 1000; 

class AdManager {
  constructor() {
    this.rewarded = RewardedAd.createForAdRequest(REWARDED_VIDEO_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    this.isLoaded = false;
    this.lastShownTime = 0;
    this.onAdClosedCallback = null;

    this.setupListeners();
  }

  setupListeners() {
    this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      this.isLoaded = true;
      console.log('AdMob: Video cached and ready to play.');
    });

    // 1. CATCH DOWNLOAD FILING FAILURES (e.g., No Network or No Fill)
    this.rewarded.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
      this.isLoaded = false;
      console.warn('AdMob Loading Error Encountered:', error.message);
      
      // If an ad fails to load, gracefully clear the navigation block if one was waiting
      if (this.onAdClosedCallback) {
        this.onAdClosedCallback();
        this.onAdClosedCallback = null;
      }

      // Quietly attempt to retry downloading a fresh ad asset in the background after 30 seconds
      setTimeout(() => {
        this.rewarded.load();
      }, 30000);
    });

    this.rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log(`User earned reward: ${reward.amount} ${reward.type}`);
    });

    this.rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      this.isLoaded = false;
      this.rewarded.load(); 
      
      if (this.onAdClosedCallback) {
        this.onAdClosedCallback();
        this.onAdClosedCallback = null;
      }
    });
  }

  initialize() {
    this.rewarded.load();
  }

  isTimerExpired() {
    const currentTime = Date.now();
    const timeSinceLastAd = currentTime - this.lastShownTime;
    return timeSinceLastAd >= COOLDOWN_TIME_MS;
  }

  isAdReady() {
    return this.isLoaded;
  }

  showAdIfEligible(onAdClosedAction) {
    if (this.isTimerExpired() && this.isAdReady()) {
      this.onAdClosedCallback = onAdClosedAction;
      
      try {
        this.rewarded.show();
        this.lastShownTime = Date.now(); 
        return true; 
      } catch (runtimeError) {
        // 2. CATCH RUNTIME CRASHES DURING AD INJECTION
        console.error('AdMob Crash intercepted during playback attempt:', runtimeError);
        this.isLoaded = false;
        this.rewarded.load(); // instantly try recovery load
        return false; // let the navigation function fire safely instead of freezing
      }
    }
    return false; 
  }
}

export const adManagerInstance = new AdManager();
