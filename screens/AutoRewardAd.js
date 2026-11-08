import { View, Text, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { RewardedAd, TestIds, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';


const rewarded = RewardedAd.createForAdRequest(TestIds.REWARDED);


export default function AutoRewardAd({ onAdFinished }) {
  const hasTriggeredCallback = useRef(false);
  const willTriggerShow = useRef(false);

  useEffect(() => {
    let earnedReward = false;


    const safeExit = (statusObj) => {
      if (!hasTriggeredCallback.current) {
        hasTriggeredCallback.current = true;
        willTriggerShow.current = true;

        requestAnimationFrame(() => {
          onAdFinished(statusObj);
        });
      }
    };

    

    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED, 
      () => {
        try {
          willTriggerShow.current = true;
          
          requestAnimationFrame(() => {
            try {
              rewarded.show();
            } catch (err) {
              safeExit({ success: false, error: err.message });
            }
          });
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
        cleanupListeners();
      }
    );


    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR, 
      (error) => { 
        safeExit({ success: false, error: error.message }); 
        cleanupListeners();
      }
    );

    try {
      rewarded.load();
    } catch (loadError) {
      safeExit({ success: false, error: "RewardAd Instance busy" });
    }


    const cleanupListeners = () => {
      if (unsubscribeLoaded) unsubscribeLoaded();
      if (unsubscribeEarned) unsubscribeEarned();
      if (unsubscribeClosed) unsubscribeClosed();
      if (unsubscribeError) unsubscribeError();
    };


    return () => {
    };
  }, [onAdFinished]);


  if (hasTriggeredCallback.current || willTriggerShow.current ) {
    return null;
  }


  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '93%', backgroundColor: 'rgba(19, 19, 19, 0.76)', alignItems: 'center', justifyContent: 'center', zIndex: 19, elevation: 50 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
        <Image style={{ height: 76, width: 76, elevation: 4, marginBottom: 24, opacity: 1, borderRadius: 12 } } resizeMode='contain' source={require('../assets/icon.png')} />
        <ActivityIndicator size="large" color="#696308" style={{ transform: [{ scale: 1.9 }], marginBottom: 17 }} />
        <Text style={{ color: "#504b08", fontWeight: '700', fontSize: 11, letterSpacing: 0.8, textAlign: 'center', textTransform: 'uppercase', marginTop: 7 }}>Please Wait...</Text>
      </View>
    </View>
  );
}