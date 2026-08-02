import { Image,StyleSheet,SafeAreaView,View,Text,ScrollView,TextInput,TouchableOpacity,ImageBackground,StatusBar } from 'react-native'
import React, {useLayoutEffect} from 'react'
import { useNavigation } from '@react-navigation/native'

export default function HomeScreen() {
  const navigation = useNavigation();

  useLayoutEffect(()=> {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  return (
    <ImageBackground style={ styles.imgBackground } imageStyle={{ opacity: 0.9 }} resizeMode='cover' source={require('../assets/homescreen.jpg')}>
      <StatusBar barStyle="dark-content"/>
      <SafeAreaView style={{ flexDirection:"column", height: "100%", marginTop:19, opacity: 1}}>
         
        <View style={{backgroundColor: '#2f4f4f', flexDirection:"row", marginHorizontal:3, marginVertical:19, textAlign:"center", justifyContent:"space-between"}}>
          <Text style={{color: "lightgray", fontWeight:"700",fontSize: 23, textAlign:"center", marginLeft:38, marginTop:10}}>Main Menu</Text>
          <ImageBackground style={ styles.icon } imageStyle={{ opacity: 1 }} resizeMode='contain' source={require('../assets/icon.jpg')} /> 
        </View>

        <ScrollView style={{ flexDirection:"column", marginTop: 30}}>
            <TouchableOpacity
              style={styles.buttonimage}
              onPress={()=> navigation.navigate('Quizzes')}>
              <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>QUIZZES</Text>
              </ImageBackground>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.buttonimage}
              onPress={()=> navigation.navigate('Crosswords')}>
              <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>CROSSWORDS</Text>
              </ImageBackground>
            </TouchableOpacity>

             <TouchableOpacity
              style={styles.buttonimage}
              onPress={()=> navigation.navigate('FightersList')}>
              <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>FIGHTERS LIST</Text>
              </ImageBackground>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.buttonimage}
              onPress={()=> navigation.navigate('About')}>
              <ImageBackground style={{ width: "100%", height: "98%", alignSelf: "center", justifyContent: "center", alignItems: "center", flex: 1 }} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>ABOUT</Text>
              </ImageBackground>
            </TouchableOpacity> 
          </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
    searchcontainer: {
      flexDirection: 'row',
      marginTop: "57",
      alignItems:'center', 
      justifyContent:'center', 
      alignSelf: 'center',
      width:'100%',
      marginBottom:"76",
      padding: 5,
      
    },
    search: {
      flexDirection: 'row',
      flex: 1,
      marginLeft: "19",
      fontSize: 19,
      padding: "8", 
      alignItems:'center', 
      justifyContent:'center', 
      alignSelf: 'center',
    },
    title: {
      fontSize: 30, 
      padding: 30,
      color:'#000',
      borderColor:'#000',
      fontWeight:"400",
      borderWidth: 2,
      backgroundColor:'#228B22'
    },
    button: {
      alignItems: 'center',
      flexDirection: "row",
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 5,
      elevation: 3,
      color: "#fff",
      backgroundColor: '#228B22',
      marginBottom: 7,
      marginLeft:19,
      height: 57,
      width: 348,
      fontWeight: 'bold',
      opacity:3 
    },
    buttontext: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '800',
      letterSpacing: 0.25,
      marginTop: 4,
      color: 'white',
    },
    imgBackground: {
      width: '100%',
      height: '100%',
      maxHeight:"96%",
      flex: 1,
      opacity: .9, 
    },
    imgBackground2: {
      width: '100%',
      height: '100%',
      flex: 1,
      opacity: .9, 
      margin:0,
      marginBottom:-2,
      padding:2,
      backgroundColor:"transparent",
      justifyContent:"flex-end"
    },icon: { height: 76, width: 76, opacity: 1, marginTop: 3, textAlign: "center", marginBottom: 9 },
  
  });