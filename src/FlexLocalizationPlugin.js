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
    // or browser setting, in this sample.  Use the method best suited to your use case.
    // The language name/code is used as a file name for an HTTP get to retrieve a JSON file
    // containing all the strings that Flex uses.  Make copies of the base file for each language
    // you might need.  Have them translated and store them with the original.
    //
    // If manager.workerClient.attributes.language evaluates, can use it to pick up some strings.
    // THEN manager.strings should get replaced/updated/enhanced (use the ... operator!)

    // const myLanguage = manager.workerClient.attributes.language;
    // To test, manually set myLanguage = "fr-CA";
    // Better, go to Twilio Console, TaskRouter->WorkSpaces->(your workspace)->Workers,
    // pick a worker, and add "language":"fr-CA" to the attributes.
    // Or use browser settings.
    // const myLanguage = navigator.language;
    // Or manager data.
    // const myLanguage = manager.configuration.language
    // Or flex data.
    // const myLanguage = flex.defaultConfiguration.language
    // What can I do with flex.languages ??

    const myLanguage = "fr-CA";

    const filePath = "/" + myLanguage + ".json";
    console.log("filePath", filePath);

    /*  async is problematic with race conditions 
        - "init" finishes before manager.strings updates using this code
    fetch(filePath)
      .then(response => response.json())
      .then(data => {
      const newStrings = { ...manager.strings, ...data};
      manager.strings = newStrings;
      console.log("manager.strings.NoTasks", manager.strings.NoTasks);
      console.log(data);
    });
    */

    /*  sync call to http server
    var request = new XMLHttpRequest();
    request.open('GET', filePath, false);  // `false` makes the request synchronous
    request.send(null);

    if (request.status === 200) {
      const data = JSON.parse(request.responseText);
      manager.strings = { ...manager.strings, ...data ;
      console.log("manager.strings.NoTasks", manager.strings.NoTasks);
    } else {
      console.warn("translation file not found");
    }
    */

    // Could also use a Twilio serverless Service/Function/Assets
    // Still sync mode!
    const request = new XMLHttpRequest();
    
    request.open("POST", process.env.FLEX_PLUGIN_FUNCTIONS_DOMAIN + "/getStrings", false);
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
