import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import Resources from './screens/Resources';
import WheeProblemsAndSolutions from './screens/WheeProblemsAndSolutions';
import WheeChapters from './screens/WheeChapters';
import WheeCrosswords from './screens/WheeCrosswords';
import WheeQuizzes from './screens/WheeQuizzes';
   
const Stack = createNativeStackNavigator();

export default function App() {
  return (
     <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{headerShown:false, animation: 'slide_from_left'}}/>
        <Stack.Screen name="Chapters" component={WheeChapters} options={{headerShown:false, animation: 'slide_from_right'}}/>
        <Stack.Screen name="Problems" component={WheeProblemsAndSolutions} options={{headerShown:false, animation: 'slide_from_right'}}/>
         <Stack.Screen name="Crosswords" component={WheeCrosswords} options={{headerShown:false, animation: 'slide_from_right'}}/>
        <Stack.Screen name="Quizzes" component={WheeQuizzes} options={{headerShown:false, animation: 'slide_from_right'}}/>
        <Stack.Screen name="About" component={Resources} options={{headerShown:false, animation: 'slide_from_right'}}/>
      </Stack.Navigator>
     </NavigationContainer>
  );
}