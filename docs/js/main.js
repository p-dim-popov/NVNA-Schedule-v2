(function main() {
    const webScrapper = `https://web--scrapper.herokuapp.com/webscrapper`;
    const submitBtn = document.getElementById('submitBtn');
    const [codeFromInput, dateFromInput, groupFromInput, lecturerFromInput, roomFromInput] = document.getElementsByTagName('input');
    const scheduleTable = document.getElementsByTagName('table')[0];
    const contentDiv = document.getElementById('content');
    const periodOption = document.getElementById('period');
    const periodNumberRef = document.getElementById("periodNumber");
    flatpickr(dateFromInput, {});

    let weekTemplate;
    fetch('./templates/weekTemplate.hbs')
        .then(r => r.text())
        .then(d => weekTemplate = Handlebars.compile(d));

    submitBtn.addEventListener('click', submitHandler);
    periodOption.addEventListener('change', changePeriodHandler);

    async function submitHandler(e)
    {
        e.preventDefault();
        if (!(groupFromInput.checked || lecturerFromInput.checked || roomFromInput.checked))
        {
            alert("Избери за к'во търсиш, де!");
            return;
        }
        if (!dateFromInput.value){
            const currentDate = new Date();
            dateFromInput.value = `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
        }

        disableSubmitBtn(true);
        let searchingFor;
        if (groupFromInput.checked) searchingFor = 'group';
        else if (lecturerFromInput.checked) searchingFor = 'lecturer';
        else if (roomFromInput.checked) searchingFor = 'room';
        let weekValue = new Date(dateFromInput.value).getWeek();
        let nvnaUrl = `http://nvna.eu/schedule/?group=${codeFromInput.value}&queryType=${searchingFor}&Week=${weekValue}`;
        let url = `${webScrapper}?url=${encodeURIComponent(nvnaUrl)}`;
        //url = '../testData.json'; //uncomment for working locally
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
        contentDiv.innerHTML = '';
        let requestedDate = new Date(dateFromInput.value);
        if (periodOption.value === 'day')
        {
            let weekContentDiv = createClassesForWeek(data);
            contentDiv.appendChild(weekContentDiv);
            [...weekContentDiv.children].forEach(el => {
                const curDate = new Date(el.firstElementChild.textContent.split(', ')[1]);
                const a = `${curDate.getFullYear()}/${curDate.getMonth() + 1}/${curDate.getDate()}`;
                const b = `${requestedDate.getFullYear()}/${requestedDate.getMonth() + 1}/${requestedDate.getDate()}`;
                if (a === b) return;
                el.hidden = true;
            })
        }
        else if (periodOption.value === 'week')
        {
            let weekContentDiv = createClassesForWeek(data);
            contentDiv.appendChild(weekContentDiv);
        }
        else if (periodOption.value === 'weeks')
        {
            //TODO: fetch some weeks :)
        }
        //TODO: download button for data as csv
    }

    function createClassesForWeek(_data)
    {
        let classesForWeekByDay = _data
            .reduce((acc, cur, i, arr) => {
                let day = cur[0].split(', ');
                if (day && day[1])
                {
                    if (getDaysOfTheWeek().includes(day[0]))
                    {
                        let dayObj = {day: day.join(', '), classes: []};
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
        classesForWeekByDay = classesForWeekByDay
            .map(it => {
                it.classes = it.classes
                    .map((c, i, a) => mapArrToClass(c, i, a, it.classes));
                return it
            });
        let weekHTML = weekTemplate({
            days: classesForWeekByDay
                .reduce((acc, cur) => [...acc, {
                    day: cur.day,
                    classes:  cur.classes
                }], [])
        });
        let div_ = document.createElement('div');
        div_.innerHTML = weekHTML;
        div_.querySelectorAll('li.subject')
            .forEach(li => li.textContent ? li.addEventListener('click', toggleInfoHandler) : null);
        return div_;
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

    function getDaysOfTheWeek()
    {
        return ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'];
    }

    function mapArrToClass(c, i, arr, origin)
    {
        if (c instanceof Class) return c;
        let thisClass = new Class(c);
        if (thisClass.classPeriod)
        {
            for (let j = 1; j < thisClass.classPeriod; j++)
            {
                origin[i + j] = new Class(arr[i])
            }
        }
        return thisClass
    }

    function changePeriodHandler(e)
    {
        if (!e.target) return;
        const weeks = document.getElementById("periodWeeks").value;
        periodNumberRef.hidden = e.target.value !== weeks;
    }
})();