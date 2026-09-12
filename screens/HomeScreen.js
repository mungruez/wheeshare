import { Image, StyleSheet, View, Text, ScrollView, TouchableOpacity, ImageBackground, StatusBar, ActivityIndicator } from 'react-native';
import { BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useState, useRef } from 'react';
import { adManagerInstance } from './AdManager';

const BANNER_A_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-5022889398292450/4030435808';

export default function HomeScreen() {
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const navigation = useNavigation();
  const loadingRef = useRef(false);

  useLayoutEffect(()=> {
    navigation.setOptions({ headerShown: false,});
  }, []);

  const handleNavigate = (scrname) => {
    const navigateToNextScreen = () => {
      setIsLoadingAd(false);
      loadingRef.current = false;
      navigation.navigate(scrname);
    };

    if (adManagerInstance.isTimerExpired()) {
      if (!adManagerInstance.isAdReady()) {
        setIsLoadingAd(true);
        loadingRef.current = true;

        setTimeout(() => {
          if (!adManagerInstance.isAdReady() && loadingRef.current) {
            navigateToNextScreen();
          }
        }, 2000);
        return;
      }
      
      setIsLoadingAd(true);
      loadingRef.current = true;
      adManagerInstance.showAdIfEligible(navigateToNextScreen);

    } else {
      navigateToNextScreen();
    }
  };

  return (
    <ImageBackground style={ styles.imgBackground } imageStyle={{ opacity: 1.0 }} resizeMode='cover' source={require('../assets/homescreen.png')}>
      <StatusBar barStyle="light-content"/>

      <SafeAreaView style={{ flexDirection:"column", height: "100%", marginTop: 19, opacity: 1}}>
        
        <View style={{ width: '100%', marginBottom: 5, marginTop: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ImageBackground style={{ height: 70, width: "95%", alignSelf: 'center' }} resizeMode='contain' source={require('../assets/wheesharetitle.png')} /> 
        </View>
         
        <View style={{ flexDirection:" row", justifyContent: "center"}}>
          <ImageBackground style={ styles.menubar } imageStyle={{ opacity: 1 }} resizeMode='contain' source={require('../assets/menubar.png')} /> 
        </View>

        <ScrollView style={{ flexDirection:"column", marginTop: 19}}>
          <TouchableOpacity
            style={[styles.buttonimage, isLoadingAd && styles.disabledButton]}
            onPress={()=> handleNavigate('Chapters')}
            disabled={isLoadingAd}>
              { isLoadingAd ? ( <ActivityIndicator size="small" color="#FFFFFF" />
                ) : ( <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                  <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>CHAPTERS</Text>
                </ImageBackground>
              ) }
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonimage, isLoadingAd && styles.disabledButton]}
            onPress={()=> handleNavigate('Crosswords')}
            disabled={isLoadingAd}>
              { isLoadingAd ? ( <ActivityIndicator size="small" color="#FFFFFF" />
                ) : ( <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                  <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>CROSSWORDS</Text>
                </ImageBackground>
              ) }
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonimage, isLoadingAd && styles.disabledButton]}
            onPress={()=> handleNavigate('Quizzes')}
            disabled={isLoadingAd}>
              { isLoadingAd ? ( <ActivityIndicator size="small" color="#FFFFFF" />
                ) : ( <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                  <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>QUIZZES</Text>
                </ImageBackground>
              ) }
          </TouchableOpacity>
            
          <TouchableOpacity
            style={[styles.buttonimage, isLoadingAd && styles.disabledButton]}
            onPress={()=> handleNavigate('Problems')}
            disabled={isLoadingAd}>
              { isLoadingAd ? ( <ActivityIndicator size="small" color="#FFFFFF" />
                ) : ( <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                  <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>PROBLEMS</Text>
                </ImageBackground>
              ) }
          </TouchableOpacity>
            
          <TouchableOpacity
            style={styles.buttonimage}
            onPress={()=> navigation.navigate('About')}
            disabled={isLoadingAd}>
              <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>ABOUT</Text>
              </ImageBackground>
          </TouchableOpacity> 
        </ScrollView>

        <View style={{ flex:1, justifyContent: "space-between", marginTop: 20, alignSelf: 'center'}}>
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
    searchcontainer: {flexDirection: 'row',marginTop: "57",alignItems:'center', justifyContent:'center', alignSelf: 'center',width:'100%',marginBottom:"76",padding: 5},
    search: {flexDirection: 'row',flex: 1,marginLeft: "19",fontSize: 19,padding: "8", alignItems:'center', justifyContent:'center', alignSelf: 'center'},
    title: {fontSize: 30, padding: 30, color:'#000',borderColor:'#000',fontWeight:"400",borderWidth: 2,backgroundColor:'#228B22'},
    button: {alignItems: 'center',flexDirection: "row",justifyContent: 'center',paddingVertical: 8,paddingHorizontal: 16,borderRadius: 5,elevation: 3,color: "#fff",backgroundColor: '#228B22',marginBottom: 7,marginLeft:19,height: 57,width: 348,fontWeight: 'bold',opacity:3 },
    buttontext: { fontSize: 16, lineHeight: 21, fontWeight: '800', letterSpacing: 0.25,marginTop: 4, color: 'white'},
    imgBackground: { width: '100%', height: '100%', maxHeight:"96%", flex: 1},
    imgBackground2: { width: '100%', height: '100%', flex: 1, opacity: 1, margin:0, marginBottom:-2, padding:2, backgroundColor:"transparent", justifyContent:"flex-end"},
    menubar: { height: 76, width: "98%", opacity: 1, marginTop: 38, alignSelf: "center", marginBottom: 1 },
    buttonimage: { width: "67%", flex: 1, height: 67, alignItems: "center", justifyContent: "center", opacity: 1, alignSelf:"center" },
    cardText: { width: "100%", fontSize: 15, fontWeight: '800', color: '#5a4f07', paddingHorizontal: 5, opacity: 1, textAlign: "center", textShadowColor: '#f3efbd', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 7 },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor: '#F5F5F5'},
    buttonText: {color: '#FFFFFF',fontSize: 16,fontWeight: '600'},
  });