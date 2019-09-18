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
    
        <script>
          'use strict';

          if (typeof module !== 'undefined') module.exports = simpleheat;

          function simpleheat(canvas) {
            if (!(this instanceof simpleheat)) return new simpleheat(canvas);

            this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

            this._ctx = canvas.getContext('2d');
            this._width = canvas.width;
            this._height = canvas.height;

            this._max = 1;
            this._data = [];
          }

          simpleheat.prototype = {

            defaultRadius: 25,

            defaultGradient: {
              0.4: 'blue',
              0.6: 'cyan',
              0.7: 'lime',
              0.8: 'yellow',
              1.0: 'red',
            },

            data: function (data) {
              this._data = data;
              return this;
            },

            max: function (max) {
              this._max = max;
              return this;
            },

            add: function (point) {
              this._data.push(point);
              return this;
            },

            clear: function () {
              this._data = [];
              return this;
            },

            radius: function (r, blur) {
              blur = blur === undefined ? 15 : blur;

              var circle = this._circle = this._createCanvas(),
              ctx = circle.getContext('2d'),
              r2 = this._r = r + blur;

              circle.width = circle.height = r2 * 2;

              ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
              ctx.shadowBlur = blur;
              ctx.shadowColor = 'black';

              ctx.beginPath();
              ctx.arc(-r2, -r2, r, 0, Math.PI * 2, true);
              ctx.closePath();
              ctx.fill();

              return this;
            },

            resize: function () {
              this._width = this._canvas.width;
              this._height = this._canvas.height;
            },

            gradient: function (grad) {
              var canvas = this._createCanvas(),
              ctx = canvas.getContext('2d'),
              gradient = ctx.createLinearGradient(0, 0, 0, 256);

              canvas.width = 1;
              canvas.height = 256;

              for (var i in grad) {
                gradient.addColorStop(+i, grad[i]);
              }

              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, 1, 256);

              this._grad = ctx.getImageData(0, 0, 1, 256).data;

              return this;
            },

            draw: function (minOpacity, alpha) {
              if (!this._circle) this.radius(this.defaultRadius);
              if (!this._grad) this.gradient(this.defaultGradient);

              var ctx = this._ctx;

              ctx.clearRect(0, 0, this._width, this._height);

              for (var i = 0, len = this._data.length, p; i < len; i++) {
                p = this._data[i];
                ctx.globalAlpha = Math.min(Math.max((p[2] / this._max), minOpacity === undefined ? 0.05 : minOpacity), 1);
                ctx.drawImage(this._circle, p[0] - this._r, p[1] - this._r);
              }

              var colored = ctx.getImageData(0, 0, this._width, this._height);
              this._colorize(colored.data, this._grad, alpha);
              ctx.putImageData(colored, 0, 0);

              return this;
            },

            _colorize: function (pixels, gradient, alpha) {
              for (var i = 0, len = pixels.length, j; i < len; i += 4) {
                j = pixels[i + 3] * 4;

                if (j) {
                  pixels[i] = gradient[j];
                  pixels[i + 1] = gradient[j + 1];
                  pixels[i + 2] = gradient[j + 2];
                  pixels[i + 3] = pixels[i + 3] * (alpha || 1);
                }
              }
            },

            _createCanvas: function () {
              if (typeof document !== 'undefined') {
                return document.createElement('canvas');
              } else {
                return new this._canvas.constructor();
              }
            }
          };
        </script>
  
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
  redraw = (minOpacity = 0.05, alpha = 1.0) => this.inject(
    `window.requestAnimationFrame(() => window.heat.draw(${minOpacity}, ${alpha}));`,
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
      minOpacity,
      alpha,
    } = this.props;
    this.gradient(gradient);
    this.max(max);
    this.data(data);
    this.redraw(
      minOpacity,
      alpha,
    );
    return onLoadEnd(e);
  };
  getSnapshotBeforeUpdate(prevProps, prevState) {
    const {
      data: prevData,
      gradient: prevGradient,
      max: prevMax,
      minOpacity: prevMinOpacity,
      alpha: prevAlpha,
    } = prevProps;
    const {
      data,
      gradient,
      max,
      minOpacity,
      alpha,
    } = this.props;
    const dataChanged = data !== prevData;
    const gradientChanged = gradient !== prevGradient;
    const maxChanged = max !== prevMax;
    const minOpacityChanged = minOpacity !== prevMinOpacity;
    const alphaChanged = alpha !== prevAlpha;
    if (dataChanged) {
      this.data(data);
    }
    if (gradientChanged) {
      this.gradient(gradient);
    }
    if (maxChanged) {
      this.max(max);
    }
    if (dataChanged || gradientChanged || maxChanged || minOpacityChanged || alphaChanged) {
      this.redraw(
        minOpacity,
        alpha,
      );
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
  minOpacity: PropTypes.number,
  alpha: PropTypes.number,
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
  minOpacity: 0.05,
  alpha: 1.0,
};

export default Heatmap;
