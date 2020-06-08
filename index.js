/**
 * @format
 */

import {Navigation} from 'react-native-navigation';

import App from './App';
import Training from './training.js';
import Track from './track.js';

Navigation.registerComponent('Menu', () => App);
Navigation.registerComponent('Training', () => Training);
Navigation.registerComponent('Track', () => Track);

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setDefaultOptions({
    topBar: {
      visible: false,
    },
  });

  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: 'Track',
            },
          },
        ],
      },
    },
  });
});
