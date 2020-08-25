(async function () {
    const webScrapper = `https://web--scrapper.herokuapp.com/webscrapper`;
    const daysArray = []; // LessonDay[]

    // Async call to all common templates
    const [headerTemplateContent, footerTemplateContent] =
        await Promise
            .all([
                fetch("./templates/header.hbs"),
                fetch("./templates/footer.hbs")
            ])
            .then(async v => await Promise.all(v.map(r => r.text())));

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
        flatpickr(date, {});
        date.value = moment().format("YYYY-MM-DD")

        submitBtn.addEventListener("click", () => {
            const query = {
                searchingFor,
                code,
                date,
                period,
                weeksCount
            }

            if (!query.date.value) query.date.value = moment().format("YYYY-MM-DD");
            if (!query.period.value) query.period.value = "day";

            let url = "";
            switch (query.period.value) {
                case "day":
                case "week":
                    url = `#/${query.searchingFor.value}/${query.code.value}/${query.date.value}/${query.period.value}`;
                    break;
                case "weeks":
                    url = `#/${query.searchingFor.value}/${query.code.value}/${query.date.value}/${query.period.value}/${query.weeksCount.value}`;
                    break;
            }
            Router.navigate(url);
        })

        if (!!postLoadAction)
            postLoadAction.call(this)
    }

    // "before" function: fetch schedule from remote
    async function fetchSchedule() {
        if (!this.params.code) {
            return // redirect to error
        }

        if (!this.params.date) this.params.date = moment()
        else this.params.date = moment(this.params.date, "YYYY-MM-DD")

        const nvnaUrl = `http://nvna.eu/schedule/?group=${this.params.code}&queryType=${this.params.searchingFor}&Week=${this.params.date.week()}`;
        let url = `${webScrapper}?url=${encodeURIComponent(nvnaUrl)}`;

        if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
            url = '../testData.json';

        const request = fetch(url);
        const response = await request;
        const data = await response.json();

        if (!this.params.period) this.params.period = "day";

        let result = {};
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

            downloadBtn.addEventListener("click", () => {
                let tsvContent = daysArray.map(d => d.serialize("tsv")).join("\n")
                let filename = (prompt('Въведи име на файл', date.value) || date.value) + ".tsv";
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

    //////////////////////
    // Register paths
    [
        {
            path: "#/",
            on: applyCommonThen(() => {
            })
        },
        {
            path: "#/:searchingFor/:code", // no date so current day is assumed
            before: fetchSchedule,
            on: applyCommonThen(showSchedule)
        },
        {
            path: "#/:searchingFor/:code/:date", // default period is day
            before: fetchSchedule,
            on: applyCommonThen(showSchedule)
        },
        {
            path: "#/:searchingFor/:code/:date/:period", // options for period = [ "day", "week", "weeks" ]
            before: fetchSchedule,
            on: applyCommonThen(showSchedule)
        },
        {
            path: "#/:searchingFor/:code/:date/:period/:weeksCount", // if period is "weeks" then weekCount should be the number (1 is assumed default)
            before: fetchSchedule,
            on: applyCommonThen(showSchedule)
        }
    ]
        .forEach(Router.add);

    Router.init();

    async function main() {
        const submitBtn = document.getElementById('submit-btn');
        const [codeFromInput, dateFromInput] = document.getElementsByTagName('input');
        const searchingFor = document.getElementById("searching-for");
        const contentDiv = document.getElementById('content');
        const periodOption = document.getElementById('period');
        const periodNumberElement = document.getElementById("period");
        const downloadBtn = document.getElementById('download-btn');

        flatpickr(dateFromInput, {});
        dateFromInput.value = moment().format("YYYY-MM-DD")

        const weekTemplateResponse = await fetch('./templates/week.hbs');
        const weekTemplateContent = await weekTemplateResponse.text();
        let weekTemplate = Handlebars.compile(weekTemplateContent);

        submitBtn.addEventListener('click', submitHandler);
        periodOption.addEventListener('change', changePeriodHandler);


        downloadBtn.addEventListener('click', downloadBtnHandler);

        async function submitHandler(e) {
            e.preventDefault();
            if (!codeFromInput.value) {
                alert("Няма посочен код на класно/преподавател/зала")
                return
            }

            downloadBtn.hidden = true;
            disableSubmitBtn(true);
            let weekValue = new Date(dateFromInput.value).getWeek();

            let nvnaUrl = `http://nvna.eu/schedule/?group=${codeFromInput.value}&queryType=${searchingFor.selectedOptions[0].value}&Week=${weekValue}`;
            let url = `${webScrapper}?url=${encodeURIComponent(nvnaUrl)}`;
            if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
                url = '../testData.json';

            let data;
            try {
                let response = await fetch(url);
                data = await response.json();
            } catch (e) {
                console.log(e);
            } finally {
                disableSubmitBtn(false);
            }

            if (periodOption.value !== 'weeks') {
                contentDiv.innerHTML = '';
                let requestedDate = new Date(dateFromInput.value);
                let weekDiv = createLessonsForWeek(Lesson.getArrayFromNormalizedData(Lesson.getLessonWeek(data)));
                contentDiv.appendChild(weekDiv);

                if (periodOption.value === 'day') {
                    showOnlyRequestedDay(requestedDate, weekDiv)
                }

                Lessons.listByDays = Lesson.getArrayFromNormalizedData(Lesson.getLessonWeek(data));
            } else if (periodOption.value === 'weeks') {
                let urls = [];
                for (let i = 0; i < periodNumberElement.value; i++) {
                    nvnaUrl = `http://nvna.eu/schedule/?group=${codeFromInput.value}&queryType=${searchingFor}&Week=${+weekValue + i}`;
                    urls.push(fetch(`${webScrapper}?url=${encodeURIComponent(nvnaUrl)}`))
                }

                let responseArr;
                try {
                    responseArr = await Promise.all(urls);
                    responseArr = await Promise.all(responseArr.map(y => y.json()));
                } catch (e) {
                }

                contentDiv.innerHTML = '';
                let dataArr = responseArr.map(d => Lesson.getArrayFromNormalizedData(Lesson.getLessonWeek(d)));
                Lessons.listByDays = dataArr.reduce((acc, cur) => [...acc, ...cur], []);
                dataArr = dataArr.map(d => createLessonsForWeek(d));
                dataArr.forEach(d => contentDiv.appendChild(d))
            }
            if (contentDiv.innerHTML.trim())
                downloadBtn.hidden = false;
        }

        function showOnlyRequestedDay(requestedDate, weekDiv) {
            [...weekDiv.children].forEach(el => {
                const curDate = new Date(el.firstElementChild.textContent.split(', ')[1]);
                const a = `${curDate.getFullYear()}/${curDate.getMonth() + 1}/${curDate.getDate()}`;
                const b = `${requestedDate.getFullYear()}/${requestedDate.getMonth() + 1}/${requestedDate.getDate()}`;
                if (a === b) return;
                el.hidden = true;
            })
        }

        function createLessonsForWeek(classesForWeekByDay) {
            let weekDiv = document.createElement('div');
            weekDiv.innerHTML = weekTemplate({days: classesForWeekByDay});
            const listItems = weekDiv.querySelectorAll('ol > li');
            [...listItems]
                .forEach(li => li.addEventListener('click', toggleInfoHandler));
            return weekDiv;
        }

        function disableSubmitBtn(shouldDisable) {
            if (shouldDisable) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Зарежда се';
                return;
            }
            submitBtn.removeAttribute('disabled');
            submitBtn.textContent = 'Покажи';
        }

        function changePeriodHandler(e) {
            if (!e.target) return;
            document.getElementById("weeks").hidden =
                document.getElementById("period").value !== "weeks"
        }
    }
})()
