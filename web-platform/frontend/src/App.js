import React, { Component } from 'react';
import ACRSample from './assets/acr/acr_sample_full.json';
import { ACRObject } from 'crimson-inference/modules/ACR.js';
import { BrowserRouter as Router, Route } from "react-router-dom";
import query from 'query-string';
import Landing from './Landing.js';
import InteractiveACRModifier from './ModifyACR';
import CodeGenerator from './CodeGeneration.js';
// import Experiments from './Experiments.js';
// import logo from './logo.svg';
import 'semantic-ui-css/semantic.min.css';
import './Resets.css';
import './App.css';
import './Styles/Palette.css';
import Package from '../package.json';
// import { basename } from 'path';

// import EditDialogue from './CustomisePrimitive';
// import { CloseIcon } from './Icons';

// Assets.
import ModifyACRPlaceholderImageSrc from './assets/modify-acr-placeholder-image.png';

class App extends Component {

  constructor(props, context){
    super(props, context);
    this.state = {
      navigate: {
        to: null,
        from: null,
        current: '/'
      }
    };

    // If no project is instantiated, use the default placeholder project + image
    // for debugging purposes.
    this.project = {
      acr: ACRObject.fromJSON(ACRSample), 
      source: {
        name: "Sample_wireframe.png",
        data: ModifyACRPlaceholderImageSrc
      }};
    this.onRecieveACRHandler = this.onRecieveACRHandler.bind(this);
  }

  // Called when the ACR object has been generated and recieved at the front
  // end. The acr is a JSON object, and so we can store this in cache and
  // move it around the application as needed.
  onRecieveACRHandler({acr, source, history}) {

      // Collect the 'history' prop, and then use that to push the current
      // path onto the browser's history stack once we need to navigate page.

      // Convert JSON objects into class instances of the ACR Object.
      acr = ACRObject.fromJSON(acr);

      // Save it to the class instance.
      this.project = {acr, source};

      // Remove extension from projectname.
      this.project.source.name = this.project.source.name.split('.')[0];

      log(`New project instantiated.`, this.project); 

      history.push('/modify-acr');
  }

  render() {
    return (
      <Router>

      <div className="routes-container" >

      {/* Navigate to other pages throughout the app. */}
      {/*this.state.navigate.to ? <Redirect from={this.state.navigate.from} to={this.state.navigate.to} /> : "" */}

        <Route exact path="/" component={
          ({history}) => <Landing
          api={Package.api}
          onRecieveACR={({acr, source}) => this.onRecieveACRHandler({acr, source, history})}

          />
        } />
        <Route exact path="/modify-acr"
        component={
          ({history, location}) => 
          <InteractiveACRModifier 
            history={history} 
            project={this.project}
            debugMode={query.parse(location.search)['debugMode']}
          />

        }
          />
        <Route exact path="/generate-code" component={
          ({history, location}) => <CodeGenerator
            history={history}
            api={Package.api}
            project={this.project}
            sessionID={query.parse(location.search)['sessionID']}
            code={query.parse(location.search)['code']}
          />
        } />
      {
        // <Route exact path="experiments">
        //   <Experiments />
        // </Route>
      }
      </div>

    </Router>);
  }
}

export default App;

// Logging
function log(...msg){
  console.log(`APP |`, ...msg);
}
