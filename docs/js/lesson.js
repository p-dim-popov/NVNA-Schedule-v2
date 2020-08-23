class Lesson {
    length;
    time;
    name;
    period;
    variousData;

    constructor(arr) {
        if (arr.length <= 1) return [];
        arr = arr.map(it => it.stripHTML().trim());

        this.period = +arr.pop();
        const firstLesson = +arr.shift();
        this.length = [...Array(this.period).keys()]
            .reduce((acc, cur) => [...acc, cur + firstLesson], []);

        [this.time, this.name, ...this.variousData] = arr;
    }

    toArray() {
        return [...this.time.split('-'), this.name, ...this.variousData];
    }

    static _getDataArray(data) {
        let table = document.createElement('table');
        table.innerHTML = data.contents.match(/<table>[.\s\S]*?<\/table>/uimg)[0];
        return [...table.getElementsByTagName("tbody")[0].children]
            .map(tr => {
                if (tr.firstElementChild &&
                    tr.firstElementChild.textContent.match(/\d{1,2}/) &&
                    tr.firstElementChild.nextElementSibling &&
                    tr.firstElementChild.nextElementSibling.hasAttribute('rowspan')
                ) {
                    let classPeriod = document.createElement('span');
                    classPeriod.textContent = tr.firstElementChild.nextElementSibling.rowSpan;
                    tr.appendChild(classPeriod);
                }
                return [...tr.children]
                    .map(it => it.innerHTML)
            })
    }

    static normalizeData(data) {
        const weekDays = {
            bg: ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя']
        };

        return this._getDataArray(data)
            .reduce((acc, cur, i, arr) => {
                const day = cur[0].split(', ');
                if (day && day[1]) {
                    if (weekDays.bg.includes(day[0])) {
                        const lessonDay = {day: day[0], date: day[1], lessons: []};
                        if (arr[i + 1][0] !== 'Няма занятия') {
                            for (let j = 0; j < 13; j++) {
                                const lesson = arr[i + j + 1].filter(el => !!el.trim());
                                if (lesson.length > 1)
                                    lessonDay.lessons.push(lesson)
                            }
                        }
                        acc.push(lessonDay);
                    }
                }
                return acc;
            }, []);
    }

    static getArrayFromNormalizedData(classesForWeekByDay) {
        return classesForWeekByDay
            .map(day => ({...day, lessons: day.lessons.reduce((acc, cur) => [...acc, new Lesson(cur)], [])}));
    }
}

class Lessons {
    static listByDays = [];

    constructor() {
    }

    static get tsv() {
        return this._charSeparatedValues('\t');
    }

    static _charSeparatedValues(separator) {
        return this.listByDays
            .map(d => d.lessons
                .map(c => [d.date, ...c.toArray()
                    .map(x => x
                        .trim())]
                    .join(separator))
                .join('\n'))
            .join('\n')
            .split('\n')
            .filter((r, i, arr) =>
                r.trim() &&
                arr.indexOf(r) === i &&
                r.split(separator).length > 1 &&
                r.split(separator)[1].trim())
            .join('\n');
    }
}