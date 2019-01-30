import React, { Component } from 'react';
import ACRSample from './acr.json';
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import Landing from './Landing.js';
import InteractiveACRModifier from './ModifyACR.js';
import CodeGenerator from './CodeGeneration.js';
import logo from './logo.svg';
import 'semantic-ui-css/semantic.min.css';
import './App.css';
import Package from '../package.json';

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
    this.project = {acr: ACRSample, source: {
      name: "Sample_wireframe.png",
      data: `https://i.imgur.com/z0J73nL.png`
    }};
    this.onRecieveACRHandler = this.onRecieveACRHandler.bind(this);
  }

  // Called when the ACR object has been generated and recieved at the front
  // end. The acr is a JSON object, and so we can store this in cache and
  // move it around the application as needed.
  onRecieveACRHandler({acr, source, history}) {

      // Collect the 'history' prop, and then use that to push the current
      // path onto the browser's history stack once we need to navigate page.

      // Save it to the class instance.
      this.project = {acr, source};

      log(`New project instantiated.`, this.project);

      // Navigate to the ACR modifier module.
      // this.setState({
      //   ...this.state,
      //   navigate: {
      //     to: '/modify-acr',
      //     from: this.state.navigate.current,
      //     current: '/modify-acr'
      //   }});

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
        render={
          () => <InteractiveACRModifier project={this.project}/>
        }
          />

        <Route exact path="/generate-code"
        render={() => <CodeGenerator api={Package.api} project={this.project} /> } />

      </div>
    </Router>);
  }
}

export default App;

// Logging
function log(...msg){
  console.log(`APP |`, ...msg);
}
