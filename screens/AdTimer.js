import * as FileSystem from 'expo-file-system/legacy';

const COOLDOWN_TIME_MS = 5 * 60 * 1000;


const getFilePath = () => {
  if (!FileSystem.documentDirectory) return null;


  return FileSystem.documentDirectory.endsWith('/')
    ? `${FileSystem.documentDirectory}last_ad_time.txt`
    : `${FileSystem.documentDirectory}/last_ad_time.txt`;
};


export const AdTimer = {
  shouldShowAd: async () => {
    try {
      
      const filePath = getFilePath();
      if (!filePath) return true;

      const fileInfo = await FileSystem.getInfoAsync(filePath).catch(() => null);
      
      if (!fileInfo || !fileInfo.exists) {
        return true; 
      }

      const lastAdTimeStr = await FileSystem.readAsStringAsync(filePath);
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
      const filePath = getFilePath();
      if (!filePath) return;

      const currentTime = Date.now().toString();
      await FileSystem.writeAsStringAsync(filePath, currentTime);

    } catch (error) {
      
    }
  }
};