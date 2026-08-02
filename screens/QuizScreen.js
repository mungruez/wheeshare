import { StyleSheet, Text, SafeAreaView, View, Pressable } from "react-native";
import React, { useState, useEffect, useLayoutEffect } from "react";
import questions from "../data/questions";
import { AntDesign } from "@expo/vector-icons";

const QuizScreen = ({ route, navigation }) => {
  const { qnum } = route.params;
  const data = questions;
  let totalQuestions = qnum;
  
  const [points, setPoints] = useState(0);
  const [index, setIndex] = useState(0);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [qarr, setQarr] = useState([]);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [counter, setCounter] = useState(15);

  let interval = null;
  const progressPercentage = Math.floor((index/totalQuestions) * 100);

  useLayoutEffect(()=> {
    navigation.setOptions({
      headerShown: false,
    });

    if(qnum > data.length) { 
        qnum=data.length;
    }
    
    totalQuestions = qnum;
    for(let ri=0; ri<qnum; ri++) {
      let rand=Math.floor(Math.random() * (data.length-1));
      while(qarr.includes(rand)) rand=Math.floor(Math.random() * (data.length-1));
      qarr.push(rand);
    }
  }, []);


  useEffect(() => {
    if (selectedAnswerIndex !== null) {
      if (selectedAnswerIndex === currentQuestion?.correctAnswerIndex) {
        setPoints((points) => points + 10);
        setAnswerStatus(true);
        answers.push({ 
          question: qarr[index] + 1, 
          answer: true, 
          q: currentQuestion.question,  
          explanation: currentQuestion.explanation, 
          corra: currentQuestion.correctAnswerIndex, 
          curra: [currentQuestion.options[0].answer, currentQuestion.options[1].answer, currentQuestion.options[2].answer, currentQuestion.options[3].answer ], 
          a: selectedAnswerIndex });
      } else {
        setAnswerStatus(false);
        answers.push({ 
          question: qarr[index] + 1, 
          answer: false, 
          q: currentQuestion.question, 
          explanation: currentQuestion.explanation, 
          corra: currentQuestion.correctAnswerIndex, 
          curra: [currentQuestion.options[0].answer, currentQuestion.options[1].answer, currentQuestion.options[2].answer, currentQuestion.options[3].answer ], 
          a: selectedAnswerIndex 
        });
      }
    }
  }, [selectedAnswerIndex]);


  useEffect(() => {
    const myInterval = () => {
      if (counter >= 1) {
        setCounter((state) => state - 1);
      }
      if (counter === 0) {
        setIndex(index + 1);
        setCounter(15);
      }
    };

    interval = setTimeout(myInterval, 1007);
    // clean up
    return () => {
      clearTimeout(interval);
    };
  }, [counter]);


  useEffect(() => {
    if (index + 1 > qarr.length || answers.length==qnum) {
      clearTimeout(interval)
      navigation.navigate("QuizResults", {
        answers: answers,
        points: points,
      });
    } else if (!interval) {
      setCounter(15);
    }

    setSelectedAnswerIndex(null);
    setAnswerStatus(null);
  }, [index]);


  const currentQuestion = data[qarr[index]];

  return (
    <SafeAreaView>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10 }}>
        <Text>Quiz Challenge</Text>
        <Pressable style={{ padding: 10, backgroundColor: "green", borderRadius: 20 }}>
          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }} >{counter}</Text>
        </Pressable>
      </View>

      <View style={{flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 10}}>
        <Text>Your Progress</Text>
        <Text>({index}/{totalQuestions}) questions answered</Text>
      </View>

      <View style={{ backgroundColor: "white", width: "100%", flexDirection: "row", alignItems: "center", height: 10, borderRadius: 20, justifyContent: "center", marginTop: 20, marginLeft: 10 }}>
        <Text style={{ backgroundColor: "#FFC0CB", borderRadius: 12, marginTop: 20, position: "absolute", left: 0, height: 10, right: 0, width: `${progressPercentage}%` }} />
      </View>

      <View style={{ marginTop: 30, backgroundColor: "#F0F8FF", padding: 10, borderRadius: 6 }} >
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
          {currentQuestion?.question}
        </Text>
        <View style={{ marginTop: 12 }}>
          {currentQuestion?.options.map((item, index) => (
            <Pressable onPress={() => selectedAnswerIndex === null && setSelectedAnswerIndex(index)} key={item.options}
              style={ selectedAnswerIndex === index && index === currentQuestion.correctAnswerIndex ? styles.correctAnswer
                : selectedAnswerIndex != null && selectedAnswerIndex === index ? styles.incorrectAnswer
                : styles.unselectedAnswer
              }
            >
              {selectedAnswerIndex === index &&
            index === currentQuestion.correctAnswerIndex ? (
              <AntDesign style={styles.correctAnswerIndex} name="check" size={20} color="white" />
              ) : selectedAnswerIndex != null &&
                selectedAnswerIndex === index ? (
                <AntDesign style={styles.options} name="closecircle" size={20} color="white" />
              ) : (<Text style={styles.options}>{index === 0 ? "A" : index === 1 ? "B" : index === 2 ? "C" : "D"}</Text>)}

              <Text style={{ marginLeft: 10 }}>{item.answer}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={answerStatus === null ? null : { marginTop: 45, backgroundColor: "#F0F8FF", padding: 10, borderRadius: 7, height: 120 }}>
        {answerStatus === null ? null : (
          <Text style={ answerStatus == null ? null : { fontSize: 17, textAlign: "center", fontWeight: "bold" }}>
            {!!answerStatus ? "Correct Answer" : "Wrong Answer"}
          </Text>
        )}

        {index + 1 >= qarr.length ? (
          <Pressable onPress={() => navigation.navigate("QuizResults", { points: points,nanswers: answers}) }
            style={{backgroundColor: "green", padding: 10, marginTop: 20, borderRadius: 6}} >
            <Text style={{ color: "white" }}>Done</Text>
          </Pressable>
        ) : answerStatus === null ? null : (
          <Pressable onPress={() => setIndex(index + 1)} style={{backgroundColor: "green", padding: 10, marginTop: 20, borderRadius: 6}}>
            <Text style={{ color: "white" }}>Next Question</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
};

export default QuizScreen;

const styles = StyleSheet.create({
  options: {borderColor: "#228B22", textAlign: "center", borderWidth: 0.5, width: 40, height: 40, borderRadius: 20, padding: 10},
  correctAnswerIndex: { borderColor: "#00FFFF", textAlign: "center", borderWidth: 0.5, width: 40, height: 40, borderRadius: 20, padding: 10},
  correctAnswer: { borderColor: "#00FFFF", textAlign: "center", borderWidth: 0.5, width: 40, height: 40, borderRadius: 20, padding: 10},
  incorrectAnswer : { flexDirection: "row", alignItems: "center", borderWidth: 0.5, borderColor: "#228B22", marginVertical: 10, backgroundColor: "red", borderRadius: 20},
  unselectedAnswer: { flexDirection: "row", alignItems: "center", borderWidth: 0.5, borderColor: "#228B22", marginVertical: 10, borderRadius: 20}
});