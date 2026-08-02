import { StyleSheet, Text, View, ImageBackground, TouchableWithoutFeedback , ScrollView, StatusBar, TouchableOpacity, Alert, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import React from 'react';

export default function Resources() {
  const navigation = useNavigation();


  const handlePress = async () => {
    try {
      const supported = await Linking.canOpenURL("https://mungruez.github.io/myPortfolioWebsite/idojoprivacy.html");
      if (supported) {
        await Linking.openURL("https://mungruez.github.io/myPortfolioWebsite/idojoprivacy.html");
      } else {
        Alert.alert('Error', 'Unable to open browser. Please check your web browser configuration.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while trying to launch the policy page.');
    }
  };



  return (
    <ImageBackground style={ styles.imgBackground } resizeMode='stretch' source={require('../assets/homescreen.jpg')}>
      <StatusBar barStyle="light-content"/>
      <SafeAreaView style={{ flex: 1, height: "100%", marginTop:7, backgroundColor: 'transparent',}}>

      <View style={{ marginBottom:19, paddingTop:1, paddingBottom:7, height:76 ,width: '90%',alignSelf: 'center',zIndex: 19,elevation: 19,}}>
        <ImageBackground style={ styles.icon } resizeMode='contain' source={require('../assets/abouttitle.png')} /> 
      </View > 

      <ScrollView style={{ flexDirection:"column", marginTop:5, marginBottom: 1, paddingBottom: 5 }}>
        <View style={{marginTop: 2, borderColor: 'silver', borderWidth: 1, borderRadius: 7, marginBottom: 19}}>
<Text style={ styles.title }> Thank you for downloading the iDojo mobile App. We hope you have learned about Self Defense, your support will be put to constructive use as we continue to build a social community. Special thanks to all involved, a lot of time and effort was put into making iDojo. Thank you to the sponsors, people and organizations who made this original App possible. We mention them here with their corporate or organizational affiliation at the time from which this App was created.
  Thanks to: The World Boxing Federation, MMA and UFC for giving us the opportunity to analyse the best fighters of all time and their fighting styles. Most of all be careful when trying out these moves and have fun. 
  Disclaimer: This App does not collect any data from any device, it is excellent with battery consumption and it is memory efficient.    
</Text>
<Text style={ styles.title }>Years of research into accumulating the best video, audio and graphics for Self Defense Moves has made iDojo a masterpiece. All future upgrades will be free as the main goal is to teach Self Defense to those who would use it only when required. Use the volume button(top right) to control sounds, videos can be played in slow motion, Wi-Fi is only needed for the Featured List. iDojo continues to innovate by placing an invisible button in the App that launches a secret password Manager App. It is recommended to clear the App Cache in your phone Settings. Do not clear the App Data or you will loose your Passwords, Moves and Chapters. iDojo promises to be the best Self Defense mobile App by releasing meaningful upgrades in the future:-  In-app video recording and move analysis to allow users to record themselves, performing techniques, and use a video analysis service to provide feedback on their form, timing, and execution to offer personalized coaching tips based on the user's performance. Other future upgrades include:-  A community forum, Challenges and an AI Coach for training and gear.
</Text>

<Text style={ styles.chapters }>Chapters:</Text>
<Text style={ styles.title }>Add, Share, Edit, View, Delete and Import your own Chapters to the iDojo App. A Chapter is a collection of videos, audios, images and PDFs in any number and in any order. You can also share an individual Chapter image, a single video or a single pdf when viewing a chapter. Chapters can be shared and imported with the iDojo App and our free WheeShare App. Only single videos, images and PDFs can be shared externally and instructions are provided. Only iDojo zip files containing Chapters can be imported. Chapters are awesome for sharing lessons, courses, albums, events and more.
</Text>

<Text style={ styles.addMove }>Problems And Solutions:</Text>
<Text style={ styles.title }> Add, Share, Edit, View, Delete and Import your own Problems and Solutions into the wheeShare App. You can also share the Move image or images, a single video or a single pdf when viewing a move. Moves can only be shared and imported with the iDojo App, only single videos, images and PDFs can be shared externally and instructions are provided. Only iDojo zip files containing Moves can be imported. Awesome for sharing individual Self Defense stories, albums, events and more. </Text>

<Text style={ styles.fightersList }>Crosswords:</Text>
<Text style={ styles.title }>Add, Share, Edit, View, Delete and Import your own Chapters to the iDojo App. A Chapter is a collection of videos, audios, images and PDFs in any number and in any order. You can also share an individual Chapter image, a single video or a single pdf when viewing a chapter. Chapters can be shared and imported with the iDojo App and our free WheeShare App. Only single videos, images and PDFs can be shared externally and instructions are provided. Only iDojo zip files containing Chapters can be imported. Chapters are awesome for sharing lessons, courses, albums, events and more.
</Text>

<Text style={ styles.manuals }>Quizzes:</Text>
<Text style={ styles.title }>Add, Share, Edit, View, Delete and Import your own Chapters to the iDojo App. A Chapter is a collection of videos, audios, images and PDFs in any number and in any order. You can also share an individual Chapter image, a single video or a single pdf when viewing a chapter. Chapters can be shared and imported with the iDojo App and our free WheeShare App. Only single videos, images and PDFs can be shared externally and instructions are provided. Only iDojo zip files containing Chapters can be imported. Chapters are awesome for sharing lessons, courses, albums, events and more.
</Text>

<TouchableOpacity onPress={handlePress} style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="link">
  <Text style={{ color: '#007AFF', fontSize: 15, textDecorationLine: 'underline', fontStyle: "italic", fontWeight: '500' }}>View Privacy Policy</Text>
</TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    </ImageBackground>
  )
}


const styles = StyleSheet.create({
  imgBackground: { marginBottom:"5%",width: '100%', maxHeight: '95%', flex: 1, opacity: 1 },
  title: {
    fontSize: 15,
    fontWeight:'medium',
    color:'white',
    backgroundColor:'lightgrey',
    backgroundColor: 'rgba(211, 211, 211, 0.1)',
    marginLeft:19,
    marginRight:19,
    marginTop: 7,
    marginBottom: 12,
    padding: 5,
  },
  icon: { height: 76, elevation: 3, marginTop:38, textAlign: "center", zIndex:3 },
  buttonArea: { flex: 1 },
  addMove: {
    textDecorationLine: 'underline',
    textDecorationColor: '#f74646',
    color:'red',
    fontSize: 19,
    fontStyle: "italic",
    fontWeight:'600',
    marginLeft: 10,
  },
  movesList: {
    textDecorationLine: 'underline',
    textDecorationColor: '#92192d',
    color:'red',
    fontSize: 19,
    fontStyle: "italic",
    fontWeight:'600',
    marginLeft: 10,
  },
  fightersList: {
    textDecorationLine: 'underline',
    textDecorationColor: '#b8ca12',
    fontStyle: "italic",
    color:'yellow',
    fontSize: 19,
    fontWeight:'600',
    marginLeft: 10,
  },
  chapters: {
    textDecorationLine: 'underline',
    textDecorationColor: '#948b0b',
    fontStyle: "italic",
    color: '#948b0b',
    fontSize: 19,
    fontWeight:'700',
    marginLeft: 10,
  },
  manuals: {
    textDecorationLine: 'underline',
    textDecorationColor: '#0b942e',
    fontStyle: "italic",
    color:'green',
    fontSize: 19,
    fontWeight:'600',
    marginLeft: 10,
  },
  featured: {
    textDecorationLine: 'underline',
    textDecorationColor: 'silver',
    fontStyle: "italic",
    fontSize: 19,
    color:'silver',
    fontWeight:'600',
    marginLeft: 10,
  },
  freeyourmind: {
    textDecorationLine: 'underline',
    textDecorationColor: '#a30cc9',
    fontStyle: "italic",
    fontSize: 19,
    color:'purple',
    fontWeight:'600',
    marginLeft: 10,
  },
})