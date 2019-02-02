/**
 * REST API for generating ACR and source codes using CRIMSON.
 *
 * @ Aaron Baw 2018
 */

// Dependencies.
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mkdir = require('mkdirp').sync;
const { exec, spawn } = require('child_process');
const package = require('./package.json');
const endpointPrefix = `/api/v${package['api-version']}`;
const multer = require('multer');
const { resolve, basename, extname, join } = require('path');
const upload = multer({
  dest: resolve(__dirname, "./.uploads"),
  preservePath: true,
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './.uploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + extname(file.originalname))
    }
  })
});
const crimson = require('crimson-inference');
const config = require('crimson-inference/config/config.json');

// Keep track of running processes, ensuring to kill them once used.
var runningProcesses = {};
const getAvailablePort = (projectName) => {
  var portNum = 3500 + Object.keys(runningProcesses).length;
  return portNum;
}

// Defaults.
const _DEFAULT_OUTPUT_DIR = resolve(__dirname, './.generated');

app.use(bodyParser.json());

// Register GET point to fetch list of supported primitives.
app.get(`${endpointPrefix}/getSupportedPrimitives`, (req, res, params) => {

  return res.json(config.supportedPrimitives);

});

// Register a POST endpoint for generating the ACR.
app.post(`${endpointPrefix}/generateACR`, upload.single('wireframe'), async (req, res, params) => {

  if (!req.file) return res.json({success: false, error: "No file provided."});

  // req.file['wireframe'].path contains path to the uploaded image wireframe.
  // req.body contains the other text fields which may be included.
  var imgPath = req.file.path;

  try {
    // Generate the ACR.
    var acr = await crimson.generateACR(resolve(__dirname, imgPath));
  } catch(e){
    res.json({success: false, error: e});
  }
  // Send ACR as response.
  res.json({acr, file: req.file});
});

// Register POST endpoint to generate code from ACR representation.
// Given an image and/or ACR representation, generates the source codes
// the given options, and returns a zip file with the generated project,
// as well as a live URL with the generated page, if desired.
app.post(`${endpointPrefix}/generateCode`, upload.single('wireframe'), async (req, res, params) => {

  // log(`Recieved request to generate code with body:`, req.body);

  // If an image is passed to the request, it will be stored under the
  // req.file field.
  // If no ACR is passed, then we generate it from the image passed.
  if (req.file && !req.body.acr){
    try {
      req.body.acr = await crimson.generateACR(resolve(__dirname, req.file.path));
    }catch(e){
      return res.json({success: false, error: e});
    }
  } else if (req.body.acr) req.body.acr = JSON.parse(req.body.acr);

  if (!req.body.acr) return res.json({success: false, error: "No ACR or image file passed."});
  if (!req.body.fileName && !req.file) return res.json({success: false, error: "'fileName' field must be passed with ACR object."});

  var fileName = req.body.fileName ? req.body.fileName : basename(req.file.originalname).split('.')[0];
  log(`Generating code for`, fileName);
  log(`Image Path for`, fileName, `:`, req.body.imgPath);

  // Generate the codes and return the output directory.
  var outputDir = await crimson.generateCode(req.body.acr, {
    fileName: fileName,
    context: req.body.context,
    file: req.file ? req.file.originalname : null,
    imgPath: req.body.imgPath ? req.body.imgPath : (req.file ? req.file.path : null),
    outputDir: function(){
      var projectDir = _DEFAULT_OUTPUT_DIR + '/' + fileName;
      mkdir(projectDir);
      return projectDir;
    }(),

    // Other params should include the context, project type
    // and output directory.
    ...req.body
  });

  log(`Output directory for generated code`, outputDir);

  // Launch a live webserver if the param has been passed.
  if (req.body.livePreview){
    // var projectApp = require(join(outputDir, 'app.js'));
    // projectApp.listen(app.get('port'), () => {
    //   log(fileName, `has been deployed and running on`, `http://localhost:${projectApp.get('port')}`);
    //   return res.json({
    //     url: `http://localhost:${projectApp.get('port')}`
    //   });
    // });

    var childServer = spawn(`node`, [join(outputDir, 'app.js'), getAvailablePort(fileName)]);
    runningProcesses[fileName] = childServer;

    log(`Generated live preview. Waiting for url.`);

    childServer.stdout.on('data', data => {
      data = data.toString();
      log(`[${fileName} : Server]`, data);
      if (data.match(/http\S+/g)) return res.json({
        url: data.match(/http\S+/g)[0]
      });
    });
  }

  // Launch a live webserver if the param has passed.
  // if (req.body.livePreview){
  //   var parcelBundelerProc = spawn('node_modules/parcel-bundler/bin/cli.js', [
  //     resolve(outputDir, 'index.html'),
  //     '-d',
  //     resolve(outputDir, 'dist')
  //   ]);
  //
  //   runningProcesses[fileName] = parcelBundelerProc;
  //
  //   log(`Generated live preview. Waiting for parcel-bundler to return live preview url.`);
  //
  //   parcelBundelerProc.stdout.on('data', data => {
  //     data = data.toString();
  //     log(`[Parcel Bundler]`, data);
  //     if (data.match(/http\S+/g)) return res.json({
  //       url: data.match(/http\S+/g)[0]
  //     });
  //   });
  //
  //   // Legacy URL.
  //   // return res.json({
  //   //   url: `http://localhost:1234`
  //   // });
  // }

  // Return zipped file.
  else if (req.body.zip){
    log(`Generated zip file. Sending download from`, outputDir);
    return res.download(`${outputDir}/${fileName}.zip`);
  }

});


app.listen(process.env.PORT ? process.env.PORT : 3715, () => log(`Listening on`,
process.env.PORT ? process.env.PORT : 3715));

// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
