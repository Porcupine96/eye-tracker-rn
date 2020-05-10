import React from 'react';
import {View, StyleSheet, Text} from 'react-native';

// import * as tf from '@tensorflow/tfjs';
// import {
//   fetch,
//   decodeJpeg,
//   bundleResourceIO,
// } from '@tensorflow/tfjs-react-native';

const Track: () => React$Node = () => {
  console.log('hey there');

  // function createModel() {
  //   const model = tf.sequential();

  //   model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

  //   console.log('hello world');

  //   return model;
  // }

  // const model = createModel();

  return (
    <View style={styles.main}>
      <Text>"test2"</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Track;
