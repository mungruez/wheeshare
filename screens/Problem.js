import { StyleSheet, Text, View, SafeAreaView, FlatList } from 'react-native'
import React from 'react'

//useEffect or prop get number of images the problem has and the number of images for solution 
export default function Problem({ route, navigation }) {
  const { problem } = route.params;

  return (
    <SafeAreaView style={{ flex: 1, height: "100%", marginTop:25}}>
        <View style={{flex:1, marginTop:0}}>
          <FlatList
            data={problem.soloutions}
            contentContainerStyle={{ paddingBottom: 57 }}
            renderItem={({ item, index }) => (
              <View
                key={index}
                style={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  margin: 5,
                  flexDirection: "column",
                  alignItems: "left",
                  marginLeft:"1",
                  marginRight:"1",
                  width:"auto",
                  height:"auto",
                  borderColor:"#f2f2f2",
                  borderWidth:.5,
                }}
              >
                 {index==0 ? 
                 (<View> 
                    <View style={{backgroundColor: '#228B22', marginBottom:20, paddingBottom:10}}>
                        <Text style={styles.title}>{problem.pnum}.{problem.title}</Text>
                    </View>
        
                    <View style={{backgroundColor: '#fff', }}>
                        <View style={styles.row}>
                            <Text style={styles.header}>Type: {problem.type}</Text>
                            <Text style={styles.header}>Difficulty: {problem.difficulty}</Text> 
                        </View>
                        <Text style={styles.text}> {problem.desc} </Text>
                    </View> 
                 </View>) : <></>}

                 <View style={{backgroundColor: '#fff', marginTop:5}}>
                    {index < problem.soltitles.length ? <Text style={styles.header}>Soloution: {problem.soltitles[index]}</Text> : <></>}
                    
                    {index < problem.soldescs.length ?  <Text style={styles.text}> {problem.soldescs[index]} </Text> : <></>} 
                    <Text style={styles.sol}>{item}</Text>
                 </View>
              </View>
            )}
          />
          </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    title: {
        fontSize: 30, 
        color:'#fff',
        borderColor:'#000',
        fontWeight:"bold",
        borderWidth: 2,
        backgroundColor:'#228B22',
        fontSize: 24,
        lineHeight: 32,
        textAlign:"center",
        marginTop: 4
      },
      header: {
          fontSize: 30, 
          color:'#fff',
          fontWeight:"bold",
          backgroundColor:'#228B22',
          fontSize: 18,
          lineHeight: 28,
          textAlign:"center",
          marginTop: 4,
          marginLeft:8
        },
        sol: {
            fontSize: 14,
              lineHeight: 19,
              fontWeight: '500',
              marginTop: 7,
              marginLeft: 7,
              color: '#228B22',
              backgroundColor: '#000',
              borderColor:"#000",
              borderWidth: 3,
              flexDirection: "column",
          },
          text: {
            fontSize: 17,
            lineHeight: 24,
            fontWeight: 'bold',
            marginTop: 4,
            marginLeft:8,
            backgroundColor: 'lightgray',
            color: '#000'
          },
})