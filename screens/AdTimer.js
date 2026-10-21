import * as FileSystem from 'expo-file-system/legacy';
import mobileAds from 'react-native-google-mobile-ads';


const FILE_PATH = `${FileSystem.documentDirectory}last_ad_time.txt`;
const COOLDOWN_TIME_MS = 5 * 60 * 1000; 
let adsInitialization;


const initializeAds = () => {
  if (!adsInitialization) {
    adsInitialization = mobileAds().initialize().catch((error) => {
      adsInitialization = undefined;
      throw error;
    });
  }

  return adsInitialization;
};


export const AdTimer = {

  shouldShowAd: async () => {
    await initializeAds();

    try {
      const fileInfo = await FileSystem.getInfoAsync(FILE_PATH);
      if (!fileInfo.exists) {
        return true; 
      }

      const lastAdTimeStr = await FileSystem.readAsStringAsync(FILE_PATH);
      const lastAdTime = parseInt(lastAdTimeStr, 10);
      
      if (isNaN(lastAdTime)) {
        return true;
      }

      const currentTime = Date.now();
      return (currentTime - lastAdTime) >= COOLDOWN_TIME_MS;

    } catch (error) {
      return true; 
    }
  },


  saveTimestamp: async () => {
    try {
      const currentTime = Date.now().toString();
      await FileSystem.writeAsStringAsync(FILE_PATH, currentTime);
    } catch (error) {
      
    }
  }
};