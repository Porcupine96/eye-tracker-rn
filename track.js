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

const emptyState = {
  cvCamera: undefined,
  eyesDetected: false,
  lastDetected: new Date(),
  model: undefined,
};

const Track: () => React$Node = () => {
  const {width, height} = Dimensions.get('window');

  const [state, setState] = useState(emptyState);

  async function createModel() {
    const modelJson = require('./model/model.json');
    const modelWeights = require('./model/weights.bin');

    await tf.ready();

    const model = await tf.loadLayersModel(
      bundleResourceIO(modelJson, modelWeights),
    );

    return model;
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
          // use the model to predict eye position
          console.log('Eyes detected!');

          let first = tf.tensor(firstEyeData);
          let second = tf.tensor(secondEyeData);

          if (first.shape[0] >= 95 && second.shape[0] >= 95) {
            first = first.slice([0, 0, 0], [95, 95, 4]);
            second = second.slice([0, 0, 0], [95, 95, 4]);

            const data = tf.concat([first, second], 1);
            const X = tf.reshape(data, [1, 95, 190, 4]);

            console.log('Want to use model');
            console.log(model);

            const prediction = await state.model.predict(X);
            console.log(prediction.dataSync());

            // do something
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
    const model = createModel();

    console.log('Setting model to');
    console.log(model);

    if (!state.cvCamera) {
      setState({...state, cvCamera: React.createRef(), model: model});
    }
  });

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
});

export default Track;
