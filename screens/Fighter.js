import { StyleSheet, Text, View, Image, ScrollView, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, {useMemo} from 'react'

const images = require.context('../assets/fighters', true, /\.png$/);

const imageSources = images.keys().map((key) => images(key));

export default function Fighter({ fighter, offset }) {
  const bgColorPalette = ['khaki', 'sandybrown', 'bisque', 'honeydew', 'darkkhaki', 'oldlace', 'papayawhip', 'lavender', 'wheat', 'mintcream', 'aliceblue', 'goldenrod', 'tan', 'lightsteelblue', 'burlywood', 'palegoldenrod', 'beige', 'azure'];


  const assignedColors = useMemo(() => {
    const randomColor = () => bgColorPalette[Math.floor(Math.random() * bgColorPalette.length)];    
    return {
      root: randomColor(),
      quotes: (fighter?.desc || []).map(() => randomColor()),
      moves: (fighter?.moves || []).map(() => randomColor())
    };
  }, [fighter]);


  if (!fighter) return null;


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: assignedColors.root }}>
      <StatusBar barStyle="dark-content"/>
      <ScrollView style={{flex: 1, marginBottom: 38, marginTop: 7, padding: 15}}>

        <Text style={{ backgroundColor:'#2f4f4f', color: "crimson", textAlign:"center", fontSize: 21, marginBottom: 7, marginTop: 7, fontWeight: "500", borderRadius: 4 }}>
          {fighter.name}
        </Text>

        <View style={{ marginBottom: 2, textAlign: "center", alignItems: 'center', justifyContent: 'center'}}>
          <Image
            source={typeof fighter.avatar === 'number' ? fighter.avatar : { uri: fighter.avatar }}
            resizeMode="contain"
            style={styles.fighterAvatar}
          />
        </View>

        {fighter.desc.map((quote, index) => {
          return (
            <View key={`quote-${index}`} style={{borderRadius: 19, padding: 12}}>
              <Text style={{backgroundColor: assignedColors.quotes[index] || 'wheat', fontSize: 15, color: "black", fontWeight: "600", padding: 7, borderRadius: 12}}>{quote}</Text>
              {index === fighter.desc.length - 1  && ( <View style={{marginTop: -12, marginBottom: 12, flex: 1 }}> 
                <Image source={require('../assets/silverdivider.png')} style={styles.divider} resizeMode='contain'/>
              </View> ) }
            </View>
          );
        })}

        {fighter.moves.map((move, index) => {
          return ( <View  key={move.id || `move-${index}`} style={{marginBottom: 7, borderRadius: 7}}>
            <View style={{backgroundColor: assignedColors.moves[index] || 'bisque', fontSize: 15, borderRadius: 7, padding: 4}}>
              <Text style={{ color: "black", fontWeight: "600", fontSize: 16, marginBottom: 6 }}>{move.title || "Signature Move"}</Text>
              <Image source={typeof move.img === 'number' ? move.img : { uri: move.img }} resizeMode="contain" style={styles.fighterImage} />
              <Text style={{color: "black", fontWeight: "500", padding: 7, fontSize: 14}}> {move.desc} </Text>
            </View>
          </View> );
        })}
    </ScrollView>
  </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  fighterImage: { borderRadius: 12, alignSelf: 'flex-start', margin: 0, height: 475, width: "100%"},
  fighterAvatar: { borderRadius: 12, marginBottom: -7, marginTop: 0, alignSelf: 'center', height: 380, width: 228}, 
  divider: {  width: '100%', height: 49, alignSelf: "center", paddingVertical: 2, opacity: 1 }
});