import { View, ScrollView, Text, StyleSheet, Dimensions, TouchableOpacity, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef} from 'react';
//import Pdf from 'react-native-pdf';

const { height } = Dimensions.get('window');
const { width } = Dimensions.get('window');
const SCALE = Math.min(width / 375, 1.25);
const ICON_SIZE = Math.round(20 * SCALE);
const BUTTON_SIZE = Math.round(48 * SCALE);
const TEXT_PRIMARY = Math.round(15 * SCALE);

export default function PdfMove({ pdf, onClosePdf, isActive }) {

  if ( !pdf ) {
    return (
      <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e'}}>
        <StatusBar barStyle="dark-content"/>
        <Text style={{color: 'white', fontSize: 16}}>Error: No PDF data</Text>
        <TouchableOpacity 
          onPress={onClosePdf}
          style={{marginTop: 19, padding: 12, backgroundColor: '#3b82f6', borderRadius: 7}}
        >
          <Text style={{color: 'white'}}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }


  const [key, setKey] = useState(0);
  const [pdfDropdownVisible, setPdfDropdownVisible] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [globalLastActionTime, setGlobalLastActionTime] = useState(0);

  const wasActive = useRef(false);
  const pdfRef = useRef(null);
  const displyRef = useRef(1);
  const isTransitioningRef = useRef(false);
  const COOLDOWN_MS = 1900;
  const zoomStep = 0.25;
    
  const pdfSource = {
    uri: pdf.vid && pdf.vid.length > 0 ? pdf.vid : (pdf.videoUrl && pdf.videoUrl.length > 7 ? pdf.videoUrl : ''),
    cache: true,
  };

  const canClick = () => {
    const now = Date.now();
    if (now - lastClickTime < COOLDOWN_MS) {
      return false;
    }
    setLastClickTime(now);
    return true;
  };

  
  const handleRetry = () => {
    if (!canClick()) return;
    setIsLoading(true);
    setKey(prev => prev + 1);
  };
  

  const handleZoomIn = () => {
    const now = Date.now();
    if ( now - globalLastActionTime < 1292 || isTransitioningRef.current) return;
    setGlobalLastActionTime(now);
    setZoomScale(s => Math.min(s + zoomStep, 4));
  }


  const handleZoomOut = () => {
    const now = Date.now();
    if ( now - globalLastActionTime < 1292 || isTransitioningRef.current) return;
    setGlobalLastActionTime(now);
    setZoomScale(s => Math.max(s - zoomStep, 0.5));
  }


  const goToNextPage = () => {
    if (isTransitioningRef.current || isLoading || !pdfRef.current) return;

    const now = Date.now();
    if ( now - globalLastActionTime < 1900) {
      return;
    }

    if (totalPages && displyRef.current < totalPages) {
      isTransitioningRef.current = true;
      setGlobalLastActionTime(now);
      
      displyRef.current += 1;
      setCurrentPage(displyRef.current); 
      pdfRef.current.setPage(displyRef.current);
    }
  }


  const goToPrevPage = () => {
    if (isTransitioningRef.current || isLoading || !pdfRef.current) return;
    
    const now = Date.now();
    if ( now - globalLastActionTime < 1900) {
      return;
    }

    if (displyRef.current > 1) {
      isTransitioningRef.current = true;
      setGlobalLastActionTime(now);
      
      displyRef.current -= 1;
      setCurrentPage(displyRef.current);
      pdfRef.current.setPage(displyRef.current);
    }
  };


  useEffect(() => {
    if (wasActive.current && !isActive) {
      onClosePdf?.();
    }
    wasActive.current = isActive;
  }, [isActive, onClosePdf]);
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#323232' }}>
      <StatusBar barStyle="dark-content"/>
      <View style={styles.header}>
        
        <TouchableOpacity onPress={onClosePdf} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="clip">{pdf.title}</Text>
        <TouchableOpacity onPress={() => setPdfDropdownVisible(!pdfDropdownVisible)} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>
            {!pdfDropdownVisible ? '▼' : '▲'}
          </Text>
        </TouchableOpacity>
      </View>

      { pdfDropdownVisible && (
        <View style={styles.dropdownContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Style:</Text>
            <Text numberOfLines={1} ellipsizeMode="clip" style={styles.infoValue}>{pdf.style || 'Self-Defence'}</Text>
            <TouchableOpacity onPress={handleRetry} style={[styles.typeBadge]}>
              <Text style={{fontSize: 14}}>🔄</Text>
              <Text style={styles.typeText}>PDF</Text>
            </TouchableOpacity>
          </View>

          { pdf.desc && (
            <View style={styles.descSection}>
              <Text style={styles.descLabel}>Description:</Text>
              <ScrollView nestedScrollEnabled={true} style={styles.descScroll}>
                <Text style={styles.descText}>{pdf.desc}</Text>
              </ScrollView>
            </View>
          )}
        </View>
      ) }

      <View style={styles.pdfContainer}>
        { !errorMessage && !isLoading && (
          <View style={styles.controlsTop} pointerEvents={isLoading ? 'none' : 'auto'}>
            <TouchableOpacity onPress={goToPrevPage} style={styles.controlBtn} hitSlop={{top:10,left:10,right:10,bottom:10}}>
              <Text style={styles.controlText}>◀</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleZoomOut} style={styles.controlBtn} hitSlop={{top:10,left:10,right:10,bottom:10}}>
              <Text style={styles.controlText}>−</Text>
            </TouchableOpacity>

            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>{currentPage}{ totalPages ? ` / ${totalPages}` : ''}</Text>
            </View>

            <TouchableOpacity onPress={handleZoomIn} style={styles.controlBtn} hitSlop={{top:10,left:10,right:10,bottom:10}}>
              <Text style={styles.controlText}>＋</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={goToNextPage} style={styles.controlBtn} hitSlop={{top:10,left:10,right:10,bottom:10}}>
              <Text style={styles.controlText}>▶</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0070f3" />
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        )}

        <View style={styles.viewerBody}>
          <Pdf
            ref={pdfRef}
            key ={key}
            source={pdfSource}
            fitPolicy={2}
            maxPageResolution={1200000}
            trustAllCerts={false}
            horizontal={true}
            enableScale={true}
            style={styles.pdfStyle}
            scale={zoomScale}
            enablePaging={true}  
            singlePage={false}
            onLoadComplete={(numberOfPages) => {
              setTotalPages(numberOfPages);
              setIsLoading(false);
            }}
            onPageChanged={(page) => {
              displyRef.current = page;
              setCurrentPage(page);
              isTransitioningRef.current = false;
            }}
            onError={(error) => {
              setErrorMessage(error.toString());
              setIsLoading(false);
              isTransitioningRef.current = false;
            }}
          />

          {errorMessage && !isLoading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.errorText}>Could not load the PDF document.</Text>
              <Text style={styles.errorSubText}>{errorMessage}</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e27' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1d377e91', paddingHorizontal: 16, paddingVertical: 3, borderBottomWidth: 2, borderBottomColor: '#3b82f6', borderTopWidth: 2 ,borderTopColor: "#3b82f6" },
  headerMessage: { height: 56, backgroundColor: '#c4e3fc', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#c4e3fc', elevation: 2 },
  closeBtn: { width: 38, height: 38,borderRadius: 18, backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center' },
  closeText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  toggleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  toggleText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  headerTitle: { flex: 1, color: 'white', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginHorizontal: 10 },
  dropdownContainer: { width: '96%', maxHeight: height * 0.25, alignSelf: 'center', backgroundColor: '#1e293b', borderRadius: 10, padding: 3, marginTop: 5, borderWidth: 1, borderColor: '#3b82f6', overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoLabel: { color: '#67a1e7', fontSize: 12, fontWeight: 'bold', width: 50 },
  infoValue: { color: 'white', fontSize: 12, flex: 1 },
  typeBadge: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, flexDirection: 'row' },
  typeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  descSection: { backgroundColor: '#1e293b', padding: 3, borderRadius: 12, borderWidth: 1, borderColor: '#3b82f6' },
  descLabel: { color: '#60a5fa', fontSize: 12, fontWeight: 'bold', marginBottom: 1 },
  descScroll: { maxHeight: height * 0.07 },
  descText: { color: 'honeydew', fontSize: 12, lineHeight: 15, marginVertical: 1 },
  pdfContainer: { flex: 1, margin: 2, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#3b82f6' },
  loadingText: { marginTop: 12, color: '#60a5fa', fontSize: 16, fontWeight: 'bold' },
  headerText: { fontSize: 11, fontWeight: '600', color: '#0b1c2e' },
  viewerBody: { flex: 1, position: 'relative', paddingTop: BUTTON_SIZE + 12 },
  pdfStyle: { flex: 1, width: '100%', backgroundColor: '#c4e3fc' },
  errorText: { fontSize: 16, fontWeight: 'bold', color: '#f73a3a', textAlign: 'center' },
  errorSubText: { fontSize: 12, color: '#c4e3fc', marginTop: 6, textAlign: 'center' },
  controlsTop: { position: 'absolute', top: 7, left: 7, right: 7, height: BUTTON_SIZE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, backgroundColor: 'rgba(7, 3, 38, 0.7)', borderRadius: 10, zIndex: 20, elevation: 10 },
  controlBtn: { width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2, backgroundColor: 'rgba(19, 12, 76, 0.8)', alignItems: 'center', justifyContent: 'center' },
  controlText: { color: 'white', fontWeight: '600', fontSize: ICON_SIZE },
  pageIndicator: { paddingHorizontal: 12 },
  pageIndicatorText: { color: 'white', fontSize: TEXT_PRIMARY, fontWeight: '600' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 19,
  },
});