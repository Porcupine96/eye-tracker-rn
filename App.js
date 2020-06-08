import React, {useState} from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';
import Training from './training.js';
import Track from './track.js';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Navigation} from 'react-native-navigation';

const App = props => {
  const goTo = name => () => {
    Navigation.push(props.componentId, {
      component: {
        name,
      },
    });
  };

  return (
    <View style={styles.main}>
      <Button
        title="Training"
        style={styles.menuButton}
        onPress={goTo('Training')}
      />
      <Button title="Track" style={styles.menuButton} onPress={goTo('Track')} />
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    fontSize: 14,
  },
});

export default App;
