import dayjs from "dayjs";

const webScrapper = `https://web-harvester.herokuapp.com/`;
export const daysArray = [];

// "before" function: fetch schedule from remote
export async function fetchSchedule() {
    if (!this.params.code) {
        return // redirect to error
    }

    dayjs.extend((await import("dayjs/plugin/isoWeek")).default)

    if (!this.params.date) this.params.date = dayjs().format("YYYY-MM-DD");

    const dayjsDateObj = dayjs(this.params.date, "YYYY-MM-DD");

    const nvnaUrl = `http://nvna.eu/schedule/?group=${this.params.code}&queryType=${this.params.searchingFor}&Week=${dayjsDateObj.isoWeek()}`;
    let url = `${webScrapper}?url=${encodeURIComponent(nvnaUrl)}`;

    let data;
    try {
        const response = await fetch(url);
        data = await response.json();
    } catch (e) {
        window.location.reload()
    }

    if (!this.params.period) this.params.period = "day";

    const { Lesson, LessonWeeks} = await import("../lesson");

    const result = {};
    daysArray.length = 0; // clear old queried data
    switch (this.params.period) {
        case "day":
            result.lessonDay = Lesson.getLessonWeek(data).days
                .find(d => dayjs(d.date, "YYYY-MM-DD").format() === dayjsDateObj.format());
            daysArray
                .push(result.lessonDay);
            break;
        case "week":
            result.lessonWeek = Lesson.getLessonWeek(data);
            result.lessonWeek
                .days
                .forEach(ld => daysArray
                    .push(ld))
            break;
        case "weeks":
            if (!this.params.weeksCount) this.params.weeksCount = 1;

            let urls = [];
            for (let i = 1; i < +this.params.weeksCount; i++) /* begin from 1 because we already have the first week */ {
                const nvnaUrl =
                    `http://nvna.eu/schedule/?group=${this.params.code}&queryType=${this.params.searchingFor}&Week=${dayjsDateObj.isoWeek() + i}`;
                urls.push(fetch(`${webScrapper}?url=${encodeURIComponent(nvnaUrl)}`))
            }

            const dataArr = [
                data,
                ...await Promise.all(urls)
                    .then(async v => await Promise.all(v
                        .map(r => r.json())))
            ];

            result.lessonWeeks = new LessonWeeks(...dataArr.map(d => Lesson.getLessonWeek(d)));
            result.lessonWeeks
                .list
                .forEach(lw => lw
                    .days
                    .forEach(ld => daysArray
                        .push(ld)))
            break;
        default:
            return; //redirect to error
    }

    this.task.done(result);
}

// "on" function: render fetched data to client
export async function showSchedule() {
    let schedule = "";
    if (this.event.previousResult.lessonDay) {
        const dayTemplate = require("../../templates/lesson/day.hbs");
        schedule += dayTemplate(this.event.previousResult.lessonDay);
    } else if (this.event.previousResult.lessonWeek) {
        const weekTemplate = require("../../templates/lesson/week.hbs");
        schedule += weekTemplate(this.event.previousResult.lessonWeek)
    } else if (this.event.previousResult.lessonWeeks) {
        const weeksTemplate = require("../../templates/lesson/weeks.hbs");
        schedule += weeksTemplate(this.event.previousResult.lessonWeeks)
    }

    this.content.innerHTML +=
        `<div class="container">
                <div class="row justify-content-center">
                    <div class="col"/>
                    <div class="col-auto">
                        ${schedule}
                    </div>
                    <div class="col"/>
                </div>
            </div>`


    const downloadBtnTemplate = require("../../templates/downloadBtn.hbs");
    this.content.innerHTML += downloadBtnTemplate({});

    return async function () {
        [...document.querySelectorAll(".subject")]
            .forEach(s => s.addEventListener("click", (e) => {
                    if (!e.target) return;
                    let subject = e.target;
                    if (e.target.tagName === "SMALL" || e.target.tagName === "H6") subject = e.target.parentNode;
                    if (!subject.classList.contains("subject")) return;
                    [...subject.children]
                        .pop()
                        .classList
                        .toggle("d-none");
                }
            ));

        // Download handler
        document.getElementById("download-btn")
            .addEventListener("click", () => {
                const date = document.getElementById("date").value;
                let tsvContent = daysArray.map(d => d.serialize("tsv")).join("\n").trim()
                let filename = prompt('Въведи име на файл', date);
                if (filename === null) return;
                filename = (filename || date) + ".tsv";
                let file = new Blob([tsvContent], {type: "data:application/octet-stream"});
                if (window.navigator.msSaveOrOpenBlob) // IE10+
                    window.navigator.msSaveOrOpenBlob(file, filename);
                else { // Others
                    let a = document.createElement("a"),
                        url = URL.createObjectURL(file);
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(function () {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                    }, 0);
                }
            })
    }
}
