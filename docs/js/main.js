document.body.onload = (async function () {
    const webScrapper = `https://web--scrapper.herokuapp.com/webscrapper`;

    //"warm up" step
    fetch(`${webScrapper}?url=${encodeURIComponent("http://schedule.nvna.free.bg")}`)

    const daysArray = []; // LessonDay[]
    const content = document.getElementById("content");

    // Async call to all common templates
    const [headerTemplateContent, footerTemplateContent, errorNotificationTemplateContent] =
        await Promise
            .all([
                fetch("./templates/header.hbs"),
                fetch("./templates/footer.hbs"),
                fetch("./templates/errorNotification.hbs")
            ])
            .then(async v => await Promise.all(v.map(r => r.text())));

    Handlebars.registerPartial("errorNotification", errorNotificationTemplateContent);

    // Compile common templates
    const headerTemplate = Handlebars.compile(headerTemplateContent);
    const footerTemplate = Handlebars.compile(footerTemplateContent);

    /**
     * Delegate/action to apply header, footer, attach events and etc...
     * @param   {Function}    func   normal "on" function which can return delegate/action
     * to be executed after rendering. *Note: returned function should not render new content*
     */
    function applyCommonThen(func) {
        return async function () {
            content.innerHTML = ""
            await showHeader.call(this);
            // Action for additional post operations
            const postLoadAction = await func.call(this);
            await showFooter.call(this);
            await postLoadActions.call(this, postLoadAction);
        }
    }

    ////////////////////
    // apply header and footer region

    async function showHeader() {
        content.innerHTML += headerTemplate({});
    }

    async function showFooter() {
        content.innerHTML += footerTemplate({});
    }

    // apply header and footer endregion
    ////////////////////

    // attaching events to header and footer and filling input fields if has queried data
    async function postLoadActions(postLoadAction) {
        flatpickr(document.getElementById("date"), {
            dateFormat: "Y-m-d",
            defaultDate: !!this.params.date ? this.params.date.format("YYYY-MM-DD") : "today",
            altFormat: "D, d M Y",
            altInput: true,
            disableMobile: true
        });

        document.getElementById("code").value = this.params.code || "";
        document.getElementById("searching-for").value = this.params.searchingFor || "group";
        document.getElementById("period").value = this.params.period || "day";

        if (!!this.params.weeksCount) {
            document.getElementById("weeks-count").value = this.params.weeksCount;
            document.getElementById("weeks-count").hidden = false;
        }

        // Form submit handler
        document.getElementById("submit-btn")
            .addEventListener("click", () => {
                const query = {
                    searchingFor: document.getElementById("searching-for"),
                    code: document.getElementById("code"),
                    period: document.getElementById("period"),
                    date: document.getElementById("date"),
                    weeksCount: document.getElementById("weeks-count")
                }

                if (!query.code.value) {
                    showError("Няма въведен код");
                    return;
                }

                if (!query.period.value) query.period.value = "day";
                if (!query.date.value) query.date.value = moment().format("YYYY-MM-DD");

                let hash = "";
                switch (query.period.value) {
                    case "day":
                    case "week":
                        hash = `#/${query.searchingFor.value}/${query.code.value}/${query.period.value}/${query.date.value}`;
                        break;
                    case "weeks":
                        hash = `#/${query.searchingFor.value}/${query.code.value}/${query.period.value}/${query.date.value}/${query.weeksCount.value}`;
                        break;
                }

                if (window.location.hash !== hash) {
                    document.getElementById("submit-btn").disabled = true;
                    document.getElementById("submit-btn").value = "Зарежда се..."
                }

                Router.navigate(hash);
            })

        // Period weeks handler
        document.getElementById("period")
            .addEventListener("change", (e) => {
                if (!e.target) return;
                document.getElementById("weeks-count").hidden =
                    document.getElementById("period").value !== "weeks"
            })

        // Show advanced usage handler
        document.getElementById("advanced-usage-btn")
            .addEventListener("click", () => Router.navigate("#/advanced-usage"))

        if (!!postLoadAction)
            postLoadAction.call(this)
    }

    // "before" function: fetch schedule from remote
    async function fetchSchedule() {
        if (!this.params.code) {
            return // redirect to error
        }

        if (!this.params.date) this.params.date = moment().format("YYYY-MM-DD")

        this.params.date = moment(this.params.date, "YYYY-MM-DD")

        const nvnaUrl = `http://nvna.eu/schedule/?group=${this.params.code}&queryType=${this.params.searchingFor}&Week=${this.params.date.week()}`;
        let url = `${webScrapper}?url=${encodeURIComponent(nvnaUrl)}`;

        if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
            url = '../testData.json';

        const data = await fetch(url)
            .then(r => r.json());

        if (!this.params.period) this.params.period = "day";

        const result = {};
        daysArray.length = 0; // clear old queried data
        switch (this.params.period) {
            case "day":
                result.lessonDay = Lesson.getLessonWeek(data).days
                    .find(d => moment(d.date, "YYYY-MM-DD").format() === this.params.date.format());
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
                        `http://nvna.eu/schedule/?group=${this.params.code}&queryType=${this.params.searchingFor}&Week=${this.params.date.week() + i}`;
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
    async function showSchedule() {
        const [lessonTemplateContent, dayTemplateContent, weekTemplateContent, weeksTemplateContent] =
            await Promise
                .all([
                    fetch("./templates/lesson.hbs"),
                    fetch("./templates/day.hbs"),
                    fetch("./templates/week.hbs"),
                    fetch("./templates/weeks.hbs")
                ])
                .then(async v => await Promise.all(v.map(r => r.text())));

        Handlebars.registerPartial("lesson", lessonTemplateContent);
        Handlebars.registerPartial("day", dayTemplateContent);
        Handlebars.registerPartial("week", weekTemplateContent);
        Handlebars.registerPartial("weeks", weeksTemplateContent);

        if (this.event.previousResult.lessonDay) {
            const dayTemplate = Handlebars.compile(dayTemplateContent);
            content.innerHTML += dayTemplate(this.event.previousResult.lessonDay);
        } else if (this.event.previousResult.lessonWeek) {
            const weekTemplate = Handlebars.compile(weekTemplateContent);
            content.innerHTML += weekTemplate(this.event.previousResult.lessonWeek)
        } else if (this.event.previousResult.lessonWeeks) {
            const weeksTemplate = Handlebars.compile(weeksTemplateContent);
            content.innerHTML += weeksTemplate(this.event.previousResult.lessonWeeks)
        }

        const downloadBtnTemplate = Handlebars.compile(await fetch("./templates/downloadBtn.hbs")
            .then(r => r.text()));
        content.innerHTML += downloadBtnTemplate({});

        return async function () {
            [...document.querySelectorAll(".subject")]
                .forEach(s => s.addEventListener("click", (e) => {
                        if (!e.target) return;
                        let subject = e.target;
                        if (e.target.tagName === "SMALL" || e.target.tagName === "H6") subject = e.target.parentNode;
                        if (!subject.classList.contains("subject")) return;
                        [...subject.children].pop().classList.toggle("d-none");
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

    function showError(content) {
        document.getElementById("error-info-box").classList.remove("d-none")
        document.getElementById("error-info-box").textContent = content;
        const hideError = () => document.getElementById("error-info-box").classList.add("d-none")
        const hideErrorTimeoutFn = setTimeout(hideError, 3000);
        document.getElementById("error-info-box")
            .addEventListener("click", function hideErrorHandler() {
                document.getElementById("error-info-box").removeEventListener("click", hideErrorHandler);
                clearTimeout(hideErrorTimeoutFn);
                hideError();
            })
    }

    async function showAdvancedUsage() {
        content.innerHTML = "";
        const url = window.location.href.split("#")[0] + "#/";
        const advancedUsageInstructionsContent = await fetch("./templates/advancedUsageInstructions.hbs")
            .then(r => r.text());
        const advancedUsageInstructionsTemplate = Handlebars.compile(advancedUsageInstructionsContent);
        content.innerHTML += advancedUsageInstructionsTemplate({location: url});

        const searchingFor = {};
        [searchingFor.day, searchingFor.week] = [...document.getElementsByTagName("select")]
        const code = {};
        [code.day, code.week] = [...document.querySelectorAll(`input[id^="code-for-"]`)];
        const copyLinkBtn = {};
        [copyLinkBtn.day, copyLinkBtn.week] = [...document.getElementsByTagName("button")];

        Object.entries(copyLinkBtn)
            .forEach(([k, v]) => v.addEventListener("click", copyLinkFor(k)))

        function copyLinkFor(period) {
            return async (e) => {
                if (!code[period].value) {
                    showError("Няма въведен код!");
                    return;
                }
                const link = `${url}${searchingFor[period].value}/${code[period].value}/${period}`
                try {
                    await navigator.clipboard.writeText(link);
                    const originalText = copyLinkBtn[period].textContent;
                    copyLinkBtn[period].textContent = "Копиран!";
                    copyLinkBtn[period].disabled = true;

                    setTimeout(() => {
                        copyLinkBtn[period].textContent = originalText;
                        copyLinkBtn[period].disabled = false;
                    }, 1000)
                } catch (_) {
                    document.getElementById(`fallback-copy-input-area-${period}`).value = link;
                    document.getElementById(`fallback-copy-input-area-${period}`).hidden = false;
                    document.getElementById(`fallback-copy-input-area-${period}`).select()
                }
            }
        }

        document.getElementById("back-btn")
            .addEventListener("click", () => Router.navigate("#/"));
    }

    //////////////////////
    // Register paths
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
            on: showAdvancedUsage
        }
    ]
        .forEach(r => Router.add(r));

    Router.init();
})
