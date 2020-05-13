import React from 'react';
import {View, Text} from 'react-native';
import Training from './training.js';
import Track from './track.js';
import SanityCheck from './sanitycheck.js';

const App: () => React$Node = () => {
  // return <SanityCheck />;
  // return <Training />;
  return <Track />;
};

export default App;
