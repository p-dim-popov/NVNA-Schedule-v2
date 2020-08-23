main();

async function main() {
    const webScrapper = `https://web--scrapper.herokuapp.com/webscrapper`;
    const submitBtn = document.getElementById('submit-btn');
    const [codeFromInput, dateFromInput] = document.getElementsByTagName('input');
    const searchingFor = document.getElementById("searching-for");
    const contentDiv = document.getElementById('content');
    const periodOption = document.getElementById('period');
    const periodNumberElement = document.getElementById("period");
    const downloadBtn = document.getElementById('download-btn');
    let bulkData = [];

    flatpickr(dateFromInput, {});
    dateFromInput.value = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;

    const weekTemplateResponse = await fetch('./templates/weekTemplate.hbs');
    const weekTemplateContent = await weekTemplateResponse.text();
    let weekTemplate = Handlebars.compile(weekTemplateContent);

    submitBtn.addEventListener('click', submitHandler);
    periodOption.addEventListener('change', changePeriodHandler);

    function downloadBtnHandler() {
        let tsvContent = Lessons.tsv
        let filename = prompt('Въведи име на файл', `${dateFromInput.value}.tsv` || `${dateFromInput.value}.tsv`);
        if (filename) {
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
        }
    }

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
            let weekDiv = createLessonsForWeek(Lesson.getArrayFromNormalizedData(Lesson.normalizeData(data)));
            contentDiv.appendChild(weekDiv);
debugger
            if (periodOption.value === 'day') {
                showOnlyRequestedDay(requestedDate, weekDiv)
            }

            Lessons.listByDays = Lesson.getArrayFromNormalizedData(Lesson.normalizeData(data));
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
            let dataArr = responseArr.map(d => Lesson.getArrayFromNormalizedData(Lesson.normalizeData(d)));
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

    function toggleInfoHandler(e) {
        if (!e.target) return;
        let subject = e.target;
        if (e.target.tagName === "SMALL" || e.target.tagName === "H6") subject = e.target.parentNode;
        if (!subject.classList.contains("subject")) return;
        [...subject.children].pop().classList.toggle("d-none");
    }

    function changePeriodHandler(e) {
        if (!e.target) return;
        document.getElementById("weeks").hidden =
            document.getElementById("period").value !== "weeks"
    }
}