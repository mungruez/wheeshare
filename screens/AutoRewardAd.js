import React, { useEffect, useRef } from 'react';
import { RewardedAd, TestIds, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';

const rewarded = RewardedAd.createForAdRequest(TestIds.REWARDED);

export default function AutoRewardAd({ onAdFinished }) {
  const hasTriggeredCallback = useRef(false);

  useEffect(() => {
    let earnedReward = false;

    const safeExit = (statusObj) => {
      if (!hasTriggeredCallback.current) {
        hasTriggeredCallback.current = true;
        requestAnimationFrame(() => {
          onAdFinished(statusObj);
        });
      }
    };

    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED, 
      () => {
        try {
          rewarded.show();
        } catch (err) {
          safeExit({ success: false, error: err.message });
        }
      }
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD, 
      () => { 
        earnedReward = true; 
      }
    );

    const unsubscribeClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED, 
      () => { 
        safeExit({ success: earnedReward, error: null }); 
      }
    );

    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR, 
      (error) => { 
        safeExit({ success: false, error: error.message }); 
      }
    );

    try {
      rewarded.load();
    } catch (loadError) {
      safeExit({ success: false, error: "Instance busy" });
    }

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [onAdFinished]);

  return null;
}