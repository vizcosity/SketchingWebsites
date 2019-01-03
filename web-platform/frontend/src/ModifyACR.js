/**
 * Module handling functionality allowing users to tweak and modify the
 * abstract component representation generated for a source wireframe
 * passed.
 *
 * @ Aaron Baw 2018
 */

import React, { Component } from 'react';
import ResizeDetector from 'react-resize-detector';
import Reactable from 'reactablejs';
import InteractWrapper from 'react-interactjs-wrapper';
import interact from 'interactjs';

// TODO: Refactor geometric methods to ./geometry.js.

// Converts absolute distances into relative values so that proportions
// are maintained as we resize the window.
function getRelativeDistance(parent, shape){

  if (typeof parent.meta.absoluteWidth == "string"){
    parent.meta.absoluteWidth = 1;
    parent.meta.absoluteHeight = 1;
  }

  const [ox, oy] = getUpperLeftmostVertex(shape.meta.vertices);
  const [px, py] = getUpperLeftmostVertex(parent.meta.vertices);

  const absX = ox - px;
  const absY = oy - py;

  // Distance as a proportion of the parent's width and height.
  const left = (absX / parent.meta.absoluteWidth) * 100;
  const top = (absY / parent.meta.absoluteHeight) * 100;

  // console.log("Parent", parent.id, px, py);
  // console.log('Shape', shape.id, ox, oy);
  // console.log(absX, absY, left, top);

  return {left, top};

}

// Given an ACR object and a change in x, y, translates the object.
function moveACRObject(primitive, dx, dy){
  // Move all of the vertices & the midpoint.
  primitive.meta.vertices = primitive.meta.vertices.map(([x, y]) => [x+dx, y+dy]);
  primitive.meta.midpoint[0] += dx;
  primitive.meta.midpoint[1] += dy;

  // Move all containing primitives by the same amount, recursively.
  if (primitive.contains && primitive.contains.length > 0)
    primitive.contains.forEach(innerPrimitive => moveACRObject(innerPrimitive, dx, dy));

}

// Grabs the upperleftmost vertex.
function getUpperLeftmostVertex(vertices){
  return vertices.sort(([x1, y1], [x2, y2]) => x1 > x2 ? 1 : -1).sort(([x1, y1], [x2, y2]) => x1 > x2 ? 1 : -1)[0]
}

const BoundingBoxComponent = ({shape, parent, level, contains, getRef, children}) => {

var meta = shape.meta;

var {left, top} = getRelativeDistance(parent, shape);

return (<div
ref={getRef}
className="bounding-box"
data-x={left}
data-y={top}
data-height={meta.relativeHeight}
data-width={meta.relativeWidth}
data-id={shape.id}
style={{
  height: `${meta.relativeHeight}`,
  width: `${meta.relativeWidth}`,
  top: `${top}${parent ? '%' : 'px'}`,
  left: `${left}${parent ? '%' : 'px'}`,
  // transform: `translateX(${meta.vertices[0][0]}px) translateY(${meta.vertices[0][1]}px)`
}}>
{children}
</div>)}
const BoundingBox = Reactable(BoundingBoxComponent);

class Toolbar extends Component {
  render(){
    return;
  }
}

class InteractiveACRModifier extends Component {

  constructor(props, context){
    super(props, context);
    this.imageRef = React.createRef();
    this.state = {
      canvasWidth: '100%',
      canvasHeight: '100%'
    };
    this.onResize = this.onResize.bind(this);
  }

  onResize(x, y){
    this.setState({
      canvasWidth: this.imageRef.width,
      canvasHeight: this.imageRef.height
    });

  }

  movePrimitive(primitive, {dx, dy, width, height}){

    moveACRObject(primitive, dx, dy);
    // Force a redraw.
    this.setState(this.state);
  }

  drawPrimitives(acr, parent = {
    meta: {
      absoluteWidth: this.state.canvasWidth,
      absoluteHeight: this.state.canvasHeight,
      vertices: [[0,0]]
    },
    id: "canvas"
  }){

    if (!acr || acr.length === 0) return "";

    // We keep the acr object as a prop so that we do not have to call
    // setState when moving the primitive, as we would not be able to do
    // so by using a reference to some shape object.
    return acr.map((primitive, i) =>
      primitive.draw ? <BoundingBox
      parent={parent}
      shape={primitive}
      children={this.drawPrimitives(primitive.contains, primitive)}
      key={i}
      draggable
      onDragMove={({dx, dy}) => this.movePrimitive(primitive, {dx, dy, width:0, height:0})}
      {...primitive} /> : "")

  }

  render(){
    return (
      <div className="acr-mod-container">

        <div className="acr-image-container">

          <ResizeDetector handleWidth handleHeight onResize={this.onResize}>

          <div style={{
            width: this.state.canvasWidth,
            height: this.state.canvasHeight,
            position: 'absolute'
          }} className="acr-object-canvas">
          {
            /* Draw ACR Bounding boxes */
            this.drawPrimitives(this.props.project.acr)
          }

          </div>

          <img ref={ref => this.imageRef = ref} style={{
            width: '80%',
            height: 'auto'
          }}
          src={this.props.project.source.url} />

          </ResizeDetector>
        </div>

        <div style={{
          margin: '20px'
        }} className="acr-header-container">
          <h1>Editing {this.props.project.source.name}</h1>
          <p>
            Adjust the bounding boxes and shape primitive classification type
            before continuing.
          </p>
          </div>

      </div>
    );
  }

}

export default InteractiveACRModifier;
