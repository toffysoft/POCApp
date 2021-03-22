/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import {SafeAreaView} from 'react-native';
import {MainContextProvider} from './context/mainContext';
import MainScreen from './screens/MainScreen';
const App: () => React$Node = () => {
  return (
    <SafeAreaView>
      <MainContextProvider>
        <MainScreen />
      </MainContextProvider>
    </SafeAreaView>
  );
};

export default App;
