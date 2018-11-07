/**
 * Container detecter wrapper which interfaces with the python detection scripts.
 */

// Dependencies.
const NodePyInt = require('./nodePyInt');
var { resolve } = require('path');

// Configuration.
const _DETECT_SCRIPT_PATH = "../../detection/src/shapeDetect.py";

module.exports = async (imagePath) => {

  // Resolve path relative to root dir so that it can be interpreted correctly
  // by the python script.
  // imagePath = resolve(__dirname, imagePath);

  log("Detecting shapes for "+ imagePath);

  // Instantiate the Node-Python-Interface.
  var detectShapes = NodePyInt(
    resolve(__dirname,_DETECT_SCRIPT_PATH),
    ['--image', imagePath], {
      pythonCmd : 'python3'
    });

  // Initialise analysis and return result as a JSON object.
  var output = {};
  var result;

  try {
    result = await detectShapes();
  } catch(e){
    log("Error detecting shapes: ", e);
  }

  try {
    output = JSON.parse(result);
  } catch(e){
    log("Error converting response to json:", result);
  }

  return output;
}

// Utility functions.
function log(...msg){
  if (process.env.DEBUG) console.log(`DETECT CONTAINER | `, ...msg);
}
