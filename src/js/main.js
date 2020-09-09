import {registerServiceWorker, installPrompt} from "./install"
import run from "./run";

//Warm-up step for heroku hibernation...
fetch(`https://web-harvester.herokuapp.com/?url=${encodeURIComponent("http://blank.org")}`)

run();
registerServiceWorker();
installPrompt();
