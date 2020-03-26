(function main() {
    const webScrapper = `https://web--scrapper.herokuapp.com/webscrapper`;
    fetch(`${webScrapper}?url=${encodeURIComponent('http://nvna.eu/schedule/?group=5&queryType=room&Week=10')}`).then();
    const submitBtn = document.getElementById('submitBtn');
    const [codeFromInput, dateFromInput, groupFromInput, lecturerFromInput, roomFromInput] = document.getElementsByTagName('input');
    const contentDiv = document.getElementById('content');
    const periodOption = document.getElementById('period');
    const periodNumberRef = document.getElementById("periodNumber");
    const downloadBtn = document.getElementById('downloadBtn');
    let bulkData = [];
    flatpickr(dateFromInput, {});

    let weekTemplate;
    fetch('./templates/weekTemplate.hbs')
        .then(r => r.text())
        .then(d => weekTemplate = Handlebars.compile(d));

    submitBtn.addEventListener('click', submitHandler);
    periodOption.addEventListener('change', changePeriodHandler);

    function downloadBtnHandler()
    {
        //TODO: download fn
    }

    downloadBtn.addEventListener('click', downloadBtnHandler);

    async function submitHandler(e)
    {
        e.preventDefault();
        if (!(groupFromInput.checked || lecturerFromInput.checked || roomFromInput.checked))
        {
            alert("Избери за к'во търсиш, де!");
            return;
        }
        if (!dateFromInput.value)
        {
            const currentDate = new Date();
            dateFromInput.value = `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
        }

        downloadBtn.hidden = true;
        disableSubmitBtn(true);
        let searchingFor;
        if (groupFromInput.checked) searchingFor = 'group';
        else if (lecturerFromInput.checked) searchingFor = 'lecturer';
        else if (roomFromInput.checked) searchingFor = 'room';
        let weekValue = new Date(dateFromInput.value).getWeek();
        let nvnaUrl = `http://nvna.eu/schedule/?group=${codeFromInput.value}&queryType=${searchingFor}&Week=${weekValue}`;
        let url = `${webScrapper}?url=${encodeURIComponent(nvnaUrl)}`;
        // url = '../testData.json'; //TODO: uncomment for working locally
        let data;
        try
        {
            let response = await fetch(url);
            data = getDataArray(await response.json());
        }
        catch (e)
        {
            console.log(e);
        }
        finally
        {
            disableSubmitBtn(false);
        }
        if (periodOption.value !== 'weeks')
        {
            contentDiv.innerHTML = '';
            let requestedDate = new Date(dateFromInput.value);
            let weekDiv = createClassesForWeek(transformArrayToClassClass(normalizeData(data)));
            contentDiv.appendChild(weekDiv);
            if (periodOption.value === 'day')
            {
                showOnlyRequestedDay(requestedDate, weekDiv)
            }
            bulkData = normalizeData(data);
        }
        else if (periodOption.value === 'weeks')
        {
            const requestedNumberOfWeeks = periodNumberRef.value;
            let urls = [];
            let responseArr;
            try
            {
                for (let i = 0; i < requestedNumberOfWeeks; i++)
                {
                    nvnaUrl = `http://nvna.eu/schedule/?group=${codeFromInput.value}&queryType=${searchingFor}&Week=${+weekValue + i}`;
                    urls.push(fetch(`${webScrapper}?url=${encodeURIComponent(nvnaUrl)}`))
                }
                responseArr = await Promise.all(urls);
                responseArr = await Promise.all(responseArr.map(y => y.json()));
            }
            catch (e)
            {
            }

            contentDiv.innerHTML = '';
            let dataArr = responseArr.map(o => getDataArray(o));
            dataArr = dataArr.map(d => transformArrayToClassClass(normalizeData(d)));
            bulkData = dataArr;
            dataArr = dataArr.map(d => createClassesForWeek(d));
            dataArr.forEach(d => contentDiv.appendChild(d))
        }

        downloadBtn.hidden = false;
    }

    function showOnlyRequestedDay(requestedDate, weekDiv)
    {
        [...weekDiv.children].forEach(el => {
            const curDate = new Date(el.firstElementChild.textContent.split(', ')[1]);
            const a = `${curDate.getFullYear()}/${curDate.getMonth() + 1}/${curDate.getDate()}`;
            const b = `${requestedDate.getFullYear()}/${requestedDate.getMonth() + 1}/${requestedDate.getDate()}`;
            if (a === b) return;
            el.hidden = true;
        })
    }

    function normalizeData(_data)
    {
        const daysOfTheWeekBg = ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'];
        return _data
            .reduce((acc, cur, i, arr) => {
                let day = cur[0].split(', ');
                if (day && day[1])
                {
                    if (daysOfTheWeekBg.includes(day[0]))
                    {
                        let dayObj = {day: day[0], date: day[1], classes: []};
                        if (arr[i + 1][0] !== 'Няма занятия')
                        {
                            for (let j = 0; j < 13; j++)
                            {
                                dayObj.classes.push(arr[i + j + 1])
                            }
                        }
                        acc.push(dayObj);
                    }
                }
                return acc;
            }, []);
    }

    function transformArrayToClassClass(classesForWeekByDay)
    {
        return classesForWeekByDay
            .map(it => {
                it.classes = it.classes
                    .map((c, i) => {
                        if (c instanceof Class) return c;
                        let thisClass = new Class(c);
                        if (thisClass.classPeriod)
                        {
                            for (let j = 1; j < thisClass.classPeriod; j++)
                            {
                                it.classes[i + j] = thisClass
                            }
                        }
                        return thisClass
                    });
                return it
            });
    }

    function createClassesForWeek(classesForWeekByDay)
    {
        let weekDiv = document.createElement('div');
        weekDiv.classList.add('weekDiv');
        weekDiv.innerHTML = weekTemplate({days: classesForWeekByDay});
        weekDiv.querySelectorAll('li.subject')
            .forEach(li => li.textContent ? li.addEventListener('click', toggleInfoHandler) : null);
        return weekDiv;
    }

    function getDataArray(data)
    {
        let table = document.createElement('table');
        table.innerHTML = data.contents.match(/<table>[.\s\S]*?<\/table>/uimg)[0];
        return [...table.getElementsByTagName("tbody")[0].children]
            .map(tr => {
                if (tr.firstElementChild &&
                    tr.firstElementChild.textContent.match(/\d{1,2}/) &&
                    tr.firstElementChild.nextElementSibling &&
                    tr.firstElementChild.nextElementSibling.hasAttribute('rowspan'))
                {
                    let classPeriod = document.createElement('span');
                    classPeriod.textContent = tr.firstElementChild.nextElementSibling.rowSpan;
                    tr.appendChild(classPeriod);
                }
                return [...tr.children]
                    .map(it => it.innerHTML)
            })
    }

    function disableSubmitBtn(shouldDisable)
    {
        if (shouldDisable)
        {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Зарежда се';
            return;
        }
        submitBtn.removeAttribute('disabled');
        submitBtn.textContent = 'Покажи';
    }

    function toggleInfoHandler(e)
    {
        if (!e.target.textContent.trim()) return;
        try
        {
            let ul = e.target.firstElementChild;
            if (ul.style.display === 'block')
                ul.style.display = 'none';
            else
                ul.style.display = 'block';
        }
        catch (e)
        {
        }
    }

    function changePeriodHandler(e)
    {
        if (!e.target) return;
        const weeks = document.getElementById("periodWeeks").value;
        periodNumberRef.hidden = e.target.value !== weeks;
    }
})();