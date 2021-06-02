import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

import reducers, { namespace } from './states';

const PLUGIN_NAME = 'FlexLocalizationPlugin';

export default class FlexLocalizationPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    this.registerReducers(manager);
    // This approach works by determining the language the user would like (by Flex worker attributes,
    // or browser setting, in this sample).  Use the method best suited to your use case.
    // The language name/code is used as a file name for an HTTP GET to retrieve a JSON file
    // containing all the strings that Flex uses.  Make copies of the base file for each language
    // you might need.  Have them translated and store them with the original.
  
    // Set a default.
    let myLanguage = "en-US";

    // Could use browser data.
    myLanguage = navigator.language || myLanguage;

    // Or flex data.
    myLanguage = flex.defaultConfiguration.language || myLanguage;

    // Or manager data.  (This can be set in appConfig.js)
    myLanguage = manager.configuration.language || myLanguage;

    // Or manager.workerClient.attributes data.
    myLanguage = manager.workerClient.attributes.language || myLanguage;

    const filePath = "/" + myLanguage + ".json";
    console.log('FLEX_APP_FUNCTIONS_DOMAIN', process.env.FLEX_APP_FUNCTIONS_DOMAIN);
    console.log("filePath", filePath);

    // Keep things synchronous to avoid race conditions

    // First we show an HTTP request to fetch a file.
    // Twilio serverless Services can expose Assets via URL, so
    // for the purpose of this sample we will use that.
    // The Asset MUST be marked "Public" for this to work!!!
    try {
      const request = new XMLHttpRequest();
      request.open('GET', process.env.FLEX_APP_FUNCTIONS_DOMAIN + filePath, false);  // `false` makes the request synchronous
      request.send(null);
  
      if (request.status === 200) {
        const data = JSON.parse(request.responseText);
        manager.strings = { ...manager.strings, ...data };
        console.log("manager.strings.NoTasks", manager.strings.NoTasks);
      } else {
        console.warn("translation file not found");
      }  
    }
    catch(e) {
      console.warn("translation file not found");
    }

    // Could also use a Twilio serverless Service/Function/Assets
    // Call a Function, which then creates or retrieves the translation data.
    // The Asset MUST be marked "Private" for this to work!!!
    try {
      const request = new XMLHttpRequest();
      
      request.open("POST", process.env.FLEX_APP_FUNCTIONS_DOMAIN + "/getStrings", false);
      request.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8");
      const body = { 
        languageRequested: filePath,
        Token: manager.store.getState().flex.session.ssoTokenPayload.token
      };
      request.send(new URLSearchParams(body));
      if(request.status === 200) {
        const data = JSON.parse(request.responseText);
        manager.strings = { ...manager.strings, ...data};
        console.log("manager.strings.NoTasks", manager.strings.NoTasks);
      } else {
        console.warn("translation file not found");
      }
    }
    catch(e) {
      console.warn("translation file not found");
    }

  }


  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(`You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`);
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
