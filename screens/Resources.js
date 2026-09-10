import { StyleSheet, Text, View, ImageBackground, ScrollView, StatusBar, TouchableOpacity, Alert, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import React from 'react';

export default function Resources() {
  const navigation = useNavigation();


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

            <Text style={styles.title}>
              Thank you for downloading WheeShare. Your support helps us continue building a connected, knowledge-sharing community and improving the experience for learners, creators, and collaborators alike. We are grateful to everyone who has contributed time, effort, and insight to bring this platform to life.
            </Text>

            <Text style={styles.title}>
              WheeShare does not collect personal data from your device. The app is designed for efficient battery usage, low memory consumption, and smooth performance. Future upgrades will remain free, and we are committed to making the experience both accessible and reliable.
            </Text>

            <Text style={styles.chapters}>Chapters</Text>
            <Text style={styles.title}>
              Create, share, edit, view, delete, and import your own chapters in the WheeShare app. Each chapter can include videos, audio files, images, and PDFs in any order, giving you flexibility to organise lessons, courses, albums, events, and other digital content. You may also share individual assets or complete chapters with other WheeShare users, while external sharing is limited to single media files and instructions are provided for supported formats.
            </Text>

            <Text style={styles.problems}>Problems and Solutions</Text>
            <Text style={styles.title}>
              Add, share, edit, view, delete, and import your own problems and solutions. You can share problem images, videos, or PDFs while viewing a record, enabling collaborative learning and streamlined knowledge exchange. Problems and solutions can be imported and shared securely within the WheeShare ecosystem, with clear guidance provided for supported file types and sharing methods.
            </Text>

            <Text style={styles.crosswords}>Crosswords</Text>
            <Text style={styles.title}>
              Build and manage your own crosswords with ease. Each crossword may contain a set of four words, and the app supports secure sharing and importing of crossword content within WheeShare. This feature offers a practical and engaging way to reinforce vocabulary, comprehension, and learning through interactive play.
            </Text>

            <Text style={styles.quizzes}>Quizzes</Text>
            <Text style={styles.title}>
              Create and manage quizzes with multiple question formats in any order. You can add, edit, view, delete, and import quiz content, and share it with other users through the WheeShare platform. Quizzes are designed to support effective learning, assessment, and engagement across a variety of subjects and content types.
            </Text>

            <Text style={styles.title}>
              For best results, use the volume control in the top-right corner to manage audio, and note that videos can be played in slow motion for clearer review. Wi-Fi is primarily used for content sharing, while the premium version removes advertisements for a cleaner experience. It is recommended to clear the app cache in your device settings when needed. Please avoid clearing app data, as this may remove saved passwords, chapters, quizzes, crosswords, and problems.
            </Text>

            <TouchableOpacity onPress={handlePress} style={styles.linkButton} accessibilityRole="link">
              <Text style={styles.linkText}>View Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  imgBackground: {
    flex: 1,
    width: '100%',
    maxHeight: '95%',
    marginBottom: '5%',
    backgroundColor: '#07111d',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 15, 24, 0.58)',
  },
  safeArea: {
    flex: 1,
    height: '100%',
    marginTop: 7,
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
  },
  icon: {
    height: 70,
    elevation: 3,
    marginTop: 3,
    textAlign: 'center',
  },
  scrollView: {
    flexDirection: 'column',
    marginTop: 5,
    marginBottom: 1,
    paddingBottom: 5,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  contentBox: {
    marginTop: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 19,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 17, 27, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  quizzes: {
    textDecorationLine: 'underline',
    textDecorationColor: '#f3b4c3',
    color: '#f7d6df',
    fontSize: 19,
    fontStyle: 'italic',
    fontWeight: '700',
    marginLeft: 20,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  chapters: {
    textDecorationLine: 'underline',
    textDecorationColor: '#f2df75',
    fontStyle: 'italic',
    color: '#f2df75',
    fontSize: 19,
    fontWeight: '700',
    marginLeft: 20,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  crosswords: {
    textDecorationLine: 'underline',
    textDecorationColor: '#8ee7a7',
    fontStyle: 'italic',
    color: '#8ee7a7',
    fontSize: 19,
    fontWeight: '700',
    marginLeft: 20,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  problems: {
    textDecorationLine: 'underline',
    textDecorationColor: '#d8a8ff',
    fontStyle: 'italic',
    fontSize: 19,
    color: '#d8a8ff',
    fontWeight: '700',
    marginLeft: 20,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  linkButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 203, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(142, 203, 255, 0.38)',
  },
  linkText: {
    color: '#cfe9ff',
    fontSize: 15,
    textDecorationLine: 'underline',
    fontStyle: 'italic',
    fontWeight: '700',
  },
});