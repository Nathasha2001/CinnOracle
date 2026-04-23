import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CinnOracleMain from './screens/CinnOracleMain';
import NewAnalysis from './screens/NewAnalysis';
import PricePrediction from './screens/PricePredictionResults';
import HistoricalTrends from './screens/HistoricalTrends';
import SavedSuccess from './screens/SavedSuccess';
import Report from './screens/Report';
import GradeGuide from './screens/GradeGuide';

export type RootStackParamList = {
  CinnOracleMain: undefined;
  NewAnalysis: undefined;
  PricePrediction: { result: any };
  HistoricalTrends: undefined;
  SavedSuccess: undefined;
  Report: { batchData: any };
  GradeGuide: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CinnOracleMain">
        <Stack.Screen 
          name="CinnOracleMain" 
          component={CinnOracleMain}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NewAnalysis" 
          component={NewAnalysis}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PricePrediction" 
          component={PricePrediction}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="HistoricalTrends" 
          component={HistoricalTrends}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SavedSuccess" 
          component={SavedSuccess}
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen 
          name="Report" 
          component={Report}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="GradeGuide" 
          component={GradeGuide}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
