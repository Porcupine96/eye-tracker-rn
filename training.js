import React, {useState, useEffect} from 'react';

import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Platform,
} from 'react-native';

import {CvCamera} from 'react-native-opencv3';

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
  toggle: false,
};

class Training extends React.Component {
  constructor(props) {
    super(props);
    this.state = emptyState;

    this.resetEyesDetected = this.resetEyesDetected.bind(this);
    this.onFacesDetected = this.onFacesDetected.bind(this);
  }

  componentDidMount() {
    console.log('Did mount');
    if (!this.state.cvCamera) {
      console.log('no camsera');
      // setInterval(resetEyesDetected, 2000, []);
      this.setState({
        ...this.state,
        cvCamera: React.createRef(),
        timerSet: true,
      });
    }
  }
  componentWillUnmount() {
    console.log('will unmount');
  }

  componentDidAppear() {
    console.log('Here I am');
  }

  componentDidDisappear() {
    console.log("I'm gone s");
  }

  resetEyesDetected() {
    const invalidationTimeout = 2000;
    const current = Date.now();

    if (
      this.state.eyesDetected &&
      this.state.lastDetected + invalidationTimeout < current
    ) {
      this.setState({...this.state, eyes: noEyes, eyesDetected: false});
    }
  }

  onFacesDetected(e) {
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
          this.setState({
            ...this.state,
            eyes: {firstEye, secondEye},
            firstEyeData: firstEyeData,
            secondEyeData: secondEyeData,
            eyesDetected: true,
            lastDetected: Date.now(),
          });
        } else if (this.state.eyesDetected) {
          if (!(this.state.eyes === noEyes)) {
            this.setState({...this.state, eyes: noEyes, eyesDetected: false});
          }
        }
      } else if (this.state.eyesDetected) {
        if (!(this.state.eyes === noEyes)) {
          this.setState({...this.state, eyes: noEyes, eyesDetected: false});
        }
      }
    }
  }

  render() {
    // const Training: () => React$Node = () => {
    const {width, height} = Dimensions.get('window');

    // const [state, setState] = useState(emptyState);

    const onButtonPress = position => async () => {
      const currentCount = this.state.buttonClicks[position] || 0;
      const newCount = currentCount + 1;
      const buttonClicks = {...this.state.buttonClicks, [position]: newCount};

      let timestamp = new Date().getTime();

      let firstPath =
        RNFS.DocumentDirectoryPath +
        `/lukasz4_${position}_first_${timestamp}.json`;
      let secondPath =
        RNFS.DocumentDirectoryPath +
        `/lukasz4_${position}_second_${timestamp}.json`;

      // TODO: this could be awaited
      RNFS.writeFile(firstPath, JSON.stringify(this.state.firstEyeData), 'utf8')
        .then(s => {
          console.log(`Written to: ${firstPath}`);
        })
        .catch(err => {
          console.error(err);
        });

      RNFS.writeFile(
        secondPath,
        JSON.stringify(this.state.secondEyeData),
        'utf8',
      )
        .then(s => {
          console.log(`Written to: ${secondPath}`);
        })
        .catch(err => {
          console.error(err);
        });

      this.setState({...this.state, buttonClicks: buttonClicks});
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

      const clicks = this.state.buttonClicks[position] || 0;

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
    ].map(position => renderButton(this.state.eyesDetected, position));

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
            {this.state.cvCamera ? (
              <CvCamera
                ref={this.state.cvCamera}
                style={styles.cameraPreview}
                facing="front"
                faceClassifier="haarcascade_frontalface_alt2"
                eyesClassifier="haarcascade_eye_tree_eyeglasses"
                onFacesDetectedCv={this.onFacesDetected}
                useStorage={true}
              />
            ) : (
              <View />
            )}
            <View style={styles.eyeTextWrapper}>
              <Text style={styles.eyeText}>
                {eyeText(
                  'Left Eye',
                  this.state.eyes ? this.state.eyes.firstEye : 'none',
                )}
              </Text>
              <Text style={styles.eyeText}>
                {eyeText(
                  'Right Eye',
                  this.state.eyes ? this.state.eyes.secondEye : 'none',
                )}
              </Text>
            </View>
            {buttons}
          </>
          {/* </ImageBackground> */}
        </View>
      </>
    );
  }
}

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
