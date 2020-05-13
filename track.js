import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Text, Dimensions, Platform} from 'react-native';
import RNFS from 'react-native-fs';

import * as tf from '@tensorflow/tfjs';
import {
  fetch,
  decodeJpeg,
  bundleResourceIO,
} from '@tensorflow/tfjs-react-native';

import {CvCamera} from 'react-native-opencv3';

const POINTER_SIZE = 40;

function emptyState(width, height) {
  return {
    cvCamera: undefined,
    eyesDetected: false,
    lastDetected: new Date(),
    model: undefined,
    dot: [(width - POINTER_SIZE) / 2, (height - POINTER_SIZE) / 2],
  };
}

const Track: () => React$Node = () => {
  const {width, height} = Dimensions.get('window');

  const [state, setState] = useState(emptyState(width, height));

  async function setup() {
    if (!state.model) {
      const modelJson = require('./model/model.json');
      const modelWeights = require('./model/weights.bin');

      await tf.ready();

      const model = await tf.loadLayersModel(
        bundleResourceIO(modelJson, modelWeights),
      );

      if (state.cvCamera) {
        setState({...state, model: model});
      } else {
        setState({...state, model: model, cvCamera: React.createRef()});
      }
    } else if (!state.cvCamera) {
      setState({...state, cvCamera: React.createRef()});
    }
  }

  async function onFacesDetected(e) {
    var rawPayload = undefined;

    if (Platform.OS === 'ios') {
      rawPayload = e.nativeEvent.payload;
    } else {
      rawPayload = e.payload;
    }

    if (rawPayload) {
      const payload = JSON.parse(rawPayload);

      if (payload.faces.length === 1) {
        const face = payload.faces[0];
        const {firstEye, secondEye} = face;
        const {firstEyeData, secondEyeData} = face;

        if (firstEye && secondEye) {
          let first = tf.tensor(firstEyeData);
          let second = tf.tensor(secondEyeData);

          if (first.shape[0] >= 95 && second.shape[0] >= 95) {
            first = first.slice([0, 0, 0], [95, 95, 4]);
            second = second.slice([0, 0, 0], [95, 95, 4]);

            const data = tf.concat([first, second], 1);
            const X = tf.reshape(data, [1, 95, 190, 4]);

            const prediction = await state.model.predict(X);
            const predData = await prediction.data();

            if (predData) {
              var [x, y] = [predData[0], predData[1]];
              if (x < 0) x = 0;
              if (y < 0) y = 0;
              if (x > width - POINTER_SIZE) x = width - POINTER_SIZE;
              if (y > height - POINTER_SIZE) y = height - POINTER_SIZE;

              console.log(`x: ${x}, y: ${y}`);

              setState({...state, dot: [x, y]});
            }
          }
        } else if (state.eyesDetected) {
          // ignore for now
        }
      } else if (state.eyesDetected) {
        // ignore for now
      }
    }
  }

  useEffect(() => {
    setup();
  });

  const dotStyle = StyleSheet.flatten([
    styles.dot,
    {left: state.dot[0], top: state.dot[1]},
  ]);

  return (
    <View style={styles.main}>
      <>
        {state.cvCamera ? (
          <CvCamera
            ref={state.cvCamera}
            style={styles.cameraPreview}
            facing="front"
            faceClassifier="haarcascade_frontalface_alt2"
            eyesClassifier="haarcascade_eye_tree_eyeglasses"
            onFacesDetectedCv={onFacesDetected}
            useStorage={true}
          />
        ) : (
          <View />
        )}
        <View style={dotStyle} />
      </>
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
  cameraPreview: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    top: 0,
    left: '80%',
    right: 8,
    bottom: '80%',
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
    margin: 0,
    padding: 0,
    width: POINTER_SIZE,
    height: POINTER_SIZE,
    borderRadius: POINTER_SIZE / 2,
    backgroundColor: 'red',
  },
});

export default Track;
