import { StyleSheet, Text, View, SafeAreaView, FlatList, Pressable } from 'react-native'
import React from 'react'
import problems from '../data/problems'
import { useNavigation } from '@react-navigation/native'

export default function ProblemsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, height: "100%", marginTop:25, backgroundColor: '#fff',}}>
      <View style={{backgroundColor: '#228B22', marginBottom:20, paddingBottom:10}}>
        <Text style={styles.title}>Problems & Soloutions</Text>
      </View>
      <View style={{flex:1}}>
          <FlatList
            data={problems}
            contentContainerStyle={{ paddingBottom: 57 }}
            renderItem={({ item, i }) => (
              <View
                key={item.title}
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

                <View style={{backgroundColor: '#acd4c4', marginTop:3}}>
                    <View style={styles.container}>
                        <View style={styles.row}>
                            <Pressable 
                              style={styles.button}
                              onPress={()=> navigation.navigate('ProblemComponent', {problem: item})}> 
                              <Text style={{color: "#228B22",marginTop: 4, fontWeight:"700",fontSize: 12}}>{item.title}</Text>
                            </Pressable>
                            <Text style={styles.stext}> difficulty: {item.difficulty} </Text>
                        </View>
                        <Text style={styles.mtext}>Type: {item.type}</Text>
                        <Text style={styles.text}> {item.shortdesc} </Text>
                    </View>
                </View>

            </View>
            )}
          />
          </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        flex: 1,
        backgroundColor:'#acd4c4',
        marginRight: 3,
        marginTop: 3
    },
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
        marginTop: 4,
    },
    header: {
        fontSize: 24, 
        color:'#fff',
        fontWeight:"bold",
        backgroundColor:'#228B22',
        fontSize: 18,
        lineHeight: 28,
        textAlign:"center",
        marginTop: 3,
        marginLeft:3,
        marginRight: 3,
    },
    stext: { 
        color:'#acd4c4',
        fontWeight:"bold",
        backgroundColor:'#228B22',
        fontSize: 12,
        lineHeight: 20,
        marginTop: 3,
        marginLeft:3,
        marginRight: 3,
    },
    row: {
        color:'#fff',
        fontWeight:"300",
        backgroundColor:'#228B22',
        fontSize: 13,
        lineHeight: 19,
        flexDirection: "row",
        textAlign:"left",
        marginLeft: 3,
        justifyContent: "space-between",
    },
    button: {
        alignItems: 'center',
        flexDirection: "row",
        justifyContent: 'center',
        paddingVertical: 2,
        paddingHorizontal: 3,
        borderRadius: 6,
        elevation: 5,
        backgroundColor: '#acd4c4',
        marginBottom: 5,
        marginLeft: 5,
        marginTop:5,
        height: 38,
        fontWeight: 'bold', 
    },
    text: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '400',
        marginTop: 0,
        marginLeft:3,
        backgroundColor: 'lightgray',
        color: '#000',
    },
    mtext: {
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '400',
        marginTop: 0,
        marginLeft:3,
        backgroundColor: 'lightgray',
        color: '#000',
    },
})