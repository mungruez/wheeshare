import { StyleSheet, Text, View, Image, Pressable, ImageBackground, SafeAreaView } from "react-native";
import React, { useState } from "react"; 
import CheckBox from "./CheckBox";
import { useNavigation } from "@react-navigation/native";

const StartQuizScreen = () => {
    const navigation = useNavigation();
    const [ten, setTen] = useState(false); 
    const [twenty, setTwenty] = useState(false); 
    const [thirty, setThirty] = useState(false);
    const [fourty, setFourty] = useState(false);

    const handleTenClick = () => {
      setTen(!ten);
      setTwenty(false);
      setThirty(false);
      setFourty(false);
    }

    const handleTwentyClick = () => {
      setTen(false);
      setTwenty(!twenty);
      setThirty(false);
      setFourty(false);
    }

    const handleThirtyClick = () => {
      setTen(false);
      setTwenty(false);
      setThirty(!thirty);
      setFourty(false);
    }

    const handleFourtyClick = () => {
      setTen(false);
      setTwenty(false);
      setThirty(false);
      setFourty(!fourty);
    }

    const getQnum = () => {
      if(ten) return 10;
      if(twenty) return 20;
      if(thirty) return 30;
      if(fourty) return 40;
      return 5;
    }

  return (
    <ImageBackground style={ styles.imgBackground } resizeMode='cover' source={require('../assets/homeBackground.png')}>
    <SafeAreaView style={{marginTop: 25, height:"100%"}}>
      <Image resizeMode="stretch" source={require('../assets/greenQuiz.jpg')} style={{ marginTop:25, borderWidth: 2, borderColor: '#9a9aa1', width: "100%", height: "27%", borderRadius: 5 }} />

      <View style={{ padding: 10, flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <Text style={styles.rulesHeader}>QUIZ RULES</Text>

        <View style={{ padding: 10, backgroundColor: "#ff7f7f", borderRadius: 6, marginTop: 15, borderWidth: 2, borderColor: "#9a9aa1"}}>
          <View style={{flexDirection: "row", alignItems: "center", marginVertical: 5}}>
            <Text style={{ color: "white" }}>•</Text>
            <Text style={styles.ruleText}>For each correct answer you get 5 points</Text>
          </View>

          <View style={{flexDirection: "row", alignItems: "center", marginVertical: 5}}>
            <Text style={{ color: "white" }}>•</Text>
            <Text style={styles.ruleText}>There is no negative marking for wrong answer</Text>
          </View>

          <View style={{flexDirection: "row", alignItems: "center", marginVertical: 5}}>
            <Text style={{ color: "white" }}>•</Text>
            <Text style={styles.ruleText}>Each question has a time limit of 15 sec</Text>
          </View>

          <View style={{flexDirection: "row", alignItems: "center", marginVertical: 5}}>
            <Text style={{ color: "white" }}>•</Text>
            <Text style={styles.ruleText}>You should answer all the questions compulsarily</Text>
          </View>
        </View>
      </View>

      <Text style={{marginLeft: 2, color: "#001414", fontSize: 15, fontWeight: "600", textAlign: "center"}}>Total Questions</Text>
      <View style={styles.container}> 
        <CheckBox onPress={handleTenClick} title="10" isChecked={ten} /> 
        <CheckBox onPress={handleTwentyClick} title="20" isChecked={twenty} /> 
        <CheckBox onPress={handleThirtyClick} title="30" isChecked={thirty} /> 
        <CheckBox onPress={handleFourtyClick} title="40" isChecked={fourty} />
      </View>

      <Pressable onPress={() => navigation.navigate("PythonQuiz", {qnum: getQnum()})}
        style={styles.startQuizBtn}>
        <Text style={{color:"white", fontWeight: "700", textAlign:"center"}}>Start Quiz</Text>
      </Pressable>
    </SafeAreaView>
    </ImageBackground>
  );
};

export default StartQuizScreen;

const styles = StyleSheet.create({
  container: { flexDirection: "row", flex: 1, maxHeight: 57, justifyContent: "center", alignItems: "center", marginBottom: 19},
  imgBackground: { width: '100%', height: '100%', flex: 1, opacity: 1},
  rulesHeader: {textAlign: "center", color: "#228B22", fontSize: 22, fontWeight: "600", backgroundColor: "#d4d4d4", marginBottom: 50, borderRadius:5, borderWidth: 1, borderColor: "#9a9aa1", marginTop: 10},
  ruleText: {marginLeft: 4, color: "#722F37", fontSize: 15, fontWeight: "500"},
  startQuizBtn: {backgroundColor: "#228B22", padding: 10, borderRadius: 5, marginTop: 20, width: "50%", alignSelf: "center"}
});