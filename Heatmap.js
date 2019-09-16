import React from 'react';
import PropTypes from 'prop-types';
import { Animated, StyleSheet } from 'react-native';

class Heatmap extends React.Component {
  static html = () => (
    `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          html, body {
            height: 100%;
            margin: 0;
          }
        </style>
      </head>
      <body>
      <canvas id="canvas"></canvas>
        
      <script>
        canvas = document.getElementById("canvas");
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
      </script>
  
      <script src="https://cdn.jsdelivr.net/npm/simpleheat@0.4.0/simpleheat.min.js"></script>
  
      <script>
        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        window.heat = simpleheat('canvas');
        </script>
      </body>
    </html>
    `
  );
  state = {
    html: Heatmap
      .html(),
  };
  inject = (script) => {
    const { webView } = this.refs;
    webView.injectJavaScript(
      script,
    );
  };
  add = (x, y, value) => this.inject(
    `window.heat.add([${x}, ${y}, ${value}]);`,
  );
  data = (data = []) => this.inject(
    `window.heat.data(${JSON.stringify(data)});`,
  );
  max = max => this.inject(
    `window.heat.max(${max});`,
  );
  redraw = (minOpacity = 0.05) => this.inject(
    `window.requestAnimationFrame(() => window.heat.draw(${minOpacity}));`,
  );
  gradient = gradient => this.inject(
    `window.heat.gradient(${JSON.stringify(gradient)});`,
  );
  onLoadEnd = (e) => {
    const {
      onLoadEnd,
      gradient,
      max,
      data,
    } = this.props;
    this.gradient(gradient);
    this.max(max);
    this.data(data);
    this.redraw();
    return onLoadEnd(e);
  };
  getSnapshotBeforeUpdate(prevProps, prevState) {
    const {
      data: prevData,
      gradient: prevGradient,
      max: prevMax,
    } = prevProps;
    const {
      data,
      gradient,
      max,
    } = this.props;
    const dataChanged = data !== prevData;
    const gradientChanged = gradient !== prevGradient;
    const maxChanged = max !== prevMax;
    if (dataChanged) {
      this.data(data);
    }
    if (gradientChanged) {
      this.gradient(gradient);
    }
    if (maxChanged) {
      this.max(max);
    }
    if (dataChanged || gradientChanged || maxChanged) {
      this.redraw();
    }
    return null;
  }
  componentDidUpdate() { /* unused */ }
  render() {
    const {
      WebView,
      containerStyle,
      pointerEvents,
      max,
      onLoadEnd,
      ...extraProps
    } = this.props;
    return (
      <Animated.View
        {...extraProps}
        style={containerStyle}
        pointerEvents={pointerEvents}
      >
        <WebView
          ref="webView"
          style={styles.webView}
          source={this.state}
          onLoadEnd={this.onLoadEnd}
        />
      </Animated.View>
    );
  }
}

const styles = StyleSheet
  .create(
    {
      containerStyle: {
        flex: 1,
      },
      webView: {
        flex: 1,
        backgroundColor: 'transparent',
      },
    },
  );

Heatmap.propTypes = {
  WebView: PropTypes.func.isRequired,
  pointerEvents: PropTypes.string,
  containerStyle: PropTypes.shape({}),
  max: PropTypes.number,
  gradient: PropTypes.shape({}),
  onLoadEnd: PropTypes.func,
  data: PropTypes.array,
};

Heatmap.defaultProps = {
  containerStyle: styles.containerStyle,
  pointerEvents: 'box-only',
  max: 10,
  gradient: {
    1.0: 'red',
    0.4: 'blue',
    0.6: 'cyan',
    0.7: 'lime',
    0.8: 'yellow',
    1.0: 'red',
  },
  onLoadEnd: e => null,
  data: [],
};

export default Heatmap;
