import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ImageBackground, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { InterstitialAd, AdEventType, RewardedAd, BannerAd, BannerAdSize, TestIds, RewardedAdEventType } from 'react-native-google-mobile-ads';
import React, { useLayoutEffect, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AdTimer } from './AdTimer';

  
const BANNER_A_ID = TestIds.BANNER; 
const INTERSTITIAL_A_ID = TestIds.INTERSTITIAL;
const REWARDED_A_ID = TestIds.REWARDED;

const rewarded = RewardedAd.createForAdRequest(REWARDED_A_ID, {
  requestNonPersonalizedAdsOnly: true,
});


export default function HomeScreen() {
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isLoadingTransition, setIsLoadingTransition] = useState(false);
  const navigation = useNavigation();

  
  useLayoutEffect(()=> {
    navigation.setOptions({ headerShown: false,});
  }, []);


  const handleNavigateInterstitial = async (scrname) => {
    try {
      const isEligible = await AdTimer.shouldShowAd();

      if (isEligible) {
        setIsLoadingAd(true);

        const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_A_ID, {
          requestNonPersonalizedAdsOnly: true
        });
        
        let unsubscribeLoaded = null;
        let unsubscribeError = null;
        let unsubscribeClosed = null; 
        let backupTimer = null;

        const cleanUp = () => {
          if (backupTimer) clearTimeout(backupTimer);
          if (unsubscribeLoaded) unsubscribeLoaded();
          if (unsubscribeError) unsubscribeError();
          if (unsubscribeClosed) unsubscribeClosed();
        };

        backupTimer = setTimeout(() => {
          cleanUp();
          setIsLoadingAd(false);
          navigation.navigate(scrname);
        }, 3000);

      
        unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
          setIsLoadingAd(false);
          try {
            interstitial.show()
              .then(() => {
                AdTimer.saveTimestamp();
              })
              .catch(() => {
                cleanUp();
                navigation.navigate(scrname);
              });
          } catch (showError) {
            cleanUp();
            navigation.navigate(scrname);
          }
        });

        unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          cleanUp();
          navigation.navigate(scrname);
        });

        unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
          cleanUp();
          setIsLoadingAd(false);
          navigation.navigate(scrname); 
        });

        interstitial.load();
      } else {
        navigation.navigate(scrname);
      }
    } catch (globalError) {
      setIsLoadingAd(false);
      navigation.navigate(scrname);
    }
  };


  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsAdLoaded(true);
      setIsLoadingTransition(false);
    });

    const unsubscribeReward = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      Alert.alert('Thank you.', 'You have earned another 10 mins without ads! Enjoy wheeShare.', [{ text: 'OK' }]);
    });

    const unsubscribeClosed = rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      setIsAdLoaded(false);
      rewarded.load(); 
    });

    const unsubscribeError = rewarded.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
      Alert.alert('Failed to prepare rewarded ad', error?.message || String(error));
      setIsLoadingTransition(false);
    });

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeReward();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);


  const handleNavigate = async (scrname) => {
    try {
      const isEligible = await AdTimer.shouldShowAd();

      if (isEligible && isAdLoaded) {
        setIsLoadingTransition(true);
        
        await rewarded.show();
        await AdTimer.saveTimestamp();
        
        setIsLoadingTransition(false);
        navigation.navigate(scrname);
      } else {
        navigation.navigate(scrname);
      }
    } catch (error) {
      setIsLoadingTransition(false);
      navigation.navigate(scrname);
    }
  };


  return (
    <ImageBackground style={ styles.imgBackground } imageStyle={{ opacity: 1.0 }} resizeMode='cover' source={require('../assets/homescreen.png')}>
      <StatusBar barStyle="light-content"/>
      <SafeAreaView style={{ flexDirection:"column", height: "100%", marginTop: 19, opacity: 1}}>
        
        <View style={{ width: '100%', marginBottom: 5, marginTop: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ImageBackground style={{ height: 70, width: "95%", alignSelf: 'center' }} resizeMode='contain' source={require('../assets/wheesharetitle.png')} /> 
        </View>
         
        <View style={{ flexDirection: "row", justifyContent: "center"}}>
          <ImageBackground style={ styles.menubar } imageStyle={{ opacity: 1 }} resizeMode='contain' source={require('../assets/menubar.png')} /> 
        </View>

        <ScrollView style={{ flexDirection:"column", marginTop: 19}}>
          <TouchableOpacity
            style={[styles.buttonimage, isLoadingAd && styles.disabledButton]}
            onPress={()=> handleNavigate('Chapters')}
            disabled={isLoadingAd}>
              { isLoadingAd ? ( <ActivityIndicator size="small" color="#FFFFFF" />
                ) : ( <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                  <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>Chapters</Text>
                </ImageBackground>
              ) }
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonimage, isLoadingAd && styles.disabledButton]}
            onPress={()=> handleNavigate('Crosswords')}
            disabled={isLoadingAd}>
              { isLoadingAd ? ( <ActivityIndicator size="small" color="#FFFFFF" />
                ) : ( <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                  <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>Crosswords</Text>
                </ImageBackground>
              ) }
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonimage, isLoadingAd && styles.disabledButton]}
            onPress={()=> handleNavigate('Quizzes')}
            disabled={isLoadingAd}>
              { isLoadingAd ? ( <ActivityIndicator size="small" color="#FFFFFF" />
                ) : ( <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                  <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>Quizzes</Text>
                </ImageBackground>
              ) }
          </TouchableOpacity>
            
          <TouchableOpacity
            style={[styles.buttonimage, isLoadingAd && styles.disabledButton]}
            onPress={()=> handleNavigate('Problems')}
            disabled={isLoadingAd}>
              { isLoadingAd ? ( <ActivityIndicator size="small" color="#FFFFFF" />
                ) : ( <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                  <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>Problems</Text>
                </ImageBackground>
              ) }
          </TouchableOpacity>
            
          <TouchableOpacity
            style={styles.buttonimage}
            onPress={()=> handleNavigateInterstitial('About')}
            disabled={isLoadingAd}>
              <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>About</Text>
              </ImageBackground>
          </TouchableOpacity> 
        </ScrollView>

        <View style={{ flex:1, justifyContent: "space-between", marginTop: 20, alignSelf: 'center', backgroundColor: "#ffffffff", width: '100%' }}>
          <BannerAd
            unitId={BANNER_A_ID}
            size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{requestNonPersonalizedAdsOnly: true}}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
    searchcontainer: {flexDirection: 'row',marginTop: 57, alignItems:'center', justifyContent:'center', alignSelf: 'center',width:'100%',marginBottom: 76,padding: 5},
    search: {flexDirection: 'row',flex: 1,marginLeft: 19,fontSize: 19, padding: 8, alignItems:'center', justifyContent:'center', alignSelf: 'center'},
    title: {fontSize: 30, padding: 30, color:'#000',borderColor:'#000',fontWeight:"400",borderWidth: 2,backgroundColor:'#228B22'},
    button: {alignItems: 'center',flexDirection: "row",justifyContent: 'center',paddingVertical: 8,paddingHorizontal: 16,borderRadius: 5,elevation: 3,color: "#fff",backgroundColor: '#228B22',marginBottom: 7,marginLeft:19,height: 57,width: 348,fontWeight: 'bold',opacity:3 },
    buttontext: { fontSize: 16, lineHeight: 21, fontWeight: '800', letterSpacing: 0.25,marginTop: 4, color: 'white'},
    imgBackground: { width: '100%', height: '100%', maxHeight: "96%", flex: 1},
    imgBackground2: { width: '100%', height: '100%', flex: 1, opacity: 1, margin:0, marginBottom:-2, padding:2, backgroundColor:"transparent", justifyContent:"flex-end"},
    menubar: { height: 76, width: "98%", opacity: 1, marginTop: 38, alignSelf: "center", marginBottom: 1 },
    buttonimage: { width: "67%", flex: 1, height: 67, alignItems: "center", justifyContent: "center", opacity: 1, alignSelf:"center" },
    cardText: { width: "100%", fontSize: 15, fontWeight: '800', color: '#5a4f07', paddingHorizontal: 5, opacity: 1, textAlign: "center", textShadowColor: '#f3efbd', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 7 },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor: '#F5F5F5'},
    buttonText: {color: '#FFFFFF',fontSize: 16,fontWeight: '600'}
});