import {Router} from "hash-router";
import {applyCommonThen} from "./common";
import {fetchSchedule, showSchedule} from "./schedule";
import {showAdvancedUsage} from "./advancedUsage";
import {showLecturerCodes, showTimetable} from "./more";

function registerPaths() {
    [
        {
            path: "#/",
            on: applyCommonThen(() => {
            })
        },
        {
            path: "#/:searchingFor/:code", // no period so day is assumed
            before: fetchSchedule,
            on: applyCommonThen(showSchedule)
        },
        {
            path: "#/:searchingFor/:code/:period", // no date so current date is assumed, options for period = [ "day", "week", "weeks" ]
            before: fetchSchedule,
            on: applyCommonThen(showSchedule)
        },
        {
            path: "#/:searchingFor/:code/:period/:date",
            before: fetchSchedule,
            on: applyCommonThen(showSchedule)
        },
        {
            path: "#/:searchingFor/:code/:period/:date/:weeksCount", // if period is "weeks" then weekCount should be the count (1 is assumed default)
            before: fetchSchedule,
            on: applyCommonThen(showSchedule)
        },
        {
            path: "#/advanced-usage",
            on: applyCommonThen(showAdvancedUsage)
        },
        {
            path: "#/timetable",
            on: applyCommonThen(showTimetable)
        },
        {
            path: "#/lecturers-codes",
            on: applyCommonThen(showLecturerCodes)
        }
    ]
        .forEach(r => Router.add(r));
}

export default function run() {
    registerPaths();
    Router.init();
}