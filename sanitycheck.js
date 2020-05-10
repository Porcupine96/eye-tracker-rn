import React, {useState, useEffect, use} from 'react';

import {
  View,
  DeviceEventEmitter,
  StyleSheet,
  Text,
  Button,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';

import {
  CvCamera,
  CvScalar,
  Mat,
  CvInvoke,
  CvInvokeGroup,
  Core,
  CvRect,
  CvType,
  ColorConv,
} from 'react-native-opencv3';

const emptyState = {
  cvCamera: undefined,
  lastDetected: new Date(),
  mat: undefined,
};

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
  },
});

const SanityCheck: () => React$Node = () => {
  const [state, setState] = useState(emptyState);

  const facing = 'front';
  const posterScalar = new CvScalar(0, 0, 0, 255);

  // setState({...state, mat: new Mat().init()});

  let onFacesDetected = e => {
    console.log('Faces detected');
  };

  useEffect(() => {
    if (state.mat === undefined) {
      async function setupMat() {
        const mat = await new Mat().init();
        setState({...state, mat: mat});
      }

      DeviceEventEmitter.addListener('onFacesDetected', onFacesDetected);
      setupMat();
    }
  }, [state]);

  return (
    <CvCamera
      /* ref={ref => { */
      /*   if (state.cvCamera === undefined && ref !== undefined) { */
      /*     setState({...state, cvCamera: ref}); */
      /*   } */
      /* }} */
      /* eyesClassifier="haarcascade_eye_tree_eyeglasses" */
      /* faceClassifier="haarcascade_frontalface_alt" */
      /* onFacesDetected={onFacesDetected} */
      faceClassifier="haarcascade_frontalface_alt"
      landmarksModel="lbfmodel"
      onFacesDetected={onFacesDetected}
      style={styles.preview}
      facing={facing}
      useStorage={true}
    />
  );
};

export default SanityCheck;
