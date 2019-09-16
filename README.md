# react-native-simpleheat
The awesome simpleheat.js, bound in React Native.

<p align="center">
  <img src="./bin/out.gif" alt="react-native-simpleheat" width="270" height="556">
</p>

## 🚀 Getting Started

Using [npm]():

```sh
yarn add react-native-simpleheat
```

Using [yarn]():

```sh
yarn add react-native-simpleheat
```

## ✍️ Example

This library exports a single `Component`, the `Heatmap`, which is essentially a React Native `<WebView/>` component that is pointed at a dynamic webpage which renders a full-screen heatmap. The heatmap is rendered using [Vlad's](https://github.com/mourner) awesome [`simpleheat.js`](https://github.com/mourner/simpleheat), which is quick, pretty and has a permissive distribution license.

```javascript
import React from 'react';
import {
  PanResponder,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import WebView from 'react-native-webview';

import Heatmap from 'react-native-simpleheat';

export default class App extends React.Component {
  state = {
    // XXX: This is a simple example of taking multi-touch gestures from the PanResponder
    //      and using these to drop points on the heatmap.
    panResponder: PanResponder
      .create(
        {
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderMove: ({ nativeEvent }) => {
            const { changedTouches } = nativeEvent;
            const { heatmap } = this.refs;
            this.setState(
              {
                data: [
                  ...this.state.data,
                  ...changedTouches
                    .map(
                      ({ locationX, locationY }) => {
                        return [
                          locationX,
                          locationY,
                          10,
                        ];
                      },
                    ),
                ],
              },
            );
          },
          onPanResponderRelease: () => this.setState({
            data: [],
          }),
        },
      ),
    data: [],
    gradient: undefined, // <-- Here you could use a custom gradient.
  };
  render() {
    const {
      panResponder,
      data,
      gradient,
    } = this.state;
    return (
      <View
        style={{
          backgroundColor: 'purple', // <-- HeatMap is transparent, so you can view what's underneath.
          flex: 1,
        }}
      >
        <Heatmap
          ref="heatmap"
          {...panResponder.panHandlers} // <-- extraProps are delegated to the containing <Animated.View/>
          WebView={WebView} // <-- Implementors must define the <WebView/> component!
          data={data}
          gradient={gradient}
        />
      </View>
    );
  }
}
```

## 📌 Props

Prop                  | Type     | Default                   | Required
--------------------- | -------- | ------------------------- | --------
WebView|func||Yes
pointerEvents|string|'box-only'|No
containerStyle|shape[object Object]|styles.containerStyle|No
max|number|10|No
gradient|shape[object Object]|{
  1.0: 'red',
  0.4: 'blue',
  0.6: 'cyan',
  0.7: 'lime',
  0.8: 'yellow',
  1.0: 'red',
}|No
onLoadEnd|func|e => null|No
data|array|[]|No

## ✌️ License
[MIT](https://opensource.org/licenses/MIT)
