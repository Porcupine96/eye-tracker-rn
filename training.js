import React, {useState, useEffect} from 'react';

import {
  View,
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

import {uploadImage} from './upload.js';

const noEyes = {
  firstEye: undefined,
  secondEye: undefined,
};

const emptyState = {
  cvCamera: undefined,
  eyes: noEyes,
  eyesDetected: false,
  lastDetected: new Date(),
  buttonClicks: {},
  timerSet: false,
  mat: undefined,
};

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
    }
  }

  useEffect(() => {
    setup();
    if (!state.timerSet) {
      // setInterval(resetEyesDetected, 2000, []);
      setState({...state, timerSet: true});
    }
  }, []);

  const onFacesDetected = e => {
    var rawPayload = undefined;

    if (Platform.OS === 'ios') {
      rawPayload = e.nativeEvent.payload;
    } else {
      rawPayload = e.payload;
    }

    if (rawPayload) {
      const payload = JSON.parse(rawPayload);

      if (payload.faces.length == 1) {
        const face = payload.faces[0];
        const {firstEye, secondEye} = face;

        if (firstEye && secondEye) {
          setState({
            ...state,
            eyes: {firstEye, secondEye},
            eyesDetected: true,
            lastDetected: Date.now(),
          });
        } else {
          setState({...state, eyes: noEyes, eyesDetected: false});
        }
      } else {
        setState({...state, eyes: noEyes, eyesDetected: false});
      }
    }
  };

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

    await takePicture(position);

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
        disabled={!eyesDetected}>
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

  async function onPayload(payload) {
    // console.log('onPayload');
    // console.log(payload);
    console.log('hello');
    console.log(state.mat.data);

    // console.log(await state.mat.get());
    // console.log(state.cvCamera);
  }

  const posterScalar = new CvScalar(0, 0, 0, 255);

  if (state.mat) {
    console.log('mat');
    console.log(state.mat);
  }

  return (
    <>
      <View
        // source={require('./img/paper_fibers.png')}
        style={styles.main}>
        <>
          {state.mat ? (
            <CvInvoke
              func="cvtColor"
              params={{
                p1: 'rgba',
                p2: state.mat,
                p3: ColorConv.COLOR_RGB2RGBA,
              }}
              callback="onPayload">
              <CvCamera
                ref={state.cvCamera}
                style={styles.cameraPreview}
                facing="front"
                faceClassifier="haarcascade_frontalface_alt2"
                eyesClassifier="haarcascade_eye_tree_eyeglasses"
                onFacesDetected={onFacesDetected}
                onPayload={onPayload}
                useStorage={true}
                overlayInterval={2000}
              />
            </CvInvoke>
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
      </View>
      {/* </ImageBackground> */}
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
    height: '20%',
    width: '20%',
    top: 80,
    right: 8,
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
