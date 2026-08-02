import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, Alert, ImageBackground, Pressable,KeyboardAvoidingView, Platform, StatusBar, FlatList, Dimensions, BackHandler, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetInfo } from "@react-native-community/netinfo";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { zip, unzip } from 'react-native-zip-archive';
import * as ImagePicker from 'expo-image-picker';
import { useAudioPlayer } from 'expo-audio';
import * as Sharing from 'expo-sharing';
import { fighters as initialStaticFighters } from '../data/fighters';
import Fighter from './Fighter';

const { height, width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.76;

const ksoundFile = require('../assets/woosh.mp3');

export default function FightersList() {
  const [mode, setMode] = useState("list");
  const [allFighters, setAllFighters] = useState([]);
  const [currentFighter, setCurrentFighter] = useState(null); 
  const [hFighters, setHFighters] = useState([]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPicking, setIsPicking] = useState(false);
  const isPickingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const isOffline = useNetInfo().isConnected === false;

  const [fighterId, setFighterId] = useState(null);
  const [fighterName, setFighterName] = useState("");
  const [fighterStyle, setFighterStyle] = useState("");
  const [fighterConc, setFighterConc] = useState("");
  const [fighterDescList, setFighterDescList] = useState([""]); 
  const [fighterMoves, setFighterMoves] = useState([]);
  const [activeAvatarUri, setActiveAvatarUri] = useState(null);

  const navigation = useNavigation();

  const kplayer = useAudioPlayer(ksoundFile, (player) => {
    player.loop = false; 
  });


  const navKSound = (item) => {
    try {
      if (kplayer) {
        kplayer.seekTo(0);
        kplayer.play();
      }
    } catch (error) {}

    setCurrentFighter(item);
    setSelectedIds([]);
    setMode("view");
  };


  const showInstructions = () => {
    Alert.alert(
      "Fighters List",
      "Intructions: Save, Edit, View, Share, Delete and Import Fighters using iDojo. You may add any number of Fighters your phone memory allows. Click the binoculars icon to search Fighters by the search term entered. After a search another search can be done by using backspace to remove the search term instead of the silver reload icon.\n(1) Use the gold, plus(+) icon in the top menu bar to Add Fighters. Every Fighter must contain at least one Signature Move. You can add an Image to every Signature Move. A Fighter avatar, style and name is required for all Fighters and media is required for all Signature Moves, the conclusion is optional. Media in each Signature Move can only contain images uploaded from the phone.\n(2) Click on one of the cards on the Fighters List Screen to open and view the Fighter Screen.\n(3) On the list screen press and hold a Fighter card to see the batch bar appear, after select all Fighters to share or delete and click on the share or delete button in the batch bar to share or delete Fighters. Use the Edit button at the bottom of a Fighters card to edit a Fighter, it only appears after pressing and holding the card. Fighters can only be shared and imported with the iDojo App.\n(4) Scroll vertically on the List Screen to view all Fighter Cards each showing a thumnail of the avatar image. On the Add Fighters screen fill out the form and click the save button to save Fighters. When adding Signature Moves on the Add Fighter screen click the add signature move button to add a Signature Move and the Add Quote button to add Fighter Quotes. The -Signature Move button is provided for removing Signature Moves. Thank you and please enjoy using iDojo.",
      [ { text: "OK",
        onPress: () => setMode("list"),
          style: "cancel" 
      }],
      { cancelable: false } 
    );
  };


  const clearAppCache = async () => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
        if (cacheDir) {
        const cachedItems = await FileSystem.readDirectoryAsync(cacheDir);
        for (const item of cachedItems) {
          const itemPath = `${cacheDir}${item}`;
          await FileSystem.deleteAsync(itemPath, { idempotent: true });
        }
      }
    } catch (error) {
      
    }
  };


  const parseStyles = (list, query) => {
    if (!Array.isArray(allFighters)) {
      Alert.alert("Data Error", "Data is not an array, skipping loading.");
      return;
    }

    try {
      const validList = allFighters.filter(f => f && f.id && f.name && f.style);
      const q = searchQuery?.trim()?.toLowerCase();
      
      if (!q) {
        setHFighters(validList);
        return;
      }

      const filteredList = validList.filter(f => 
        f.name?.toLowerCase().includes(q) || f.style?.toLowerCase().includes(q) || f.desc?.some(d => d?.toLowerCase().includes(q)) ||
        f.moves?.some(m => m.title?.toLowerCase().includes(q) || m.desc?.toLowerCase().includes(q))
      );

      setHFighters(filteredList);
    } catch (e) {
      Alert.alert("Filtering Error", e.message || "An error occurred filtering Fighters.");
    }
  };


  const loadFighters = async () => {
    try {
      if (isLoadingRef.current) return; 
      isLoadingRef.current = true;
      setLoading(true);

      const fileUri = `${FileSystem.documentDirectory}fighters_custom.json`;
      const trackingUri = `${FileSystem.documentDirectory}.fighters_user_initialized`;
      const info = await FileSystem.getInfoAsync(fileUri);
      const trackingInfo = await FileSystem.getInfoAsync(trackingUri);
      if (!info.exists && !trackingInfo.exists) {
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify([]));
        await FileSystem.writeAsStringAsync(trackingUri, "true");
      }

      let customFighters = [];
      const currentInfo = await FileSystem.getInfoAsync(fileUri);
      if (currentInfo.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        customFighters = JSON.parse(content || "[]");
        customFighters = customFighters.filter(f => f && f.id && f.name && f.name.trim() !== "");
      }

      const mappedStaticBundle = initialStaticFighters.map((item, index) => ({
        ...item,
        id: `static_fighter_${index}`,
        isStaticBundle: true
      }));

      const masterList = [...mappedStaticBundle, ...customFighters];
      setAllFighters(masterList);
      
      const query = searchQuery?.trim()?.toLowerCase();
      if (query) {
        const filtered = masterList.filter(f => 
          f.name?.toLowerCase().includes(query) ||
          f.style?.toLowerCase().includes(query) ||
          f.desc?.some(d => d?.toLowerCase().includes(query)) ||
          f.moves?.some(m => m.title?.toLowerCase().includes(query) || m.desc?.toLowerCase().includes(query))
        );
        setHFighters(filtered);
      } else {
        setHFighters(masterList);
      }

      setTimeout(async () => {
        try {
          const baseDir = `${FileSystem.documentDirectory}fighters/`;
          const dirInfo = await FileSystem.getInfoAsync(baseDir);
          if (dirInfo.exists) {
            const localFolders = await FileSystem.readDirectoryAsync(baseDir);
            const validIds = customFighters.map(f => String(f.id).trim());
            for (const folderId of localFolders) {
              if (!validIds.includes(String(folderId).trim())) {
                await FileSystem.deleteAsync(`${baseDir}${folderId}/`, { idempotent: true });
              }
            }
          }
        } catch (gcError) { }
      }, 1500);

    } catch (e) {
      Alert.alert("Load Failed", e.message || "Failed to load Fighter files.");
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  };  


  const populateForEdit = ( fighter ) => {
    if ( !fighter ) {
      setSelectedIds([]); setFighterName(""); setFighterConc(""); setActiveAvatarUri(null);
      setFighterStyle(""); setFighterDescList([""]); setFighterMoves([]);
      setFighterId(Date.now().toString());
    } else {
      setCurrentFighter(fighter); setFighterId(fighter.id); setFighterName(fighter.name);
      setFighterStyle(fighter.style); setFighterConc(fighter.conc || "");
      setActiveAvatarUri(typeof fighter.avatar === 'string' ? fighter.avatar : null);
      setFighterDescList(Array.isArray(fighter.desc) ? [...fighter.desc] : [""]);
      setFighterMoves(Array.isArray(fighter.moves) ? [...fighter.moves] : []);
    }
    setMode("add");
  };


  const deleteFighters = async (idsFromArg = []) => {
    const actualIds = Array.isArray(idsFromArg) && idsFromArg.length > 0 ? idsFromArg : (selectedIds || []);
    const cleanIdsToDelete = actualIds.map(id => String(id).trim());
    if (cleanIdsToDelete.length === 0) return;

    const staticSelections = cleanIdsToDelete.filter(id => id.startsWith('static_fighter_'));
    if (staticSelections.length > 0) {
      Alert.alert("Permission Blocked", "Built-in legendary fighter files cannot be removed from your catalog roster.");
      return;
    }

    const isDeletingAll = actualIds.length === hFighters.length;
    Alert.alert(
      isDeletingAll ? "Purge Catalog Items" : "Delete Selection",
      isDeletingAll ? "Remove all custom entries under this style column?" : `Remove ${cleanIdsToDelete.length} custom fighter profile(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const customFightersOnly = allFighters.filter(f => !f.isStaticBundle);
              const staticFightersOnly = allFighters.filter(f => f.isStaticBundle);

              const itemsToDelete = customFightersOnly.filter(f => cleanIdsToDelete.includes(String(f.id).trim()));
              let errfound = false;

              for (const fighterItem of itemsToDelete) {
                const folderUri = `${FileSystem.documentDirectory}fighters/${fighterItem.id}/`;
                try {
                  await FileSystem.deleteAsync(folderUri, { idempotent: true });
                } catch (err) {
                  if (!errfound) {
                    errfound = true;
                    Alert.alert("Storage Error", "Could not remove trailing media files.");
                  }
                }
              }

              const updatedCustomList = customFightersOnly.filter(f => !cleanIdsToDelete.includes(String(f.id).trim()));
              const fileUri = `${FileSystem.documentDirectory}fighters_custom.json`;
              await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(updatedCustomList));

              if (updatedCustomList.length === 0) {
                const trackingUri = `${FileSystem.documentDirectory}.fighters_user_initialized`;
                await FileSystem.writeAsStringAsync(trackingUri, "true");
              }

              const nextCombinedMaster = [...staticFightersOnly, ...updatedCustomList];
              setAllFighters(nextCombinedMaster);
              setHFighters(nextCombinedMaster);
              setSelectedIds([]);
              setCurrentFighter(null);
              if (isDeletingAll || nextCombinedMaster.length < 1) {
                if( mode !== "list" ) {
                  setMode('list');
                } 
              }
            } catch (e) {
              Alert.alert("Delete Error", e.message || "Failed to purge database selections.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };



  const shareFighters = async (fighterIds) => {
    if (isOffline) {
      Alert.alert("No Internet", "An active internet profile connection is required to share fighters.");
      return;
    }

    if (!fighterIds?.length) return;
    const cleanSharableIds = fighterIds.filter(id => !id.startsWith('static_fighter_'));
    
    if (cleanSharableIds.length === 0) {
      Alert.alert("Action Blocked", "Built-in core fighters cannot be compressed into external sharing packages.");
      return;
    }

    let shareDir = null;
    let zipPath = null;
    let shareSuccess = false;

    try {
      setLoading(true);
      shareDir = `${FileSystem.cacheDirectory}fighter_export_${Date.now()}/`;
      zipPath = `${FileSystem.cacheDirectory}iDojo_Fighters_${Date.now()}.zip`;

      await FileSystem.deleteAsync(shareDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(shareDir, { intermediates: true });

      const customFightersOnly = allFighters.filter(f => !f.isStaticBundle);
      const itemsToShare = customFightersOnly.filter(f => cleanSharableIds.includes(f.id));

      for (let i = 0; i < itemsToShare.length; i++) {
        await FileSystem.makeDirectoryAsync(`${shareDir}fighter_${i}/`, { intermediates: true });
      }

      const exportPromises = itemsToShare.map(async (fighter, fIdx) => {
        const fCopy = { ...fighter, moves: fighter.moves?.map(m => ({ ...m })) || [] };
        const targetDir = `${shareDir}fighter_${fIdx}/`;

        if (fCopy.avatar && typeof fCopy.avatar === 'string' && fCopy.avatar.startsWith('file://')) {
          const avatarName = `avatar_${fCopy.avatar.split('/').pop()}`;
          await FileSystem.copyAsync({ from: fCopy.avatar, to: `${targetDir}${avatarName}` });
          fCopy.avatar = avatarName;
        }

        for (let mIdx = 0; mIdx < fCopy.moves.length; mIdx++) {
          const move = fCopy.moves[mIdx];
          if (move.img && typeof move.img === 'string' && move.img.startsWith('file://')) {
            const moveFileName = `move_${mIdx}_${move.img.split('/').pop()}`;
            await FileSystem.copyAsync({ from: move.img, to: `${targetDir}${moveFileName}` });
            move.img = moveFileName;
          }
        }

        await FileSystem.writeAsStringAsync(`${targetDir}fighter.json`, JSON.stringify(fCopy));
        return fCopy;
      });

      await Promise.all(exportPromises);
      const manifest = { app: 'iDojo_Fighters', version: 1, count: itemsToShare.length, exportDate: new Date().toISOString() };
      await FileSystem.writeAsStringAsync(`${shareDir}manifest.json`, JSON.stringify(manifest));
      await zip(shareDir, zipPath);
      await Sharing.shareAsync(zipPath, { dialogTitle: `Share ${itemsToShare.length} Fighter(s)`, mimeType: 'application/zip' });
      shareSuccess = true;
    } catch (e) {
      Alert.alert('Share Error', e.message || 'Compression pipeline breakdown.');
    } finally {
      setLoading(false);
      if (shareSuccess) setSelectedIds([]);
      if (shareDir) try { await FileSystem.deleteAsync(shareDir, { idempotent: true }); } catch (e) {}
      if (zipPath) try { await FileSystem.deleteAsync(zipPath, { idempotent: true }); } catch (e) {}
    }
  };



  const handleImportFighters = async () => {
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
      extractDir = `${FileSystem.documentDirectory}imported_fighters_${importId}/`;
      tempZipPath = `${FileSystem.cacheDirectory}import_fighter_temp_${importId}.zip`;
      
      await FileSystem.copyAsync({ from: asset.uri, to: tempZipPath });
      await FileSystem.makeDirectoryAsync(extractDir, { intermediates: true });
      await unzip(tempZipPath, extractDir);
      
      let manifest = { count: 1 };
      try {
        const manifestContent = await FileSystem.readAsStringAsync(`${extractDir}manifest.json`);
        manifest = JSON.parse(manifestContent);
      } catch (e) {
        Alert.alert("Import Notice", "Parsing generic structural mapping parameters.");
      }
      
      const rawFighters = [];
      const fighterDirs = manifest.count > 0 
        ? Array.from({length: manifest.count}, (_, i) => `fighter_${i}/`) 
        : [''];
      
      for (const dir of fighterDirs) {
        const itemPath = `${extractDir}${dir}`;
        const itemInfo = await FileSystem.getInfoAsync(itemPath);
        let fighterPath = '';
        
        if (itemInfo.exists && itemInfo.isDirectory) {
          fighterPath = `${itemPath}fighter.json`; 
        } else if (dir === '') {
          fighterPath = `${extractDir}fighter.json`;
        } else {
          continue;
        }

        const fileInfo = await FileSystem.getInfoAsync(fighterPath);
        if (!fileInfo.exists) continue;
        
        const content = await FileSystem.readAsStringAsync(fighterPath);
        let fighterItem;
        try {
          fighterItem = JSON.parse(content);
        } catch (parseError) {
          continue;
        }

        if (!fighterItem || typeof fighterItem !== 'object') continue;
        if (!fighterItem.name?.trim() || !fighterItem.style?.trim()) continue;
        
        const fDir = `${extractDir}${dir}`;
        const fixFilePath = (oldPath) => {
          if (!oldPath || typeof oldPath !== 'string' || oldPath.startsWith('http') || !oldPath.includes('/')) {
            if (oldPath && typeof oldPath === 'string' && !oldPath.startsWith('http')) {
              return `${fDir}${oldPath}`;
            }
            return oldPath;
          }
          const fileName = oldPath.split('/').pop();
          return `${fDir}${fileName}`;
        };
        
        fighterItem.avatar = fixFilePath(fighterItem.avatar);
        fighterItem.moves?.forEach((move) => {
          if (!move) return;
          move.img = fixFilePath(move.img);
        });
        
        rawFighters.push(fighterItem);
      }
      
      if (rawFighters.length === 0) {
        throw new Error('No valid fighters found in zip file');
      }
      
      const finalFighters = rawFighters.map((fighter, index) => ({
        ...fighter,
        id: `fighter_${importId}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        isStaticBundle: false
      }));

      const copyImportedMedia = async (fighter) => {
        const permanentDirUri = `${FileSystem.documentDirectory}fighters/${fighter.id}/`;
        await FileSystem.makeDirectoryAsync(permanentDirUri, { intermediates: true });

        const migrateFile = async (sourcePath, destName) => {
          if (!sourcePath || typeof sourcePath !== 'string' || sourcePath.startsWith('http') || sourcePath.startsWith('asset://')) return sourcePath;
          const baseFileName = sourcePath.split('/').pop() || '';
          const sourceExt = baseFileName.includes('.') ? `.${baseFileName.split('.').pop().toLowerCase()}` : '.png';
          const destUri = `${permanentDirUri}${destName}${sourceExt}`;
          
          try {
            await FileSystem.copyAsync({ from: sourcePath, to: destUri });
            return destUri;
          } catch (err) {
            console.log('Import file shift error:', err.message);
            return null;
          }
        };

        if (fighter.avatar) {
          const freshAvatar = await migrateFile(fighter.avatar, 'idojo_avatar');
          if (freshAvatar) fighter.avatar = freshAvatar;
        }

        if (Array.isArray(fighter.moves)) {
          for (const move of fighter.moves) {
            if (!move || !move.img) continue;
            const freshMoveImg = await migrateFile(move.img, `idojo_fighter_move_${move.id}`);
            if (freshMoveImg) move.img = freshMoveImg;
          }
        }
      };

      for (const fighter of finalFighters) {
        await copyImportedMedia(fighter);
      }
      
      const customFightersOnly = allFighters.filter(f => !f.isStaticBundle);
      const staticFightersOnly = allFighters.filter(f => f.isStaticBundle);
      const updatedCustomList = [...customFightersOnly, ...finalFighters];
      const fileUri = `${FileSystem.documentDirectory}fighters_custom.json`;
      const trackingUri = `${FileSystem.documentDirectory}.fighters_user_initialized`;
      await FileSystem.writeAsStringAsync(trackingUri, "true");
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(updatedCustomList));
      const nextCombinedMaster = [...staticFightersOnly, ...updatedCustomList];
      setAllFighters(nextCombinedMaster);
      setHFighters(nextCombinedMaster);
      Alert.alert('Success', `${finalFighters.length} fighter(s) imported!`);
    } catch (e) {
      Alert.alert('Import Failed', e.message || 'Failed to extract custom archive package.');
    } finally {
      setLoading(false);
      setSelectedIds([]);
      if (extractDir) try { await FileSystem.deleteAsync(extractDir, { idempotent: true }); } catch (err) {}
      if (tempZipPath) try { await FileSystem.deleteAsync(tempZipPath, { idempotent: true }); } catch (err) {}
    }
  };
  


  useFocusEffect(
    useCallback(() => {
      if (mode !== "add") clearAppCache();
      if (mode !== "add") loadFighters();
    }, [mode])
  );


  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isPickingRef.current || isPicking || isLoadingRef.current || loading) {
        return true; 
      }

      if (mode === 'add' || mode === 'view') {
        setCurrentFighter(null);
        setSelectedIds([]);
        setMode('list');
        return true; 
      }

      if (selectedIds.length > 0) {
        setSelectedIds([]);
        return true;
      }

      return false;
    });

    return () => backHandler.remove();
  }, [mode]);



  const saveFightersToStorage = async (customOnlyList, combinedMasterList, activeStyle) => {
    try {
      const fileUri = `${FileSystem.documentDirectory}fighters_custom.json`;
      const trackingUri = `${FileSystem.documentDirectory}.fighters_user_initialized`;
      await FileSystem.writeAsStringAsync(trackingUri, "true");
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(customOnlyList));
      setAllFighters(combinedMasterList);
      setHFighters(combinedMasterList); 
    } catch (e) {
      Alert.alert("Save Error", e.message || "Could not save fighter updates to disk.");
      throw e;
    }
  };


  const handleSaveFighterData = async (newFighterPayload) => {
    try {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      
      const incomingFighters = Array.isArray(newFighterPayload) ? newFighterPayload : [newFighterPayload];
      const currentCustomFighters = allFighters.filter(f => !f.isStaticBundle);
      const staticBundleItems = allFighters.filter(f => f.isStaticBundle);

      incomingFighters.forEach(itemData => {
        const index = currentCustomFighters.findIndex(f => String(f.id).trim() === String(itemData.id).trim());
        if (index > -1) {
          currentCustomFighters[index] = itemData;
        } else {
          currentCustomFighters.push(itemData);
        }
      });

      const nextCombinedMaster = [...staticBundleItems, ...currentCustomFighters];
      const fileUri = `${FileSystem.documentDirectory}fighters_custom.json`;
      const trackingUri = `${FileSystem.documentDirectory}.fighters_user_initialized`;
      await FileSystem.writeAsStringAsync(trackingUri, "true");
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(currentCustomFighters));
      setAllFighters(nextCombinedMaster);
      setHFighters(nextCombinedMaster);
      setSearchQuery('');
      setMode('list');
    } catch (e) {
      Alert.alert('Save Failed', e.message);
    } finally {
      isLoadingRef.current = false;
    }
  };


  const saveFighterProfile = async () => {
    if (isPickingRef.current || isPicking) return;

    if (!fighterName.trim()) {
      Alert.alert('Required', 'Please enter a Fighter Name');
      return;
    }

    if (!fighterStyle.trim()) {
      Alert.alert('Required', 'Please enter a Fighting Style');
      return;
    }

    const validatedDesc = fighterDescList
      .map(d => d.trim())
      .filter(d => d.length > 0);

    if (validatedDesc.length === 0) {
      Alert.alert('Required', 'Please provide at least one description item text block.');
      return;
    }

    for (const move of fighterMoves) {
      if (!move.title.trim()) {
        Alert.alert('Required', 'Every custom signature move needs a Title.');
        return;
      }
      if (!move.img && !move.desc?.trim()) {
        Alert.alert('Required', `Signature move "${move.title}" requires either an image or a text description.`);
        return;
      }
    }

    try {
      setLoading(true);
      let copyfailed = false;
      const activeSavedFilenames = [];
      const fId = fighterId || currentFighter?.id || Date.now().toString();
      const permanentDirUri = `${FileSystem.documentDirectory}fighters/${fId}/`;
      await FileSystem.makeDirectoryAsync(permanentDirUri, { intermediates: true });
      
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
          Alert.alert("Copy Media Failed", "Please try again. Device storage space may be full.");
          return "COPYFAILED";
        }
      };

      let finalAvatar = activeAvatarUri;
      if (activeAvatarUri && activeAvatarUri.startsWith('file://')) {
        const ext = getMediaFileExtension(activeAvatarUri);
        finalAvatar = await ensurePermanent(activeAvatarUri, `idojo_avatar${ext}`);
        if (finalAvatar === "COPYFAILED") copyfailed = true;
      }

      const processedMoves = await Promise.all(
        fighterMoves.map(async (moveItem) => {
          const moveCopy = { ...moveItem, title: moveItem.title.trim(), desc: moveItem.desc.trim() };
          if (moveItem.img && typeof moveItem.img === 'string' && moveItem.img.startsWith('file://')) {
            const ext = getMediaFileExtension(moveItem.img);
            const safeFilename = `idojo_fighter_move_${String(moveItem.id).trim()}${ext}`;
            moveCopy.img = await ensurePermanent(moveItem.img, safeFilename);
            if (moveCopy.img === "COPYFAILED") copyfailed = true;
          }
          return moveCopy;
        })
      );

      if (copyfailed) {
        setLoading(false);
        return;
      }

      const finalFighterData = {
        id: fId,
        name: fighterName.trim(),
        avatar: finalAvatar || require('../assets/chapterplaceholder.png'),
        desc: validatedDesc,
        style: fighterStyle.trim(),
        conc: fighterConc?.trim() || "",
        moves: processedMoves
      };

      try {
        const existingFiles = await FileSystem.readDirectoryAsync(permanentDirUri);
        for (const file of existingFiles) {
          if (!activeSavedFilenames.includes(file)) {
            const fullPathToDelete = `${permanentDirUri}${file}`;
            await FileSystem.deleteAsync(fullPathToDelete, { idempotent: true });
          }
        }
      } catch (cleanupErr) {}

      await handleSaveFighterData(finalFighterData);
    } catch (err) {
      Alert.alert("Save Error", err.message || "An error occurred while compiling fighter data profiles.");
    } finally {
      setLoading(false);
    }
  };


  const getMediaFileExtension = (uri) => {
    if (!uri || typeof uri !== 'string') return '.png';
    const extMatch = uri.match(/\.[0-9a-z]+$/i);
    return extMatch ? extMatch[0].toLowerCase() : '.png';
  };


  const addDescLine = () => setFighterDescList([...fighterDescList, ""]);
  const removeDescLine = (idx) => setFighterDescList(fighterDescList.filter((_, i) => i !== idx));
  const updateDescLine = (idx, val) => setFighterDescList(fighterDescList.map((d, i) => i === idx ? val : d));
  const addMoveItem = () => { setFighterMoves([...fighterMoves, { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), title: "", img: null, desc: "" }]); };
  const removeMoveItem = (id) => setFighterMoves(fighterMoves.filter(m => m.id !== id));
  const updateMoveItem = (id, field, val) => setFighterMoves(fighterMoves.map(m => m.id === id ? { ...m, [field]: val } : m));
  const toggleSelect = (id) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  
  const selectedFighterMatch = allFighters.find(f => String(f.id) === String(selectedIds[0]));
  
  
  const pickFighterMedia = async (target, moveId = null) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Gallery access is required!");
      return;
    }

    try {
      isPickingRef.current = true;
      setIsPicking(true);
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1.0 });
      if (res.canceled || !res.assets?.[0]?.uri) return;

      const pickedUri = res.assets[0].uri;
      const ext = getMediaFileExtension(pickedUri);
      const cacheDir = `${FileSystem.cacheDirectory}fighter-cache/`;
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      const cachedUri = `${cacheDir}${Date.now()}${ext}`;
      await FileSystem.copyAsync({ from: pickedUri, to: cachedUri });

      if (target === 'avatar') {
        setActiveAvatarUri(cachedUri);
      } else if (target === 'move' && moveId) {
        updateMoveItem(moveId, 'img', cachedUri);
      }
    } catch (err) {
      Alert.alert("Picker Error", "Could not copy selected asset.");
    } finally {
      isPickingRef.current = false;
      setIsPicking(false);
    }
  };

  
  const renderMoveFormItem = (move) => {
    if ( !move ) return null;

    return (
    <View key={move.id} style={styles.sectionContainerBlock}>
      <Text style={styles.label}>Signature Move Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Move Name..."
        placeholderTextColor="#726b6b"
        value={move.title || ""}
        onChangeText={(text) => updateMoveItem(move.id, 'title', text)}
      />

      <Text style={styles.label}>Signature Move Image</Text>
      <View style={styles.mediaPickerRow}>
        <TouchableOpacity onPress={() => pickFighterMedia('move', move.id)} style={styles.stepImgContainer}>
          {move.img ? <Image source={{ uri: move.img }} style={styles.stepImg} /> : <ImageBackground style={{ alignSelf: 'center', height: 77, width: 77, }} resizeMode='contain' source={require('../assets/uploadfighterimagebtn.png')} />}
        </TouchableOpacity>
        { move.img && <Text style={styles.fileLoadedIndicator}>✅Uploaded click to change</Text> }
      </View>

      <Text style={styles.label}>Move Breakdowns / Technical Details</Text>
      <TextInput
        style={[styles.input, styles.descInput]}
        placeholder="Explain technical details/secrets..."
        placeholderTextColor="#726b6b"
        value={move.desc || ""}
        onChangeText={(text) => updateMoveItem(move.id, 'desc', text)}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity onPress={() => removeMoveItem(move.id)} style={styles.removeSignatureMoveBtn}>
        <ImageBackground style={{ height: 47, width: "100%", opacity: 1, borderRadius: 19 }} imageStyle={{ opacity: 1, borderRadius: 19 }} resizeMode='contain' source={require('../assets/removesignaturemovebtn.png')} />
      </TouchableOpacity>
    </View> )
  };



  if (mode === "view") { return <Fighter fighter={currentFighter} offset={0} />; }


  if (mode === "add") {
    return (
      <ImageBackground source={require('../assets/addfighterbg.png')} style={styles.imgBackground} resizeMode='cover' >
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.19)', borderRadius: 9 }}>
            <View>
              <ImageBackground style={styles.iconAM} resizeMode='contain' source={currentFighter ? require('../assets/editfightertitle.png') : require('../assets/addfightertitle.png')} /> 
            </View>

            <TouchableOpacity onPress={() => { if (isPicking || isPickingRef.current) return; setCurrentFighter(null); setSelectedIds([]); setFighterName(""); setFighterConc(""); setActiveAvatarUri(null); setFighterStyle(""); setFighterDescList([""]); setFighterMoves([]); setMode('list'); }} style={styles.discardBtn} >
              <ImageBackground style={{ alignSelf: "flex-start", marginLeft: 3, height: 67, width: 67, opacity: 1}} imageStyle={{ opacity: 1 }} resizeMode='contain' source={require('../assets/discardicon.png')}/>
              <Text style={styles.discardText}>❌CANCEL</Text>
            </TouchableOpacity>

            <ScrollView style={styles.formScroller} contentContainerStyle={{ paddingBottom: 157 ,backgroundColor: 'rgba(0, 0, 0, 0.43)', borderRadius: 9  }}>
              <Text style={styles.label}>Fighter Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Fedor Emelianenko" placeholderTextColor="#72726b" value={fighterName} onChangeText={setFighterName} />

              <Text style={styles.label}>Fighting Style</Text>
              <TextInput style={styles.input} placeholder="e.g. Sambo" placeholderTextColor="#72726b" value={fighterStyle} onChangeText={setFighterStyle} />

              <Text style={styles.label}>Avatar/Profile Image</Text>
              <View style={styles.mediaPickerRow}>
                <TouchableOpacity onPress={() => pickFighterMedia('avatar')} style={styles.stepImgContainer}>
                  {activeAvatarUri ? <Image source={{ uri: activeAvatarUri }} style={styles.stepImg} /> : <ImageBackground style={{ alignSelf: 'center', height: 77, width: 77, }} resizeMode='contain' source={require('../assets/uploadfighterimagebtn.png')} />}
                </TouchableOpacity>
                {activeAvatarUri && <Text style={styles.fileLoadedIndicator}>✅Profile Photo Loaded</Text>}
              </View>

              <Text style={styles.label}>Legendary Quotes & Wisdom Lines</Text>
              { Array.isArray(fighterDescList) && fighterDescList.map((descLine, dIdx) => (
                <View key={dIdx} style={styles.dynamicLineRow}>
                  <TextInput
                    style={styles.quoteinput}
                    placeholder={`Quote description line #${dIdx + 1}`}
                    placeholderTextColor="#72726b"
                    value={descLine}
                    onChangeText={(text) => updateDescLine(dIdx, text)}
                  />
                  {fighterDescList.length > 1 && (
                    <TouchableOpacity onPress={() => removeDescLine(dIdx)} style={styles.removeQuoteBtn}>
                      <ImageBackground style={{ height: 31, width: "100%", opacity: 1, borderRadius: 15 }} imageStyle={{ opacity: 1, borderRadius: 15 }} resizeMode='cover' source={require('../assets/removequotebtn.png')} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={addDescLine} style={styles.addQuoteBtn}>
                <ImageBackground style={{ height: 31, width: "100%", opacity: 1, borderRadius: 15 }} imageStyle={{ opacity: 1, borderRadius: 15 }} resizeMode='cover' source={require('../assets/addquotebtn.png')} />
              </TouchableOpacity>

              <Text style={styles.label}>Strategic Conclusions / Secrets</Text>
              <TextInput style={styles.input} placeholder="e.g. Leaning back into ropes avoids heavy blows..." placeholderTextColor="#726b6b" value={fighterConc} onChangeText={setFighterConc} />

              <Text style={styles.formStreamSectionDivider}>⚡ SIGNATURE MOVES</Text>
              { Array.isArray(fighterMoves) && fighterMoves.map((move) => renderMoveFormItem(move))}

              <TouchableOpacity onPress={addMoveItem} style={styles.addSignatureMoveBtn}>
                <ImageBackground style={{ height: 43, width: "100%", opacity: 1, borderRadius: 19 }} imageStyle={{ opacity: 1, borderRadius: 19 }} resizeMode='contain' source={require('../assets/addsignaturemovebtn.png')} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={saveFighterProfile}>
                <ImageBackground style={{ height: 95, width: "100%", opacity: 1, borderRadius: 12 }} imageStyle={{ opacity: 1, borderRadius: 12 }} resizeMode='cover' source={require('../assets/savechapterbtn.png')} />
              </TouchableOpacity> 
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </ImageBackground>
    );
  }


  return (
    <ImageBackground style={ styles.imgBackground } imageStyle={{ opacity: 1 }} resizeMode='cover' source={require('../assets/fightersbackground.jpeg')}>
      <StatusBar barStyle="light-content"/>
      <SafeAreaView style={{ flex: 1, height: "100%", marginTop: 7}}>

        <View style={{marginBottom: 3, paddingTop:-10, paddingBottom: 10}}>
          <ImageBackground style={ styles.icon } imageStyle={{ opacity: 1 }} resizeMode='contain' source={require('../assets/fighterslisttitle.png')} /> 
        </View>  

        <View style={styles.header}>
          <View style={styles.searchRow}>
            <TextInput style={styles.searchInput} placeholder="Search Martial Artists..." placeholderTextColor="rgba(255,255,255,0.5)" value={searchQuery} onChangeText={setSearchQuery} />
            <TouchableOpacity onPress={() => parseStyles(allFighters, searchQuery)} style={styles.searchBtn}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/binocularsicon.png')}/>         
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSearchQuery(''); setHFighters(allFighters); }} style={styles.clearBtn}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/reloadicon.png')}/>         
            </TouchableOpacity>
          </View>

          <View style={styles.dashboardIconsControlsRow}>
            <TouchableOpacity onPress={() => populateForEdit(null)} style={styles.plusIcon}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/addfightericon.png')}/>         
            </TouchableOpacity> 
            <TouchableOpacity onPress={handleImportFighters} style={styles.importIcon}>
              <ImageBackground style={{ height:"100%", width:"100%"}} resizeMode='contain' source={require('../assets/importmoveicon.png')}/>
            </TouchableOpacity> 
            <TouchableOpacity onPress={showInstructions} style={styles.infoIcon}>
              <ImageBackground style={{ height:"100%", width:"100%",}} resizeMode='contain' source={require('../assets/mydojostylesinfoicon.png')}/>         
            </TouchableOpacity> 
          </View>
        </View>  
        
        { loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#caaf38" />
            <Text style={styles.loadingText}>Synchronizing Fighters Roster...</Text>
          </View> )
        : ( <FlatList
          data={hFighters || []}
          extraData={{ selectedIds, allFighters }}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 114 }}
          keyExtractor={(item, index) => item.id ? String(item.id) : index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", marginTop: 2, marginLeft: 7, marginRight: 7, width: "50%", borderWidth: 0 }}>
              { selectedIds.includes(item.id) && selectedIds.length === 1 ? ( <View style={{ flex: 1, flexDirection: "row", alignItems: "center", marginTop: 2, marginLeft: 7, marginRight: 7, width: "100%", borderWidth: 0 }}> <Pressable onLongPress={() => !item.isStaticBundle && toggleSelect(item.id)}
                onPress={() => { if (selectedIds.length > 0) { if (!item.isStaticBundle) toggleSelect(item.id); } else { navKSound(item); }}}  
                style={ selectedIds.includes(item.id) ? styles.mainCardViewSelected : styles.mainCardView} >
                  <View style={styles.subCardViewSelected}>
                    <Image source={typeof item.avatar === 'number' ? item.avatar : item.avatar ? { uri: item.avatar } : require('../assets/chapterplaceholder.png')} resizeMode="contain" style={{ borderRadius: 12, alignSelf: 'flex-start', margin: 0, height: 133, width: "100%" }} />
                    <View style={{marginLeft: 12, marginBottom: 3}}>
                        <Text style={styles.nameTextViewSelected}>{item.name}</Text>  
                      </View>
                  </View>
                </Pressable>
                <View style={styles.chapterCardFooter}>
                  <TouchableOpacity style={styles.editBtnCard} onPress={() => populateForEdit(item)}>
                    <Text style={styles.editBtnText}>EDIT</Text>
                  </TouchableOpacity>
                </View> 
                </View> ) : ( <Pressable onLongPress={() => !item.isStaticBundle && toggleSelect(item.id)}
                  onPress={() => { if (selectedIds.length > 0) { if (!item.isStaticBundle) toggleSelect(item.id); } else { navKSound(item); }}}  
                  style={ selectedIds.includes(item.id) ? styles.mainCardViewSelected : styles.mainCardView}  >
                    <View style={styles.subCardView}>
                      <Image source={typeof item.avatar === 'number' ? item.avatar : { uri: item.avatar }} resizeMode="contain" style={{ borderRadius: 12, alignSelf: 'flex-start', margin: 0, height: 133, width: "100%" }} />
                      <View style={{marginLeft: 12, marginBottom: 7}}>
                        <Text style={ selectedIds.includes(item.id) ? styles.nameTextViewSelected : styles.nameTextView}>{item.name}</Text>  
                        <View style={styles.styleTextView}>
                          <Text style={{ color: '#9a9aa1', fontSize: 12 }}>{item.style}</Text>
                        </View>
                      </View>
                    </View>
                </Pressable> ) 
              }
            </View> ) }
          /> ) }

          { selectedIds.length > 0 && (
            <View style={styles.batchBar}>
              <Text style={styles.batchText}>{`${selectedIds.length} Selected`}</Text>
              <TouchableOpacity onPress={() => shareFighters(selectedIds)} style={styles.shareIcon}>
                <ImageBackground style={{height: "100%", width: "100%"}} resizeMode='contain' source={require('../assets/sharechaptericon.png')}/>         
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteFighters(selectedIds)} style={styles.myDojoDiscardIcon}>
                <ImageBackground style={{height: "100%", width: "100%"}} resizeMode='contain' source={require('../assets/discardicon.png')}/> 
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedIds([])} style={styles.myDojoDeleteIcon}>
                <ImageBackground style={{height: "100%", width: "100%"}} resizeMode='contain' source={require('../assets/deletechaptericon.png')}/>         
              </TouchableOpacity>
            </View>
          ) }
      </SafeAreaView>
    </ImageBackground>
  )
}


const styles = StyleSheet.create({ 
  dashboardIconsControlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 1, minHeight: 73, width: '100%', gap: 15 },
  imgBackground: { minWidth: '100%', minHeight: '100%', height: Dimensions.get('window').height, flex: 1 },
  icon: { height: 57, opacity: 1, marginTop: 3, textAlign: "center"},
  mainCardView: { minHeight: 228, width: "100%", backgroundColor: "#2f4f4f", borderRadius: 15, shadowColor: "#000", shadowOffset: {width: 0, height: 0}, shadowOpacity: 1, shadowRadius: 5, elevation: 8, justifyContent: 'center', padding: 5,marginTop: 12, marginBottom: 12, marginLeft: 1, marginRight: 5, borderColor: "#caaf38", borderWidth: 2, flexDirection: 'column', alignItems: 'flex-start'},
  mainCardViewSelected: { minHeight: 192, width: "100%", borderRadius: 15, shadowColor: "#000", shadowOffset: {width: 0, height: 0}, shadowOpacity: 1, shadowRadius: 5, elevation: 8, justifyContent: 'center', padding: 5,marginTop: 12, marginBottom: 12, marginLeft: 1, marginRight: 5, flexDirection: 'column', alignItems: 'flex-start', borderColor: 'rgba(126, 107, 21, 0.76)', backgroundColor: 'rgba(126, 107, 21, 0.76)', borderWidth: 2 },
  subCardView: { minHeight: 207, width: "100%", marginLeft: 7, borderRadius: 8, backgroundColor: "slategray", borderWidth: 0, alignSelf: 'center', justifyContent: 'center', marginRight: 7, padding:0},
  subCardViewSelected: { minHeight: 171, width: "100%", marginLeft: 7, borderRadius: 8, borderColor: 'rgba(126, 107, 21, 0.38)', borderWidth: 0, alignSelf: 'center', justifyContent: 'center', marginRight: 7, padding:0},
  plusIcon: { width: 45, height: 45 },
  iconAM: { height: 50, width: "97%", opacity: 1, marginTop: 3, textAlign: "center", marginBottom: 9 },
  header: { flexDirection: 'column', width: "95%", minHeight: 76, backgroundColor: 'rgba(195, 209, 223, 0.4)', borderWidth: 1, borderColor: '#c2cdd4',justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 1, borderRadius: 9},
  searchRow: { flexDirection: 'row', paddingHorizontal: 9, paddingVertical: 4, gap: 8, marginBottom: 7, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 9, alignItems: 'center', justifyContent: 'center', width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  searchInput: { height: 38, width: '70%', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, paddingHorizontal: 8, color: 'white', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', fontSize: 11 },
  searchBtn: { width: 39, height: 37, backgroundColor: '#e7f5ed4f', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  clearBtn: { width: 32, height: 32, backgroundColor: '#31303080', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  infoIcon: { height: 47, width: 47, marginLeft: 21, marginBottom: 5, opacity: 1 },
  plusIcon: { height: 57, width: 76, backgroundColor: 'rgba(0,0,0,0.57)', borderRadius: 12, marginLeft: 15, marginRight: 7, opacity: 1},
  importIcon: {height: 76, width: 67, borderRadius: 9, marginLeft: 12 },
  chapterCardFooter: { flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: -7 },
  editBtnCard: { backgroundColor: '#7e6b15', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 5, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: "#caaf38"},
  editBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600', letterSpacing: 1},
  batchBar: { position: 'absolute', bottom: 57, left: 20, right: 20, backgroundColor: '#1e293b', borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1.5, borderColor: '#caaf38', elevation: 10 },
  batchText: { color: '#caaf38', fontWeight: 'bold', fontSize: 13 },
  shareIcon: { width: 35, height: 35 },
  myDojoDiscardIcon: { width: 35, height: 35 },
  myDojoDeleteIcon: { width: 35, height: 35 },
  formHeaderTitleRow: { width: '100%', alignItems: 'center', marginVertical: 10 },
  discardBtn: { alignSelf: 'flex-start', justifyContent:"flex-start", alignItems: 'flex-start', backgroundColor: 'rgba(220, 38, 38, 0.15)', borderWidth: 1, borderColor: '#dc2626', paddingHorizontal: 3, paddingVertical: 7, borderRadius: 8, marginBottom: 7, marginLeft: 19 },
  discardText: { color: '#ef4444', fontWeight: 'bold', fontSize: 11, marginTop: 5 },
  formScroller: { flex: 1, paddingHorizontal: 7, opacity: 1 },
  label: { color: '#f3efbd', fontSize: 12, fontWeight: 'bold', marginTop: 12, marginBottom: 2, marginLeft: 7 },
  input: { borderWidth: 2.5, borderColor: '#7e6b15', borderRadius: 12, padding: 3, marginTop: 3, backgroundColor: 'rgba(235, 224, 71, 0.57)', opacity: 1, fontWeight: "bold", fontSize: 13, width: "95%", marginLeft: 7, marginBottom: 9 },
  quoteinput: { borderWidth: 2.5, borderColor: '#7e6b15', borderRadius: 12, padding: 3, marginTop: 3, backgroundColor: 'rgba(235, 224, 71, 0.57)', opacity: 1, fontWeight: "bold", fontSize: 13, width: "95%" - 114, marginLeft: 3, marginBottom: 9 },
  descInput: { height: 70, textAlignVertical: 'top', paddingVertical: 8 },
  dynamicLineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, width: "100%" },
  nameTextView: { fontSize: 13, color: "gold", fontWeight: 'bold', textTransform: 'capitalize' },
  nameTextViewSelected: { fontSize: 13, color: '#f3efbd', fontWeight: 'bold', textTransform: 'capitalize' },
  styleTextView: { marginTop: 3, borderWidth: .5, borderRadius: 12, borderColor:'#caaf38', flexDirection:'row', backgroundColor:'#323232', justifyContent: 'flex-start', alignItems: 'flex-start', paddingHorizontal: 4, paddingVertical: 2},
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  loadingText: { color: '#caaf38', fontWeight: 'bold', fontSize: 12, marginTop: 10, letterSpacing: 0.5 },
  saveBtn: { width: 133, height: 114, borderRadius: 15, marginTop: 12, alignSelf:'center' },
  addSignatureMoveBtn: { width: 171, height: 52, borderRadius: 19, marginTop: 7, alignSelf:'center' },
  addQuoteBtn: { width: 109, height: 31, borderRadius: 19, marginTop: 5, alignSelf:'center'},
  removeQuoteBtn: { width: 109, height: 31, borderRadius: 19, marginTop: 3, alignSelf:'center'},
  removeSignatureMoveBtn: { width: 177, height: 52, borderRadius: 19, marginTop: 7, alignSelf:'center' },
  formStreamSectionDivider: { color: '#f3efbd', fontSize: 13, fontWeight: 'bold', marginTop: 29, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#947e1f', paddingBottom: 4 },
  sectionContainerBlock: { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 10, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  mediaPickerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 10 },
  fileLoadedIndicator: { color: '#4ade80', fontSize: 10, fontWeight: '600' },
  stepImg: { width: '100%', height: '100%' },
  stepImgContainer: { width: 77, height: 77, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 0, opacity: 1},
});