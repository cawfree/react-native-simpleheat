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

            data: function (data, region) {
              this._data = data;
              this._region = region;
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

                var x = p[0]; // longitude
                var y = p[1]; // latitude
                
                // TODO: This an over-simplification.
                if (this._region) {
                  
                  var minLng = this._region.longitude - (this._region.longitudeDelta * 0.5);
                  var minLat = this._region.latitude - (this._region.latitudeDelta * 0.5);
                  
                  var xPx = this._width / this._region.longitudeDelta;
                  var yPx = this._height / this._region.latitudeDelta;

                  x = (x - minLng) * xPx;
                  y = (y - minLat) * yPx;
                  
                }

                ctx.drawImage(this._circle, x - this._r, y - this._r);
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
  data = (data = [], region = null) => this.inject(
    `window.heat.data(${JSON.stringify(data)}, ${JSON.stringify(region)});`,
  );
  max = max => this.inject(
    `window.heat.max(${max});`,
  );
  draw = (minOpacity = 0.05, alpha = 1.0) => this.inject(
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
      region,
    } = this.props;
    this.gradient(gradient);
    this.max(max);
    this.data(
      data,
      region,
    );
    this.draw(
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
      region: prevRegion,
    } = prevProps;
    const {
      data,
      gradient,
      max,
      minOpacity,
      alpha,
      region,
    } = this.props;
    const dataChanged = data !== prevData;
    const gradientChanged = gradient !== prevGradient;
    const maxChanged = max !== prevMax;
    const minOpacityChanged = minOpacity !== prevMinOpacity;
    const alphaChanged = alpha !== prevAlpha;
    const regionChanged = region !== prevRegion;
    if (dataChanged || regionChanged) {
      this.data(
        data,
        region,
      );
    }
    if (gradientChanged) {
      this.gradient(gradient);
    }
    if (maxChanged) {
      this.max(max);
    }
    if (dataChanged || gradientChanged || maxChanged || minOpacityChanged || alphaChanged || regionChanged) {
      this.draw(
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
  region: PropTypes.shape({}),
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
  region: null,
};

export default Heatmap;
