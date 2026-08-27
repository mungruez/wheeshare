import { StyleSheet, Text, View, Image, Pressable, ImageBackground, SafeAreaView , FlatList, ScrollView } from "react-native";
import React, { useState, useEffect, useLayoutEffect } from "react"; 
import CheckBox from "./CheckBox";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from '@expo/vector-icons'; 

export default function WheeQuizScreen({ data, onBackToDashboard}) {
  const [ten, setTen] = useState(false); 
  const [twenty, setTwenty] = useState(false); 
  const [thirty, setThirty] = useState(false);
  const [fourty, setFourty] = useState(false);
  const [qmode, setQmode] = useState("start"); 
  const [qnum, setQnum] = useState(5); 
  const [points, setPoints] = useState(0);
  const [index, setIndex] = useState(0);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [qarr, setQarr] = useState([]);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [counter, setCounter] = useState(15);
  const navigation = useNavigation();
  
  let interval = null;
  const totalQuestionsCount = qnum > 0 ? qnum : 1;
  const progressPercentage = Math.floor((index / totalQuestionsCount) * 100);

  const handleTenClick = () => { setTen(!ten); setTwenty(false); setThirty(false); setFourty(false); };
  const handleTwentyClick = () => { setTen(false); setTwenty(!twenty); setThirty(false); setFourty(false); };
  const handleThirtyClick = () => { setTen(false); setTwenty(false); setThirty(!thirty); setFourty(false); };
  const handleFourtyClick = () => { setTen(false); setTwenty(false); setThirty(false); setFourty(!fourty); };

  const getQnum = () => {
    if (ten) return 10;
    if (twenty) return 20;
    if (thirty) return 30;
    if (fourty) return 40;
    return 5;
  };
  
  const getInferredType = (question) => {
    if (!question || !Array.isArray(question.options)) return "long";
    
    const optionsCount = question.options.filter(option => option?.trim()).length;
    if (optionsCount === 1) return "long";
    if (optionsCount === 2) return "truefalse";
    if (optionsCount === 4) return "single";
    if (optionsCount > 4)  return "multiple";
    
    return "single";
  };

  const getDisplayOptions = (question) => Array.isArray(question?.options)
    ? question.options.map((item, index) => ({ item, index })).filter(({ item }) => item?.trim())
    : [];
  
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  
  const initializeQuizArray = (selectedNum) => {
    if (!Array.isArray(data) || data.length === 0) return;
    let finalCount = selectedNum;
    if (finalCount > data.length) finalCount = data.length;
    setQnum(finalCount);

    const randomIndices = [];
    const maxBound = data.length;

    for (let ri = 0; ri < finalCount; ri++) {
      let rand = Math.floor(Math.random() * maxBound);
      while (randomIndices.includes(rand)) {
        rand = Math.floor(Math.random() * maxBound);
      }
      randomIndices.push(rand);
    }
    setQarr(randomIndices);
    setIndex(0);
    setPoints(0);
    setAnswers([]);
    setCounter(15);
    setQmode("quiz");
  };


  const currentQuestion = Array.isArray(data) && qarr.length > 0 && index < qarr.length ? data[qarr[index]] : null;


  useEffect(() => {
    if (selectedAnswerIndex !== null && currentQuestion) {
      const qType = getInferredType(currentQuestion);
      let isCorrect = false;

      if (qType === "single" || qType === "truefalse") {
        isCorrect = selectedAnswerIndex === currentQuestion.correctAnswerIndex;
      } else if (qType === "multiple") {
        const selections = Array.isArray(selectedAnswerIndex) ? selectedAnswerIndex : [];
        const targets = Array.isArray(currentQuestion.correctAnswerIndex) ? currentQuestion.correctAnswerIndex : [];
          isCorrect = selections.length === targets.length && selections.every(v => targets.includes(v));
      } else if (qType === "long") {
        const userText = typeof selectedAnswerIndex === "string" ? selectedAnswerIndex.trim().toLowerCase() : "";
        const targetText = String(currentQuestion.correctAnswerIndex).trim().toLowerCase();
        isCorrect = userText === targetText && targetText !== "";
      }
      
      if (isCorrect) {
        setPoints((prevPoints) => prevPoints + 10);
        setAnswerStatus(true);
      } else {
        setAnswerStatus(false);
      }

      const newAnswerRecord = {
        question: index + 1,
        answer: isCorrect,
        q: currentQuestion.title || currentQuestion.q || "Question Title",
        explanation: currentQuestion.explanation || "",
        corra: currentQuestion.correctAnswerIndex,
        curra: Array.isArray(currentQuestion.options) ? [...currentQuestion.options] : [],
        a: selectedAnswerIndex,
        inferredType: qType
      };

      setAnswers((prevAnswers) => [...prevAnswers, newAnswerRecord]);
    }
  }, [selectedAnswerIndex]);

  
 
  
  useEffect(() => {
    if (qmode !== "quiz") return;

    const myInterval = () => {
      if (counter >= 1) {
        setCounter((state) => state - 1);
      }
      if (counter === 0) {
        if (selectedAnswerIndex === null && currentQuestion) {
          const qType = getInferredType(currentQuestion);
          let timeoutAns = -1;
          if (qType === "multiple") timeoutAns = [];
          if (qType === "long") timeoutAns = "";

          const timeoutRecord = {
            question: index + 1,
            answer: false,
            q: currentQuestion.title || currentQuestion.q || "Question Title",
            explanation: currentQuestion.explanation || "Time limit exceeded.",
            corra: currentQuestion.correctAnswerIndex,
            curra: Array.isArray(currentQuestion.options) ? [...currentQuestion.options] : [],
            a: timeoutAns,
            inferredType: qType
          };
          setAnswers((prevAnswers) => [...prevAnswers, timeoutRecord]);
        }
        setIndex((prevIndex) => prevIndex + 1);
        setCounter(15);
      }
    };
  
    interval = setTimeout(myInterval, 1007);
    return () => {
      clearTimeout(interval);
    };
  }, [counter, qmode]);
   


  useEffect(() => {
    if (qmode !== "quiz") return;

    if (index >= qarr.length || (answers.length === qnum && qnum > 0)) {
      clearTimeout(interval);
      setQmode("results");
    } else {
      setCounter(15);
    }
    setSelectedAnswerIndex(null);
    setAnswerStatus(null);
  }, [index, qarr.length]);

 

  if (qmode === "start") {
    return (
      <ImageBackground style={styles.imgBackground} resizeMode='cover' source={require('../assets/quizzes/quizlistbg.png')}>
        <SafeAreaView style={{ marginTop: 25, height: "100%" }}>
          <Image resizeMode="stretch" source={require('../assets/quizzes/redquiztitle.jpg')} style={{ marginTop: 25, borderWidth: 2, borderColor: '#9a9aa1', width: "100%", height: "27%", borderRadius: 5 }} />

          <View style={{ padding: 10, flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.rulesHeader}>QUIZ RULES</Text>

            <View style={{ padding: 10, backgroundColor: "#ff7f7f", borderRadius: 6, marginTop: 15, borderWidth: 2, borderColor: "#9a9aa1" }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 5 }}>
                <Text style={{ color: "white", marginRight: 6 }}>•</Text>
                <Text style={styles.ruleText}>For each correct answer you get 10 points</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 5 }}>
                <Text style={{ color: "white", marginRight: 6 }}>•</Text>
                <Text style={styles.ruleText}>There is no negative marking for wrong answers</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 5 }}>
                <Text style={{ color: "white", marginRight: 6 }}>•</Text>
                <Text style={styles.ruleText}>Each question has a time limit of 15 seconds</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 5 }}>
                <Text style={{ color: "white", marginRight: 6 }}>•</Text>
                <Text style={styles.ruleText}>You should answer all the questions compulsarily</Text>
              </View>
            </View>
          </View>

          <Text style={{ marginLeft: 2, color: "#001414", fontSize: 15, fontWeight: "600", textAlign: "center", marginBottom: 5 }}>Total Questions</Text>
          <View style={styles.container}> 
            <CheckBox onPress={handleTenClick} title="10" isChecked={ten} /> 
            <CheckBox onPress={handleTwentyClick} title="20" isChecked={twenty} /> 
            <CheckBox onPress={handleThirtyClick} title="30" isChecked={thirty} /> 
            <CheckBox onPress={handleFourtyClick} title="40" isChecked={fourty} />
          </View>

          <Pressable onPress={() => initializeQuizArray(getQnum())} style={styles.startQuizBtn}>
            <Text style={{ color: "white", fontWeight: "700", textAlign: "center" }}>Start Quiz</Text>
          </Pressable>
        </SafeAreaView>
      </ImageBackground>
    );
  }


  if (qmode === "quiz" && currentQuestion) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10 }}>
          <Pressable onPress={() => { if (onBackToDashboard) {onBackToDashboard();}}} style={styles.closeIconContainer} >
          <AntDesign name="close" size={22} color="red" />
        </Pressable>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b" }}>Quiz Challenge</Text>
          <Pressable style={{ padding: 10, backgroundColor: "green", borderRadius: 20, minWidth: 45 }}>
            <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }} >{counter}</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 10 }}>
          <Text style={{ fontSize: 13, color: "#64748b" }}>Your Progress</Text>
          <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>({index}/{totalQuestions}) questions answered</Text>
        </View>

        <View style={{ backgroundColor: "#e2e8f0", width: "95%", height: 10, borderRadius: 20, marginTop: 15, marginLeft: 10, overflow: "hidden", position: "relative" }}>
          <View style={{ backgroundColor: "#FFC0CB", borderRadius: 12, position: "absolute", left: 0, top: 0, bottom: 0, width: `${progressPercentage}%` }} />
        </View>

        <View style={{ marginTop: 25, marginHorizontal: 10, backgroundColor: "#F0F8FF", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#cbd5e1" }} >
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#0f172a", textAlign: "center", marginBottom: 15 }}>
           {currentQuestion?.q || currentQuestion?.title || "Question Prompt Missing"}
          </Text>
          
          <View style={{ marginTop: 6, gap: 10 }}>
            {getInferredType(currentQuestion) === "long" ? (
              <View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type your response here..."
                  editable={answerStatus === null}
                  value={typeof selectedAnswerIndex === 'string' ? selectedAnswerIndex : ""}
                  onChangeText={(txt) => answerStatus === null && setSelectedAnswerIndex(txt)}
                  multiline
                />
                {answerStatus === null && (
                  <Pressable 
                    onPress={() => {
                      if (typeof selectedAnswerIndex === 'string' && selectedAnswerIndex.trim() !== "") {
                        setSelectedAnswerIndex(selectedAnswerIndex);
                      }
                    }} 
                    style={styles.compositeSubmitBtn}
                  >
                    <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Submit Answer</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <>
                {getDisplayOptions(currentQuestion).map(({ item, index: optIdx }) => {
                  const totalOpts = getDisplayOptions(currentQuestion).length;
                  const isMultiple = totalOpts > 4;
                  
                  const isSelected = isMultiple
                    ? (Array.isArray(selectedAnswerIndex) && selectedAnswerIndex.includes(optIdx))
                    : selectedAnswerIndex === optIdx;

                  let optionStyle = styles.unselectedAnswer;
                  if (isSelected) {
                    optionStyle = isMultiple ? styles.selectedMultipleAnswer : styles.incorrectAnswer;
                  }

                  if (answerStatus !== null) {
                    if (isMultiple) {
                      const correctSet = Array.isArray(currentQuestion.correctAnswerIndex) ? currentQuestion.correctAnswerIndex : [];
                      if (correctSet.includes(optIdx)) optionStyle = styles.correctAnswer;
                    } else {
                      if (optIdx === currentQuestion.correctAnswerIndex) optionStyle = styles.correctAnswer;
                    }
                  }

                  return (
                    <Pressable 
                      key={`opt-${optIdx}-${item}`}
                      disabled={answerStatus !== null || (!isMultiple && selectedAnswerIndex !== null)}
                      onPress={() => {
                        if (isMultiple) {
                          setSelectedAnswerIndex((prev) => {
                            const arr = Array.isArray(prev) ? prev : [];
                            return arr.includes(optIdx) ? arr.filter(i => i !== optIdx) : [...arr, optIdx];
                          });
                        } else {
                          setSelectedAnswerIndex(optIdx);
                        }
                      }} 
                      style={optionStyle}
                    >
                      {answerStatus !== null && ((!isMultiple && optIdx === currentQuestion.correctAnswerIndex) || (isMultiple && Array.isArray(currentQuestion.correctAnswerIndex) && currentQuestion.correctAnswerIndex.includes(optIdx))) ? (
                        <AntDesign style={styles.correctAnswerIndex} name="check" size={20} color="white" />
                      ) : answerStatus !== null && isSelected ? (
                        <AntDesign style={styles.options} name="closecircle" size={20} color="white" />
                      ) : (
                        <Text style={styles.options}>
                          {isMultiple ? (isSelected ? "☑" : "☐") : (optIdx === 0 ? "A" : optIdx === 1 ? "B" : optIdx === 2 ? "C" : "D")}
                        </Text>
                      )}
                      <Text style={{ marginLeft: 10, fontSize: 14, color: "#334155", fontWeight: "600", flex: 1 }}>{item}</Text>
                    </Pressable>
                  );
                })}

                {getInferredType(currentQuestion) === "multiple" && answerStatus === null && (
                  <Pressable 
                    onPress={() => {
                      if (Array.isArray(selectedAnswerIndex)) {
                        setSelectedAnswerIndex([...selectedAnswerIndex]); 
                      } else {
                        setSelectedAnswerIndex([]);
                      }
                    }} 
                    style={styles.compositeSubmitBtn}
                  >
                    <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Submit Selections</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>

        <View style={answerStatus === null ? null : { marginTop: 25, marginHorizontal: 10, backgroundColor: "#F0F8FF", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" }}>
          {answerStatus === null ? null : (
            <Text style={{ fontSize: 15, textAlign: "center", fontWeight: "bold", color: answerStatus ? "green" : "red" }}>
              {!!answerStatus ? "✓ Correct Answer" : "✗ Wrong Answer"}
            </Text>
          )}

          {/* Displays target verification string text block specifically for essays */}
          {answerStatus !== null && getInferredType(currentQuestion) === "long" && (
            <Text style={{ fontSize: 13, textAlign: 'center', marginVertical: 4, color: '#334155', fontWeight: '600' }}>
              Expected Answer: "{currentQuestion.correctAnswerIndex}"
            </Text>
          )}

          {answerStatus !== null && currentQuestion?.explanation ? (
            <Text style={{ fontSize: 12, color: "#475569", fontStyle: "italic", textAlign: "center", marginTop: 4 }} numberOfLines={2}>
              {currentQuestion.explanation}
            </Text>
          ) : null}

          {index + 1 >= qarr.length && answerStatus !== null ? (
            <Pressable 
              onPress={() => { setQmode("results"); }}
              style={{ backgroundColor: "green", padding: 12, marginTop: 12, borderRadius: 8, justifyContent: "center" }} 
            >
              <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>View Score Card (Done)</Text>
            </Pressable>
          ) : answerStatus === null ? null : (
            <Pressable 
              onPress={() => setIndex(index + 1)} 
              style={{ backgroundColor: "green", padding: 12, marginTop: 12, borderRadius: 8, justifyContent: "center" }}
            >
              <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Next Question</Text>
            </Pressable>
          )}

        </View>
      </SafeAreaView>
    );
  }


  if (qmode === "results") {
    return (
      <SafeAreaView style={{ margin: 10, flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text>Your Results</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 14 }}>
            <Text>Share</Text>
            <AntDesign style={{ marginLeft: 4 }} name="sharealt" size={18} color="black" />
          </View>
        </View>
  
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 10 }}>
          <Text>Questions Answered</Text>
          <Text>({points}/{answers.length})</Text>
        </View>
  
        <View style={{ backgroundColor: "white", borderRadius: 7, marginTop: 10, marginBottom: 20, paddingBottom: 76, minHeight: "100%" }}>
          <Text style={{ color: "#E30B5C", fontSize: 15, fontWeight: "700", textAlign: "center", marginTop: 7, textDecorationLine: "underline" }}>Score Card</Text>

          <View style={{ flex: 1 }}>
            <FlatList
              data={answers || []}
              keyExtractor={(item, index) => {
                return item.question?.toString() || index.toString();
              }}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => {
                const displayOptions = Array.isArray(item.curra)
                  ? item.curra.map((opt, optIdx) => ({ opt, optIdx })).filter(({ opt }) => opt?.trim())
                  : [];
                const isLongText = item.inferredType === "long" || !Array.isArray(item.curra) || displayOptions.length === 1;
                const isMultipleAns = item.inferredType === "multiple" || displayOptions.length > 4;

                return (
                  <View style={styles.questionContainer}>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b", marginBottom: 6 }}>
                      {item.question}. {item.q}
                    </Text>
                    
                    {isLongText ? (
                      <View style={{ backgroundColor: "#f8fafc", padding: 10, borderRadius: 6, borderWidth: 1, borderColor: item.answer ? "green" : "red" }}>
                        <Text style={{ fontSize: 12, color: "#475569" }}>
                          <Text style={{ fontWeight: "bold" }}>Your Entry:</Text> {item.a === "" ? "[Timed Out/Blank]" : `"${item.a}"`}
                        </Text>
                        <Text style={{ fontSize: 12, color: "green", marginTop: 2 }}>
                          <Text style={{ fontWeight: "bold" }}>Correct Keyword:</Text> "{item.corra}"
                        </Text>
                      </View>
                    ) : (
                      <View style={{ gap: 4 }}>
                        {displayOptions.map(({ opt, optIdx }) => {
                          const isCorrectOption = isMultipleAns 
                            ? (Array.isArray(item.corra) && item.corra.includes(optIdx))
                            : Number(item.corra) === optIdx;

                          const isUserSelected = isMultipleAns
                            ? (Array.isArray(item.a) && item.a.includes(optIdx))
                            : Number(item.a) === optIdx;

                          return (
                            <View key={`rev-opt-${optIdx}`} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f2f2f2", padding: 8, borderRadius: 4 }}>
                              <Text style={{ fontSize: 13, color: "#334155" }}>
                                {item.inferredType === "truefalse" ? "" : (optIdx === 0 ? "(A) " : optIdx === 1 ? "(B) " : optIdx === 2 ? "(C) " : "(D) " || `(${optIdx + 1}) `)} 
                                {opt}
                              </Text>
                              {isCorrectOption ? (
                                <AntDesign name="checkcircle" size={18} color="green" />
                              ) : (!item.answer && isUserSelected) ? (
                                <AntDesign name="closecircle" size={18} color="red" />
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                    )}
                    
                    {!!item.explanation && (
                      <Text style={{ fontSize: 11, fontStyle: "italic", color: "#64748b", marginTop: 4 }}>
                        Note: {item.explanation}
                      </Text>
                    )}
                  </View>
                );
              }}

            />
          </View>         

          <Pressable style={{ backgroundColor: "#228B22", padding: 12, marginBottom: 20, borderRadius: 5, mx: 10 }}
            onPress={() => { setQmode("start"); }}>
            <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>New Quiz</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}


const styles = StyleSheet.create({
  imgBackground: { flex: 1, width: '100%', height: '100%' },
  rulesHeader: { fontSize: 22, fontWeight: 'bold', color: '#001414', textAlign: 'center', letterSpacing: 0.5, marginTop: 10 },
  ruleText: { color: 'white', fontSize: 13, marginLeft: 8, fontWeight: '500', flex: 1, flexWrap: 'wrap' },
  container: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginVertical: 12, paddingHorizontal: 10 },
  startQuizBtn: { backgroundColor: '#004d40', paddingVertical: 14, borderRadius: 8, marginHorizontal: 20, marginBottom: 30, elevation: 3 },
  questionContainer: { paddingHorizontal: 14, paddingVertical: 10, width: '100%', borderBottomWidth: 1, borderBottomColor: '#e6e6e6' },
  unselectedAnswer: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 12, backgroundColor: '#fff', borderRadius: 8, marginVertical: 6, borderWidth: 1.5, borderColor: '#cbd5e1', elevation: 2 },
  correctAnswer: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 12, backgroundColor: '#ecfdf5', borderRadius: 8, marginVertical: 6, borderWidth: 1.5, borderColor: 'green', elevation: 2 },
  incorrectAnswer: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, marginVertical: 6, borderWidth: 1.5, borderColor: 'red', elevation: 2 },
  options: { fontSize: 14, fontWeight: 'bold', color: '#475569', minWidth: 20 },
  correctAnswerIndex: { minWidth: 20 },
  closeIconContainer: { padding: 6, justifyContent: 'center', alignItems: 'center' }
});