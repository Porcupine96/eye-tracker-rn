import React, {useState} from 'react';
import {View, Button, StyleSheet} from 'react-native';
import Training from './training.js';
import Track from './track.js';
import SanityCheck from './sanitycheck.js';

const MENU = 0;
const TRAINING_ROUTE = 1;
const TRACK_ROUTE = 2;

const emptyState = {
  route: MENU,
};

const App: () => React$Node = () => {
  const [state, setState] = useState(emptyState);

  const goTo = route => () => {
    setState({...state, route: route});
  };

  const renderMenu = () => {
    return (
      <>
        <Button
          title="Training"
          style={styles.menuButton}
          onPress={goTo(TRAINING_ROUTE)}
        />
        <Button
          title="Track"
          style={styles.menuButton}
          onPress={goTo(TRACK_ROUTE)}
        />
      </>
    );
  };

  const renderRoute = () => {
    switch (state.route) {
      case TRAINING_ROUTE:
        return <Training />;
      case TRACK_ROUTE:
        return <Track />;
      default:
        return renderMenu();
    }
  };

  return <View style={styles.main}>{renderRoute()}</View>;
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
