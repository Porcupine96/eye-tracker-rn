import React, {useState, useEffect} from 'react';

import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  DeviceEventEmitter,
  Platform,
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

import {uploadImage} from './upload.js';

import RNFS from 'react-native-fs';

const noEyes = {
  firstEye: undefined,
  secondEye: undefined,
};

const emptyState = {
  cvCamera: undefined,
  eyes: noEyes,
  firstEyeData: undefined,
  secondEyeData: undefined,
  eyesDetected: false,
  lastDetected: new Date(),
  buttonClicks: {},
  timerSet: false,
  mat: undefined,
  toggle: false,
};

var listenerAdded = false; // <3 Global variable

const Training: () => React$Node = () => {
  const {width, height} = Dimensions.get('window');

  const [state, setState] = useState(emptyState);

  function resetEyesDetected() {
    const invalidationTimeout = 2000;
    const current = Date.now();

    if (
      state.eyesDetected &&
      state.lastDetected + invalidationTimeout < current
    ) {
      setState({...state, eyes: noEyes, eyesDetected: false});
    }
  }

  async function setup() {
    if (!state.cvCamera) {
      const mat = await new Mat().init();
      setState({...state, cvCamera: React.createRef(), mat: mat});
    } else if (!listenerAdded) {
      console.log('Added Event Emitter');
      DeviceEventEmitter.addListener('onFacesDetected', onFacesDetected);
      listenerAdded = true;
    }
  }

  function allowDetection() {}

  useEffect(() => {
    setup();
    if (!state.timerSet) {
      setInterval(resetEyesDetected, 2000, []);
      allowDetection(allowDetection, 200, []);
      setState({...state, timerSet: true});
    }
  }, [state]);

  function onFacesDetected(e) {
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
          setState({
            ...state,
            eyes: {firstEye, secondEye},
            firstEyeData: firstEyeData,
            secondEyeData: secondEyeData,
            eyesDetected: true,
            lastDetected: Date.now(),
          });
        } else if (state.eyesDetected) {
          if (!(state.eyes === noEyes)) {
            setState({...state, eyes: noEyes, eyesDetected: false});
          }
        }
      } else if (state.eyesDetected) {
        if (!(state.eyes === noEyes)) {
          setState({...state, eyes: noEyes, eyesDetected: false});
        }
      }
    }
  }

  async function takePicture(position) {
    const {uri, width, height} = await state.cvCamera.current.takePicture(
      `${position}-test.png`,
    );

    console.log('taking a picture');

    uploadImage(uri);
  }

  const onButtonPress = position => async () => {
    const currentCount = state.buttonClicks[position] || 0;
    const newCount = currentCount + 1;
    const buttonClicks = {...state.buttonClicks, [position]: newCount};

    // TODO: this could be awaited
    let timestamp = new Date().getTime();

    let firstPath =
      RNFS.DocumentDirectoryPath +
      `/lukasz_${position}_first_${timestamp}.json`;
    let secondPath =
      RNFS.DocumentDirectoryPath +
      `/lukasz_${position}_second_${timestamp}.json`;

    RNFS.writeFile(firstPath, JSON.stringify(state.firstEyeData), 'utf8')
      .then(s => {
        console.log(`Written to: ${firstPath}`);
      })
      .catch(err => {
        console.error(err);
      });

    RNFS.writeFile(secondPath, JSON.stringify(state.secondEyeData), 'utf8')
      .then(s => {
        console.log(`Written to: ${secondPath}`);
      })
      .catch(err => {
        console.error(err);
      });

    setState({...state, buttonClicks: buttonClicks});
  };

  const renderButton = (eyesDetected, position) => {
    const color = eyesDetected ? '#228B22' : '#DC143C';
    const circleSize = 36;

    function positionToCoords() {
      const top = 24;
      const midY = height / 2 - circleSize / 2;
      const bottom = height - circleSize - 10;

      const left = 10;
      const midX = width / 2 - circleSize / 2;
      const right = width - circleSize - 10;

      switch (position) {
        case 'top-left':
          return [top, left];
        case 'mid-left':
          return [midY, left];
        case 'bottom-left':
          return [bottom, left];
        case 'top-right':
          return [top, right];
        case 'mid-right':
          return [midY, right];
        case 'bottom-right':
          return [bottom, right];
        case 'top-mid':
          return [top, midX];
        case 'mid-mid':
          return [midY, midX];
        case 'bottom-mid':
          return [bottom, midX];
      }
    }

    const [top, left] = positionToCoords();

    const style = StyleSheet.flatten([
      styles.roundButton,
      {backgroundColor: color},
      {top, left},
      {width: circleSize, height: circleSize, borderRadius: circleSize / 2},
    ]);

    const clicks = state.buttonClicks[position] || 0;

    return (
      <TouchableOpacity
        style={style}
        key={position}
        onPress={onButtonPress(position)}
        disabled={false}>
        <Text style={{fontFamily: 'Courier New'}}>{clicks}</Text>
      </TouchableOpacity>
    );
  };

  const buttons = [
    'top-left',
    'mid-left',
    'bottom-left',
    'top-mid',
    'mid-mid',
    'bottom-mid',
    'top-right',
    'mid-right',
    'bottom-right',
  ].map(position => renderButton(state.eyesDetected, position));

  const eyeText = (label, value) => {
    if (value) {
      const coords = `(${value.x}, ${value.y})`;
      return `${label}: ${coords}`;
    } else {
      return `${label}: none`;
    }
  };

  return (
    <>
      {/* <ImageBackground source={require('./img/paper.png')} style={styles.main} /> */}
      <View style={styles.main}>
        <>
          {state.mat ? (
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
          <View style={styles.eyeTextWrapper}>
            <Text style={styles.eyeText}>
              {eyeText(
                'Left Eye',
                state && state.eyes ? state.eyes.firstEye : 'none',
              )}
            </Text>
            <Text style={styles.eyeText}>
              {eyeText(
                'Right Eye',
                state && state.eyes ? state.eyes.secondEye : 'none',
              )}
            </Text>
          </View>
          {buttons}
        </>
        {/* </ImageBackground> */}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  main: {
    height: '100%',
    width: '100%',
  },
  eyeText: {
    fontFamily: 'Courier New',
    fontSize: 6,
  },
  eyeTextWrapper: {
    top: 230,
    right: 10,
    position: 'absolute',
  },
  cameraPreview: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    top: 0,
    left: '70%',
    right: 8,
    bottom: '70%',
    position: 'absolute',
  },
  roundButton: {
    margin: 0,
    padding: 0,
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Training;
