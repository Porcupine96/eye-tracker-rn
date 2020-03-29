import React, {useState, useEffect} from 'react';
import {
  StatusBar,
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
} from 'react-native-opencv3';

const emptyState = {
  overlayMat: undefined,
  cvCamera: undefined,
  eyes: {
    firstEye: undefined,
    secondEye: undefined,
  },
  eyesDetected: false,
  lastDetected: 0,
  buttonClicks: {},
};

const App: () => React$Node = () => {
  const {width, height} = Dimensions.get('window');

  const [state, setState] = useState(emptyState);

  const resetEyesDetected = () => {
    const invalidationTimeout = 2000;
    const current = Date.now();

    if (
      state.eyesDetected &&
      state.lastDetected + invalidationTimeout < current
    ) {
      setState({...state, eyesDetected: false});
    }
  };

  async function setup() {
    if (!state.cvCamera) {
      let mat = await new Mat(50, 50, CvType.CV_8UC4).init();
      setInterval(resetEyesDetected, 2000, []);
      setState({...state, overlayMat: mat, cvCamera: React.createRef()});
    }
  }

  useEffect(() => {
    setup();
  }, []);

  const onFacesDetected = e => {
    if (Platform.OS === 'ios') {
      if (e.nativeEvent.payload) {
        const payload = JSON.parse(e.nativeEvent.payload);

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
          }
        }
      }
    } else {
      console.error('Android currently unsupported!');
    }
  };

  const onPayload = async e => {
    console.log('payload');
    console.log(e);

    if (state.cvCamera && state.cvCamera.current && state.overlayMat) {
      // TODO: for some reason setting the overlay crashes the app
      // state.cvCamera.current.setOverlay(state.overlayMat);
    }
  };

  const takePicture = async () => {
    const {uri, width, height} = await state.cvCamera.current.takePicture(
      'test.png',
    );
  };

  const onButtonPress = position => () => {
    const currentCount = state.buttonClicks[position] || 0;
    const newCount = currentCount + 1;
    const buttonClicks = {...state.buttonClicks, [position]: newCount};

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
        enabled={eyesDetected}>
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
      <ImageBackground
        source={require('./img/paper_fibers.png')}
        style={styles.main}>
        {state.overlayMat ? (
          <>
            <CvCamera
              ref={state.cvCamera}
              style={styles.cameraPreview}
              facing="front"
              faceClassifier="haarcascade_frontalface_alt2"
              eyesClassifier="haarcascade_eye_tree_eyeglasses"
              onFacesDetected={onFacesDetected}
              onPayload={onPayload}
              useStorage={true}
            />
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
        ) : (
          <Text>Loading</Text>
        )}
      </ImageBackground>
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

export default App;
