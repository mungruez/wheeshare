import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { DeviceEventEmitter } from 'react-native'; 
import React, { useEffect, useRef, useState } from 'react';

const LOCAL_AUDIO_MAP = {
  0: require('../assets/freeyourmind/freeyourmind(part1).mp3'),
  1: require('../assets/freeyourmind/freeyourmind(part2).mp3'),
  2: require('../assets/freeyourmind/freeyourmind(part3).mp3'),
  3: require('../assets/freeyourmind/freeyourmind(part4).mp3'),
  4: require('../assets/freeyourmind/freeyourmind(part5).mp3'),
  5: require('../assets/freeyourmind/freeyourmind(part6).mp3'),
  6: require('../assets/freeyourmind/freeyourmind(part7).mp3'),
  7: require('../assets/freeyourmind/freeyourmind(part8).mp3'),
  8: require('../assets/freeyourmind/freeyourmind(part9).mp3'),
  9: require('../assets/freeyourmind/theuniverseforcesyoutoletgo(part1).mp3'),
  10: require('../assets/freeyourmind/theuniverseforcesyoutoletgo(part2).mp3'),
  11: require('../assets/freeyourmind/theuniverseforcesyoutoletgo(part3).mp3'),
};


export default function TrackPlayer({ track }) {
  const isMounted = useRef(true);
  const source = track.id <= 11 ? LOCAL_AUDIO_MAP[track.id] : track.uri;
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  const [barWidth, setBarWidth] = useState(0);


  const formatTime = (seconds) => {
    if (!seconds && seconds !==0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };


  useEffect(() => {
    if(player) {
      player.play();
    }
    return () => {
      try {
        if (player) {
          player.pause();
          player.replace(null); 
        }
      } catch (e) {
        // Silently fail so the app doesn't die
      }
    };
  }, [player]);



  const handleSliderPress = (evt) => {
    const dur = status.duration;
    if (dur > 0 && barWidth > 0) {
      const locationX = evt.nativeEvent.locationX;
      let percentage = Math.max(0, Math.min(1, locationX / barWidth));
      try {
        player.seekTo(percentage * dur);
      } catch (e) {
        //console.log("Seek error:", e);
      }
    }
  };


  const progressPercent = status.duration > 0
    ? (status.currentTime / status.duration) * 100
    : 0;
  

  useEffect(() => {
    if (!player || !status || !track) return;

    if (track.ispaused && status.playing) {
      player.pause();
    } else if (!track.ispaused && !status.playing) {
      player.play();
    }
  }, [track.ispaused, status.playing]);


  useEffect(() => {
    if (status && status.didJustFinish) {
      if (isMounted.current) {
        try {
          DeviceEventEmitter.emit('TRACK_FINISHED');
        } catch (e) {
          //silent...
        }
      }
    }
  }, [status?.didJustFinish]);


  useEffect(() => {
    if (status && status.error && isMounted.current) {
      DeviceEventEmitter.emit('TRACK_FINISHED');
    }
  }, [status?.error]);


  return (
    <View style={styles.row}>
      {status.error ? (
        <Text style={styles.duration}>00</Text>
          ) : status.playing || status.currentTime > 0 ? (
            <View style={{flexDirection:"column", alignItems:"center", width: 228, backgroundColor: 'transparent', marginTop: -2, padding: 3, borderRadius: 7}}> 
              <Pressable
                style={styles.sliderTrack}
                onPress={handleSliderPress}
                onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              >
                <View style={[styles.progressLine, { width: `${progressPercent}%` }]} pointerEvents="none" />
              </Pressable>
              <Text style={styles.duration}>
                {formatTime(status.currentTime)} / {formatTime(status.duration)}
              </Text>
            </View>
          ) : player && !track.ispaused ?
            <ActivityIndicator size="small" color="#5b12a5ff" /> :
      <></> }
    </View>
  );
};


const styles = StyleSheet.create({
  row: { 
    marginTop: -43, 
    padding: 1,
    borderRadius: 7,
    borderWidth: 0, 
    alignSelf: 'center',
    alignItems: "center",
    borderRadius: 50,
  },
  sliderTrack: {
    width: "100%",
    height: 6,
    borderRadius: 19,
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 7, 
    marginBottom: 15,
    paddinginLeft: 12,
    marginLeft: 25,
    backgroundColor: '#a64fbe50',
  },
  progressLine: {
    height: 6, 
    backgroundColor: '#792dc5',
    borderRadius: 19,
    marginLeft: 0,
    paddingVertical: 7,
  },
  duration: {
    fontSize: 12,
    color: "#5b12a5ff",
    fontWeight: 'bold',
    borderColor: '#8d6facff',
    borderWidth: 2,
    borderRadius: 19,
    paddingHorizontal: 8,
    marginTop: -3,
  }
});