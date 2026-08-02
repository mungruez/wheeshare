import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image,TouchableOpacity, StyleSheet, Dimensions, ScrollView, Alert, Share, DeviceEventEmitter, ImageBackground } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import VideoPlayer from './VideoPlayer';
import TrackPlayer from './TrackPlayer';
import PdfMove from './PdfMove';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

export default function SectionPlayer({ section, index, isActive, onActivate, onDeactivate, onOpenpdfViewer, navigation, isOffline}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [musicFile, setMusicFile] = useState(section.type === "audio" ? { id: 12, uri: section.mediaUri || section.mediaUrl, ispaused: true } : null);
  const [isMuted, setIsMuted] = useState(true);
  const wasActive = useRef(false);

  const getTypeColor = () => {
    switch (section.type) {
      case 'video': return '#b91133';
      case 'pdf': return '#181ab3';
      case 'audio': return '#7317b1';
      case 'image': return '#166d1c';
      default: return '#4b4141';
    }
  };

  const getTypeIcon = () => {
    switch (section.type) {
      case 'video': return '📹';
      case 'pdf': return '📄';
      case 'audio': return '🎵';
      case 'image': return '🖼️';
      default: return '📎';
    }
  };

  const openPdf = async () => {
    if (!section || !section.mediaUri) {
      Alert.alert("Error", "No PDF Section found.");
      return;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(section.mediaUri);
      if (!fileInfo.exists) {
        Alert.alert("Error", "PDF file not found on device.");
        return;
      }
  
      await Sharing.shareAsync(section.mediaUri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: `Open ${section.title}`,
      });
            
    } catch (err) {
      if (err.message && !err.message.includes('cancelled')) {
        Alert.alert("PDF Error", "Could not open PDF");
      }
    }
  };


  const getYouTubeId = (url) => {
    try {
      if (!url || typeof url !== 'string') return "";
      if (url.length < 19) return "";
      if (!url.includes('/') && !url.includes('.')) return "";
      
      const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
      const match = url.match(regExp);
      
      return (match && match[1]) ? match[1] : "";
        
    } catch (e) {
        return "";
    }
  };

  const handleOpenPdf = () => {
    if( section.type === "pdf" ) {

    }
    setIsFullscreen(!isFullscreen)
  }

  const handleShareSection = async (selectedsection) => {
    if (!selectedsection) return;
    try {
      const image = selectedsection.mediaUri || selectedsection.mediaUrl || "";
      if (!image || image.length === 0) {
        Alert.alert('No Media to Share', 'This section does not have a valid media URL or URI to share.');
        return;
      }

      if(selectedsection.mediaUri) {
        if (await Sharing.isAvailableAsync()) {
          if( selectedsection.type === 'audio' ) {
            await Sharing.shareAsync(image, {
              mimeType: 'audio/*',
              dialogTitle: `Share ${selectedsection.title}`,
            });
          } else if (selectedsection.type === 'pdf') {
            await Sharing.shareAsync(image, {
              mimeType: 'application/pdf',
              dialogTitle: `Share ${selectedsection.title}`,
            });
          } else if (selectedsection.type === 'image') {
            await Sharing.shareAsync(image, {
              mimeType: 'image/*',
              dialogTitle: `Share ${selectedsection.title}`,
            });
          } else {
            Alert.alert('Share Error', 'Unknown File type. Section must be an Image, Audio, or PDF to share. Videos can be shared using the red arrow next to the title.');
          }
        } else {
            Alert.alert('Share Error', 'Sharing is not available on this device.');
        }
      } else {
        if (isOffline) {
          Alert.alert("No Internet", "You need an internet connection to share PDF Urls.");
          return;
        }
        await Share.share({ title: selectedsection.title, message: image, url: image });
      }

    } catch (e) {
      Alert.alert('Sharing Failed', 'An error occurred while trying to share the media: '+e.message);
    }
  };


  const getThumbnail = () => {
    if (section.type === 'image') {
      if( section.mediaUri ) return { uri: section.mediaUri };
      if( !isOffline ) return { uri: section.mediaUrl };
    }

    if (section.type === 'video') {
      if( section.mediaUri ) return { uri: section.mediaUri };
      if( isOffline ) return require('../assets/onlinevideoicon.png');

      if ( section.mediaUrl?.includes('youtube.com') || section.mediaUrl?.includes('youtu.be') ) {
        const id = section.mediaUrl.match(
          /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        )?.[1];
        return id ? { uri: `https://img.youtube.com/vi/${id}/hqdefault.jpg` } : require('../assets/onlinevideoicon.png');
      }

      return require('../assets/onlinevideoicon.png');
    }

    return null;
  };


  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('TRACK_FINISHED', () => {
      setIsFinished(true);
      setIsMuted(true);
    });
    
    const unsubscribeNav = navigation.addListener('beforeRemove', () => {
      setIsFinished(true);
      setIsMuted(true);
    });
          
    return () => {
      subscription.remove(); 
      unsubscribeNav();
    };
  }, [navigation])


  useEffect(() => {
    if (section && section.type === "audio") {
      if ( wasActive.current && !isActive ) {
        setMusicFile({id: 12, uri: section.mediaUrl, ispaused: true});
        setIsFinished(false);
        setIsMuted(true);
      }
      wasActive.current = isActive;
    }
  }, [isActive]);

  
  const playPauseAudio = () => {
    if ( isFinished ) {
      if ( section.mediaUri ) {
        setMusicFile({id: index + 19, uri: section.mediaUri, ispaused: false});
      } else {
        setMusicFile({id: index + 19, uri: section.mediaUrl, ispaused: false});
      }
      setIsMuted(false);
      setIsFinished(false);
      return;
    }

    if ( section.mediaUri ) {
      setMusicFile({id: index + 19, uri: section.mediaUri, ispaused: !isMuted});
    } else {
      setMusicFile({id: index + 19, uri: section.mediaUrl, ispaused: !isMuted});
    } 
    setIsMuted(!isMuted);
  };


  if (isActive) {
    return (
     <ScrollView
        nestedScrollEnabled={true} 
        style={ section.type === 'pdf' ? styles.pdfscreenView : isFullscreen ? styles.fullscreenView : styles.screenView }
        scrollEnabled={section.type !== 'pdf'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 38 }}
     >
      <View style={[styles.activeCard, { borderColor: getTypeColor() }, isFullscreen && styles.fullscreenCard]}>

        <View style={styles.activeHeader}>
          { section.type === "pdf" ? (
            <TouchableOpacity onPress={() => handleShareSection(section)} style={styles.shareiconBtn}>
              <Image source={ require('../assets/bluesharearrow.png') } style={{ width: "71%", height: "71%" }} resizeMode='contain' />
            </TouchableOpacity>
          ) : isFullscreen && section.type !== 'video' ? (
            <TouchableOpacity onPress={() => handleShareSection(section)} style={styles.shareiconBtn}>
              <Image source={ section.type === 'image' ? require('../assets/grnsharearrow.png') : require('../assets/purplesharearrow.png')} style={{ width: "71%", height: "71%" }} resizeMode='contain' />
            </TouchableOpacity>
            )  : ( <Text style={styles.activeSectionLabel}>Section {index + 1}: {section.type.toUpperCase()}</Text> ) 
          }

          <View style={{ flexDirection: 'row' }}>
            { section.type === "pdf" ? ( <TouchableOpacity onPress={onOpenpdfViewer} style={styles.iconBtn}>
              <Text style={styles.iconText}>⛶</Text>
            </TouchableOpacity> ) : ( 
              <TouchableOpacity onPress={() => setIsFullscreen(!isFullscreen)} style={styles.iconBtn}>
                {isFullscreen ? ( <Image source={require('../assets/goldminusicon.png')} style={{width: 21, height: 7}} resizeMode="stretch" /> )
                  : ( <Text style={isFullscreen ? styles.iconImage : styles.iconText}>⛶</Text> ) } 
              </TouchableOpacity> ) }
            <TouchableOpacity onPress={onDeactivate} style={styles.iconBtn}>
              <Image source={require('../assets/redgoldcloseicon.png')} style={styles.iconImage} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>

        { section.type === 'video' && (
          <View style={[ styles.videoContainer, isFullscreen && { minHeight: height * 0.83 } ]}>
          { section.mediaUrl && (section.mediaUrl.includes("youtube.com") || section.mediaUrl.includes("youtu.be")) ? (
            <VideoPlayer 
              video = {{
              title: section.title,
              desc: section.description,
              style: 'Chapter',
              vid: "",
              videoUrl: getYouTubeId(section.mediaUrl),
              type: "video",
              }}
              isActive = {isActive}
            /> ) : (
              <VideoPlayer
                video = {{
                  title: section.title,
                  desc: section.description,
                  style: 'Chapter',
                  vid: section.mediaUri?.length > 7 ? section.mediaUri : '',
                  videoUrl: section.mediaUrl?.length > 7 ? section.mediaUrl : '',
                  type: "video",
                }}
                isActive = {isActive}
              />
            )
          }
          </View>
        )}

        { section.type === 'pdf' && ( <View style={[styles.pdfContainer, { minHeight: height * 0.95 }]}> 
          <PdfMove
            pdf={{
              title: section.title,
              style: 'Chapter',
              desc: section.description,
              videoUrl: section.mediaUrl,
              vid: section.mediaUri,
            }}
             isActive={isActive}
             onClosePdf={() => { onDeactivate(); }} 
          />
         </View> ) 
        }

        { section.type === 'audio' && (
          <View style={[styles.audioContainer, isFullscreen && { minHeight: height * 0.38 } ]}>

            <View style={styles.trackPlayerContainer}>
              <TouchableOpacity onPress={() => playPauseAudio()} style={styles.playButton}>
                <View style={{ alignItems:"flex-start", height: 47, width: "100%",}}>
                  <ImageBackground 
                    style={ styles.imgSound }
                    imageStyle={{ opacity: 1 }}
                    resizeMode='contain' 
                    source={ !isMuted ? require('../assets/fympausebutton.png') : require('../assets/fymplaybutton.png')}>
                  </ImageBackground>
                </View>
              </TouchableOpacity>

                <View style={{ alignItems:"flex-start", height: 19, width: "95%" }}>
                  <Text style={styles.fileName} numberOfLines={2} ellipsizeMode='tail'> { section.title.length > 29 ? section.title : `${section.title}     `} </Text>        
                </View>      
            
              { !isFinished && musicFile && musicFile.id !== 12 && ( <TrackPlayer track={musicFile} /> ) }
            </View>
          </View>
        ) }

        { section.type === 'image' && (
          <View style={[styles.imageContainer, isFullscreen && { minHeight: height * 0.83 } ]}>
            <Text style={styles.activeTitle}>{section.title}</Text>

            <Image
              source={{ uri: section.mediaUri || section.mediaUrl }}
              style={[styles.inlineImage, isFullscreen ? { flex: 1 } : { height: 266 }]}
              resizeMode="contain"
            />
          </View>
        ) }

        { section.description && (section.type === 'image' || section.type === 'audio') && (
          <View style={styles.spDescSection}>
            <Text style={styles.spDescLabel}>Description:</Text>
              <Text style={styles.spDescText}>{section.description}</Text>
          </View>
        ) }

      </View>
     </ScrollView>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.thumbnailCard, { borderColor: getTypeColor() }]}
      onPress={onActivate}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailRow}>
        
        <View style={[styles.visualBox,  { borderRightColor: getTypeColor(), borderRightWidth: 1.5 } ]}>
          {getThumbnail() ? (
            <Image source={ getThumbnail() } style={styles.thumbImg} />
          ) : (
            <View style={[ styles.thumbPlaceholder, section.type === "pdf" ? { backgroundColor: 'rgba(19, 7, 57, 0.76)'} : {backgroundColor: 'rgba(27, 7, 57, 0.76)'} ]} >
              <Text style={ section.type === "pdf" ? styles.thumbIconPdf : styles.thumbIcon}>{getTypeIcon()}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.sectionNum} numberOfLines={1}>SECTION {index + 1}</Text>
          <Text style={styles.sectionTitle} numberOfLines={2} ellipsizeMode='tail'>{section.title}</Text>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor() }]}>
            <Text style={styles.typeText}>{section.type.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  activeCard: { backgroundColor: 'rgba(0,0,0,0.95)', marginHorizontal: 7, marginVertical: 7, borderRadius: 16, borderWidth: 2, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10 },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 7, opacity: 1},
  activeSectionLabel: { color: '#8d7f30', fontWeight: 'bold', fontSize: 11 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', marginLeft: 8, borderColor: '#d4af37', borderWidth: 1.5  },
  iconText: { color: 'rgb(228, 19, 19)', fontSize: 18,  textAlignVertical: 'center', textAlign: "center", alignSelf: 'center', includeFontPadding: false },
  iconImage: { width: 22, height: 22 },
  shareiconBtn: { width: 50, height: 50, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.95)',  borderColor: '#d4af37', borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  activeTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', padding: 5, paddingTop: 8 },
  videoContainer: { height: 380, backgroundColor: '#7a2b2b4f' },
  pdfContainer: { height: height * 0.83, width: '100%', alignSelf: 'center', padding: 0, backgroundColor: '#0c153baf', flex: 1, overflow: 'hidden', marginTop: -7 },
  pdfContainerBtn: { height: 228, backgroundColor: '#0c153baf', },
  audioContainer: { height: 133, backgroundColor: 'rgba(225, 0, 255, 0.1)', padding: 2, margin: 0, borderRadius: 12, alignItems: 'center'},
  imageContainer: { backgroundColor: '#0f33128f', alignItems: 'center', padding: 3, opacity: 1 },
  inlineImage: { width: '100%', borderRadius: 8 },
  fullscreenCard: { marginHorizontal: 0, minHeight: height * 0.83 },
  fullscreenText: { color: 'white', fontWeight: 'bold' },
  fullscreenView: { flex: 1, marginHorizontal: 0, maxHeight: height * 0.95 },
  pdfscreenView: { flex: 1, marginHorizontal: 0, minHeight: height * 0.95 },
  screenView: { flex: 1, marginHorizontal: 0, maxHeight: height * 0.76 },
  thumbnailCard: { backgroundColor: 'rgba(241, 255, 250, 0.84)', marginHorizontal: 7, marginVertical: 7, borderRadius: 12, borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4, overflow: 'hidden' },
  thumbnailRow: { flexDirection: 'row', height: 133 },
  visualBox: { width: 140, position: 'relative' },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  thumbIcon: { fontSize: 43, opacity: 1 },
  thumbIconPdf: { fontSize: 52, opacity: 1 },
  infoBox: { flex: 1, padding: 7, justifyContent: 'center' },
  sectionNum: { color: '#8d7f30', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  sectionTitle: { color: '#5f5905', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 3 },
  typeText: { color: 'honeydew', fontSize: 9, fontWeight: 'bold' },
  sectionDesc: { color: '#b6b9c0', fontSize: 12, lineHeight: 16 },
  spDescSection: { backgroundColor: '#1e293b', padding: 7, borderRadius: 12, borderWidth: 1, borderColor: '#99840f', marginBottom: 5, marginTop: 7, marginHorizontal: 5 },
  spDescLabel: { color: '#8d7f30', fontSize: 12, fontWeight: 'bold', marginBottom: 1 },
  spDescScroll: { maxHeight: height * 0.09 },
  spDescText: { color: 'honeydew', fontSize: 12, lineHeight: 15, marginVertical: 1 },
  trackPlayerContainer: { minHeight: 114, width: "98%", backgroundColor: "#C0C0C0", borderRadius: 50, padding: 0, borderColor: '#5f239bff', borderWidth: 4 },
  fileName: { fontSize: 11, color: "#5b12a5ff", fontWeight: 'bold', maxHeight: 19, width: "100%", textAlign: "left", paddingLeft: 62, marginTop: -57, overflow: "hidden" },
  playButton: { borderRadius: 50, width: 57, height: 57, padding: 5, marginLeft: 4, marginBottom: 12, marginRight: 10, marginTop: 1, borderColor: '#5f239bff', borderWidth: 0, shadowColor: "#c494e4", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 5 },
  openPdfButton: { backgroundColor: '#191ba3', paddingVertical: 12, paddingHorizontal: 27, borderRadius: 25, borderWidth: 2, borderColor: '#d4af37', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 8, alignSelf: 'center', marginTop: 45 },
  imgSound: { height: 47, width: 47, marginTop: 7 }
});