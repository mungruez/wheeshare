import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, Alert, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, FlatList, Dimensions, BackHandler, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetInfo } from "@react-native-community/netinfo";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { zip, unzip } from 'react-native-zip-archive';
import * as ImagePicker from 'expo-image-picker';
import SectionPlayer from './SectionPlayer'; 
import * as Sharing from 'expo-sharing';
import PdfMove from './PdfMove';

const { height, width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.76;

const SECTION_TYPES = {
  VIDEO: "video",
  PDF: "pdf",
  IMAGE: "image",
  AUDIO: "audio",
};

export default function ProblemAndSolution() {
  const [currentPSItem, setCurrentPSItem] = useState(null);
  const [prevMode, setPrevMode] = useState("main");
  const [mode, setMode] = useState("main");
  const navigation = useNavigation();
  const isPickingRef = useRef(false);
  const isLoadingRef = useRef(false);

  const [sPsItems, setSPsItems] = useState([]); 
  const [hPsItems, setHPsItems] = useState([]); 
  const [psItems, setPsItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openpdfViewer, setOpenpdfViewer] = useState(null);
  const [pDropdownVisible, setPDropdownVisible] = useState(true);
  const [sDropdownVisible, setSDropdownVisible] = useState(true);
  const [vcDropdownVisible, setVcDropdownVisible] = useState(true);

  const [psItemCategory, setPsItemCategory] = useState("");
  const [prevCategory, setPrevCategory] = useState("");
  const [psItemTitle, setPsItemTitle] = useState("");
  const [psItemDesc, setPsItemDesc] = useState("");
  const [psItemId, setPsItemId] = useState(null);

  const [solutionSections, setSolutionSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [problemSections, setProblemSections] = useState([]);
  const isOffline = useNetInfo().isConnected === false;
  const [isPicking, setIsPicking] = useState(false);


  const showInstructions = () => {
    Alert.alert(
      "My Dojo Problems & Solutions List",
      "Instructions: Save, Edit, View, Share, Delete and Import Problems and Solutions using iDojo. You may add any number of items your phone memory allows. Click the binoculars icon to search items by terms. (1) Use the plus(+) icon to Add Items. Each item splits into a Problem Chapter and a Solution Chapter. A category and title are required. (2) Click category buttons to view items. Press and hold items to activate batch operations. Thank you for using our App.",
      [{ text: "OK", onPress: () => setMode("main"), style: "cancel" }],
      { cancelable: false }
    );
  };

  
  const getMediaFileExtension = (uri, type) => {
    if (!uri || typeof uri !== 'string') return '';
    const nameFromUri = uri.split('/').pop()?.split('?')[0] || '';
    const extFromName = nameFromUri.includes('.') ? `.${nameFromUri.split('.').pop().toLowerCase()}` : '';
    const supportedExts = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.m4a', '.mp3', '.pdf'];
    if (supportedExts.includes(extFromName)) return extFromName;
    
    if (type === SECTION_TYPES.PDF) return '.pdf';
    if (type === SECTION_TYPES.AUDIO) return '.m4a';
    if (type === SECTION_TYPES.IMAGE) return '.jpg';
    return '.mp4';
  };

  
  const parseCategories = (list, query) => {
    if (!Array.isArray(list)) {
      Alert.alert("Data Error", "Data is not an array, skipping parse.");
      return;
    }
  
    let categoriesSeen = [];
    let cCategories = [{ id: "ps-all", category: "allcategories" }];
  
    try {
      let validList = list.filter(m => m && m.id && m.title && m.category);    
      const q = query?.trim()?.toLowerCase();

      validList?.forEach(m => {
        const currentStyle = m.category || "Enter Category";
  
        let matches = false;
        const problemMatch = m.problemSections?.some(s => 
          s.title?.toLowerCase().includes(q) || 
          s.description?.toLowerCase().includes(q)
        );
        const solutionMatch = m.solutionSections?.some(s => 
          s.title?.toLowerCase().includes(q) || 
          s.description?.toLowerCase().includes(q)
        );

        const mainMatch = !q || 
          m.title?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q);
            
        matches = mainMatch || problemMatch || solutionMatch;
        if (!matches) return;
  
        if (!categoriesSeen.includes(currentStyle)) {
          categoriesSeen.push(currentStyle); 
          cCategories.push({ ...m, category: currentStyle }); 
        } 
      });
  
      if (cCategories.length > 1) {
        setSPsItems(cCategories);
      } else {
        setSPsItems([]);
      }
    } catch (e) {
      Alert.alert("Parse Error", "An error occurred while grouping categories: " + e.message);
    }
  };
   
  
  const normalizePSItem = (item) => {
    if (!item || typeof item !== 'object') return null;

    const normalized = { ...item };
    const problemSections = Array.isArray(item.problemSections)
      ? item.problemSections
      : Array.isArray(item.problem) ? item.problem : [];
    const solutionSections = Array.isArray(item.solutionSections)
      ? item.solutionSections
      : Array.isArray(item.solution) ? item.solution : [];

    normalized.problemSections = problemSections;
    normalized.solutionSections = solutionSections;

    return normalized;
  };

  const parseHPsItems = (itemsList) => {
    let hItemsList = [];
    let categoriesSeen = [];
    for (let mNum = 0; mNum < itemsList.length; mNum++) {
      const psItem = itemsList[mNum];
      const currentCategory = psItem.category || "Enter Category";
      let mIndex = categoriesSeen.indexOf(currentCategory);
  
      if (mIndex < 0) {
        categoriesSeen.push(currentCategory);
        hItemsList.push({
          category: currentCategory,
          data: [psItem],
        });
      } else {
        hItemsList[mIndex].data.push(psItem);
      }
    }
    return hItemsList;
  };
  
  
  const getPsItems = (cat, itemsList) => {
    if (!cat || cat.trim() === "" || !itemsList) return [];
    let sItemsList = itemsList.filter(m => (cat === "allcategories" || m.category === cat));
    if (cat === "allcategories") return parseHPsItems(sItemsList);
    return sItemsList;
  };


  const populateForEdit = (psItem, mvcat) => {
    if (psItem === null) {
      setSelectedIds([]);
      setPsItemTitle("");
      setPsItemDesc("");
      setCurrentPSItem(null);
      setPsItemId(Date.now().toString());

      if (mvcat === "allcategories") {
        setPrevCategory("allcategories");
        setPsItemCategory("");
      } else {
        setPrevCategory(mvcat);
        setPsItemCategory(mvcat);
      }

      setProblemSections([]);
      setSolutionSections([]);
      setPrevMode("list");
      setMode("add");
    } else {
      setCurrentPSItem(psItem);
      setPsItemId(psItem.id);
      setPsItemTitle(psItem.title);
      setPsItemCategory(mvcat);
      setPrevCategory(mvcat);
      setPsItemDesc(psItem.description || "");
      setProblemSections(psItem.problemSections || []);
      setSolutionSections(psItem.solutionSections || []);
      setPrevMode("list");
      setMode("add");
    }
  };

  const resetForm = () => {
    setCurrentPSItem(null);
    setPsItemId(Date.now().toString());
    setPsItemTitle('');
    setPsItemDesc('');
    setProblemSections([]);
    setSolutionSections([]);
    if (prevCategory === "allcategories") setPsItemCategory("allcategories");
  };


  const addSection = (type, stream) => {
    if (isPickingRef.current || isPicking) return;
    const newSection = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      type: type,
      title: "",
      description: "",
      mediaUri: null,
      mediaUrl: '',
    };
    if (stream === 'problem') {
      setProblemSections([...problemSections, newSection]);
    } else {
      setSolutionSections([...solutionSections, newSection]);
    }
  };

  const removeSection = (id, stream) => {
    if (isPickingRef.current || isPicking) return;
    if (stream === 'problem') {
      setProblemSections(problemSections.filter(s => s.id !== id));
    } else {
      setSolutionSections(solutionSections.filter(s => s.id !== id));
    }
  };

  const updateSection = (id, field, value, stream) => {
    if (isPickingRef.current || isPicking) return;
    if (stream === 'problem') {
      setProblemSections(problemSections.map(s => s.id === id ? { ...s, [field]: value } : s));
    } else {
      setSolutionSections(solutionSections.map(s => s.id === id ? { ...s, [field]: value } : s));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const viewPSItem = (psItem) => {
    setCurrentPSItem(psItem);
    setVcDropdownVisible(false);  
    setMode("view");
  };

  const isValidMediaUri = (uri) => {
    if (!uri || typeof uri !== 'string') return false;
    return uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://') || uri.startsWith('content://');
  };

  const copyPickedMediaToCache = async (sourceUri, fileName) => {
    const cacheDir = `${FileSystem.cacheDirectory}ps-media/`;
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    const destinationUri = `${cacheDir}${fileName}`;
    try {
      await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
      return destinationUri;
    } catch (e) {
      throw new Error('Unable to copy media file.');
    }
  };

  const pickMedia = async (id, stream) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Gallery access is needed to add assets!");
      return;
    }
    
    const activeSections = stream === 'problem' ? problemSections : solutionSections;
    const targetSection = activeSections.find(s => s.id === id);
    if (!targetSection) return;

    const isVideo = targetSection.type === SECTION_TYPES.VIDEO;
    const mediaType = isVideo ? 'videos' : 'images';
    
    try {
      isPickingRef.current = true;
      setIsPicking(true);
      let pickedUri = "";

      if (targetSection.type === SECTION_TYPES.PDF) {
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
        if (!result.canceled && result.assets?.[0]) {
          pickedUri = result.assets[0].uri;
        }
      } else {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: [mediaType],
          allowsEditing: false,
          quality: 1.0,
        });
        if (!res.canceled && res.assets?.[0]) {
          pickedUri = res.assets[0].uri; 
        }
      }
      
      if (!pickedUri) return;

      const ext = getMediaFileExtension(pickedUri, targetSection.type);
      const mediaFileName = `${Date.now()}${ext}`;
      const cachedUri = await copyPickedMediaToCache(pickedUri, mediaFileName);

      updateSection(id, 'mediaUri', cachedUri, stream);
    } catch (err) {
      Alert.alert("Copy Media Failed", "Please try again or select a smaller asset file.");
    } finally {
      isPickingRef.current = false;
      setIsPicking(false);
    }
  };

    const loadPsItems = async () => {
    try {
      if (isLoadingRef.current) return; 
      isLoadingRef.current = true;
      setLoading(true);

      const fileUri = `${FileSystem.documentDirectory}problem_solution.json`;
      const trackingUri = `${FileSystem.documentDirectory}.ps_user_initialized`;
      
      const info = await FileSystem.getInfoAsync(fileUri);
      const trackingInfo = await FileSystem.getInfoAsync(trackingUri);
      if (!info.exists && !trackingInfo.exists) {
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify([]));
        await FileSystem.writeAsStringAsync(trackingUri, "true");
      }

      const currentInfo = await FileSystem.getInfoAsync(fileUri);
      if (currentInfo.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        let loadedItems = JSON.parse(content || "[]");
        loadedItems = (Array.isArray(loadedItems) ? loadedItems : []).map(normalizePSItem).filter(m => 
          m && 
          m.id && 
          m.title &&
          m.category &&
          m.title.trim() !== "" &&
          Array.isArray(m.problemSections) && Array.isArray(m.solutionSections) &&
          (m.problemSections.length > 0 || m.solutionSections.length > 0)
        );

        if (loadedItems.length === 0) {
          setPsItems([]);
          setSPsItems([]);
          setHPsItems([]);
          setMode("main");
        } else {
          setPsItems(loadedItems);
          parseCategories(loadedItems, null);

          const filtered = getPsItems(psItemCategory || prevCategory || "allcategories", loadedItems);
          if (filtered.length === 0) {
            setHPsItems([]);
            if (mode === "list") setMode("main");
          } else {
            setHPsItems(filtered);
          }

          setTimeout(async () => {
            try {
              const baseDir = `${FileSystem.documentDirectory}problem_solution/`;
              const dirInfo = await FileSystem.getInfoAsync(baseDir);
                
              if (dirInfo.exists) {
                const localFolders = await FileSystem.readDirectoryAsync(baseDir);
                const validIds = loadedItems.map(c => String(c.id).trim());

                for (const folderId of localFolders) {
                  if (!validIds.includes(String(folderId).trim())) {
                    const pathToDelete = `${baseDir}${folderId}/`;
                    await FileSystem.deleteAsync(pathToDelete, { idempotent: true });
                  }
                }
              }
            } catch (gcError) {
              console.log("Background GC routine skipped:", gcError.message);
            }
          }, 1500);
        } 
      } else {     
        setPsItems([]);
        setSPsItems([]);
        setHPsItems([]);
        setMode("main");
        setPsItemCategory("");
      }
    } catch (e) {
      Alert.alert("Load Failed", e.message || "Failed to load Problem & Solution list.");
      setPsItems([]);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  };

  const savePsItemsToStorage = async (itemsData, activeCategory) => {
    try {
      const fileUri = `${FileSystem.documentDirectory}problem_solution.json`;
      const trackingUri = `${FileSystem.documentDirectory}.ps_user_initialized`;
      
      await FileSystem.writeAsStringAsync(trackingUri, "true");
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(itemsData));
      
      setPsItems(itemsData);
      parseCategories(itemsData, null);
      
      const targetCategory = activeCategory || prevCategory || "allcategories";
      setHPsItems(getPsItems(targetCategory, itemsData)); 
    } catch (e) {
      Alert.alert("Save Error", e.message || "Could not save items to disk.");
      throw e;
    }
  };

  const handleSavePSItem = async (newData, activeCategory) => {
    try {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      if (!loading) setLoading(true);

      const incomingItems = (Array.isArray(newData) ? newData : [newData]).map(normalizePSItem).filter(Boolean);
      const updatedList = [...psItems];
      
      incomingItems.forEach(itemData => {
        const index = updatedList.findIndex(c => String(c.id).trim() === String(itemData.id).trim());
        if (index > -1) {
          updatedList[index] = itemData;
        } else {
          updatedList.push(itemData);
        }
      });

      await savePsItemsToStorage(updatedList, activeCategory);
      setMode('list');
    } catch (e) {
      Alert.alert('Save Failed', e.message);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  };

  const deletePsItems = async (idsFromArg = []) => {
    const actualIds = Array.isArray(idsFromArg) && idsFromArg.length > 0 ? idsFromArg : (selectedIds || []);
    const cleanIdsToDelete = actualIds.map(id => String(id).trim());
    if (cleanIdsToDelete.length === 0) return;
    
    const isDeletingAll = actualIds.length === hPsItems.length;
    Alert.alert(
      isDeletingAll ? "Delete All Items" : "Delete Items",
      isDeletingAll ? "Remove all Items in this Category?" : `Remove ${cleanIdsToDelete.length} selected Item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const itemsToDelete = psItems.filter(m => cleanIdsToDelete.includes(String(m.id).trim()));
              let errfound = false;
              
              for (const psItem of itemsToDelete) {
                const folderUri = `${FileSystem.documentDirectory}problem_solution/${psItem.id}/`;
                try {
                  await FileSystem.deleteAsync(folderUri, { idempotent: true });
                } catch (err) {
                  if (!errfound) {
                    errfound = true;
                    Alert.alert("Delete Error", err.message || "Could not delete file from storage.");
                  }
                }
              }
              
              const updatedList = psItems.filter(m => !cleanIdsToDelete.includes(String(m.id).trim()));
              const fileUri = `${FileSystem.documentDirectory}problem_solution.json`;
              await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(updatedList));
              
              if (updatedList.length === 0) {
                const trackingUri = `${FileSystem.documentDirectory}.ps_user_initialized`;
                await FileSystem.writeAsStringAsync(trackingUri, "true");
              }

              setPsItems(updatedList);
              parseCategories(updatedList, null);
              setSelectedIds([]);
              setCurrentPSItem(null);

              const matchingItems = updatedList.filter(m => 
                psItemCategory === "allcategories" || m.category === psItemCategory
              );

              if (isDeletingAll || matchingItems.length < 1) {
                setPsItemCategory('Enter Category');
                setPrevCategory("");
                setMode('main');
              } else {
                setHPsItems(getPsItems(psItemCategory, updatedList));
              }
            } catch (e) {
              Alert.alert("Delete Error", e.message || "Could not delete files from storage.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

    const savePSItem = async () => {
    if (isPickingRef.current || isPicking) return;

    if (!psItemTitle.trim()) {
      Alert.alert('Required', 'Please enter a Title');
      return;
    }

    if (!psItemCategory.trim()) {
      Alert.alert('Required', 'Please enter a Category');
      return;
    }

    if (problemSections.length === 0) {
      Alert.alert('Required', 'Add at least one Problem section.');
      return;
    }

    if (solutionSections.length === 0) {
      Alert.alert('Required', 'Add at least one Solution section.');
      return;
    }

    for (const section of problemSections) {
      if (!section.title.trim()) {
        Alert.alert('Required', `Problem section needs a Title`);
        return;
      }
      if (!section.mediaUri && !section.mediaUrl?.trim()) {
        Alert.alert('Required', `Problem section "${section.title}" needs Media`);
        return;
      }
    }

    for (const section of solutionSections) {
      if (!section.title.trim()) {
        Alert.alert('Required', `Solution section needs a Title`);
        return;
      }
      if (!section.mediaUri && !section.mediaUrl?.trim()) {
        Alert.alert('Required', `Solution section "${section.title}" needs Media`);
        return;
      }
    }

    try {
      setLoading(true);
      let copyfailed = false;
      const psId = psItemId || currentPSItem?.id || Date.now().toString();
      const permanentDirUri = `${FileSystem.documentDirectory}problem_solution/${psId}/`;
      await FileSystem.makeDirectoryAsync(permanentDirUri, { intermediates: true });

      const activeSavedFilenames = [];
      const ensurePermanent = async (uri, fileName) => {
        if (!uri) return uri;
        
        if (typeof uri === 'string' && uri.startsWith(permanentDirUri)) {
          const existingName = uri.split('/').pop();
          if (existingName) activeSavedFilenames.push(existingName);
          return uri;
        }

        const destUri = `${permanentDirUri}${fileName}`;
        try {
          await FileSystem.copyAsync({ from: uri, to: destUri });
          activeSavedFilenames.push(fileName);
          return destUri;
        } catch (e) {
          Alert.alert("Copy Media Failed", "Please try again. Device may be running out of space.");
          return "COPYFAILED";
        }
      };

      const processedProblemSections = await Promise.all(
        problemSections.map(async (section) => {
          const newSection = { ...section };
          if (section.mediaUri && typeof section.mediaUri === 'string') {
            const ext = getMediaFileExtension(section.mediaUri, section.type);
            const safeFilename = `idojo_prob_section_${String(section.id).trim()}${ext}`;
            newSection.mediaUri = await ensurePermanent(section.mediaUri, safeFilename);
            if (newSection.mediaUri === "COPYFAILED") copyfailed = true;
          }
          return newSection;
        })
      );

      const processedSolutionSections = await Promise.all(
        solutionSections.map(async (section) => {
          const newSection = { ...section };
          if (section.mediaUri && typeof section.mediaUri === 'string') {
            const ext = getMediaFileExtension(section.mediaUri, section.type);
            const safeFilename = `idojo_sol_section_${String(section.id).trim()}${ext}`;
            newSection.mediaUri = await ensurePermanent(section.mediaUri, safeFilename);
            if (newSection.mediaUri === "COPYFAILED") copyfailed = true;
          }
          return newSection;
        })
      );
    
      if (copyfailed) {
        setLoading(false);
        return;
      }  

      const psItemData = normalizePSItem({
        id: psId,
        title: psItemTitle.trim(),
        category: psItemCategory.trim() || "Enter Category",
        description: psItemDesc,
        problemSections: processedProblemSections,
        solutionSections: processedSolutionSections,
        updatedAt: new Date().toISOString(),
      });

      try {
        const existingFiles = await FileSystem.readDirectoryAsync(permanentDirUri);
        for (const file of existingFiles) {
          if (!activeSavedFilenames.includes(file)) {
            const fullPathToDelete = `${permanentDirUri}${file}`;
            await FileSystem.deleteAsync(fullPathToDelete, { idempotent: true });
          }
        }
      } catch (cleanupErr) {
        console.log("Cleanup system bypassed:", cleanupErr.message);
      }

      const destinationCategory = prevCategory || 'allcategories';
      setPrevCategory(destinationCategory);
      setPsItemCategory(destinationCategory);
      
      await handleSavePSItem(psItemData, destinationCategory);
    } catch (err) {
      Alert.alert("Save Error", err.message || "Failed to save Item");
    } finally {
      setLoading(false);
    }
  };

  const sharePsItems = async (itemIds) => {
    if (isOffline) {
      Alert.alert("No Internet", "You need an internet connection to share data.");
      return;
    }
    if (!itemIds?.length) return;
    
    let shareDir = null;
    let zipPath = null;
    let shareSuccess = false;
    
    try {
      setLoading(true);
      shareDir = `${FileSystem.cacheDirectory}ps_export_${Date.now()}/`;
      zipPath = `${FileSystem.cacheDirectory}iDojo_PS_${Date.now()}.zip`;
      
      await FileSystem.deleteAsync(shareDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(shareDir, { intermediates: true });
      
      const itemsToShare = psItems.filter(c => itemIds.includes(c.id));
      for (let i = 0; i < itemsToShare.length; i++) {
        await FileSystem.makeDirectoryAsync(`${shareDir}item_${i}/`, { intermediates: true });
      }

      const exportPromises = itemsToShare.map(async (item, itemIdx) => {
        const itemCopy = { 
          ...item, 
          problemSections: item.problemSections?.map(s => ({...s})) || [],
          solutionSections: item.solutionSections?.map(s => ({...s})) || []
        };
        
        const itemDir = `${shareDir}item_${itemIdx}/`;
        
        const processStream = async (sectionsArray, prefix) => {
          return Promise.all(sectionsArray.map(async (section, sectionIdx) => {
            const sectionCopy = { ...section };
            if (section.mediaUri && section.mediaUri.startsWith('file://')) {
              const info = await FileSystem.getInfoAsync(section.mediaUri);
              if (info.exists) {
                const fileName = `${prefix}_${itemIdx}_${sectionIdx}_${section.mediaUri.split('/').pop()}`;
                const dest = `${itemDir}${fileName}`;
                await FileSystem.copyAsync({ from: section.mediaUri, to: dest });
                sectionCopy.mediaUri = fileName;
              } else {
                sectionCopy.mediaUri = null;
              }
            }
            return sectionCopy;
          }));
        };

        itemCopy.problemSections = await processStream(item.problemSections, 'prob');
        itemCopy.solutionSections = await processStream(item.solutionSections, 'sol');
        
        await FileSystem.writeAsStringAsync(`${itemDir}item.json`, JSON.stringify(itemCopy));
        return itemCopy;
      });
      
      await Promise.all(exportPromises);
      
      const manifest = {
        app: 'iDojo_PS',
        version: 1,
        count: itemsToShare.length,
        exportDate: new Date().toISOString()
      };
      
      await FileSystem.writeAsStringAsync(`${shareDir}manifest.json`, JSON.stringify(manifest));
      
      const nakedSource = Platform.OS === 'android' ? shareDir.replace('file://', '').replace(/\/$/, '') : shareDir;
      const nakedTarget = Platform.OS === 'android' ? zipPath.replace('file://', '') : zipPath;
        
      await zip(nakedSource, nakedTarget);
      await Sharing.shareAsync(zipPath, { dialogTitle: `Share ${itemsToShare.length} Item(s)`, mimeType: 'application/zip' });
      shareSuccess = true;
    } catch (e) {
      Alert.alert('Share Error', e.message || 'Failed to share data');
    } finally {
      setLoading(false);
      if (shareSuccess) setSelectedIds([]);
      if (shareDir) try { await FileSystem.deleteAsync(shareDir, { idempotent: true }); } catch (e) {}
      if (zipPath) try { await FileSystem.deleteAsync(zipPath, { idempotent: true }); } catch (e) {}
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPsItems();
    }, [psItemCategory])
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (openpdfViewer !== null) {
        setOpenpdfViewer(null);
        return true;
      }
      if (mode === 'view') {
        setMode('list');
        setVcDropdownVisible(true);
        return true;
      }
      if (mode === 'add') {
        if (isPickingRef.current || isPicking) return true;
        if (isLoadingRef.current) return true;
        setMode('list');
        resetForm();
        return true;
      }
      if (mode === 'list') {
        setSelectedIds([]);
        setPsItemCategory('');
        setMode('main');
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [mode, openpdfViewer, isPicking, loading]);


    const handleImportPSItems = async () => {
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
      extractDir = `${FileSystem.documentDirectory}imported_ps_${importId}/`;
      tempZipPath = `${FileSystem.cacheDirectory}import_ps_temp_${importId}.zip`;
      
      await FileSystem.copyAsync({ from: asset.uri, to: tempZipPath });
      await FileSystem.makeDirectoryAsync(extractDir, { intermediates: true });
      
      const nakedZip = Platform.OS === 'android' ? tempZipPath.replace('file://', '') : tempZipPath;
      const nakedDest = Platform.OS === 'android' ? extractDir.replace('file://', '').replace(/\/$/, '') : extractDir;
      
      await unzip(nakedZip, nakedDest);
      
      let manifest = { count: 1 };
      try {
        const manifestContent = await FileSystem.readAsStringAsync(`${extractDir}manifest.json`);
        manifest = JSON.parse(manifestContent);
      } catch (e) {}
      
      const rawItems = [];
      const itemDirs = manifest.count > 1 
          ? Array.from({length: manifest.count}, (_, i) => `item_${i}/`) 
        : [''];
      
      for (const dir of itemDirs) {
        const itemPath = `${extractDir}${dir}item.json`;
        const info = await FileSystem.getInfoAsync(itemPath);
        if (!info.exists) continue;
        
        const content = await FileSystem.readAsStringAsync(itemPath);
        let psItem;
        try {
          psItem = JSON.parse(content);
        } catch (parseError) {
          continue;
        }

        if (!psItem || typeof psItem !== 'object') continue;
        if (!psItem.title?.trim()) continue;
        
        const itemDir = `${extractDir}${dir}`;
        const fixItemPath = (oldPath) => {
          if (!oldPath || typeof oldPath !== 'string' || oldPath.startsWith('http')) return oldPath;
          const fileName = oldPath.split('/').pop();
          return `${itemDir}${fileName}`;
        };
        
        psItem.problemSections?.forEach((section) => {
          if (!section) return;
          section.mediaUri = fixItemPath(section.mediaUri);
          if (section.mediaUri && section.mediaUrl && !section.mediaUrl.startsWith('http')) {
            section.mediaUrl = '';
          }
        });

        psItem.solutionSections?.forEach((section) => {
          if (!section) return;
          section.mediaUri = fixItemPath(section.mediaUri);
          if (section.mediaUri && section.mediaUrl && !section.mediaUrl.startsWith('http')) {
            section.mediaUrl = '';
          }
        });
        
        rawItems.push(psItem);
      }
      
      if (rawItems.length === 0) {
        throw new Error('No valid items found in zip file');
      }
      
      const finalItems = rawItems.map((psItem, index) => normalizePSItem({
        ...psItem,
        id: `ps_${importId}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        updatedAt: new Date().toISOString()
      })).filter(c => (Array.isArray(c.problemSections) && c.problemSections.length > 0) && (Array.isArray(c.solutionSections) && c.solutionSections.length > 0));
      
      if (finalItems.length === 0) {
        throw new Error("No valid items to import");
      }

      const copyImportedMedia = async (psItem) => {
        const permanentDirUri = `${FileSystem.documentDirectory}problem_solution/${psItem.id}/`;
        await FileSystem.makeDirectoryAsync(permanentDirUri, { intermediates: true });

        const processImportStream = async (sectionsArray, isProblem) => {
          for (const section of sectionsArray || []) {
            if (!section) continue;

            const localSource = section.mediaUri && typeof section.mediaUri === 'string' && !section.mediaUri.startsWith('http')
              ? section.mediaUri
              : section.mediaUrl && typeof section.mediaUrl === 'string' && !section.mediaUrl.startsWith('http')
                ? section.mediaUrl
                : null;

            if (!localSource) continue;
            if (localSource.startsWith(permanentDirUri)) continue;

            const sourceExt = localSource.includes('.')
              ? `.${localSource.split('.').pop().toLowerCase()}`
              : section.type === 'pdf' ? '.pdf'
              : section.type === 'audio' ? '.m4a'
              : section.type === 'image' ? '.jpg'
              : '.mp4';

            const prefix = isProblem ? 'prob' : 'sol';
            const destUri = `${permanentDirUri}idojo_${prefix}_section_${section.id}${sourceExt}`;

            try {
              await FileSystem.copyAsync({ from: localSource, to: destUri });
              section.mediaUri = destUri;
              if (section.mediaUrl && typeof section.mediaUrl === 'string' && !section.mediaUrl.startsWith('http')) {
                section.mediaUrl = '';
              }
            } catch (copyErr) {
              console.log('Import copy failure:', copyErr.message);
            }
          }
        };

        await processImportStream(psItem.problemSections, true);
        await processImportStream(psItem.solutionSections, false);
      };

      for (const psItem of finalItems) {
        await copyImportedMedia(psItem);
      }
      
      const updatedList = [...psItems, ...finalItems];
      await savePsItemsToStorage(updatedList, psItemCategory);
      
      Alert.alert('Success', `${finalItems.length} item(s) imported!`);
    } catch (e) {
      Alert.alert('Import Failed', e.message || 'Failed to import elements');
    } finally {
      setLoading(false);
      if (extractDir) try { await FileSystem.deleteAsync(extractDir, { idempotent: true }); } catch (e) {}
      if (tempZipPath) try { await FileSystem.deleteAsync(tempZipPath, { idempotent: true }); } catch (e) {}
    }
  };

  
  const MyHeader = () => (
    <View style={styles.silverDivider}>
      <ImageBackground style={{width: "100%", height: "100%"}} resizeMode="cover" source={require('../assets/silverdivider.png')}/>
    </View>
  );

  const PSItemCard = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity 
        onLongPress={() => toggleSelect(item.id)}
        onPress={() => selectedIds.length > 0 ? toggleSelect(item.id) : viewPSItem(item)}
        style={[styles.chapterCard, isSelected && styles.selectedCard]}
      >
        <Text style={styles.chapterCardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.chapterCardCount}>{`${item.problemSections?.length || 0} Problems / ${item.solutionSections?.length || 0} Solutions`}</Text>
        <View style={styles.chapterCardFooter}>
          <TouchableOpacity style={styles.editBtnCard} onPress={() => populateForEdit(item, item.category)}>
            <Text style={styles.editBtnText}>EDIT</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionItem = (section, index, stream) => (
    <View key={section.id} style={styles.sectionContainerBlock}>
      <Text style={styles.sectionIndexLabel}>{`${stream.toUpperCase()} SECTION #${index + 1}`}</Text>
      
      <Text style={styles.label}>Section Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Section Title"
        placeholderTextColor="#918c8c"
        value={section.title}
        onChangeText={(text) => updateSection(section.id, 'title', text, stream)}
      />

      <Text style={styles.label}>Online Media URL (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Paste Link (HTTP/HTTPS)"
        placeholderTextColor="#918c8c"
        value={section.mediaUrl}
        onChangeText={(text) => updateSection(section.id, 'mediaUrl', text, stream)}
      />

      <View style={styles.mediaPickerRow}>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickMedia(section.id, stream)}>
          <Text style={styles.uploadBtnText}>{section.mediaUri ? "🔄 CHANGE LOCAL FILE" : "📁 UPLOAD FROM PHONE"}</Text>
        </TouchableOpacity>
        {section.mediaUri && <Text style={styles.fileLoadedIndicator}>✅ Local File Loaded</Text>}
      </View>

      <Text style={styles.label}>Section Description</Text>
      <TextInput
        style={[styles.input, styles.descInput]}
        placeholder="Enter Section Description"
        placeholderTextColor="#918c8c"
        value={section.description}
        onChangeText={(text) => updateSection(section.id, 'description', text, stream)}
        multiline
        numberOfLines={3}
      />

      <View style={styles.sectionFooterRow}>
        <View style={styles.changeTypeContainer}>
          <Text style={styles.changeTypeLabel}>Change To:</Text>
          <View style={styles.changeTypeGrid}>
            {[SECTION_TYPES.VIDEO, SECTION_TYPES.PDF, SECTION_TYPES.AUDIO, SECTION_TYPES.IMAGE]
              .filter((type) => type !== section.type)
              .map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.changeTypeIconBtn}
                  onPress={() => updateSection(section.id, 'type', type, stream)}
                >
                  <Text style={styles.changeTypeIcon}>
                    {type === SECTION_TYPES.VIDEO ? '📹' : type === SECTION_TYPES.PDF ? '📄' : type === SECTION_TYPES.AUDIO ? '🎵' : '🖼️'}
                  </Text>
                </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={() => removeSection(section.id, stream)} style={styles.removeStepIcon}>
          <ImageBackground style={{ height: 45, width: 110 }} resizeMode='contain' source={require('../assets/removesectionicon.png')}/>
        </TouchableOpacity>
      </View>
    </View>
  );


  if ( openpdfViewer && mode === 'view' && currentPSItem?.problemSections?.[openpdfViewer] && currentPSItem.problemSections[openpdfViewer].type === "pdf" ) {
    return (
      <PdfMove
        pdf={{
          title: currentPSItem.problemSections[openpdfViewer].title,
          style: 'Problem',
          desc: currentPSItem.problemSections[openpdfViewer].description,
          videoUrl: currentPSItem.problemSections[openpdfViewer].mediaUrl,
          vid: currentPSItem.problemSections[openpdfViewer].mediaUri,
        }}
        onClosePdf={() => setOpenpdfViewer(null)}
        isActive={true}
      />
    )
  }


  if ( openpdfViewer && mode === 'view' && currentPSItem?.solutionSections?.[openpdfViewer] && currentPSItem.solutionSections[openpdfViewer].type === "pdf" ) {
    return (
      <PdfMove
        pdf={{
          title: currentPSItem.solutionSections[openpdfViewer].title,
          style: 'Solution',
          desc: currentPSItem.solutionSections[openpdfViewer].description,
          videoUrl: currentPSItem.solutionSections[openpdfViewer].mediaUrl,
          vid: currentPSItem.solutionSections[openpdfViewer].mediaUri,
        }}
        onClosePdf={() => setOpenpdfViewer(null)}
        isActive={true}
      />
    )
  }


  if (mode === 'view' && currentPSItem) {
    return (
      <SafeAreaView style={styles.viewLayoutContainer}>
        <StatusBar barStyle="dark-content"/>
        <View style={styles.vcHeader}>
          <Text style={styles.vcTitle} numberOfLines={1}>{currentPSItem.title}</Text>
          <TouchableOpacity onPress={() => setVcDropdownVisible(!vcDropdownVisible)} style={styles.vcToggleBtn}>
            <Text style={styles.vcToggleText}>{!vcDropdownVisible ? '▼' : '▲'}</Text>
          </TouchableOpacity>
        </View>

        {vcDropdownVisible && (
          <View style={styles.vcDropdownContainer}>
            <Text style={styles.vcInfoLabel}>{`Sections: ${currentPSItem.problemSections?.length || 0} Problems / ${currentPSItem.solutionSections?.length || 0} Solutions`}</Text>
            {currentPSItem.description ? (
              <ScrollView nestedScrollEnabled style={styles.vcDescScroll}>
                <Text style={styles.vcDescText}>{currentPSItem.description}</Text>
              </ScrollView>
            ) : null}
          </View>
        )}

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.vcHeader}>
            <Text style={styles.streamHeadingDivider}>⚠️ PROBLEM SECTIONS</Text>
            <TouchableOpacity onPress={() => setPDropdownVisible(!pDropdownVisible)} style={styles.vcToggleBtn}>
              <Text style={styles.vcToggleText}>{!pDropdownVisible ? '▼' : '▲'}</Text>
            </TouchableOpacity>
          </View>
          {pDropdownVisible && currentPSItem.problemSections?.map((item, index) => (
            <SectionPlayer
              key={item.id}
              section={item}
              index={index}
              isActive={activeSectionId === item.id}
              onActivate={() => setActiveSectionId(item.id)}
              onDeactivate={() => setActiveSectionId(null)}
              onOpenpdfViewer={() => setOpenpdfViewer(index)}
              navigation={navigation}
              isOffline={isOffline}
            />
          ))}

          <View style={styles.vcHeader}>
            <Text style={styles.streamHeadingDivider}>✅ SOLUTION SECTIONS</Text>
            <TouchableOpacity onPress={() => setSDropdownVisible(!sDropdownVisible)} style={styles.vcToggleBtn}>
              <Text style={styles.vcToggleText}>{!sDropdownVisible ? '▼' : '▲'}</Text>
            </TouchableOpacity>
          </View>
          {sDropdownVisible && currentPSItem.solutionSections?.map((item, index) => (
            <SectionPlayer
              key={item.id}
              section={item}
              index={index}
              isActive={activeSectionId === item.id}
              onActivate={() => setActiveSectionId(item.id)}
              onDeactivate={() => setActiveSectionId(null)}
              onOpenpdfViewer={() => setOpenpdfViewer(index)}
              navigation={navigation}
              isOffline={isOffline}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }


  if(loading) { 
    return ( 
      <View style={styles.loadingOverlay}>
        <View style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
          <Image style={{ height: 76, width: 76, elevation: 4, marginBottom: 24,  borderRadius: 12, opacity: 1 } } resizeMode='contain' source={require('../assets/icon.png')} />
          <ActivityIndicator size="large" color="#7a0891" style={{ transform: [{ scale: 1.9 }], marginBottom: 17,  }} />
          <Text style={styles.loadingText}>Please Wait...</Text>
        </View>
      </View> 
    );
  }


  if (mode === 'list') {
     return (
      <ImageBackground style={{flex: 1, width: '100%', height: '100%'}} resizeMode='cover' source={require('../assets/problems/problemsbg.png')}>
        <StatusBar barStyle="light-content"/>
        <SafeAreaView style={{ flex: 1}}>
          <View style={styles.centerLogoWrapper}>
            <ImageBackground style={styles.icon} resizeMode='contain' source={require('../assets/problems/problemslisttitle.png')} /> 
          </View>
    
          <View style={styles.myDojoHeader}>
            <Text style={styles.categoryHeaderText}>{psItemCategory === "allcategories" ? "ALL CATEGORIES" : `CATEGORY: ${psItemCategory}`}</Text>
            <View style={{flexDirection:'row'}}>
              <TouchableOpacity onPress={() => { setSelectedIds([]); setMode("main"); }} style={styles.plusIconAM}>
                <ImageBackground style={{ height: "100%", width: "100%" }} resizeMode='contain' source={require('../assets/problems/backpurple.png')}/>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => populateForEdit(null, psItemCategory)} style={styles.plusIcon}>
                <ImageBackground style={{ height: "100%", width: "100%" }} resizeMode='contain' source={require('../assets/problems/addproblembtn.png')}/>         
              </TouchableOpacity>
            </View>
          </View>
               
          <View style={styles.flatlistContainer}> 
            <FlatList
              data={hPsItems}
              extraData={[selectedIds, psItems]}
              keyExtractor={(item, index) => item.id || index.toString()}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 38, flexGrow: 1 }}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainerView}>
                  <Text style={styles.emptyReloadText}>Reload Content</Text>
                  <TouchableOpacity onPress={() => { if (!loading && !isLoadingRef.current) loadPsItems(); }}>
                    <ImageBackground style={{ height: 60, width: 60 }} resizeMode='contain' source={require('../assets/reloadicon.png')}/>         
                  </TouchableOpacity>
                </View>
              )}
              renderItem={({ item }) => (
                psItemCategory === "allcategories" ? (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>{item.category}</Text>
                    <FlatList
                      horizontal
                      data={item.data || []}
                      extraData={[selectedIds, psItems]}
                      initialNumToRender={item?.data?.length || 1}
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(item, index) => item?.id?.toString() || `idx-${index}`}
                      contentContainerStyle={{ paddingRight: 38, paddingLeft: 12 }}
                      renderItem={({ item: psElement }) => <PSItemCard item={psElement} />}
                    />
                  </View>
                ) : (<View style={styles.verticalWrapper}><PSItemCard item={item} /></View>)
              )}
            />
          </View>
         
          {selectedIds.length > 0 && (
            <View style={styles.batchBar}>
              <Text style={styles.batchText}>{`${selectedIds.length} Selected`}</Text>
              <TouchableOpacity onPress={() => sharePsItems(selectedIds)} style={styles.shareIcon}>
                <ImageBackground style={{height: "100%", width: "100%"}} resizeMode='contain' source={require('../assets/problems/purplesharearrow.png')}/>         
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deletePsItems(selectedIds)} style={styles.myDojoDiscardIcon}>
                <ImageBackground style={{height: "100%", width: "100%"}} resizeMode='contain' source={require('../assets/discardicon.png')}/> 
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedIds([])} style={styles.myDojoDeleteIcon}>
                <ImageBackground style={{height: "100%", width: "100%"}} resizeMode='contain' source={require('../assets/problems/deleteproblembtn.png')}/>         
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (mode === 'add') {
     return (
      <ImageBackground source={require('../assets/problems/problemsbg.png')} style={styles.imgBackground} resizeMode='cover' >
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.formHeaderTitleRow}>
              <ImageBackground style={styles.iconAM} resizeMode='contain' source={currentPSItem ? require('../assets/problems/editproblemtitle.png') : require('../assets/problems/addproblemtitle.png')} /> 
            </View>
            
            <TouchableOpacity onPress={() => { if (isPicking || isPickingRef.current) return; setMode('list'); resetForm(); }} style={styles.discardBtn}>
              <ImageBackground style={{ alignSelf:'center', height:67, width:"100%", opacity: 1}} imageStyle={{ opacity: 1 }} resizeMode='contain' source={require('../assets/discardicon.png')}/>
              <Text style={styles.discardText}>❌CANCEL</Text>
            </TouchableOpacity>

            <ScrollView style={styles.formScroller} contentContainerStyle={{ paddingBottom: 120 }}>
              <Text style={styles.label}>Problem & Solution Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Title..."
                placeholderTextColor="#726b6b"
                value={psItemTitle}
                onChangeText={setPsItemTitle}
              />

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Category..."
                placeholderTextColor="#726b6b"
                value={psItemCategory}
                onChangeText={setPsItemCategory}
              />

              <Text style={styles.label}>Global Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.descInput]}
                placeholder="Enter Description Summary..."
                placeholderTextColor="#726b6b"
                value={psItemDesc}
                onChangeText={setPsItemDesc}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.formStreamSectionDivider}>⚠️ PROBLEM SECTIONS BUILDER</Text>
              {problemSections.map((section, index) => renderSectionItem(section, index, 'problem'))}
              
              <View style={styles.addSectionContainer}>
                <View style={styles.addSectionButtons}>
                  <TouchableOpacity style={styles.addSectionBtn} onPress={() => addSection(SECTION_TYPES.VIDEO, 'problem')}>
                    <ImageBackground style={{ height: 38, width: "100%", justifyContent: 'center', opacity: 1, borderRadius: 12 }} imageStyle={{ opacity: 1, borderRadius:12 }} resizeMode='contain' source={require('../assets/addvideobtn.png')} />
                  </TouchableOpacity>
              
                  <TouchableOpacity style={styles.addPdfSectionBtn} onPress={() => addSection(SECTION_TYPES.PDF, 'problem')}>
                    <ImageBackground style={{ height: 38, width: "100%", justifyContent: 'center', opacity: 1, borderRadius: 12 }} imageStyle={{ opacity: 1, borderRadius:12 }} resizeMode='contain' source={require('../assets/addpdfbtn.png')} />
                  </TouchableOpacity>
                </View>
              
                <View style={styles.addSectionButtons}>
                  <TouchableOpacity style={styles.addAudioSectionBtn} onPress={() => addSection(SECTION_TYPES.AUDIO, 'problem')}>
                    <ImageBackground style={{ height: 38, width: "100%", justifyContent: 'center', opacity: 1, borderRadius: 12 }} imageStyle={{ opacity: 1, borderRadius:12 }} resizeMode='contain' source={require('../assets/addaudiobtn.png')} />
                  </TouchableOpacity>
              
                  <TouchableOpacity style={styles.addImgSectionBtn} onPress={() => addSection(SECTION_TYPES.IMAGE, 'problem')}>
                    <ImageBackground style={{ height: 38, width: "100%", justifyContent: 'center', opacity: 1, borderRadius: 12 }} imageStyle={{ opacity: 1, borderRadius:12 }} resizeMode='contain' source={require('../assets/addimagebtn.png')} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{marginTop: 4, marginBottom: 3, flex: 1 }}> 
                <Image source={require('../assets/silverdivider.png')} style={{ width: '99%', height: 49, alignSelf: "center", paddingVertical: 1, opacity: 1}} resizeMode='contain'/>
              </View>

              <Text style={styles.formStreamSectionDivider}>✅ SOLUTION SECTIONS BUILDER</Text>
              {solutionSections.map((section, index) => renderSectionItem(section, index, 'solution'))}

              <View style={styles.addSectionContainer}>
                <View style={styles.addSectionButtons}>
                  <TouchableOpacity style={styles.addSectionBtn} onPress={() => addSection(SECTION_TYPES.VIDEO, 'solution')}>
                    <ImageBackground style={{ height: 38, width: "100%", justifyContent: 'center', opacity: 1, borderRadius: 12 }} imageStyle={{ opacity: 1, borderRadius:12 }} resizeMode='contain' source={require('../assets/addvideobtn.png')} />
                  </TouchableOpacity>
              
                  <TouchableOpacity style={styles.addPdfSectionBtn} onPress={() => addSection(SECTION_TYPES.PDF, 'solution')}>
                    <ImageBackground style={{ height: 38, width: "100%", justifyContent: 'center', opacity: 1, borderRadius: 12 }} imageStyle={{ opacity: 1, borderRadius:12 }} resizeMode='contain' source={require('../assets/addpdfbtn.png')} />
                  </TouchableOpacity>
                </View>
              
                <View style={styles.addSectionButtons}>
                  <TouchableOpacity style={styles.addAudioSectionBtn} onPress={() => addSection(SECTION_TYPES.AUDIO, 'solution')}>
                    <ImageBackground style={{ height: 38, width: "100%", justifyContent: 'center', opacity: 1, borderRadius: 12 }} imageStyle={{ opacity: 1, borderRadius:12 }} resizeMode='contain' source={require('../assets/addaudiobtn.png')} />
                  </TouchableOpacity>
              
                  <TouchableOpacity style={styles.addImgSectionBtn} onPress={() => addSection(SECTION_TYPES.IMAGE, 'solution')}>
                    <ImageBackground style={{ height: 38, width: "100%", justifyContent: 'center', opacity: 1, borderRadius: 12 }} imageStyle={{ opacity: 1, borderRadius:12 }} resizeMode='contain' source={require('../assets/addimagebtn.png')} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtnFullBlock} onPress={savePSItem}>
                <ImageBackground style={{ height: 50, width: "100%", justifyContent: 'center', alignItems: 'center' }} resizeMode='cover' source={require('../assets/problems/saveproblemandsolutionbtn.png')}>
                </ImageBackground>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </ImageBackground>
    );
  }


  return (
    <ImageBackground style={styles.imgBackground} resizeMode='cover' source={require('../assets/problems/problemsbg.png')}>
      <StatusBar barStyle="dark-content"/>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.centerLogoWrapper}>
          <ImageBackground style={styles.icon} resizeMode='contain' source={require('../assets/problems/problemstitle.png')} /> 
        </View>

        <View style={styles.header}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Workspace..."
              placeholderTextColor="rgba(88, 79, 79, 0.62)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => parseCategories(psItems, searchQuery)} style={styles.searchBtn}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/binocularsicon.png')}/>         
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSearchQuery(''); parseCategories(psItems, null); }} style={styles.clearBtn}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/reloadicon.png')}/>         
            </TouchableOpacity>
          </View>

          <View style={styles.dashboardIconsControlsRow}>
            <TouchableOpacity onPress={() => populateForEdit(null, "")} style={styles.plusIcon}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/problems/addproblembtn.png')}/>         
            </TouchableOpacity> 
            <TouchableOpacity onPress={handleImportPSItems} style={styles.importIcon}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/importmoveicon.png')}/>         
            </TouchableOpacity>
            <TouchableOpacity onPress={showInstructions} style={styles.infoIcon}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/mydojostylesinfoicon.png')}/>         
            </TouchableOpacity>
          </View>
        </View>

        { sPsItems.length > 0 ? (
          <FlatList
            data={sPsItems}
            extraData={psItems}
            style={{flex: 1}}
            keyExtractor={item => item.id}
            ListHeaderComponent={MyHeader}
            ItemSeparatorComponent={() => <View style={styles.smallGap} />}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item && item.category && (
                  <TouchableOpacity
                    style={styles.categoryMenuSelectionRowItem}
                    onPress={() => {
                      setHPsItems(getPsItems(item.category, psItems));
                      setPsItemCategory(item.category);
                      setPrevCategory(item.category);
                      setMode("list");
                    }}
                  >
                    {item.id === 'ps-all' ? (
                      <ImageBackground style={styles.fullWidthBtnAsset} resizeMode='contain' source={require('../assets/allcategoriesbtn.png')} />
                    ) : (
                      <ImageBackground style={styles.fullWidthBtnAssetTextured} resizeMode='contain' source={require('../assets/goldwhitebtn.png')}>
                        <Text numberOfLines={1} style={styles.cardTextMenuTitle}>{item.category}</Text>
                      </ImageBackground>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        ) : (
          <View style={styles.centerNotificationFlexPanel}>
            <Text style={styles.infoTextDashboardFallback}>Tap the gold (+) icon to define a fresh Problem & Solution vector workspace or load an external iDojo backup file.</Text>
          </View>
        ) }

        { loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#caaf38" />
            <Text style={styles.loadingText}>Synchronizing File Systems...</Text>
          </View>
        ) }
      </SafeAreaView>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  imgBackground: { flex: 1, width: '100%', height: '100%' },
  viewLayoutContainer: { flex: 1, backgroundColor: '#323232', width: '100%', height: '100%' },
  centerLogoWrapper: { marginBottom: 5, marginTop: -19, justifyContent: 'center', alignItems: 'center' },
  icon: { height: 70, width: width * 0.9 },
  iconAM: { height: 60, width: width * 0.8 },
  header: { paddingHorizontal: 16, marginBottom: 10, width: '100%' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 9, paddingVertical: 4, gap: 8, marginBottom: 7, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 9, alignItems: 'center', justifyBontent: 'center', width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  searchInput: { height: 38, width: '70%', backgroundColor: 'rgba(255, 255, 255, 0.79)', borderRadius: 8, paddingHorizontal: 8, color: 'black', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', fontSize: 11 },
  searchBtn: { width: 39, height: 37, backgroundColor: '#e7f5ed4f', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  clearBtn: { width: 32, height: 32, backgroundColor: '#31303080', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  dashboardIconsControlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 1, minHeight: 50, width: '100%', gap: 15 },
  plusIcon: { width: 45, height: 45 },
  plusIconAM: { width: 40, height: 40, marginRight: 10 },
  importIcon: { width: 45, height: 45 },
  infoIcon: { width: 45, height: 45 },
  silverDivider: { width: '99%', height: 10, alignSelf: 'center', marginVertical: 5 },
  smallGap: { height: 12 },
  card: { width: '100%', alignItems: 'center', marginVertical: 6 },
  categoryMenuSelectionRowItem: { width: '80%', height: 55, justifyContent: 'center', alignItems: 'center' },
  fullWidthBtnAsset: { width: '100%', height: '100%' },
  fullWidthBtnAssetTextured: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardTextMenuTitle: { color: '#313030', fontWeight: 'bold', fontSize: 15, textAlign: 'center', width: '90%' },
  centerNotificationFlexPanel: { flex: 1, paddingHorizontal: 30, justifyContent: 'center', alignItems: 'center' },
  infoTextDashboardFallback: { color: '#f3efbd', textAlign: 'center', fontSize: 13, lineHeight: 18 },
  categoryHeaderText: { color: '#9e37f3', fontSize: 13, fontWeight: '600', textAlign: 'center', textTransform: 'uppercase', marginVertical: 6 },
  flatlistContainer: { flex: 1, width: '100%' },
  emptyContainerView: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyReloadText: { color: '#f3efbd', marginBottom: 12, fontWeight: 'bold', fontSize: 15 },
  sectionContainer: { marginVertical: 10, width: '100%' },
  sectionHeader: { color: '#9e37f3', fontSize: 14, fontWeight: 'bold', marginLeft: 16, marginBottom: 8, textTransform: 'uppercase' },
  verticalWrapper: { width: '100%', alignItems: 'center', paddingVertical: 6 },
  chapterCard: { width: CARD_WIDTH, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 12, padding: 14, marginHorizontal: 8, borderWidth: 1, borderColor: '#a926dc', elevation: 3 },
  selectedCard: { borderColor: '#a926dc', backgroundColor: '#fef2f2', borderWidth: 2 },
  chapterCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  chapterCardCount: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  chapterCardFooter: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%' },
  editBtnCard: { backgroundColor: '#8f36d8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  editBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  batchBar: { position: 'absolute', bottom: 20, left: '5%', right: '5%', height: 55, backgroundColor: '#1e293b', borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderWidth: 1.5, borderColor: '#a926dc', elevation: 10 },
  batchText: { color: '#ae2ab3', fontWeight: 'bold', fontSize: 13 },
  shareIcon: { width: 35, height: 35 },
  myDojoDiscardIcon: { width: 35, height: 35 },
  myDojoDeleteIcon: { width: 35, height: 35 },
  vcHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e0c29a9', paddingHorizontal: 16, paddingVertical: 8, borderWidth: 2, borderColor: '#a926dc', borderRadius: 10, margin: 8 },
  vcTitle: { flex: 1, color: 'white', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginHorizontal: 10 },
  vcToggleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8d3081', justifyContent: 'center', alignItems: 'center' },
  vcToggleText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  vcDropdownContainer: { width: '95%', maxHeight: height * 0.2, alignSelf: 'center', backgroundColor: '#1e293b', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#9a926dc90f1a' },
  vcInfoLabel: { color: '#8f36d8', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  vcDescScroll: { flexGrow: 1, marginTop: 4 },
  vcDescText: { color: 'honeydew', fontSize: 12, lineHeight: 16 },
  streamHeadingDivider: { color: '#eef5ed', backgroundColor: '#3f154293', fontSize: 13, fontWeight: 'bold', paddingVertical: 6, paddingHorizontal: 16, marginVertical: 12, letterSpacing: 1 },
  formHeaderTitleRow: { width: '100%', alignItems: 'center', marginVertical: 10 },
  discardBtn: { backgroundColor: 'rgba(206, 26, 26, 0.32)', borderWidth: 1, borderColor: '#dc262623', marginBottom: 9, marginLeft: 12, height: 70, width: 67, borderRadius: 10, justifyContent: 'center', alignItems: 'center', opacity: 1},
  discardText: { color: '#ef4444', fontWeight: 'bold', fontSize: 11 },
  formScroller: { flex: 1, paddingHorizontal: 16 },
  label: { color: '#9e37f3', fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 4, textTransform: 'uppercase' },
  input: { height: 40, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, color: '#000', borderWidth: 1, borderColor: '#590f85', marginBottom: 4 },
  descInput: { height: 70, textAlignVertical: 'top', paddingVertical: 8 },
  formStreamSectionDivider: { color: '#9e37f3', fontSize: 13, fontWeight: 'bold', marginTop: 22, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#660f88', paddingBottom: 4 },
  sectionContainerBlock: { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 10, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  sectionIndexLabel: { color: '#fff', fontWeight: 'bold', fontSize: 11, marginBottom: 6 },
  mediaPickerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 10 },
  uploadBtn: { backgroundColor: '#475569', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  uploadBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  fileLoadedIndicator: { color: '#4ade80', fontSize: 11, fontWeight: '600' },
  sectionFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  changeTypeContainer: { flex: 1 },
  changeTypeLabel: { color: '#f3efbd', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  changeTypeGrid: { flexDirection: 'row', gap: 6 },
  changeTypeIconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(185, 56, 202, 0.15)', borderWidth: 1, borderColor: 'rgba(161, 35, 219, 0.38)', alignItems: 'center', justifyContent: 'center' },
  changeTypeIcon: { fontSize: 18 },
  removeStepIcon: { justifyContent: 'center', alignItems: 'center' },
  addSectionBtn: {marginTop: 5, height: 47, width: 114, alignSelf:'center', alignItems: 'center', justifyContent:'center', opacity: 1, marginRight: 19},
  addPdfSectionBtn: {marginTop: 5, height: 41, width: 114, alignSelf:'center', alignItems: 'center', justifyContent:'center', opacity: 1, marginLeft: 3},
  addImgSectionBtn: {marginTop: 24, height: 76, width: 125, opacity: 1, alignSelf:'center', alignItems: 'center', marginLeft: 19},
  addAudioSectionBtn: {marginTop: 5, height: 57, width: 140, opacity: 1, marginLeft: 15, alignSelf:'center',},
  addSectionButtons: {marginTop: 5, width: "100%", flexDirection: "row", opacity: 1, alignItems: 'center', justifyContent: 'center'},
  addSectionContainer: {marginTop: 38, width: "100%", flexDirection: "column", opacity: 1, justifyContent:'center', alignItems: 'center'},
  saveBtnFullBlock: { width: '100%', height: 50, borderRadius: 10, overflow: 'hidden', marginTop: 25, marginBottom: 20 },
  saveBtnTextInternal: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.76)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  loadingText: { color: '#9e37f3', fontWeight: 'bold', fontSize: 12, marginTop: 10, letterSpacing: 0.5 }
});