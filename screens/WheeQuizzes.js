import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, Alert, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, FlatList, Dimensions, BackHandler, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetInfo } from "@react-native-community/netinfo";
import { MaterialCommunityIcons } from "@expo/vector-icons"; 
import * as FileSystem from 'expo-file-system/legacy';
import { zip, unzip } from 'react-native-zip-archive';
import * as DocumentPicker from 'expo-document-picker';
import WheeQuizScreen from "./WheeQuizScreen";
import * as Sharing from 'expo-sharing';

const { height, width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.76;

export default function WheeQuizzes() {
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [hquizzes, setHquizzes] = useState([]);
  
  const [squizzes, setSquizzes] = useState([]);
  const navigation = useNavigation();
  const isOffline = useNetInfo().isConnected === false;
  const isLoadingRef = useRef(false);

  const [mode, setMode] = useState("main"); 
  const [prevMode, setPrevMode] = useState("main");
  const [currentQuiz, setCurrentQuiz] = useState(null);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizCategory, setQuizCategory] = useState("");
  const [prevCategory, setPrevCategory] = useState("");
  const [quizDesc, setQuizDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlayIndices, setActivePlayIndices] = useState([0, 0, 0, 0]); 
  
  const [multiplechoice, setMultipleChoice] = useState(true); 
  const [truefalse, setTrueFalse] = useState(false); 
  const [multipleanswers, setMultipleAnswers] = useState(false);
  const [longanswer, setLongAnswer] = useState(false);

  const [questionsList, setQuestionsList] = useState([
    { id: "q1", question: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" },
    { id: "q2", question: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" },
    { id: "q3", question: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" },
    { id: "q4", question: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }
  ]);


  const iconName = props.isChecked ? "checkbox-marked" : "checkbox-blank-outline"; 
  

  const showInstructions = () => {
    Alert.alert(
      "WheeShare Quizzes",
      "Instructions: Save, Edit, View, Share, Delete and Import Quiz using WheeShare. You may add any number of Quiz your phone memory allows. Click the binoculars icon to search Quiz by the search term entered. After a search another search can be done by using backspace to remove the search term instead of the silver reload icon.\n(1) Use the green, plus(+) icon in the top menu bar to Add Quiz. Every Quiz must contain four Questions that form a valid quiz, and a Title and a Category. Each of the four words can be ten characters long at most.\n The default allcategories, will be used when a Quiz Category is not entered.\n(2) Click on one of the gold and white buttons on the Quiz Screen to see all Quiz with the same Category. The first Category button in the list is All Categories in gold.\n(3) On the list screen press and hold a Quiz card to see the Batch Bar appear, after select all Quiz to Share or Delete and click on the Share or Delete button in the Batch Bar to share or delete Quiz. Use the green Edit button at the bottom of each Quiz card in the list to edit a Quiz, and to view any Quiz just click on its Quiz card. Quizzes can only be shared and imported with the WheeShare App.\n(4) Scroll horizontally and vertically on the All categories list screen to view All your Quizzes. On the Add Quiz Screen fill out the form and click the Save button to save a Quiz. Thank you for using our App.",
      [ { text: "OK",
        onPress: () => setMode("main"),
        style: "cancel" 
      }],
      { cancelable: false } 
    );
  };

  const handleMultipleChoiceClick = () => {
    if(!multiplechoice) setMultipleChoice(true);
    setTrueFalse(false);
    setMultipleAnswers(false);
    setLongAnswer(false);
  }
  
  const handleTrueFalseClick = () => {
    setMultipleChoice(false);
    if(!truefalse) setTrueFalse(true);
    setMultipleAnswers(false);
    setLongAnswer(false);
  }
  
  const handleMultipleAnswersClick = () => {
    setMultipleChoice(false);
    setTrueFalse(false);
    if(!multipleanswers) setMultipleAnswers(true);
    setLongAnswer(false);
  }
  
  const handleLongAnswerClick = () => {
    setMultipleChoice(false);
    setTrueFalse(false);
    setMultipleAnswers(false);
    if(!longanswer) setLongAnswer(true);
  }


  const parseCategories = (list, query) => {
    if (!Array.isArray(list)) {
      Alert.alert("Data Error", "Data is not an array, skipping parse.");
      return;
    }
  
    let categoriesSeen = [];
    let qCategories = [{ id: "q-all", category: "allcategories" }];
  
    try {
      let validList = list.filter(m => m && m.id && m.title && m.category);    
      const q = query?.trim()?.toLowerCase();

      validList?.forEach(m => {
        const currentStyle = m.category || "Enter Category";
  
        let matches = false;
        const nestedMatch = m.quiz?.some(s => 
          s.question?.toLowerCase().includes(q) ||
          s.explanation?.toLowerCase().includes(q) ||
          s.options?.some(opt => opt?.toLowerCase().includes(q))
        );

        const mainMatch = !q || 
          m.title?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q);
            
        matches = mainMatch || nestedMatch;
        if (!matches) return;
  
        if (!categoriesSeen.includes(currentStyle)) {
          categoriesSeen.push(currentStyle); 
          qCategories.push({ ...m, category: currentStyle }); 
        } 
      });
  
      if (qCategories.length > 1) {
        setSquizzes(qCategories);
      } else {
        setSquizzes([]);
      }
    } catch (e) {
      Alert.alert("Parse Error", "An error occurred while grouping quiz category: " + e.message);
    }
  };
   

  const parseHQuizzes = (quizzesList) => {
    let hQuizzes = [];
    let categoriesSeen = [];
    for (let mNum = 0; mNum < quizzesList.length; mNum++) {
      const quizItem = quizzesList[mNum];
      const currentCategory = quizItem.category || "Enter Quiz Category";
      let mIndex = categoriesSeen.indexOf(currentCategory);
  
      if (mIndex < 0) {
        categoriesSeen.push(currentCategory);
        hQuizzes.push({
          category: currentCategory,
          data: [quizItem],
        });
      } else {
        hQuizzes[mIndex].data.push(quizItem);
      }
    }
    return hQuizzes;
  };
  

  const getQuizzes = (cat, quizzesList) => {
    if (!cat || cat.trim() === "" || !quizzesList) return [];
    let sQuizzes = quizzesList.filter(c => (cat === "allcategories" || c.category === cat));
    if (cat === "allcategories") return parseHQuizzes(sQuizzes);
    return sQuizzes;
  };


  const loadQuizzes = async () => {
    try {
      if (isLoadingRef.current) return; 
      isLoadingRef.current = true;
      if (!isLoading) setIsLoading(true);
 
      const fileUri = `${FileSystem.documentDirectory}wheequizzes.json`;
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        let loadedQuizzes = JSON.parse(content || "[]");

        loadedQuizzes = loadedQuizzes.filter(c => 
          c && c.id && c.title && c.category &&
          c.title.trim() !== "" && c.category.trim() !== "" &&
          Array.isArray(c.quiz) && c.quiz.length === 4 &&
          c.quiz.every(qItem => {
            const optionCount = qItem?.options?.length || 0;
            return qItem && qItem.question?.trim() !== "" &&
              Array.isArray(qItem.options) &&
              (optionCount === 1 || optionCount === 2 || optionCount === 4 || (optionCount >= 5 && optionCount <= 7)) &&
              qItem.options.every(opt => opt?.trim() !== "");
          })
        );
 
        if (loadedQuizzes.length === 0) {
          setQuizzes([]);
          setSquizzes([]);
          setHquizzes([]);
          setMode("main");
        } else {
          setQuizzes(loadedQuizzes);
          parseCategories(loadedQuizzes, null);
 
          const filtered = getQuizzes(quizCategory, loadedQuizzes);
          if (filtered.length === 0 && mode === "list") {
            setHquizzes([]);
            setMode("main");
          } else {
            setHquizzes(filtered);
          }
        }
      } else {
        setQuizzes([]);
        setHquizzes([]);
        setQuizCategory("");
        setMode("main");
      }
    } catch (e) {
      Alert.alert("Load Quizzes Failed", e.message || "Error loading Quizzes.");
      setQuizzes([]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };



  const saveQuizzesToStorage = async (quizzesData) => {
    try {
      const fileUri = `${FileSystem.documentDirectory}wheequizzes.json`;
      const trackingUri = `${FileSystem.documentDirectory}.quizzes_user_initialized`;
      await FileSystem.writeAsStringAsync(trackingUri, "true");
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(quizzesData));
      setQuizzes(quizzesData);
      parseCategories(quizzesData, null);
      if (mode !== "main") setHquizzes(getQuizzes(prevCategory, quizzesData)); 
    } catch (e) {
      Alert.alert("Save Error", e.message || "Could not save your quiz list to disk.");
      throw e;
    }
  };

  
  const handleSaveQuiz = async (newData) => {
    try {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setLoading(true);

      const incomingQuizzes = Array.isArray(newData) ? newData : [newData];
      const updatedList = [...quizzes];
      
      incomingQuizzes.forEach(quizData => {
        const index = updatedList.findIndex(q => String(q.id).trim() === String(quizData.id).trim());
        if (index > -1) {
          updatedList[index] = quizData;
        } else {
          updatedList.push(quizData);
        }
      });

      await saveQuizzesToStorage(updatedList);
      setMode('list');
    } catch (e) {
      Alert.alert('Save Failed', e.message);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  };

  
  const deleteQuizzes = async (idsFromArg = []) => {
    const actualIds = Array.isArray(idsFromArg) && idsFromArg.length > 0 ? idsFromArg : (selectedIds || []);
    const cleanIdsToDelete = actualIds.map(id => String(id).trim());
    if (cleanIdsToDelete.length === 0) return;
    
    const isDeletingAll = actualIds.length === hquizzes.length;
    Alert.alert(
      isDeletingAll ? "Delete All Quizzes" : "Delete Quizzes",
      isDeletingAll ? "Remove all Quizzes in this Category?" : `Remove ${cleanIdsToDelete.length} selected Quiz(zes)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const updatedList = quizzes.filter(m => !cleanIdsToDelete.includes(String(m.id).trim()));
              const fileUri = `${FileSystem.documentDirectory}wheequizzes.json`;
              await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(updatedList));
              
              if (updatedList.length === 0) {
                const trackingUri = `${FileSystem.documentDirectory}.quizzes_user_initialized`;
                await FileSystem.writeAsStringAsync(trackingUri, "true");
              }

              setQuizzes(updatedList);
              parseCategories(updatedList, null);
              setSelectedIds([]);
              setCurrentQuiz(null);

              const matchingItems = updatedList.filter(m => 
                quizCategory === "allcategories" || m.category === quizCategory
              );

              if (isDeletingAll || matchingItems.length < 1) {
                setQuizCategory("");
                setPrevCategory("");
                setMode('main');
              } else {
                setHquizzes(getQuizzes(prevCategory, updatedList));
              }
            } catch (e) {
              Alert.alert("Delete Error", e.message || "Could not delete database item from storage.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };



  const saveQuiz = async () => {
    if (isLoadingRef.current || loading) return;

    if (!quizTitle.trim()) {
      Alert.alert('Required', 'Please enter a Quiz Title');
      return;
    }

    if (!quizCategory.trim()) {
      Alert.alert('Required', 'Please enter a Quiz Category');
      return;
    }

    if (!Array.isArray(questionsList) || questionsList.length !== 4) {
      Alert.alert('Required', 'Every Quiz must contain exactly 4 Questions');
      return;
    }

        for (let i = 0; i < questionsList.length; i++) {
      const qitem = questionsList[i];
      if (!Array.isArray(qitem.options) || qitem.options.length === 0) {
        Alert.alert('Required', `Question #${i + 1} must contain answer options`);
        return;
      }
      
      const originalOptions = qitem.options;
      const trimmedOptions = originalOptions.map(option => option?.trim() || "");
      const isMultipleAnswers = originalOptions.length > 4;
      const filledOptions = isMultipleAnswers ? trimmedOptions.filter(Boolean) : trimmedOptions;
      const totalOptionsCount = isMultipleAnswers ? filledOptions.length : originalOptions.length;
      const isLongTextLayout = totalOptionsCount === 1;
      const isTrueFalseLayout = totalOptionsCount === 2;
      const isSingleChoiceLayout = totalOptionsCount === 4;
      const isMultipleAnswersLayout = totalOptionsCount > 4;
      if (!isLongTextLayout && !isTrueFalseLayout && !isSingleChoiceLayout && !isMultipleAnswersLayout) {
        Alert.alert('Layout Error', `Question #${i + 1} has an invalid choice configuration (${totalOptionsCount} options). Valid setups are: 1 (Long Text), 2 (True/False), 4 (Single Choice), or 5-7 (Multiple Answers).`);
        return;
      }

      for (let j = 0; j < trimmedOptions.length; j++) {
        const optionText = trimmedOptions[j];
        if (!optionText && !isLongTextLayout) {
          if (isMultipleAnswers) continue;
          Alert.alert('Required', `Question #${i + 1}, Option #${j + 1} cannot be empty`);
          return;
        }
        if (optionText && optionText.length > 95) {
          Alert.alert('Limit Exceeded', `Question #${i + 1} Option #${j + 1} is too long! Maximum allowed is 95 characters.`);
          return;
        }
      }
    }


    try {
      setLoading(true);
      const activeId = quizId || currentQuiz?.id || Date.now().toString();
      const sanitizedQuizData = {
        id: activeId,
        title: quizTitle.trim(),
        category: quizCategory.trim() || "allcategories",
        description: quizDesc.trim(),
        quiz: questionsList.map(item => {
          const rawOptions = Array.isArray(item.options) ? item.options : [];
          const totalOpts = rawOptions.length;
          let finalSanitizedAnswerKey = item.correctAnswerIndex;
          if (totalOpts === 4 || totalOpts === 2) {
            finalSanitizedAnswerKey = parseInt(String(item.correctAnswerIndex), 10) || 0;
          } else if (totalOpts > 4) {
            const keptOptionIndexes = rawOptions.reduce((indexes, option, index) => {
              if (option?.trim()) indexes.push(index);
              return indexes;
            }, []);
            const indexMap = new Map(keptOptionIndexes.map((originalIndex, compactIndex) => [originalIndex, compactIndex]));
            finalSanitizedAnswerKey = Array.isArray(item.correctAnswerIndex)
              ? item.correctAnswerIndex
                .map(val => indexMap.get(parseInt(String(val), 10)))
                .filter(val => Number.isInteger(val))
              : [];
          } else if (totalOpts === 1) {
            finalSanitizedAnswerKey = typeof item.correctAnswerIndex === 'string' 
              ? item.correctAnswerIndex.trim() 
              : String(item.correctAnswerIndex).trim();
          }

          return {
            question: item.question.trim(),
            options: totalOpts === 1 ? [""] : totalOpts > 4
              ? rawOptions.map(o => o.trim()).filter(Boolean)
              : rawOptions.map(o => o.trim()),
            correctAnswerIndex: finalSanitizedAnswerKey,
            explanation: item.explanation?.trim() || ""
          };
        }),
        updatedAt: new Date().toISOString()
      };


      await handleSaveQuiz(sanitizedQuizData);
      if(prevCategory === 'allcategories') setQuizCategory("allcategories");
      setCurrentQuiz(null);
      setMode(prevMode || 'main');
    } catch (err) {
      Alert.alert("Save Error", err.message || "Failed to finalize quiz compilation workflow.");
    } finally {
      setLoading(false);
    }
  };

  
  const shareQuizzes = async (quizIds) => {
    if (isOffline) {
      Alert.alert("No Internet", "An internet connection is required to share components.");
      return;
    }
    if (!quizIds?.length) return;
    
    let shareDir = null;
    let zipPath = null;
    let shareSuccess = false;
    
    try {
      setLoading(true);
      shareDir = `${FileSystem.cacheDirectory}quiz_export_${Date.now()}/`;
      zipPath = `${FileSystem.cacheDirectory}WheeShare_Quizzes_${Date.now()}.zip`;
      
      await FileSystem.deleteAsync(shareDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(shareDir, { intermediates: true });
      
      const quizzesToShare = quizzes.filter(c => quizIds.includes(c.id));
      for (let i = 0; i < quizzesToShare.length; i++) {
        await FileSystem.makeDirectoryAsync(`${shareDir}quiz_${i}/`, { intermediates: true });
      }

      const exportPromises = quizzesToShare.map(async (quizItem, quizIdx) => {
        const quizDir = `${shareDir}quiz_${quizIdx}/`;
        await FileSystem.writeAsStringAsync(`${quizDir}quiz.json`, JSON.stringify(quizItem));
        return quizItem;
      });
      
      await Promise.all(exportPromises);
      
      const manifest = {
        app: 'WheeShare_Quizzes',
        version: 1,
        count: quizzesToShare.length,
        exportDate: new Date().toISOString()
      };
      
      await FileSystem.writeAsStringAsync(`${shareDir}manifest.json`, JSON.stringify(manifest));
      
      const nakedSource = Platform.OS === 'android' ? shareDir.replace('file://', '').replace(/\/$/, '') : shareDir;
      const nakedTarget = Platform.OS === 'android' ? zipPath.replace('file://', '') : zipPath;
        
      await zip(nakedSource, nakedTarget);
      await Sharing.shareAsync(zipPath, { dialogTitle: `Share ${quizzesToShare.length} Quiz(zes)`, mimeType: 'application/zip' });
      shareSuccess = true;
    } catch (e) {
      Alert.alert('Share Error', e.message || 'Failed to execute backup distribution.');
    } finally {
      setLoading(false);
      if (shareSuccess) setSelectedIds([]);
      if (shareDir) try { await FileSystem.deleteAsync(shareDir, { idempotent: true }); } catch (e) {}
      if (zipPath) try { await FileSystem.deleteAsync(zipPath, { idempotent: true }); } catch (e) {}
    }
  };


  const populateForEdit = (quizItem, mvcat) => {
    if (quizItem === null) {
      setSelectedIds([]);
      setQuizTitle("");
      setQuizDesc("");
      setCurrentQuiz(null);
      setQuizId(Date.now().toString());

      if (mvcat === "allcategories") {
        setPrevCategory("allcategories");
        setQuizCategory("");
      } else {
        setQuizCategory(mvcat);
      }
      
      setQuestionsList([{ id: Date.now().toString()+"q1", question: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }]);
      setMode("add");
    } else {
      setCurrentQuiz(quizItem);
      setQuizId(quizItem.id);
      setQuizTitle(quizItem.title);
      setQuizCategory(mvcat);
      setQuizDesc(quizItem.description || "");
      setQuestionsList(quizItem.quiz || []);
      setMode("add");
    }
  };


  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };


  const removeQuestionItem = (qIdx) => {
    if (questionsList.length <= 1) return;
    setQuestionsList(questionsList.filter((_, index) => index !== qIdx));
  };


  const resetForm = () => {
    setCurrentQuiz(null);
    setQuizId(Date.now().toString());
    setQuizTitle("");
    setQuizDesc("");
    if (prevCategory === "allcategories") setQuizCategory("allcategories");
    setQuestionsList([{ id: Date.now().toString()+"q1", question: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }]);
  };


  const addQuestionItem = () => { 
    if(multiplechoice) setQuestionsList([...questionsList, { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), question: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }]); 
    else if (truefalse) setQuestionsList([...questionsList, { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), question: "", options: ["True", "False"], correctAnswerIndex: 0, explanation: "" }]);
    else if (multipleanswers) setQuestionsList([...questionsList, { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), question: "", options: ["", "", "", "", "", "", ""], correctAnswerIndex: [], explanation: "" }]);
    else setQuestionsList([...questionsList, { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), question: "", options: [""], correctAnswerIndex: 0, explanation: "" }]);
  };


  useFocusEffect(
    useCallback(() => {
      loadQuizzes();
    }, [quizCategory])
  );


  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mode === 'view') {
        setMode('list');
        return true;
      }

      if (mode === 'add') {
        if (isLoadingRef.current) return true;
        setMode(prevMode || "main");
        resetForm();
        return true;
      }

      if (mode === 'list') {
        setSelectedIds([]);
        setQuizCategory('');
        setMode('main');
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [mode, loading]);
  


  const handleImportQuizzes = async () => {
    let extractDir = null;
    let tempZipPath = null;

    try {
      const res = await DocumentPicker.getDocumentAsync({ 
        type: ['application/zip', 'application/x-zip-compressed'],
        copyToCacheDirectory: true 
      });
      
      if (res.canceled) return;
      setLoading(true);
      
      const asset = res.assets?.[0];
      if (!asset) throw new Error("No file selected");
      if (!asset.uri) throw new Error("Invalid file URI");
      if (!asset.name?.toLowerCase().endsWith('.zip')) {
        throw new Error("Please select a valid .zip export file.");
      }
      
      const importId = Date.now().toString();
      extractDir = `${FileSystem.documentDirectory}imported_quizzes_${importId}/`;
      tempZipPath = `${FileSystem.cacheDirectory}import_quiz_temp_${importId}.zip`;
      
      await FileSystem.copyAsync({ from: asset.uri, to: tempZipPath });
      await FileSystem.makeDirectoryAsync(extractDir, { intermediates: true });
      
      const nakedZip = Platform.OS === 'android' ? tempZipPath.replace('file://', '') : tempZipPath;
      const nakedDest = Platform.OS === 'android' ? extractDir.replace('file://', '').replace(/\/$/, '') : extractDir;
      
      await unzip(nakedZip, nakedDest);
      
      let manifest = { count: 0 };
      try {
        const manifestContent = await FileSystem.readAsStringAsync(`${extractDir}manifest.json`);
        manifest = JSON.parse(manifestContent);
      } catch (e) { }
      
      const rawQuizzes = [];
      const quizDirs = manifest.count > 0 
        ? Array.from({length: manifest.count}, (_, i) => `quiz_${i}/`) 
        : [''];
      
      for (const dir of quizDirs) {
        const quizPath = `${extractDir}${dir}quiz.json`;
        const info = await FileSystem.getInfoAsync(quizPath);
        if (!info.exists) continue;
        
        const content = await FileSystem.readAsStringAsync(quizPath);
        let quizItem;
        try {
          quizItem = JSON.parse(content);
        } catch (parseError) {
          continue;
        }

        if (!quizItem || typeof quizItem !== 'object') continue;
        if (!quizItem.title?.trim() || !quizItem.category?.trim()) continue;
        if (!Array.isArray(quizItem.quiz) || quizItem.quiz.length !== 4) continue;
        rawQuizzes.push(quizItem);
      }
      
      if (rawQuizzes.length === 0) {
        throw new Error('No valid quizzes found in zip file');
      }
      
      const finalQuizzes = rawQuizzes.map((quizItem, index) => ({
        ...quizItem,
        id: `quiz_${importId}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        updatedAt: new Date().toISOString()
      }));
      
      await handleSaveQuiz(finalQuizzes);
      Alert.alert('Success', `${finalQuizzes.length} quiz(zes) imported!`);
    } catch (e) {
      Alert.alert('Import Failed', e.message || 'Failed to import quiz data package.');
    } finally {
      setLoading(false);
      if (extractDir) try { await FileSystem.deleteAsync(extractDir, { idempotent: true }); } catch (err) {}
      if (tempZipPath) try { await FileSystem.deleteAsync(tempZipPath, { idempotent: true }); } catch (err) {}
    }
  };

  
  const MyHeader = () => (
    <View style={styles.silverDivider}>
      <ImageBackground style={{width: "100%", height: "100%"}} resizeMode="cover" source={require('../assets/quizzes/quizzesdivider.png')}/>
    </View>
  );


  const QuizItemCard = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity 
        style={[styles.chapterCard, isSelected && styles.selectedCard]}
        onLongPress={() => toggleSelect(item.id)}
        onPress={() => {
          if (selectedIds.length > 0) {
            toggleSelect(item.id);
          } else {
            setCurrentQuiz(item.quiz);
            setMode("play_active"); 
          }
        }}>
        <Text style={styles.chapterCardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.chapterCardCount}>{`Contains: ${item.quiz.length} Questions`}</Text>
        { isSelected && selectedIds.length === 1 && ( <View style={styles.chapterCardFooter}>
          <TouchableOpacity style={styles.editBtnCard} onPress={() => populateForEdit(item, item.category)}>
            <Text style={styles.editBtnText}>EDIT</Text>
          </TouchableOpacity>
        </View> ) }
      </TouchableOpacity>
    );
  };

//remove checkbox use icons or btns
//add remove question button
//for multiple answers just give them up to 7 options and dont render blank options
  const renderFormQuestionEditor = (qItem, qIdx) => (
    <View key={qItem.id} style={styles.sectionContainerBlock}>
      <View style={styles.questionHeaderRow}>
        <Text style={styles.sectionIndexLabel}>{`QUESTION ELEMENT #${qIdx + 1}`}</Text>
        <TouchableOpacity
          disabled={questionsList.length <= 1}
          onPress={() => removeQuestionItem(qIdx)}
          style={[styles.removeQuestionBtn, questionsList.length <= 1 && styles.disabledQuestionBtn]}
        >
          <Text style={styles.removeQuestionText}>REMOVE QUESTION</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Question Prompt</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Question Prompt/Statement..."
        placeholderTextColor="#726b6b"
        value={qItem.question}
        onChangeText={(text) => {
          const updated = [...questionsList];
          updated[qIdx].question = text;
          setQuestionsList(updated);
        }}
      />
      
      { qItem.options?.length == 4 ? ( <View>
        <Text style={styles.label}>4 Multiple Choice Options (Max 80 Chars Each)</Text>
        {Array.from({ length: 7 }, (_, optIdx) => qItem.options?.[optIdx] || "").map((optValue, optIdx) => (
          <TextInput
            key={optIdx}
            style={styles.optionsinput}
            placeholder={`Option ${String.fromCharCode(65 + optIdx)} (Max 80 chars)`}
            placeholderTextColor="#726b6b"
            maxLength={80}
            value={optValue}
            onChangeText={(text) => {
              const updated = [...questionsList];
              updated[qIdx].options[optIdx] = text;
              setQuestionsList(updated);
            }}
          />
        ))}

        <Text style={styles.label}>Correct Option Selector</Text>
        <View style={styles.changeTypeGrid}>
          {[0, 1, 2, 3].map((idx) => {
            const isActiveIndex = qItem.correctAnswerIndex === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.changeTypeIconBtn, isActiveIndex && { backgroundColor: '#ca3838' }]}
                onPress={() => {
                  const updated = [...questionsList];
                  updated[qIdx].correctAnswerIndex = idx;
                  setQuestionsList(updated);
                }}
              >
                <Text style={[styles.changeTypeIcon, isActiveIndex && { color: '#fff' }]}>{String.fromCharCode(65 + idx)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View> ) : qItem.options?.length == 2 ? ( <View>
        <Text style={styles.label}>True or False Selector</Text>
        <View style={styles.changeTypeGrid}>
          {[0, 1].map((idx) => {
            const isActiveIndex = qItem.correctAnswerIndex === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.changeTypeIconBtn, isActiveIndex && { backgroundColor: '#ca3838' }]}
                onPress={() => {
                  const updated = [...questionsList];
                  updated[qIdx].correctAnswerIndex = idx;
                  setQuestionsList(updated);
                }}
              >
                <Text style={[styles.changeTypeIcon, isActiveIndex && { color: '#fff' }]}>{qItem.options[idx]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View> ) : qItem.options?.length > 4 ? (<View>
        <Text style={styles.label}>Multiple Answers Options (Max 80 Chars Each)</Text>
        {qItem.options?.map((optValue, optIdx) => (
          <TextInput
            key={optIdx}
            style={styles.optionsinput}
            placeholder={`Option ${String.fromCharCode(65 + optIdx)} (Max 76 chars)`}
            placeholderTextColor="#726b6b"
            maxLength={76}
            value={optValue}
            onChangeText={(text) => {
              const updated = [...questionsList];
              updated[qIdx].options[optIdx] = text;
              setQuestionsList(updated);
            }}
          />
        ))}

        <Text style={styles.label}>Correct Option Index Selector</Text>
        <View style={styles.changeTypeGrid}>
          {qItem.options?.map((option, idx) => ({ option, idx })).filter(({ option }) => option?.trim()).map(({ option, idx }) => {
            const isActiveIndex = Array.isArray(qItem.correctAnswerIndex) && qItem.correctAnswerIndex.includes(idx);
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.changeTypeIconBtn, isActiveIndex && { backgroundColor: '#ca3838' }]}
                onPress={() => {
                  const updated = [...questionsList];
                  const currentAnswers = Array.isArray(updated[qIdx].correctAnswerIndex) ? updated[qIdx].correctAnswerIndex : [];
                  updated[qIdx].correctAnswerIndex = currentAnswers.includes(idx)
                    ? currentAnswers.filter(answerIndex => answerIndex !== idx)
                    : [...currentAnswers, idx];
                  setQuestionsList(updated);
                }}
              >
                <Text style={[styles.changeTypeIcon, isActiveIndex && { color: '#fff' }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View> ) : ( <View>
        <Text style={styles.label}>Long Answer</Text>
        <TextInput
          style={[styles.input, styles.descInput]}
          placeholder="Provide a Long Answer..."
          placeholderTextColor="#a18e8e"
          value={qItem.correctAnswerIndex}
          onChangeText={(text) => {
            const updated = [...questionsList];
            updated[qIdx].correctAnswerIndex = text;
            setQuestionsList(updated);
          }}
          multiline
          numberOfLines={3}
        />
      </View> ) }

      <Text style={styles.label}>Answer Explanation(Optional)</Text>
      <TextInput
        style={[styles.input, styles.descInput]}
        placeholder="Provide an explanation of the answer..."
        placeholderTextColor="#a18e8e"
        value={qItem.explanation}
        onChangeText={(text) => {
          const updated = [...questionsList];
          updated[qIdx].explanation = text;
          setQuestionsList(updated);
        }}
        multiline
        numberOfLines={3}
      />

      <View style={{marginTop: 4, marginBottom: 3, flex: 1 }}> 
        <Image source={require('../assets/silverdivider.png')} style={{ width: '99%', height: 49, alignSelf: "center", paddingVertical: 1, opacity: 1}} resizeMode='contain'/>
      </View> 
    </View>
  );
  
    
  if (mode === "play_active" && currentQuiz) {
    return (
      <WheeQuizScreen 
        data={currentQuiz || []} 
        onBackToDashboard={() => {
          setMode("list");
          setCurrentQuiz(null);
        }}
      />
    );
  }


  if (loading) { 
   return ( 
    <View style={styles.loadingOverlay}>
      <View style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
        <Image style={{ height: 76, width: 76, elevation: 4, marginBottom: 24, opacity: 1, borderRadius: 12 } } resizeMode='contain' source={require('../assets/icon.png')} />
        <ActivityIndicator size="large" color="#b41919" style={{ transform: [{ scale: 1.9 }], marginBottom: 17,  }} />
        <Text style={styles.loadingText}>Please Wait...</Text>
      </View>
    </View>
   );
  }


  if (mode === 'list') {
    return (
      <ImageBackground style={{flex: 1, width: '100%', height: '100%'}} resizeMode='cover' source={require('../assets/quizzes/quizlistbg.png')}>
        <StatusBar barStyle="light-content"/>
        <SafeAreaView style={{ flex: 1}}>
          <View style={styles.centerLogoWrapper}>
            <ImageBackground style={styles.icon} resizeMode='contain' source={require('../assets/quizzes/quizlisttitle.png')} /> 
          </View>
    
          <View style={styles.myDojoHeader}>
            <Text style={styles.categoryHeaderText}>{quizCategory === "allcategories" ? "ALL CATEGORIES" : `CATEGORY: ${quizCategory}`}</Text>
            <View style={{flexDirection:'row'}}>
              <TouchableOpacity onPress={() => { setSelectedIds([]); setQuizCategory(""); setPrevCategory(""); setMode("main"); setPrevMode("main"); }} style={styles.plusIconAM}>
                <ImageBackground style={{ height: "100%", width: "100%" }} resizeMode='contain' source={require('../assets/quizzes/redbackbtn.png')}/>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setPrevMode("list"); populateForEdit(null, quizCategory); }} style={styles.plusIcon}>
                <ImageBackground style={{ height: "100%", width: "100%" }} resizeMode='contain' source={require('../assets/quizzes/addquizbtn.png')}/>         
              </TouchableOpacity>
            </View>
          </View>
               
          <View style={styles.flatlistContainer}> 
            <FlatList
              data={hquizzes || []}
              extraData={[selectedIds, quizzes]}
              keyExtractor={(item, index) => item.id || index.toString()}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 57, flexGrow: 1 }}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainerView}>
                  <Text style={styles.emptyReloadText}>Reload Content</Text>
                  <TouchableOpacity onPress={() => { if (!loading && !isLoadingRef.current) loadQuizzes(); }}>
                    <ImageBackground style={{ height: 60, width: 60 }} resizeMode='contain' source={require('../assets/reloadicon.png')}/>         
                  </TouchableOpacity>
                </View>
              )}
              renderItem={({ item }) => (
                quizCategory === "allcategories" ? (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>{item.category}</Text>
                    <FlatList
                      horizontal
                      data={item.data || []}
                      extraData={[selectedIds, quizzes]}
                      initialNumToRender={item?.data?.length || 1}
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(item, index) => item?.id?.toString() || `idx-${index}`}
                      contentContainerStyle={{ paddingRight: 38, paddingLeft: 12 }}
                      renderItem={({ item: quizEl }) => <QuizItemCard item={quizEl} />}
                    />
                  </View>
                ) : (<View style={styles.verticalWrapper}><QuizItemCard item={item} /></View>)
              )}
            />
          </View>
         
          {selectedIds.length > 0 && (
            <View style={styles.batchBar}>
              <Text style={styles.batchText}>{`${selectedIds.length} Selected`}</Text>
              <TouchableOpacity onPress={() => shareQuizzes(selectedIds)} style={styles.shareIcon}>
                <ImageBackground style={{height: "100%", width: "100%"}} resizeMode='contain' source={require('../assets/quizzes/sharequizbtn.png')}/>         
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteQuizzes(selectedIds)} style={styles.myDojoDiscardIcon}>
                <ImageBackground style={{height: "100%", width: "100%"}} resizeMode='contain' source={require('../assets/discardicon.png')}/> 
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedIds([])} style={styles.myDojoDeleteIcon}>
                <ImageBackground style={{height: "100%", width: "100%"}} resizeMode='contain' source={require('../assets/quizzes/deletequizbtn.png')}/>         
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </ImageBackground>
    );
  }


  if (mode === 'add') {
    return (
      <ImageBackground source={require('../assets/quizzes/addquizbg.png')} style={styles.imgBackground} resizeMode='cover' >
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.formHeaderTitleRow}>
              <ImageBackground style={styles.iconAM} resizeMode='contain' source={currentQuiz ? require('../assets/quizzes/editquiztitle.png') : require('../assets/quizzes/addquiztitle.png')} /> 
            </View>
            
            <TouchableOpacity onPress={() => { resetForm(); setMode(prevMode); }} style={styles.discardBtn}>
              <ImageBackground style={{ height: 67, width: "100%", opacity: 1, marginBottom: 4}} imageStyle={{ opacity: 1 }} resizeMode='contain' source={require('../assets/discardicon.png')}/>
              <Text style={styles.discardText}>❌CANCEL</Text>
            </TouchableOpacity>

            <ScrollView style={styles.formScroller} contentContainerStyle={{ paddingBottom: 120 }}>
              <Text style={styles.label}>Quiz Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Title..."
                placeholderTextColor="#726b6b"
                value={quizTitle}
                onChangeText={setQuizTitle}
              />

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Category..."
                placeholderTextColor="#726b6b"
                value={quizCategory}
                onChangeText={setQuizCategory}
              />

              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.descInput]}
                placeholder="Enter Quiz Summary..."
                placeholderTextColor="#726b6b"
                value={quizDesc}
                onChangeText={setQuizDesc}
                multiline
                numberOfLines={3}
              />

              {questionsList.map((section, index) => renderFormQuestionEditor(section, index))}
              
              <Text style={{marginLeft: 2, color: "#001414", fontSize: 15, fontWeight: "600", textAlign: "center"}}>Question Type:</Text>
              <View style={{ flexDirection: "row", flex: 1, maxHeight: 57, justifyContent: "center", alignItems: "center", marginBottom: 19}}>
                <View style={{justifyContent: "flex-start", alignItems: "center", flexDirection: "column", width: 57, height: 55, marginTop: 5,marginBottom: 4, marginHorizontal: 0,backgroundColor: '#d8fffd',borderWidth:.7}}> 
                  <Pressable onPress={handleMultipleChoiceClick}> 
                    <MaterialCommunityIcons name={multiplechoice ? "checkbox-marked" : "checkbox-blank-outline"} size={25} color="#411313" /> 
                  </Pressable> 
                  <Text style={{fontSize: 11, color: "#000", marginLeft: 0, fontWeight: "600"}}>Multiple Choice</Text> 
                </View>
                
                <View style={{justifyContent: "flex-start", alignItems: "center", flexDirection: "column", width: 57, height: 55, marginTop: 5,marginBottom: 4, marginHorizontal: 0,backgroundColor: '#d8fffd',borderWidth:.7}}> 
                  <Pressable onPress={handleTrueFalseClick}> 
                    <MaterialCommunityIcons name={truefalse ? "checkbox-marked" : "checkbox-blank-outline"} size={25} color="#228B22" /> 
                  </Pressable> 
                  <Text style={{fontSize: 11, color: "#000", marginLeft: 0, fontWeight: "600"}}>True/False</Text> 
                </View>

                <View style={{justifyContent: "flex-start", alignItems: "center", flexDirection: "column", width: 57, height: 55, marginTop: 5,marginBottom: 4, marginHorizontal: 0,backgroundColor: '#d8fffd',borderWidth:.7}}> 
                  <Pressable onPress={handleMultipleAnswersClick}> 
                    <MaterialCommunityIcons name={multipleanswers ? "checkbox-marked" : "checkbox-blank-outline"} size={25} color="#228B22" /> 
                  </Pressable> 
                  <Text style={{fontSize: 11, color: "#000", marginLeft: 0, fontWeight: "600"}}>Multiple Answers</Text> 
                </View>

                <View style={{justifyContent: "flex-start", alignItems: "center", flexDirection: "column", width: 57, height: 55, marginTop: 5,marginBottom: 4, marginHorizontal: 0,backgroundColor: '#d8fffd',borderWidth:.7}}> 
                  <Pressable onPress={handleLongAnswerClick}> 
                    <MaterialCommunityIcons name={longanswer ? "checkbox-marked" : "checkbox-blank-outline"} size={25} color="#228B22" /> 
                  </Pressable> 
                  <Text style={{fontSize: 11, color: "#000", marginLeft: 0, fontWeight: "600"}}>Long Answer</Text> 
                </View>
              </View>
              
              <TouchableOpacity onPress={addQuestionItem} style={styles.addQuestionBtn}>
                <ImageBackground style={{ height: 45, width: "100%", opacity: 1, borderRadius: 19 }} imageStyle={{ opacity: 1, borderRadius: 19 }} resizeMode='contain' source={require('../assets/quizzes/addquestionbtn.png')} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtnFullBlock} onPress={saveQuiz}>
                <ImageBackground style={{ height: 57, width: "100%",justifyContent: 'center', opacity: 1, borderRadius: 12 }} imageStyle={{ opacity: 1, borderRadius:12 }} resizeMode='contain' source={require('../assets/savequizbtn.png')} />
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </ImageBackground>
    );
  }

  
  return (
    <ImageBackground style={styles.imgBackground} resizeMode='cover' source={require('../assets/quizzes/quizzesbg.jpg')}>
      <StatusBar barStyle="light-content"/>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.centerLogoWrapper}>
          <ImageBackground style={styles.icon} resizeMode='contain' source={require('../assets/quizzes/quizzestitle.png')} /> 
        </View>

        <View style={styles.header}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Quizzes..."
              placeholderTextColor="rgba(88, 79, 79, 0.62)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => parseCategories(quizzes, searchQuery)} style={styles.searchBtn}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/binocularsicon.png')}/>         
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSearchQuery(''); parseCategories(quizzes, null); }} style={styles.clearBtn}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/reloadicon.png')}/>         
            </TouchableOpacity>
          </View>

          <View style={styles.dashboardIconsControlsRow}>
            <TouchableOpacity onPress={() => { setPrevMode("main"); populateForEdit(null, "allcategories"); }} style={styles.plusIcon}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/quizzes/addquizbtn.png')}/>         
            </TouchableOpacity> 
            <TouchableOpacity onPress={handleImportQuizzes} style={styles.importIcon}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/importmoveicon.png')}/>         
            </TouchableOpacity>
            <TouchableOpacity onPress={showInstructions} style={styles.infoIcon}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/mydojostylesinfoicon.png')}/>         
            </TouchableOpacity>
          </View>
        </View>

        {squizzes.length > 0 ? (
          <FlatList
            data={squizzes || []}
            extraData={quizzes}
            style={{flex: 1}}
            keyExtractor={item => item.id}
            ListHeaderComponent={MyHeader}
            ItemSeparatorComponent={() => <View style={styles.smallGap} />}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item && item.category && (
                  <TouchableOpacity
                    style={{ width: '79%', height: 43, justifyContent:'center', alignItems:'center' }}
                    onPress={() => { setHquizzes(getQuizzes(item.category, quizzes)); setQuizCategory(item.category); setPrevCategory(item.category); setMode("list"); }}>
                    <ImageBackground style={{flex: 1, justifyContent:'center', alignItems:'center'}} resizeMode='stretch' source={require('../assets/quizzes/redbtnbg.png')}>
                      { item.id === 'q-all' ? 
                        ( <Image
                          resizeMode="contain"
                          style={{ height: "57%", width: "63%", alignSelf:"center"}}
                          source={require('../assets/allstyles.png')}
                        /> ) : (
                          <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>{ item.category.length > 20 ? item.category.substring(0, 20) : item.category }</Text>
                        ) }
                    </ImageBackground>
                  </TouchableOpacity> 
                )}
              </View>
            )}
          />
        ) : (
          <View style={styles.centerNotificationFlexPanel}>
            <Text style={styles.infoTextDashboardFallback}>Tap the red (+) icon to design a new Quiz..</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#c2151d" />
            <Text style={styles.loadingText}>Synchronizing Databases...</Text>
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
} 


const styles = StyleSheet.create({
  imgBackground: { flex: 1, width: '100%', height: '100%' },
  viewLayoutContainer: { flex: 1, backgroundColor: '#1e293b', width: '100%', height: '100%' },
  centerLogoWrapper: { marginBottom: 19, marginTop: 19, justifyContent: 'center', alignItems: 'center' },
  icon: { height: 70, width: width * 0.9 },
  iconAM: { height: 60, width: width * 0.8 },
  addQuestionBtn: { width: 177, height: 55, borderRadius: 19, marginTop: 7, alignSelf:'center' },
  header: { paddingHorizontal: 16, marginBottom: 10, width: '100%' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 9, paddingVertical: 4, gap: 8, marginBottom: .5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 9, alignItems: 'center', justifyContent: 'center', width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  searchInput: { height: 38, width: '70%', backgroundColor: 'rgba(255, 255, 255, 0.79)', borderRadius: 8, paddingHorizontal: 8, color: 'black', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', fontSize: 11 },
  searchBtn: { width: 39, height: 37, backgroundColor: '#e7f5ed4f', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  clearBtn: { width: 32, height: 32, backgroundColor: '#31303080', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  dashboardIconsControlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 1, minHeight: 50, width: '100%', gap: 19, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 9},
  plusIcon: { width: 45, height: 45 },
  plusIconAM: { width: 40, height: 40, marginRight: 10 },
  importIcon: { width: 45, height: 45 },
  infoIcon: { width: 45, height: 45 },
  silverDivider: { width: '99%', height: 10, alignSelf: 'center', marginVertical: 5 },
  smallGap: { height: 12 },
  card: { width: '100%', alignItems: 'center', marginVertical: 6 },
  cardText: { fontSize: 16, fontWeight: 'bold', color: '#f3bdbd', paddingHorizontal: 5},
  categoryMenuSelectionRowItem: { width: '80%', height: 55, justifyContent: 'center', alignItems: 'center' },
  cardTextMenuTitle: { color: '#313030', fontWeight: 'bold', fontSize: 15, textAlign: 'center', width: '90%' },
  centerNotificationFlexPanel: { flex: 1, paddingHorizontal: 30, justifyContent: 'center', alignItems: 'center' },
  infoTextDashboardFallback: { color: '#f3efbd', textAlign: 'center', fontSize: 13, lineHeight: 18 },
  categoryHeaderText: { color: '#ca3838', fontSize: 13, fontWeight: '600', textAlign: 'center', textTransform: 'uppercase', marginVertical: 6 },
  flatlistContainer: { flex: 1, width: '100%' },
  emptyContainerView: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyReloadText: { color: '#facdcd', marginBottom: 12, fontWeight: 'bold', fontSize: 15 },
  sectionContainer: { marginVertical: 10, width: '100%' },
  sectionHeader: { color: '#ca3838', fontSize: 14, fontWeight: 'bold', marginLeft: 16, marginBottom: 8, textTransform: 'uppercase' },
  verticalWrapper: { width: '100%', alignItems: 'center', paddingVertical: 6 },
  chapterCard: { width: CARD_WIDTH, backgroundColor: 'rgba(245, 195, 195, 0.76)', borderRadius: 12, padding: 14, marginHorizontal: 8, borderWidth: 1, borderColor: '#f14242', elevation: 3 },
  selectedCard: { borderColor: '#dc2626', backgroundColor: '#fa6f6f8c', borderWidth: 2 },
  chapterCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  chapterCardCount: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  chapterCardFooter: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%' },
  editBtnCard: { backgroundColor: '#da4e36', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  editBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  batchBar: { position: 'absolute', bottom: 57, left: 20, right: 20, height: 55, backgroundColor: '#19212e', borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 19, borderWidth: 1.5, borderColor: '#ca3838', elevation: 10 },
  batchText: { color: '#e95757', fontWeight: 'bold', fontSize: 13 },
  shareIcon: { width: 35, height: 35 },
  myDojoDiscardIcon: { width: 35, height: 35 },
  myDojoDeleteIcon: { width: 35, height: 35 },
  vcHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0c1429a9', paddingHorizontal: 16, paddingVertical: 8, borderWidth: 2, borderColor: '#99840f', borderRadius: 10, margin: 8 },
  vcTitle: { flex: 1, color: 'white', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginHorizontal: 10 },
  vcToggleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#570f0f', justifyContent: 'center', alignItems: 'center' },
  vcToggleText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  vcDropdownContainer: { width: '95%', maxHeight: height * 0.2, alignSelf: 'center', backgroundColor: '#1e293b', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#99840f' },
  vcInfoLabel: { color: '#caaf38', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  vcDescScroll: { flexGrow: 1, marginTop: 4 },
  vcDescText: { color: 'honeydew', fontSize: 12, lineHeight: 16 },
  formHeaderTitleRow: { width: '100%', alignItems: 'center', marginVertical: 10 },
  discardBtn: { alignSelf: 'flex-start', backgroundColor: 'rgba(220, 38, 38, 0.15)', borderWidth: 1, borderColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 8, marginBottom: 9, marginLeft: 12, height: 70, width: 67, borderRadius: 10, justifyContent: 'center', alignItems: 'center', opacity: 1 },
  discardText: { color: '#ef4444', fontWeight: 'bold', fontSize: 11 },
  formScroller: { flex: 1, paddingHorizontal: 16 },
  label: { color: '#f04444', fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 4, textTransform: 'uppercase' },
  input: { height: 40, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, color: '#000', borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 4 },
  optionsinput: { height: 38, backgroundColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 5, color: '#000', borderWidth: 1, borderColor: '#8a3c40cc', marginBottom: 2 },
  descInput: { height: 70, textAlignVertical: 'top', paddingVertical: 8 },
  sectionContainerBlock: { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 10, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  questionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionIndexLabel: { color: '#fff', fontWeight: 'bold', fontSize: 11, marginBottom: 6 },
  removeQuestionBtn: { backgroundColor: '#b91c1c', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, marginBottom: 6 },
  disabledQuestionBtn: { opacity: 0.45 },
  removeQuestionText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  changeTypeGrid: { flexDirection: 'row', gap: 10, marginVertical: 6 },
  changeTypeIconBtn: { width: 45, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  changeTypeIcon: { fontSize: 14, fontWeight: 'bold', color: '#caaf38' },
  optionPlayButton: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, marginVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  optionPlayButtonChosen: { backgroundColor: 'rgba(202, 175, 56, 0.25)', borderColor: '#caaf38' },
  optionPlayText: { color: '#fff', fontSize: 13 },
  optionPlayTextChosen: { color: '#caaf38', fontWeight: 'bold' },
  explanationBoxView: { marginTop: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  explanationLabelText: { color: '#cf2323', fontSize: 12, fontWeight: 'bold' },
  explanationBodyText: { color: '#cbd5e1', fontSize: 12, marginTop: 4 },
  saveBtnFullBlock: { width: 125, height: 97, borderRadius: 15, marginTop: 7, alignSelf:'center', alignItems: 'center', justifyContent:'center', },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  loadingText: { color: '#e02f2f', fontWeight: 'bold', fontSize: 12, marginTop: 10, letterSpacing: 0.5 } });