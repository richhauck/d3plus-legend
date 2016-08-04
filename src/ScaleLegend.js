import {constant} from "d3plus-common";
import {max} from "d3-array";
import {select as d3Select} from "d3-selection";
import {transition} from "d3-transition";
import * as scales from "d3-scale";
import {textBox, textWidth, textWrap} from "d3plus-text";

/**
    @class ScaleLegend
    @desc Creates an SVG scale based on an array of data. If *data* is specified, immediately draws based on the specified array and returns this generator. If *data* is not specified on instantiation, it can be passed/updated after instantiation using the [data](#shape.data) method.
*/
export default class ScaleLegend {

  constructor() {

    this._align = "middle";
    this._domain = [0, 10];
    this._duration = 600;
    this._height = 100;
    this.orient("bottom");
    this._outerBounds = {width: 0, height: 0, x: 0, y: 0};
    this._padding = 5;
    this._scale = "linear";
    this._strokeWidth = 1;
    this._textBoxConfig = {
      fontFamily: textBox().fontFamily(),
      fontResize: false,
      fontSize: constant(10)
    };
    this._tickSize = 5;
    this._uuid = new Date().getTime();
    this._width = 400;

  }

  /**
      @memberof ScaleLegend
      @desc Sets positioning for the axis bar.
      @param {D3Selection} *bar*
      @private
  */
  _barPosition(bar) {
    const {height, x, y} = this._position;
    const position = ["top", "left"].includes(this._orient) ? this._outerBounds[y] + this._outerBounds[height] : this._outerBounds[y];
    bar
      .attr(`${x}1`, this._d3Scale(this._d3Scale.domain()[0]))
      .attr(`${x}2`, this._d3Scale(this._d3Scale.domain()[1]))
      .attr(`${y}1`, position)
      .attr(`${y}2`, position);
  }

  /**
      @memberof ScaleLegend
      @desc Sets positioning for the clip rectangle.
      @param {D3Selection} *click*
      @private
  */
  _clipPosition(clip) {
    const {width, height, x, y} = this._position;
    const d = this._d3Scale.domain(),
          p = this._strokeWidth,
          s = this._d3Scale(d[1]) - this._d3Scale(d[0]);
    const position = ["top", "left"].includes(this._orient) ? this._outerBounds[y] + this._outerBounds[height] - this._tickSize : this._outerBounds[y];
    clip
      .attr(x, this._d3Scale(this._d3Scale.domain()[0]) - p)
      .attr(y, position)
      .attr(width, s + p * 2)
      .attr(height, this._tickSize + p);
  }

  /**
      @memberof ScaleLegend
      @desc Sets positioning for the axis ticks.
      @param {D3Selection} *ticks*
      @private
  */
  _tickPosition(ticks, last = false) {
    const {height, x, y} = this._position;
    const position = ["top", "left"].includes(this._orient) ? this._outerBounds[y] + this._outerBounds[height] : this._outerBounds[y],
          scale = last ? this._lastScale || this._d3Scale : this._d3Scale,
          size = ["top", "left"].includes(this._orient) ? -this._tickSize : this._tickSize;
    ticks
      .attr("stroke-width", this._strokeWidth)
      .attr(`${x}1`, d => scale(d.id))
      .attr(`${x}2`, d => scale(d.id))
      .attr(`${y}1`, position)
      .attr(`${y}2`, last ? position : position + size);
  }

  /**
      @memberof ScaleLegend
      @desc Renders the current ScaleLegend to the page. If a *callback* is specified, it will be called once the legend is done drawing.
      @param {Function} [*callback* = undefined]
  */
  render(callback) {

    if (this._select === void 0) this.select(d3Select("body").append("svg").attr("width", `${this._width}px`).attr("height", `${this._height}px`).node());
    if (this._lineHeight === void 0) this._lineHeight = (d, i) => this._textBoxConfig.fontSize(d, i) * 1.1;

    const {width, height, x, y} = this._position;

    const clipId = `d3plus-ShapeLegend-clip-${this._uuid}`,
          p = this._padding,
          t = transition().duration(this._duration);

    let size = this[`_${width}`] - p * 2;

    this._d3Scale = scales[`scale${this._scale.charAt(0).toUpperCase()}${this._scale.slice(1)}`]()
      .domain(this._domain)
      .range([p, p + size]);

    const values = this._ticks || this._d3Scale.ticks();

    let space = 0;
    for (let i = 0; i < values.length; i++) {
      const s = this._d3Scale(values[i + 1]) - this._d3Scale(values[i]);
      if (s > space) space = s;
    }
    space -= p;

    function measureText(d, i) {

      const f = this._textBoxConfig.fontFamily(d, i),
            lh = this._lineHeight(d, i),
            s = this._textBoxConfig.fontSize(d, i);

      const res = textWrap()
        .fontFamily(f)
        .fontSize(s)
        .lineHeight(lh)
        .width(space)
        .height(this._height - this._tickSize - p)
        (d);

      res.width = Math.ceil(max(res.lines.map(t => textWidth(t, {"font-family": f, "font-size": s}))));
      res.height = Math.ceil(res.lines.length * (lh + 1));
      return res;

    }

    const textData = values.map(measureText.bind(this));

    const firstWidth = textData[0][width],
          lastWidth = textData[textData.length - 1][width];

    size -= firstWidth / 2 + lastWidth / 2;
    this._d3Scale.range([p + firstWidth / 2, p + firstWidth / 2 + size]);

    this._outerBounds = {
      [height]: this._tickSize + max(textData, t => t[height]) + p * 2,
      [width]: size,
      [x]: this._d3Scale.range()[0]
    };
    this._outerBounds[y] = this._align === "start" ? this._padding
                         : this._align === "end" ? this[`_${height}`] - this._outerBounds[height]
                         : this[`_${height}`] / 2 - this._outerBounds[height] / 2;

    let group = this._select.selectAll(`g#d3plus-ScaleLegend-${clipId}`)
      .data([0]);

    group = group.enter().append("g")
        .attr("id", `d3plus-ScaleLegend-${clipId}`)
      .merge(group);

    let defs = group.selectAll("defs").data([null]);
    defs = defs.enter().append("defs").merge(defs);

    let clip = defs.selectAll(`clipPath#${clipId}`).data([null]);
    clip = clip.enter().append("clipPath")
        .attr("id", clipId)
      .merge(clip);

    const axisClip = clip.selectAll("rect").data([null]);
    axisClip.enter().append("rect")
      .call(this._clipPosition.bind(this))
      .merge(axisClip).transition(t)
        .call(this._clipPosition.bind(this));

    const bar = group.selectAll("line.bar").data([null]);

    bar.enter().append("line")
        .attr("class", "bar")
        .attr("stroke", "#000")
        .attr("opacity", 0)
        .call(this._barPosition.bind(this))
      .merge(bar).transition(t)
        .attr("opacity", 1)
        .call(this._barPosition.bind(this));

    const valueData = values.map(d => ({id: d}));

    const ticks = group.selectAll("line.tick").data(valueData, d => d.id);

    ticks.exit().transition(t)
      .attr("opacity", 0)
      .call(this._tickPosition.bind(this))
      .remove();

    ticks.enter().append("line")
        .attr("class", "tick")
        .attr("stroke", "#000")
        .attr("opacity", 0)
        .attr("clip-path", `url(#${clipId})`)
        .call(this._tickPosition.bind(this), true)
      .merge(ticks).transition(t)
        .attr("opacity", 1)
        .call(this._tickPosition.bind(this));

    const maxTextHeight = max(textData, t => t.height),
          maxTextWidth = max(textData, (t, i) => t.width + this._textBoxConfig.fontSize(values[i], i));
    textBox()
      .data(valueData)
      .duration(this._duration)
      .height(maxTextHeight)
      .select(group.node())
      .text(d => d.id)
      .textAnchor(this._orient === "left" ? "end" : this._orient === "right" ? "start" : "middle")
      .verticalAlign(this._orient === "bottom" ? "top" : this._orient === "top" ? "bottom" : "middle")
      .width(maxTextWidth)
      .x((d, i) => {
        if (["top", "bottom"].includes(this._orient)) return this._d3Scale(d.id) - maxTextWidth / 2;
        return this._orient === "left" ? this._outerBounds.x - this._textBoxConfig.fontSize(values[i], i) / 2 : this._outerBounds.x + this._tickSize + this._padding;
      })
      .y(d => {
        if (["left", "right"].includes(this._orient)) return this._d3Scale(d.id) - maxTextHeight / 2;
        return ["right", "bottom"].includes(this._orient) ? this._outerBounds.y + this._tickSize + p : this._outerBounds.y;
      })
      .config(this._textBoxConfig)
      ();

    this._lastScale = this._d3Scale;

    if (callback) setTimeout(callback, this._duration + 100);

    return this;

  }

  /**
      @memberof ScaleLegend
      @desc If *value* is specified, sets the horizontal alignment to the specified value and returns this generator. If *value* is not specified, returns the current horizontal alignment.
      @param {String} [*value* = "center"] Supports `"left"` and `"center"` and `"right"`.
  */
  align(_) {
    return arguments.length ? (this._align = _, this) : this._align;
  }

  /**
      @memberof ScaleLegend
      @desc If *value* is specified, sets the methods that correspond to the key/value pairs and returns this generator. If *value* is not specified, returns the current configuration.
      @param {Object} [*value*]
  */
  config(_) {
    if (arguments.length) {
      for (const k in _) if ({}.hasOwnProperty.call(_, k) && k in this) this[k](_[k]);
      return this;
    }
    else {
      const config = {};
      for (const k in this.prototype.constructor) if (k !== "config" && {}.hasOwnProperty.call(this, k)) config[k] = this[k]();
      return config;
    }
  }

  /**
      @memberof ScaleLegend
      @desc If *value* is specified, sets the scale domain of the legend and returns this generator. If *value* is not specified, returns the current scale domain.
      @param {Array} [*value* = [0, 10]]
  */
  domain(_) {
    return arguments.length ? (this._domain = _, this) : this._domain;
  }

  /**
      @memberof ScaleLegend
      @desc If *value* is specified, sets the overall height of the legend and returns this generator. If *value* is not specified, returns the current height value.
      @param {Number} [*value* = 100]
  */
  height(_) {
    return arguments.length ? (this._height = _, this) : this._height;
  }

  /**
      @memberof ScaleLegend
      @desc If *orient* is specified, sets the orientation of the shape and returns this generator. If *orient* is not specified, returns the current orientation.
      @param {String} [*orient* = "bottom"] Supports `"top"`, `"right"`, `"bottom"`, and `"left"` orientations.
  */
  orient(_) {
    if (arguments.length) {
      const horizontal = ["top", "bottom"].includes(_);
      this._position = {
        width: horizontal ? "width" : "height",
        height: horizontal ? "height" : "width",
        x: horizontal ? "x" : "y",
        y: horizontal ? "y" : "x"
      };
      return this._orient = _, this;
    }
    return this._orient;
  }

  /**
      @memberof ScaleLegend
      @desc If called after the elements have been drawn to DOM, will returns the outer bounds of the legend content.
      @example
{"width": 180, "height": 24, "x": 10, "y": 20}
  */
  outerBounds() {
    return this._outerBounds;
  }

  /**
      @memberof ScaleLegend
      @desc If *value* is specified, sets the padding between each key to the specified number and returns this generator. If *value* is not specified, returns the current padding value.
      @param {Number} [*value* = 10]
  */
  padding(_) {
    return arguments.length ? (this._padding = _, this) : this._padding;
  }

  /**
      @memberof ScaleLegend
      @desc If *value* is specified, sets the scale of the legend and returns this generator. If *value* is not specified, returns the current this._d3Scale
      @param {String} [*value* = "linear"]
  */
  scale(_) {
    return arguments.length ? (this._scale = _, this) : this._scale;
  }

  /**
      @memberof ScaleLegend
      @desc If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns this generator. If *selector* is not specified, returns the current SVG container element.
      @param {String|HTMLElement} [*selector* = d3.select("body").append("svg")]
  */
  select(_) {
    return arguments.length ? (this._select = d3Select(_), this) : this._select;
  }

  /**
      @memberof ShapeLegend
      @desc If *config* is specified, sets the methods that correspond to the key/value pairs for each shape and returns this generator. If *config* is not specified, returns the current shape configuration.
      @param {Object} [*config* = {}]
  */
  textBoxConfig(_) {
    return arguments.length ? (this._textBoxConfig = Object.assign(this._textBoxConfig, _), this) : this._textBoxConfig;
  }

  /**
      @memberof ScaleLegend
      @desc If *value* is specified, sets the tick values of the legend and returns this generator. If *value* is not specified, returns the current tick values, which by default are interpreted based on the [domain](#ScaleLegend.domain) and the available [width](#ScaleLegend.width).
      @param {Array} [*value*]
  */
  ticks(_) {
    return arguments.length ? (this._ticks = _, this) : this._ticks;
  }

  /**
      @memberof ScaleLegend
      @desc If *value* is specified, sets the tick size of the legend and returns this generator. If *value* is not specified, returns the current tick size.
      @param {Number} [*value* = 5]
  */
  tickSize(_) {
    return arguments.length ? (this._tickSize = _, this) : this._tickSize;
  }

  /**
      @memberof ScaleLegend
      @desc If *value* is specified, sets the overall width of the legend and returns this generator. If *value* is not specified, returns the current width value.
      @param {Number} [*value* = 400]
  */
  width(_) {
    return arguments.length ? (this._width = _, this) : this._width;
  }

}
