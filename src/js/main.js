import {registerServiceWorker, installPrompt} from "./install"
import run from "./run";

const webScrapper = `https://web--scrapper.herokuapp.com/webscrapper`;
//"warm up" step
if (process.env.NODE_ENV === "production")
    fetch(`${webScrapper}?url=${encodeURIComponent("http://schedule.nvna.free.bg")}`)

run();
registerServiceWorker();
installPrompt();