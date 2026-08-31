import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, Alert, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, FlatList, Dimensions, BackHandler, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetInfo } from "@react-native-community/netinfo";
import * as FileSystem from 'expo-file-system/legacy';
import { zip, unzip } from 'react-native-zip-archive';
import * as DocumentPicker from 'expo-document-picker';
import CrosswordGrid from "./CrosswordGrid";
import * as Sharing from 'expo-sharing';

const { height, width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.76;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 16; 
const COLUMN_COUNT = 25;
const CALCULATED_CELL_SIZE = (SCREEN_WIDTH - (GRID_PADDING * 2)) / COLUMN_COUNT;
const CELL_SIZE = Math.max(CALCULATED_CELL_SIZE, 24);


export default function WheeCrosswords() {
  const [questions, setQuestions] = useState([{answer: "", hint: "", startx: "", starty: "", orientation: "", position: "1"}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: "2"}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: "3"}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: "4"}]);
  const [crosswordCategory, setCrosswordCategory] = useState("");
  const [currentCrossword, setCurrentCrossword] = useState(null);
  const [crosswordTitle, setCrosswordTitle] = useState("");
  const [crosswordId, setCrosswordId] = useState(null);  
  const [prevCategory, setPrevCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cwordList, setCwordList] = useState([[]]);
  const [prevMode, setPrevMode] = useState("main");
  const [mode, setMode] = useState("main");

  const [crosswordGridT, setCrosswordGridT] = useState([[]]);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [hcrosswords, setHcrosswords] = useState([]);
  const [scrosswords, setScrosswords] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [crosswords, setCrosswords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const isOffline = useNetInfo().isConnected === false;
  const navigation = useNavigation();
  const isLoadingRef = useRef(false);


  const showInstructions = () => {
    Alert.alert(
      "WheeShare Crosswords",
      "Instructions: Save, Edit, View, Share, Delete and Import Crosswords using WheeShare. You may add any number of Crosswords your phone memory allows. Click the binoculars icon to search Crosswords by the search term entered. After a search another search can be done by using backspace to remove the search term instead of the silver reload icon.\n(1) Use the green, plus(+) icon in the top menu bar to Add Crossword. Every Crossword must contain four Questions that form a valid crossword, and a Title and a Category. Each of the four words can be ten characters long at most.\n The default allcategories, will be used when a Crossword Category is not entered.\n(2) Click on one of the gold and white buttons on the Crossword Screen to see all Crossword with the same Category. The first Category button in the list is All Categories in gold.\n(3) On the list screen press and hold a Crossword card to see the Batch Bar appear, after select all Crossword to Share or Delete and click on the Share or Delete button in the Batch Bar to share or delete Crossword. Use the green Edit button at the bottom of each Crossword card in the list to edit a Crossword, and to view any Crossword just click on its Crossword card. Crosswords can only be shared and imported with the WheeShare App.\n(4) Scroll horizontally and vertically on the All categories list screen to view All your Crosswords. On the Add Crossword Screen fill out the form and click the Save button to save a Crossword. Thank you for using our App.",
      [ { text: "OK",
        onPress: () => setMode("main"),
        style: "cancel" 
      }],
      { cancelable: false } 
    );
  };


  const recCrossword = (crossW, gridT, wordNum, tracker) => {
    const MAX_X = 12; 
    const MAX_Y = 25;
    let wordsPlacedSoFar = wordNum - 1;
    if (wordsPlacedSoFar > tracker.maxWordsPlaced) {
      tracker.maxWordsPlaced = wordsPlacedSoFar;
      tracker.bestQuestionsSnapshot = JSON.parse(JSON.stringify(crossW));
    }

    if (wordNum === 1) {
      let w1 = crossW[0];
      if (w1.starty + w1.answer.length > MAX_Y) return crossW;
      for (let y = 0; y < w1.answer.length; y++) {
        gridT[w1.startx][w1.starty + y] = w1.answer[y];
      }
      return recCrossword(crossW, gridT, 2, tracker);
    }

    for (let wI = 0; wI < wordNum - 1; wI++) {
      let word1 = crossW[wI].answer;
      let word2 = crossW[wordNum - 1].answer;
      let ix = []; let iy = [];
      for (let l1 = 0; l1 < word1.length; l1++) {
        for (let l2 = 0; l2 < word2.length; l2++) {
          if (word1[l1] === word2[l2]) { ix.push(l1); iy.push(l2); }
        }
      }
      if (ix.length === 0) { ix.push(-1); iy.push(-1); }
      for (let i = 0; i < ix.length && i < iy.length; i++) {
        let intersectParent = ix[i];
        let intersectCurrent = iy[i];

        if (intersectParent < 0 || intersectCurrent < 0) continue;

        let currentStartX, currentStartY;
        let parent = crossW[wI];
        let current = crossW[wordNum - 1];

        if (parent.orientation === "across") {
          current.orientation = "down";
          currentStartX = parent.startx - intersectCurrent;
          currentStartY = parent.starty + intersectParent;
        } else {
          current.orientation = "across";
          currentStartX = parent.startx + intersectParent;
          currentStartY = parent.starty - intersectCurrent;
        }

        if (currentStartX < 0 || currentStartY < 0) continue;
        if (current.orientation === "across" && currentStartY + current.answer.length > MAX_Y) continue;
        if (current.orientation === "down" && currentStartX + current.answer.length > MAX_X) continue;

        let isValid = true;
        let gridStack = [];

        for (let charIdx = 0; charIdx < current.answer.length; charIdx++) {
          let tx = current.orientation === "down" ? currentStartX + charIdx : currentStartX;
          let ty = current.orientation === "across" ? currentStartY + charIdx : currentStartY;

          if (gridT[tx][ty] !== '.' && gridT[tx][ty] !== current.answer[charIdx]) {
            isValid = false;
            break;
          }
          if (gridT[tx][ty] === '.') {
            gridStack.push({ x: tx, y: ty });
          }
        }

        if (isValid) {
          for (let charIdx = 0; charIdx < current.answer.length; charIdx++) {
            let tx = current.orientation === "down" ? currentStartX + charIdx : currentStartX;
            let ty = current.orientation === "across" ? currentStartY + charIdx : currentStartY;
            gridT[tx][ty] = current.answer[charIdx];
          }

          current.startx = currentStartX;
          current.starty = currentStartY;

          if (wordNum === 4) {
            let complete = true;
            for (let w = 0; w < 4; w++) {
              if (crossW[w].startx === -1 || crossW[w].starty === -1 || !crossW[w].orientation) complete = false;
            }
            if (complete) {
              tracker.maxWordsPlaced = 4;
              tracker.bestQuestionsSnapshot = JSON.parse(JSON.stringify(crossW));
              return crossW;
            }
          } else {
            let vCrossword = recCrossword(crossW, gridT, wordNum + 1, tracker);
            if (vCrossword && vCrossword[0].startx !== -1 && vCrossword[3].startx !== -1) return vCrossword;
          }

          while (gridStack.length > 0) {
            let cell = gridStack.pop();
            gridT[cell.x][cell.y] = '.';
          }
          current.startx = -1;
          current.starty = -1;
          current.orientation = '';
        }
      }
    }
    return crossW;
  };


  const checkCrossword = () => {
    const createFreshGrid = () => Array(12).fill(0).map(() => Array(25).fill('.'));
    let initialGrid = createFreshGrid();
    let crossW = { 
      id: typeof crosswordId !== 'undefined' ? crosswordId : (currentCrossword?.id || Date.now().toString()), 
      title : crosswordTitle.trim(), 
      category: crosswordCategory.trim(), 
      updatedAt: new Date().toISOString(),
      questions: [ 
        { answer: questions[0].answer.trim(), hint: questions[0].hint.trim(), startx: 1, starty: 12, orientation: 'across', position: 1 },
        { answer: questions[1].answer.trim(), hint: questions[1].hint.trim(), startx: -1, starty: -1, orientation: '', position: 2 },
        { answer: questions[2].answer.trim(), hint: questions[2].hint.trim(), startx: -1, starty: -1, orientation: '', position: 3 },
        { answer: questions[3].answer.trim(), hint: questions[3].hint.trim(), startx: -1, starty: -1, orientation: '', position: 4 } 
      ]  
    };    

    let overallBestTracker = { maxWordsPlaced: 0, bestQuestionsSnapshot: null };
    recCrossword(crossW.questions, initialGrid, 1, overallBestTracker);
    if (overallBestTracker.maxWordsPlaced === 4) {
      crossW.questions = overallBestTracker.bestQuestionsSnapshot;
      return crossW;
    }

    for (let x = 1; x < 4; x++) {
      initialGrid = createFreshGrid();
      let workingQuestions = JSON.parse(JSON.stringify(crossW.questions));
      workingQuestions.forEach(q => { q.startx = -1; q.starty = -1; q.orientation = ''; });
      workingQuestions[0].startx = 1; workingQuestions[0].starty = 12; workingQuestions[0].orientation = 'across';
      let tmp = workingQuestions[0];
      workingQuestions[0] = workingQuestions[x];
      workingQuestions[x] = tmp;
      workingQuestions[0].position = 1;
      workingQuestions[0].startx = 1; 
      workingQuestions[0].starty = 12;
      workingQuestions[0].orientation = 'across';
      workingQuestions[x].position = x + 1;
      recCrossword(workingQuestions, initialGrid, 1, overallBestTracker);

      if (overallBestTracker.maxWordsPlaced === 4) {
        crossW.questions = overallBestTracker.bestQuestionsSnapshot;
        return crossW;
      }
    }

    crossW.questions = overallBestTracker.bestQuestionsSnapshot;
    let finalCleanGrid = Array(12).fill(0).map(() => Array(25).fill('.'));
    crossW.questions.forEach(q => {
      if (q.startx === -1 || q.starty === -1 || !q.orientation) return;

      for (let i = 0; i < q.answer.length; i++) {
        let x = q.orientation === 'down' ? q.startx + i : q.startx;
        let y = q.orientation === 'across' ? q.starty + i : q.starty;
        if (finalCleanGrid[x] && finalCleanGrid[x][y] !== undefined) {
          finalCleanGrid[x][y] = q.answer[i];
        }
      }
    });

    return {
      crosswordData: crossW,
      renderGrid: finalCleanGrid
    };
  };
    

  const parseCategories = (list, query) => {
    if ( !Array.isArray(list) ) {
      Alert.alert("Data Error", "Data is not an array, skipping parse.");
      return;
    }
  
    let crosswordCategories = [];
    let cCategories = [{ id: "c-all", category: "allcategories" }];
  
    try {
      let validList = list.filter(m => m && m.id && m.title && m.category);    
      const q = query?.trim()?.toLowerCase();

      validList?.forEach(m => {
        const currentStyle = m.category || "Enter Category";
        const mType = m.category.trim().toLowerCase();
  
        let matches = false;
        const nestedMatch = m.questions?.some(s => 
          s.hint?.toLowerCase().includes(q) || 
          s.answer?.toLowerCase().includes(q)
        );

        const mainMatch = !q || 
          m.title?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q);
            
        matches = mainMatch || nestedMatch;
        if (!matches) return;
  
        if ( !crosswordCategories.includes(currentStyle) ) {
          crosswordCategories.push(currentStyle); 
          cCategories.push({ ...m, category: currentStyle }); 
        } 
      });
  
      if(cCategories.length > 1) {
        setScrosswords(cCategories);
      } 
    } catch (e) {
      Alert.alert("Parse Error", "An error occurred while grouping crossword category: " + e.message);
    }
  };
   
  
  
  const parseHCrosswords = (crosswordsList) => {
    let hCrosswords = [];
    let categoriesSeen = [];
    for (let mNum = 0; mNum < crosswordsList.length; mNum++) {
      const crossword = crosswordsList[mNum];
      const currentCategory = crossword.category || "Enter Crossword Category";
      let mIndex = categoriesSeen.indexOf(currentCategory);
  
      if (mIndex < 0) {
        categoriesSeen.push(currentCategory);
        hCrosswords.push({
          category: currentCategory,
          data: [crossword],
        });
      } else {
        hCrosswords[mIndex].data.push(crossword);
      }
    }
    return hCrosswords;
  };
  

  const getCrosswords = (cat, crosswordsList) => {
    if( !cat || !crosswordsList ) return [];
    let sCrosswords = crosswordsList.filter(c => (cat === "allcategories" || c.category === cat));
    if(cat === "allcategories") return parseHCrosswords(sCrosswords);
    return sCrosswords;
  }


  const loadCrosswords = async () => {
    try {
      if ( isLoadingRef.current ) return; 
      isLoadingRef.current = true;
      if ( !isLoading ) setIsLoading(true);
 
      const fileUri = `${FileSystem.documentDirectory}wheecrosswords.json`;
      const info = await FileSystem.getInfoAsync(fileUri);
       
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        let loadedCrosswords = JSON.parse(content);
        loadedCrosswords = loadedCrosswords.filter(c => 
          c && 
          c.id && 
          c.title &&
          c.category &&
          c.title.trim() !== "" &&
          c.category.trim() !== "" &&
          (c.questions && c.questions.length > 3) &&
          (c.questions[0].hint.trim() !== "" && c.questions[0].answer.trim() !== "" && c.questions[0].startx > -1 && c.questions[0].starty > -1 && c.questions[0].orientation.trim() !== "") &&
          (c.questions[1].hint.trim() !== "" && c.questions[1].answer.trim() !== "" && c.questions[1].startx > -1 && c.questions[1].starty > -1 && c.questions[1].orientation.trim() !== "") &&
          (c.questions[2].hint.trim() !== "" && c.questions[2].answer.trim() !== "" && c.questions[2].startx > -1 && c.questions[2].starty > -1 && c.questions[2].orientation.trim() !== "") &&
          (c.questions[3].hint.trim() !== "" && c.questions[3].answer.trim() !== "" && c.questions[3].startx > -1 && c.questions[3].starty > -1 && c.questions[3].orientation.trim() !== "")
        );
 
        if (loadedCrosswords.length === 0) {
          setHcrosswords([]);
          setMode("main");
        } else {
          setCrosswords(loadedCrosswords || []);
          parseCategories(loadedCrosswords, null);
 
          const filtered = getCrosswords(crosswordCategory, loadedCrosswords);
          if (filtered.length === 0 && mode === "list") {
            setHcrosswords([]);
            setMode("main");
          } else {
            setHcrosswords(filtered);
          }
        }
 
      } else {
        setCrosswords([]);
        setScrosswords([]);
        setHcrosswords([]);
        setCrosswordCategory("");
        setMode("main");
      }
    } catch (e) {
      Alert.alert("Load Crosswords Failed", e.message || "Error loading Crosswords.");
      setCrosswords([]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };

    
  const saveCrosswordsToStorage = async (crosswordsData) => {
    try {
      const fileUri = `${FileSystem.documentDirectory}wheecrosswords.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(crosswordsData));
      setCrosswords(crosswordsData);
      parseCategories(crosswordsData, null);
      if (mode !== "main") setHcrosswords(getCrosswords(prevCategory, crosswordsData));
    } catch (e) {
      Alert.alert('Save Error', 'Could not save Crosswords' + e.message);
      throw e;
    }
  };
    

  const handleSaveCrossword = async (newData) => {
    try {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      if(!isLoading) setIsLoading(true);
    
      const incomingCrosswords = Array.isArray(newData) ? newData : [newData];
      const updatedList = [...crosswords];
          
      incomingCrosswords.forEach(crossword => {
        const index = updatedList.findIndex(c => c.id === crossword.id);
        if (index > -1) {
          updatedList[index] = crossword;
        } else {
          updatedList.push(crossword);
        }
      });
    
      await saveCrosswordsToStorage(updatedList);
      Alert.alert('Success', `${incomingCrosswords.length} crossword(s) saved!`);
    } catch (e) {
      Alert.alert('Save Failed', e.message);
    } finally {
      isLoadingRef.current = false;
      if (isLoading) setIsLoading(false);
    }
  };


  const populateForEdit = (cwrd, cwrdcat ) => {
    if(cwrd === null) {
      setSelectedIds([]);
      setCrosswordTitle("");
      setCurrentCrossword(null);
      setCrosswordId(Date.now().toString());

      if(cwrdcat === "allcategories") {
        setPrevCategory("allcategories");
        setCrosswordCategory("");
      } else {
        setPrevCategory(cwrdcat);
        setCrosswordCategory(cwrdcat);
      }

      setQuestions([{answer: "", hint: "", startx: "", starty: "", orientation: "", position: 1}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: 2}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: 3}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: 4}]);
      setMode("add");

    } else {
      setCurrentCrossword(cwrd);
      setCrosswordId(cwrd.id);
      setCrosswordTitle(cwrd.title);
      setCrosswordCategory(cwrdcat);
      setQuestions(cwrd.questions || []);
      setMode("add");
    }
  };


  const resetForm = () => {
    if(prevCategory === "allcategories") setCrosswordCategory("allcategories");
    setCurrentCrossword(null);
    setQuestions([{answer: "", hint: "", startx: "", starty: "", orientation: "", position: 1}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: 2}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: 3}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: 4}]);
  };


  const getGridT = (crossW) => {
    const grid = Array(12).fill(0).map(() => Array(25).fill('.'));
    if (!crossW || !Array.isArray(crossW.questions)) return grid;
    for (let wI = 0; wI < crossW.questions.length; wI++) {
      const q = crossW.questions[wI];
      if (!q || q.startx == -1 || q.starty == -1 || !q.orientation) continue;
      const ans = q.answer || '';
      if (q.orientation === 'across') {
        for (let xI = 0; xI < ans.length; xI++) {
          const x = q.startx + xI;
          const y = q.starty;
          if (x >= 0 && x < 12 && y >= 0 && y < 25) grid[x][y] = ans[xI];
        }
      } else {
        for (let yI = 0; yI < ans.length; yI++) {
          const x = q.startx;
          const y = q.starty + yI;
          if (x >= 0 && x < 12 && y >= 0 && y < 25) grid[x][y] = ans[yI];
        }
      }
    }
    return grid;
  };


  const saveCrossword = async (crosswordData) => {
    if (isLoadingRef.current || loading) return;

    if (!crosswordTitle.trim()) {
      Alert.alert("Missing Title Field", "A Crossword Title is required. Please fill in the Title field."); 
      return;
    }

    if (!crosswordCategory.trim()) {
      Alert.alert("Missing Category Field", "A Crossword Category is required. Please fill in the Category field."); 
      return;
    }

    for (const question of questions) {
      if (!question.answer.trim()) {
        Alert.alert('Answer Required', 'All 4 Crosswords Questions require an Answer');
        return;
      }
      if (!question.hint.trim()) {
        Alert.alert('Hint Required', `Question "${crosswordTitle}" requires a Hint or an Answer`);
        return;
      }
    }
      
    let response = checkCrossword();
    let vCrossword = response.crosswordData;
    let generatedGrid = response.renderGrid;
    let placedWordCount = vCrossword.questions.filter(q => q.startx !== -1 && q.starty !== -1).length;
    if (placedWordCount < 2) {
      Alert.alert(
        "Invalid Formation",
        "Unable to create a matching configuration with these words. Please change your answers."
      );
      return;
    }

    setCrosswordGridT(generatedGrid);
    setIsGridVisible(true);
    if (placedWordCount < 4) {
      Alert.alert(
        "Partial Match Found",
        `Only ${placedWordCount} out of 4 words could be connected layout-wise. Placing available words.`
      );
      return;
    }

    try {
      if (!isLoading) setIsLoading(true);
      await handleSaveCrossword(vCrossword);
      resetForm();
      setMode(prevMode || "main");
    } catch (err) {
      Alert.alert("Save Error", err.message || "Failed to save Crossword");
    } finally {
      if (isLoading) setIsLoading(false);
    }
  }

    
  const deleteCrosswords = async (idsFromArg = []) => {
    const actualIds = Array.isArray(idsFromArg) && idsFromArg.length > 0 ? idsFromArg : (selectedIds || []);
    const cleanIdsToDelete = actualIds.map(id => String(id).trim());
    if (cleanIdsToDelete.length === 0) return;
    
    const isDeletingAll = actualIds.length === hcrosswords.length;
    Alert.alert(
      isDeletingAll ? "Delete All Crosswords" : "Delete Crosswords",
      isDeletingAll ? "Remove all Crosswords in this Category?" : `Remove ${cleanIdsToDelete.length} selected Crossword(s)?`,

      [{ text: 'Cancel', style: 'cancel' },
        {text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              const crosswordsToDelete = crosswords.filter(m => cleanIdsToDelete.includes(String(m.id)));
              for (const crossword of crosswordsToDelete) {
                const folderUri = `${FileSystem.documentDirectory}wheecrosswords/${crossword.id}/`;
                try {
                  await FileSystem.deleteAsync(folderUri, { idempotent: true });
                } catch (err) { }
              }
              const updatedList = crosswords.filter(m => !cleanIdsToDelete.includes(String(m.id)));
              const fileUri = `${FileSystem.documentDirectory}wheecrosswords.json`;
              await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(updatedList));
              setCrosswords(updatedList);
              parseCategories(updatedList, null);
              setSelectedIds([]);
              setCurrentCrossword(null);

              if (isDeletingAll || updatedList.filter(m => (crosswordCategory === "allcategories" || m.category === crosswordCategory)).length < 1) {
                setCrosswordCategory('');
                if( isDeletingAll && prevCategory === "allcategories" ) {
                  setScrosswords([]);
                }
                setPrevCategory("");
                setMode("main");
              } else {
                setHcrosswords(getCrosswords(prevCategory, updatedList));
              }

            } catch (e) {
              Alert.alert("Delete Error", e.message || "Could not delete files from storage.");
            }
          }
        }
      ]
    );
  };



  const shareCrosswords = async (crosswordIds) => {
    if (isOffline) {
      Alert.alert("No Internet", "You need an internet connection to share crosswords.");
      return;
    }

    if (!crosswordIds?.length) return;
    let shareDir = null;
    let zipPath = null;
    let shareSuccess = false;
    
    try {
      setLoading(true);
      shareDir = `${FileSystem.cacheDirectory}crosswords_export_${Date.now()}/`;
      zipPath = `${FileSystem.cacheDirectory}iDojo_Crosswords_${Date.now()}.zip`;
      
      await FileSystem.deleteAsync(shareDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(shareDir, { intermediates: true });
      const crosswordsToShare = crosswords.filter(c => crosswordIds.includes(c.id));
      for (let i = 0; i < crosswordsToShare.length; i++) {
        await FileSystem.makeDirectoryAsync(`${shareDir}crossword_${i}/`, { intermediates: true });
      }

      const exportPromises = crosswordsToShare.map(async (crossword, crosswordIdx) => {
        const crosswordCopy = { 
          ...crossword 
        };
        
        const crosswordDir = `${shareDir}crossword_${crosswordIdx}/`;
        await FileSystem.writeAsStringAsync(`${crosswordDir}crossword.json`, JSON.stringify(crosswordCopy));
        return crosswordCopy;
      });
      
      await Promise.all(exportPromises);
      const manifest = { app: 'iDojo', version: 1, count: crosswordsToShare.length, exportDate: new Date().toISOString() };
      await FileSystem.writeAsStringAsync(`${shareDir}manifest.json`, JSON.stringify(manifest));
      const nakedSource = Platform.OS === 'android' ? shareDir.replace('file://', '').replace(/\/$/, '') : shareDir;
      const nakedTarget = Platform.OS === 'android' ? zipPath.replace('file://', '') : zipPath;
      await zip(nakedSource, nakedTarget);
      await Sharing.shareAsync(zipPath, {
        dialogTitle: `Share ${crosswordsToShare.length} Crossword(s)`,
        mimeType: 'application/zip'
      });
      
      shareSuccess = true;
      
    } catch (e) {
      Alert.alert('Share Error', e.message || 'Failed to share crosswords');
    } finally {
      setLoading(false);
      if (shareSuccess) setSelectedIds([]);
      if (shareDir) {
        try { await FileSystem.deleteAsync(shareDir, { idempotent: true }); } catch (e) {}
      }
      if (zipPath) {
        try { await FileSystem.deleteAsync(zipPath, { idempotent: true }); } catch (e) {}
      }
    }
  };




  const handleImportCrosswords = async () => {
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
      extractDir = `${FileSystem.documentDirectory}imported_crosswords_${importId}/`;
      tempZipPath = `${FileSystem.cacheDirectory}import_crossword_temp_${importId}.zip`;
      
      await FileSystem.copyAsync({ from: asset.uri, to: tempZipPath });
      await FileSystem.makeDirectoryAsync(extractDir, { intermediates: true });
      
      const nakedZip = Platform.OS === 'android' ? tempZipPath.replace('file://', '') : tempZipPath;
      const nakedDest = Platform.OS === 'android' ? extractDir.replace('file://', '').replace(/\/$/, '') : extractDir;
      
      await unzip(nakedZip, nakedDest);
      const fixPath = (oldPath) => {
        if (!oldPath || typeof oldPath !== 'string' || oldPath.startsWith('http')) return oldPath;
        const fileName = oldPath.split('/').pop();
        return `${extractDir}${fileName}`;
      };
      
      let manifest = { count: 0 };
      try {
        const manifestContent = await FileSystem.readAsStringAsync(`${extractDir}manifest.json`);
        manifest = JSON.parse(manifestContent);
      } catch (e) {
        
      }
      
      const rawCrosswords = [];
      const crosswordDirs = manifest.count > 0 
        ? Array.from({length: manifest.count}, (_, i) => `crossword_${i}/`) 
        : [''];
      
      for (const dir of crosswordDirs) {
        const crosswordPath = `${extractDir}${dir}crossword.json`;
        const info = await FileSystem.getInfoAsync(crosswordPath);
        if (!info.exists) continue;
        
        const content = await FileSystem.readAsStringAsync(crosswordPath);
        let crossword;
        try {
          crossword = JSON.parse(content);
        } catch (parseError) {
          continue;
        }

        if (!crossword || typeof crossword !== 'object') continue;
        if (!crossword.title?.trim()) continue;
        if (!Array.isArray(crossword.questions)) continue;
        const crosswordDir = `${extractDir}${dir}`;
        const fixCrosswordPath = (oldPath) => {
          if (!oldPath || typeof oldPath !== 'string' || oldPath.startsWith('http')) return oldPath;
          const fileName = oldPath.split('/').pop();
          return `${crosswordDir}${fileName}`;
        };
        rawCrosswords.push(crossword);
      }
      
      if (rawCrosswords.length === 0) {
        throw new Error('No valid crosswords found in zip file');
      }
      
      const finalCrosswords = rawCrosswords.map((crossword, index) => ({
        ...crossword,
        id: `crossword_${importId}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        updatedAt: new Date().toISOString()
      })).filter(c => c.questions.length > 0);
      
      if (finalCrosswords.length === 0) {
        throw new Error("No valid crosswords to import");
      }
      
      const updatedList = [...crosswords, ...finalCrosswords];
      await handleSaveCrossword(finalCrosswords);
      setCrosswords(updatedList);
      parseCategories(updatedList, null); 
      Alert.alert('Success', `${finalCrosswords.length} crossword(s) imported!`);
    } catch (e) {
      Alert.alert('Import Failed', e.message || 'Failed to import Crosswords');
      if (extractDir) {
        try { await FileSystem.deleteAsync(extractDir, { idempotent: true }); } catch (e) {}
      }
    } finally {
      setLoading(false);
      if (extractDir) {
        try { await FileSystem.deleteAsync(extractDir, { idempotent: true }); } catch (e) {}
      }
      if (tempZipPath) {
        try { await FileSystem.deleteAsync(tempZipPath, { idempotent: true }); } catch (e) {}
      }
    }
  };
  
  
  const viewCrossword = (viewCategory) => {
    let crossList = [];
    for (let cNum = 0; cNum < crosswords.length; cNum++) {
      if( crosswords[cNum].category === viewCategory) {
        crossList.push(crosswords[cNum].questions);
      }
    }
    setCwordList(crossList);
    setPrevMode("list");
    setMode('view');
  };


  const truncText = (txt) => {
    let str = "";
    if(txt) {
      let end = txt.length;
          
      if(end > 19) {
        end = 19;
          
        for(let index=0; index < end-4; index++) {
          str+=txt[index];
        }
        str+="...";
        return str;
      }
      return txt; 
    } 
    return str;
  };


  useFocusEffect(
    useCallback(() => {
      loadCrosswords();
    }, [])
  );


  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mode === "view") {
        setSelectedIds([]);
        setCurrentCrossword(null);
        setMode("list");
        return true;
      }

      if (mode === "add") {
        if (isLoadingRef.current) return true;
        if(prevMode === "list") setMode("list");
        else setMode("main");
        resetForm();
        return true;
      }

      if (mode === "list") {
        setMode("main");
        setCrosswordCategory("");
        setPrevCategory("");
        setSelectedIds([]);
        return true;
      }

      return false;
    });

    return () => backHandler.remove();
  }, [mode]);   
  


  const MyHeader = () => {
    if (scrosswords.length === 0) return null;
    if (!scrosswords[0]) return null;
    if (scrosswords[0].id === "c-all") return <Image source={require('../assets/crosswords/crosswordsdivider.png')} style={styles.goldDivider} resizeMode='contain'/>;
    return null;
  };



  if(mode === "view") {
    return (
      <View style={{flex: 1, justifyContent: "center", alignItems: "center" }}>
        <CrosswordGrid crosswordData={cwordList} />
      </View>
    );
  }

  
  if(loading) { 
    return ( <View style={styles.loadingOverlay}>
      <View style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
        <Image style={{ height: 76, width: 76, elevation: 4, marginBottom: 24,  borderRadius: 12, opacity: 1 } } resizeMode='contain' source={require('../assets/icon.png')} />
        <ActivityIndicator size="large" color="#19b42e" style={{ transform: [{ scale: 1.9 }], marginBottom: 17,  }} />
        <Text style={styles.loadingText}>Please Wait...</Text>
      </View>
    </View> );
  }


  if (mode === "add" ) {
    return ( <ImageBackground source={require('../assets/crosswords/addcrosswordbg.png')} style={styles.imgBackground} imageStyle={{ opacity: 1.0 }} resizeMode='cover' >
      <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 , opacity: 1, height: '100%'}}>
            
            <View style={{ marginTop: 12, opacity : 1, justifyContent: 'center', alignItems: 'center' }}>
              <ImageBackground style={ styles.iconAM } resizeMode='contain' imageStyle={{ opacity: 1 }} source={currentCrossword ? require('../assets/crosswords/editcrosswordtitle.png') : require('../assets/crosswords/addcrosswordtitle.png') } /> 
            </View>
  
            <TouchableOpacity onPress={() => { resetForm(); setMode(prevMode || "main"); }} style={styles.discardBtn}>
              <ImageBackground style={{ alignSelf: 'center', height: 51, width: "100%", opacity: 1}} imageStyle={{ opacity: 1 }} resizeMode='contain' source={require('../assets/discardicon.png')}/>
              <Text style={styles.discardText}>❌CANCEL</Text>
            </TouchableOpacity>
            
            <ScrollView style={styles.container}>
              <View style={styles.content}>

                <Text style={styles.label}>Crossword Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Title"
                    secureTextEntry={false}
                    value={crosswordTitle}
                    onChangeText={(text) => setCrosswordTitle(text)} />

                  <Text style={styles.label}>Crossword Category</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Category"
                    secureTextEntry={false}
                    value={crosswordCategory}
                    onChangeText={(text) => setCrosswordCategory(text)} />

                  <Text style={styles.label}>Question #1</Text>    
                  <TextInput
                    style={styles.input}
                    placeholder="Question #1"
                    value={questions[0].hint}
                    onChangeText={(text) => {
                      const newQuestions = [...questions];
                      newQuestions[0].hint = text.trim();
                      setQuestions(newQuestions); 
                    }} />

                  <Text style={styles.label}>Answer #1</Text> 
                  <TextInput
                    style={styles.input}
                    placeholder="Answer #1"
                    value={questions[0].answer}
                    onChangeText={(text) => {
                      const newQuestions = [...questions];
                      newQuestions[0].answer = text.trim();
                      setQuestions(newQuestions); 
                  }} />
                    
                  <Text style={styles.label}>Question #2</Text>  
                  <TextInput
                    style={styles.input}
                    placeholder="Question #2"
                    value={questions[1].hint}
                    onChangeText={(text) => {
                      const newQuestions = [...questions];
                      newQuestions[1].hint = text.trim();
                      setQuestions(newQuestions); 
                  }} />

                  <Text style={styles.label}>Answer #2</Text> 
                  <TextInput
                    style={styles.input}
                    placeholder="Answer #2"
                    value={questions[1].answer}
                    onChangeText={(text) => {
                      const newQuestions = [...questions];
                      newQuestions[1].answer = text.trim();
                      setQuestions(newQuestions); 
                  }} />

                  <Text style={styles.label}>Question #3</Text> 
                  <TextInput
                    style={styles.input}
                    placeholder="Question #3"
                    value={questions[2].hint}
                    onChangeText={(text) => {
                      const newQuestions = [...questions];
                      newQuestions[2].hint = text.trim();
                      setQuestions(newQuestions); 
                  }} />

                  <Text style={styles.label}>Answer #3</Text> 
                  <TextInput
                    style={styles.input}
                    placeholder="Answer #3"
                    value={questions[2].answer}
                    onChangeText={(text) => {
                      const newQuestions = [...questions];
                      newQuestions[2].answer = text.trim();
                      setQuestions(newQuestions); 
                  }} />

                  <Text style={styles.label}>Question #4</Text> 
                  <TextInput
                    style={styles.input}
                    placeholder="Question #4"
                    value={questions[3].hint}
                    onChangeText={(text) => {
                      const newQuestions = [...questions];
                      newQuestions[3].hint = text.trim();
                      setQuestions(newQuestions); 
                  }} />

                  <Text style={styles.label}>Answer #4</Text> 
                  <TextInput
                    style={styles.input}
                    placeholder="Answer #4"
                    value={questions[3].answer}
                    onChangeText={(text) => {
                      const newQuestions = [...questions];
                      newQuestions[3].answer = text.trim();
                      setQuestions(newQuestions); 
                  }} />
    
                  <TouchableOpacity style={{ width: 125, height: 97, borderRadius: 15, marginTop: 7, alignSelf:'center', alignItems: 'center', justifyContent:'center' }} onPress={saveCrossword}>
                    <ImageBackground style={{ height: 47, width: "100%",justifyContent: 'center', opacity: 1, borderRadius: 12 }} imageStyle={{ opacity: 1, borderRadius:12 }} resizeMode='contain' source={require('../assets/crosswords/savecrosswordbtn.png')} />
                  </TouchableOpacity>

                  { isGridVisible && ( <View style={styles.grid}>
                    <View style={styles.gridHeaderRow}>
                      <Text style={styles.sectionIndexLabel}>Crossword</Text>
                      <TouchableOpacity onPress={() => setIsGridVisible(false)} style={styles.removeGridBtn}>
                        <Image source={require('../assets/redgoldcloseicon.png')} style={styles.removeGridImage} resizeMode="contain" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View>
                          {crosswordGridT.map((row, rowIndex) => (
                            <View key={`row-${rowIndex}`} style={styles.row}>
                              {row.map((letter, colIndex) => {
                                const isEmpty = letter === '.';
                                return (
                                  <View 
                                    key={`cell-${rowIndex}-${colIndex}`} 
                                    style={[
                                      styles.cell, 
                                      { backgroundColor: isEmpty ? '#111111' : '#FFFFFF', borderWidth: isEmpty ? 0 : 1, borderColor: '#FFD700' }
                                    ]}
                                  >
                                    <Text style={[styles.cellText, { color: isEmpty ? '#333' : '#111' }]}>
                                      {isEmpty ? '' : letter}
                                    </Text>
                                  </View>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                    </ScrollView>
                    </View>
                  ) }
                </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </ImageBackground> )
  };  


  if (mode === 'list') {
    return (
      <ImageBackground style={{flex: 1, width: '100%', height: '100%', opacity: 1}} resizeMode='cover' imageStyle={{ opacity: 0.9 }} source={require('../assets/crosswords/crosswordslistbg.png')}>
          <StatusBar barStyle="dark-content"/>
          <SafeAreaView style={{ flex: 1}}>
            <View style={{marginBottom: 12, paddingHorizontal: 5, justifyContent: 'center', alignItems: 'center', opacity: 1}}>
              <ImageBackground style={ styles.icon } resizeMode='contain' imageStyle={{ opacity: 1 }} source={ require('../assets/crosswords/crosswordlisttitle.png') } /> 
            </View>
      
              <View style={styles.myDojoHeader}>
                <Text style={{ color: '#2da32d', fontSize: 12, flex: 1, textTransform: 'uppercase', fontWeight: "500" }}>{ crosswordCategory === "allcategories" ? "ALL CATEGORIES" : "CATEGORY: "+crosswordCategory}</Text>
                  
                <View style={{flexDirection:'row'}}>
                  <TouchableOpacity onPress={() => { setSelectedIds([]); setPrevMode("main"); setMode("main");} } style={styles.plusIconAM}>
                    <ImageBackground style={{ height: "100%", width: "100%", }} resizeMode='contain' source={ require('../assets/crosswords/greenbackbtn.png') }/>
                  </TouchableOpacity>
          
                  <TouchableOpacity onPress={() => { setPrevMode("main"); populateForEdit(null, crosswordCategory); }} style={ styles.plusIcon }>
                    <ImageBackground style={{ height: "100%", width: "100%", }} resizeMode='contain' source={ require('../assets/crosswords/addcrosswordbtn.png') }/>         
                  </TouchableOpacity>
                </View>
              </View>
                 
              <View style = {styles.flatlistContainer}> 
                <FlatList
                  data={hcrosswords || []}
                  keyExtractor={(item) => item.id}
                  style = {{ flex: 1 }}
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ paddingBottom: 57 }}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={styles.listCard}
                      onPress={() => viewCrossword(item.category)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.listRow}>
                        <View style={styles.infoBox}>
                          <Text style={styles.crosswordTitle} numberOfLines={2} ellipsizeMode='clip' >{truncText(item.title)}</Text>
                        </View>
                          <View style={styles.typeBadge}>
                            <Text style={styles.questionText} numberOfLines={2} ellipsizeMode='clip' >{truncText(item.questions[0].hint)}</Text>
                          </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
           
              { selectedIds.length > 0 && (
                <View style={styles.batchBar}>
                  <Text style={styles.batchText}>{selectedIds.length} Selected</Text>
                  <TouchableOpacity onPress={() => shareCrosswords(selectedIds)} style={styles.shareIcon}>
                    <ImageBackground style={{height: "100%", width: "100%", borderRadius: 4}} imageStyle={{ opacity: 1 }} resizeMode='contain' source={ require('../assets/crosswords/sharecrosswordbtn.png') }/>         
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCrosswords(selectedIds)} style={styles.myDojoDiscardIcon}>
                    <ImageBackground style={{height: "100%", width: "100%", }} imageStyle={{ opacity: 1 }} resizeMode='contain' source={require('../assets/discardicon.png') }/> 
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedIds([])} style={styles.myDojoDeleteIcon}>
                    <ImageBackground style={{height: "100%", width: "100%", }} imageStyle={{ opacity: 1 }} resizeMode='contain' source={require('../assets/crosswords/deletecrosswordbtn.png') }/>         
                  </TouchableOpacity>
                </View> ) }
          </SafeAreaView>
        </ImageBackground>
      );
  }


  return ( 
    <ImageBackground style={styles.imgBackground } imageStyle={{ opacity: 1 }} resizeMode='cover' source={require('../assets/crosswords/crosswordsbg.png')}>
      <StatusBar barStyle="light-content"/>
      <SafeAreaView style={{flex: 1, width: "100%", height: "100%", marginTop: 0}}>
        <View style={{ marginBottom: 5, marginTop: 12, opacity: 1, justifyContent: "center", alignItems: 'center', textAlign: 'center' }}>
          <ImageBackground style={styles.icon} imageStyle={{ opacity: 1 }} resizeMode='contain' source={require('../assets/crosswords/crosswordstitle.png')} /> 
        </View>
    
            <View style={styles.header}>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Crosswords"
                  placeholderTextColor="rgba(88, 79, 79, 0.62)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <TouchableOpacity onPress={() => parseCategories(crosswords, searchQuery)} style={styles.searchBtn}>
                  <ImageBackground style={{ height:"100%", width:"100%",}} resizeMode='contain' source={require('../assets/binocularsicon.png')}/>         
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {setSearchQuery(''); parseCategories(crosswords, null);}} style={styles.clearBtn}>
                  <ImageBackground style={{ height:"100%", width:"100%",}} resizeMode='contain' source={require('../assets/reloadicon.png')}/>         
                </TouchableOpacity>
              </View>
    
              <View style={{flexDirection:'row', alignItems:'center', justifyContent: 'center', marginBottom: 1, minHeight: 73, width:"100%"}}>
                <TouchableOpacity onPress={() => { setCurrentCrossword(null); setCrosswordTitle(""); setCrosswordCategory(""); setSelectedIds([]); setQuestions([{answer: "", hint: "", startx: "", starty: "", orientation: "", position: "1"}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: "2"}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: "3"}, {answer: "", hint: "", startx: "", starty: "", orientation: "", position: "4"}]); setPrevMode("main"); setMode("add"); } } style={styles.plusIcon}>
                  <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/crosswords/addcrosswordbtn.png')}/>         
                </TouchableOpacity> 
                <TouchableOpacity onPress={handleImportCrosswords} style={styles.importIcon}>
                  <ImageBackground style={{ height:"100%", width:"100%",}} resizeMode='contain' source={require('../assets/importmoveicon.png')}/>         
                </TouchableOpacity>
                <TouchableOpacity onPress={showInstructions} style={styles.infoIcon}>
                  <ImageBackground style={{ height:"100%", width:"100%",}} resizeMode='contain' source={require('../assets/mydojostylesinfoicon.png')}/>         
                </TouchableOpacity>
              </View>
            </View>
    
            {scrosswords.length > 0 ? (
              <FlatList
               data={scrosswords || []}
               extraData={crosswords}
               style={{flex: 1}}
               keyExtractor={item => item.id}
               ListHeaderComponent={MyHeader}
               contentContainerStyle = {{ paddingBottom: 38, flexGrow: 1 }}
               ItemSeparatorComponent={({ leadingItem }) => {
                return <View style={{height: 12}} />;
               }}
               renderItem={ ({ item }) => (
                <View style={styles.card}>
                  { item && item.category && 
                    ( <TouchableOpacity
                    style={{ width: '79%', height: 43 }}
                    onPress={() => { setHcrosswords(getCrosswords(item.category, crosswords)); setCrosswordCategory(item.category); setPrevCategory(item.category); setMode("list"); setPrevMode("main"); }}>
                    <ImageBackground style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} resizeMode='stretch' source={require('../assets/crosswords/greenbtnbg.png')}>
                      {item.id === 'c-all' ? 
                        ( <Image
                          resizeMode="contain"
                          style={{height:"57%", width:"63%", alignSelf:"center"}}
                          source={require('../assets/allstyles.png')}
                        /> ) : (
                            <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.cardText, { width: '95%', textAlign: 'center' }]}>{ item.category.length > 20 ? item.category.substring(0, 20) : item.category }</Text>
                      )}
                    </ImageBackground>
                  </TouchableOpacity> )
                  }
                </View>
               ) }
              /> ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.infoText}>Click on the green + icon to add Crosswords or use the import icon to import them. You can share Crosswords after adding or importing.</Text>
              </View>
            ) }
      </SafeAreaView>
    </ImageBackground>
  ); 
};


const styles = StyleSheet.create({
  container: { flex: 1, margin: 4 },
  content: { margin: 5},  
  iconAM: { height: 50, width: "97%", opacity: 1, marginTop: 3, textAlign: "center", marginBottom: 9 },
  flatlistContainer: { minWidth: "100%", flex: 1, paddingBottom: 5 },
  imgBackground: {flex: 1, opacity: 1, maxHeight: "97%", minWidth: "100%", height: Dimensions.get('window').height, marginBottom: "1%",},
  header: { flexDirection: 'column', width: "95%", minHeight: 76, backgroundColor: 'rgba(195, 209, 223, 0.4)', borderWidth: 1, borderColor: '#c2cdd4',justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 5, },
  myDojoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'rgba(0,0,0,0.76)', opacity: 1 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#27bd2e', height: 38, width: '100%', textAlign: 'center', marginBottom: 2 },
  card: {  marginVertical: -4, alignSelf: 'center', borderRadius: 10, width: "100%", opacity: 1, alignItems: "center", justifyContent: "center", flex: 1 },
  cardText: { width: "100%", fontSize: 15, fontWeight: '800', color: '#075a0e', paddingHorizontal: 5, opacity: 1, textAlign: "center", textShadowColor: '#f3efbd', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 7 },
  infoText: { fontSize: 14, fontWeight: 'bold', color: '#5be656', minHeight: 76, width: '94%', textAlign: 'center', marginTop: -95, paddingHorizontal: 19, backgroundColor: 'rgba(0,0,0,0.5)' },
  icon: { height: 57, width: '89%', alignSelf: 'center', textAlign: 'center', marginLeft: 19, marginBottom: 3, opacity: 1 },
  saveBtn: { width: 133, height: 114, borderRadius: 15, marginTop: -12, alignSelf:'center' },
  discardBtn: { marginBottom: 9, marginLeft: 12, height: 95, width: 67, borderRadius: 10, justifyContent: 'center', alignItems: 'center', opacity: 1},
  discardText: { textAlign: 'center', color: '#dc2626', fontWeight: 'bold', fontSize: 10, marginTop: 3, minHeight: 15, width: '100%', },
  searchRow: { flexDirection: 'row', paddingHorizontal: 9, paddingVertical: 4,  gap: 8, marginBottom: 7, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 9, alignItems: 'center', justifyContent: 'center', width: "100%", borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  searchInput: { height: 38, width: "70%", backgroundColor: 'rgba(255, 255, 255, 0.79)', borderRadius: 8, paddingHorizontal: 8, color: 'black', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', fontSize: 11},
  searchBtn: { width: 39, height: 37, backgroundColor: '#e7f5ed4f', borderRadius: 8, justifyContent: 'center', alignItems: 'center', opacity: 1, paddingHorizontal: 2},
  clearBtn: { width: 32, height: 32, backgroundColor: '#31303080', borderRadius: 8, justifyContent: 'center', alignItems: 'center',},
  plusIcon: { height: 57, width: 76, backgroundColor: 'rgba(0,0,0,0.57)', borderRadius: 12, marginLeft: 15, marginRight: 7, opacity: 1},
  editIcon: { height: 57, width: 55, borderRadius: 4, marginLeft: 12, opacity: 1 },
  infoIcon: { height: 47, width: 47, marginLeft: 21, marginBottom: 5, opacity: 1 },
  importIcon: {height: 76, width: 67, borderRadius: 9, marginLeft: 12 },
  label: { fontWeight: 'bold', color: '#f3efbd', marginTop: 12, fontSize: 12, marginLeft:12 },
  input: { borderWidth: 2.5, borderColor: '#15811e', borderRadius: 12, padding: 5, marginTop: 7, backgroundColor: 'rgba(152, 247, 123, 0.57))', opacity: 1, fontWeight: "bold", fontSize: 13 },
  plusIconAM: { height: 51, width: 46, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 7, marginRight: 19, marginBottom: 2, opacity: 1},
  myDojoDeleteIcon: {height: 49, width: 49, borderRadius: 0,  alignItems: 'center', justifyContent: 'center' },
  myDojoDiscardIcon: {height: 49, width: 49, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  batchBar: { position: 'absolute', bottom: 57, left: 20, right: 20, flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 15, borderRadius: 30, alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: '#88df41', elevation: 10 },
  batchText: { color: '#25b320', fontWeight: 'bold'},
  shareIcon: { height: 49, width: 49, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  goldDivider: {width: '57%', height: 43, alignSelf: 'center', marginVertical: 15, shadowColor: '#edf7d6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, opacity: 1},
  listCard: { backgroundColor: 'rgba(241, 255, 250, 0.84)', marginHorizontal: 7, marginVertical: 7, borderRadius: 12, borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4, overflow: 'hidden' },
  listRow: { flexDirection: 'row', height: 133 },
  infoBox: { flex: 1, padding: 7, justifyContent: 'center' },
  crosswordTitle: { color: '#308d38', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  questionText: { color: '#2b8814', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 3 },
  typeText: { color: 'honeydew', fontSize: 9, fontWeight: 'bold' },
  row: {flexDirection: 'row', justifyContent: 'center'},
  removeGridBtn: { width: 27, height: 27, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', marginLeft: "70%", borderColor: '#990f0f', borderWidth: 1.5 },
  removeGridImage: { width: 19, height: 19 },
  sectionIndexLabel: { color: '#fff', fontWeight: 'bold', fontSize: 11, marginBottom: 6 },
  grid: {backgroundColor: '#1a1a1a',borderRadius: 12,padding: GRID_PADDING,borderWidth: 1,borderColor: '#15811e',marginVertical: 12,alignSelf: 'stretch'},
  gridHeaderRow: {flexDirection: 'row', justifyContent: 'space-between',alignItems: 'center',marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#333'},
  sectionIndexLabel: {fontSize: 18,fontWeight: 'bold',color: '#308d38'},
  cell: {width: CELL_SIZE,height: CELL_SIZE,justifyContent: 'center',alignItems: 'center',margin: 0.5,borderRadius: 2,backgroundColor: '#2a2a2a'},
  cellText: {fontSize: CELL_SIZE * 0.55,fontWeight: 'bold',color: '#FFFFFF',textTransform: 'uppercase'}
});