import { StyleSheet, Text, View, ImageBackground, ScrollView, StatusBar, TouchableOpacity, Alert, Linking } from 'react-native'
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetInfo } from "@react-native-community/netinfo";
import { useNavigation, useIsFocused } from '@react-navigation/native';
import React, { useLayoutEffect, useState, useEffect } from 'react';

const BANNER_A_ID = TestIds.BANNER;

export default function Resources() {
  const isOffline = useNetInfo().isConnected === false;
  const [loadAd, setLoadAd] = useState(false);
  const navigation = useNavigation();
  const isFocused = useIsFocused();


  useEffect(() => {

    if (!isFocused) {
      setLoadAd(false);
      return;
    } else {
      setLoadAd(true);
    }

  }, [isFocused]);


  const handlePress = async () => {
    try {
      const supported = await Linking.canOpenURL("https://mungruez.github.io/myPortfolioWebsite/wheeshareprivacy.html");
      
      if (supported) {
        await Linking.openURL("https://mungruez.github.io/myPortfolioWebsite/wheeshareprivacy.html");
      } else {
        Alert.alert('Error', 'Unable to open browser. Please check your web browser configuration.');
      }
      
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while trying to launch the policy page.');
    }
  };
  

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);


  const showEulaModal = () => {
    Alert.alert(
      "Terms of Use & EULA",
      `1. AGE CLASSIFICATION REQUIREMENT: By purchasing, downloading, and using this application, you affirm, represent, and warrant that you are at least 18 years of age. This application targets an adult audience and is strictly restricted from use by individuals under the age of 18.\n\n2. LOCAL STORAGE & DATA USER RESPONSIBILITY: This application operates strictly as a local creation framework tool. All custom moves, fighters, data objects, manifests, and chapters built or imported inside this application are stored exclusively on the user's local device hardware. The developer does not host, stream, view, intercept, or manage user-generated content (UGC) over an external server or cloud database system.\n\n3. CONTENT LIABILITY & IMPORT DISCLAIMER: The user retains 100% individual legal responsibility and liability for all text, files, structural chapters, media assets, and zipped file archives imported into or created within their local application storage space. The developer holds zero liability or responsibility for any user-created, user-imported, or community-shared data structures.\n\n4. TRANSACTIONS AND REFUND POLICY: All financial transactions, application purchases, and licensing rights are executed and managed strictly by the Google Play Billing engine. All refund inquiries, payment processing issues, or transaction updates must comply with and be routed through Google Play's standard consumer terms and conditions.`,
      [{ text: "I Accept and Agree", style: "default" }]
    );
  };  


  return (
    <ImageBackground style={styles.imgBackground} resizeMode='cover' source={require('../assets/resbg.png')}>
      <View style={styles.tintOverlay} />
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.headerWrap}>
          <ImageBackground style={styles.icon} resizeMode='contain' source={require('../assets/abouttitle.png')} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentBox}>

            <TouchableOpacity style={styles.eulaButton} onPress={showEulaModal}>
              <Text style={styles.eulaButtonText}>⚖️ View Terms of Use & EULA (16+)</Text>
            </TouchableOpacity>

            <Text style={styles.title}>
              Thank you for downloading WheeShare by DojoSoft! Your support helps us build a connected, knowledge-sharing community for learners, creators, and collaborators worldwide. We are incredibly grateful to everyone who has contributed time, effort, and insight to bring this platform to life. 
            </Text>

            <Text style={styles.title}>
              Enjoy the fully-featured free version with ads, or upgrade to Premium to remove ads and unlock enhanced crossword and quiz tools, alongside a secure, hidden password manager.
            </Text>

            <Text style={styles.title}>
              Your privacy matters: WheeShare does not collect personal data from your device. Built for efficiency, the app features low memory consumption, smooth performance, and optimized battery usage. We are committed to keeping future updates reliable, accessible, and continuously improved at no extra cost.
            </Text>

            <Text style={styles.chapters}>Chapters</Text>
            <Text style={styles.title}>
              Create, share, edit, view, delete, and import your own chapters seamlessly. Each chapter can include videos, audio files, images, and PDFs in any order, giving you ultimate flexibility to organize lessons, courses, albums, events, and multimedia content. Share individual assets or entire chapters with other WheeShare users instantly. External sharing is also supported for single media files in compatible formats.
            </Text>

            <Text style={styles.problems}>Problems and Solutions</Text>
            <Text style={styles.title}>
              Add, share, edit, view, delete, and import your own problems and solutions to streamline knowledge exchange. You can share problem-related images, videos, or PDFs while reviewing records, making collaborative learning easier than ever. Problems and solutions can be imported and shared securely within the WheeShare ecosystem with clear, guided support for all file types.
            </Text>

            <Text style={styles.crosswords}>Crosswords</Text>
            <Text style={styles.title}>
              Build and manage custom crosswords with ease. Each puzzle contains a personalized set of words, making it an engaging and practical way to strengthen vocabulary, comprehension, and learning. Share and import your crossword content securely within the WheeShare ecosystem to challenge your friends or students.
            </Text>

            <Text style={styles.quizzes}>Quizzes</Text>
            <Text style={styles.title}>
              Create and manage dynamic quizzes in multiple formats, arranged in any order you choose. Seamlessly add, edit, view, delete, import, and share your quiz content with other users. WheeShare quizzes are designed to support effective learning, quick assessments, and deep engagement across any subject or content type.
            </Text>

            <Text style={styles.title}>
              Tips for the best experience: Use the volume control in the top-right corner to easily manage your audio. For detailed review, you can play videos in slow motion. Content sharing is optimized primarily for Wi-Fi. As a reminder, upgrading to Premium completely removes advertisements for a clean, distraction-free interface.
            </Text>

            <Text style={styles.title}>
              Important Note: If you need to optimize space, please clear only the app cache from your device settings. Avoid clearing "App Data," as doing so will permanently remove your securely saved passwords, chapters, quizzes, crosswords, and problems. 
            </Text>

            <Text style={styles.title}>
              Discover the DojoSoft Ecosystem: We also create iDojo—the ultimate self-defense training companion, available now on the App Store for $9.99! 
            </Text>

            <Text style={styles.title}>
              In a powerful, innovative first, both WheeShare and iDojo feature the exact same intuitive "Chapters" interface. Because they share this unified core, you can seamlessly import and share your custom chapters and media assets between both apps instantly. Upgrade your routine by bringing collaborative learning and tactical training together!
            </Text>

            <TouchableOpacity onPress={handlePress} style={styles.linkButton} accessibilityRole="link">
              <Text style={styles.linkText}>View Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {!isOffline && loadAd && isFocused ? (
          <View style={styles.bannerContainer}>
            <BannerAd
              key="res-footer-banner"
              unitId={BANNER_A_ID}
              size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{requestNonPersonalizedAdsOnly: true}}
              onAdFailedToLoad={(error) => {
                setLoadAd(false);
              }}
            />
          </View>
        ) : null }

      </SafeAreaView>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  imgBackground: { flex: 1, width: '100%', backgroundColor: '#07111d' },
  icon: {height: 70,width: '100%',elevation: 3,marginTop: 3,textAlign: 'center'},
  scrollView: { flex: 1, flexDirection: 'column', marginTop: 5, marginBottom: 1, paddingBottom: 5 },
  eulaButton: { backgroundColor: 'rgba(142, 203, 255, 0.19)', borderWidth: 1, borderColor: 'rgba(142, 203, 255, 0.38)', borderRadius: 8,paddingVertical: 12,paddingHorizontal: 15,marginVertical: 12,alignItems: 'center',shadowColor: '#00d9ff',shadowOffset: { width: 0, height: 2 },shadowOpacity: 0.3,shadowRadius: 4,elevation: 4},
  eulaButtonText: {color: '#76b9e4',fontWeight: 'bold',fontSize: 14,textTransform: 'uppercase',letterSpacing: 0.5,},
  scrollContent: {paddingBottom: 24},
  safeArea: { flex: 1 },
  bannerContainer: { alignSelf: 'center', width: '100%' },
  contentBox: { marginTop: 2, borderColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderRadius: 16, marginBottom: 19,paddingVertical: 10,backgroundColor: 'rgba(211, 211, 211, 0.1)',shadowColor: '#000',shadowOffset: { width: 0, height: 10 },shadowOpacity: 0.18,shadowRadius: 12},
  quizzes: {textDecorationLine: 'underline',textDecorationColor: '#dd4848',color: '#ce0a0a',fontSize: 19,fontStyle: 'italic',fontWeight: '700',marginLeft: 20,marginTop: 4,letterSpacing: 0.2},
  chapters: {textDecorationLine: 'underline',textDecorationColor: '#ecd866',fontStyle: 'italic',color: '#bba31c',fontSize: 19,fontWeight: '700',marginLeft: 20, marginTop: 4, letterSpacing: 0.2},
  crosswords: {textDecorationLine: 'underline',textDecorationColor: '#4ee97a',fontStyle: 'italic',color: '#0e8d32',fontSize: 19,fontWeight: '700',marginLeft: 20,marginTop: 4,letterSpacing: 0.2},
  problems: {textDecorationLine: 'underline',textDecorationColor: '#9e5ad6', fontStyle: 'italic', fontSize: 19,color: '#7f28c7',fontWeight: '700',marginLeft: 20,marginTop: 4,letterSpacing: 0.2},
  linkButton: {paddingVertical: 12,paddingHorizontal: 18,alignItems: 'center',justifyContent: 'center',alignSelf: 'center',marginTop: 8,marginBottom: 14,borderRadius: 14,backgroundColor: 'rgba(142, 203, 255, 0.10)',borderWidth: 1,borderColor: 'rgba(142, 203, 255, 0.38)'},
  linkText: {color: '#9ecef8',fontSize: 15,textDecorationLine: 'underline',fontStyle: 'italic',fontWeight: '700'},
  tintOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 15, 24, 0.58)',
  },
  headerWrap: {
    marginBottom: 19,
    paddingTop: 1,
    paddingBottom: 7,
    height: 79,
    width: '90%',
    alignSelf: 'center',
    elevation: 18,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F4F7FB',
    backgroundColor: 'rgba(12, 18, 28, 0.40)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginLeft: 19,
    marginRight: 19,
    marginTop: 7,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    lineHeight: 23,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  }
});