class Lesson {
    span;
    time;
    name;
    period;
    variousData;
    durationString;

    constructor(arr) {
        if (arr.length <= 1) return [];
        arr = arr.map(it => it.stripHTML().trim());

        this.period = +arr.pop();
        const firstLesson = +arr.shift();
        this.span = [...Array(this.period).keys()]
            .reduce((acc, cur) => [...acc, cur + firstLesson], []);
        this.durationString = this.span.join(",");
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

    static getLessonWeek(data) {
        const weekDays = {
            bg: ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя']
        };

        return this._getDataArray(data)
            .reduce((acc, cur, i, arr) => {
                const day = cur[0].split(', ');
                if (day && day[1]) {
                    if (weekDays.bg.includes(day[0])) {
                        const lessonDay = new LessonDay(day[0], day[1]);
                        if (arr[i + 1][0] !== 'Няма занятия') {
                            for (let j = 0; j < 13; j++) {
                                const lesson = new Lesson(arr[i + j + 1].filter(el => !!el.trim()));
                                if (lesson.span && lesson.span.length > 1)
                                    lessonDay.lessons.push(lesson)
                            }
                        }
                        acc.days.push(lessonDay);
                    }
                }
                return acc;
            }, new LessonWeek());
    }

    serialize(format){
        switch (format.toLowerCase()) {
            case "json":
                return JSON.stringify(this);
            case "tsv":
                return [...this.time.split("-"), this.name, ...this.variousData]
                    .join("\t")
            default:
                return this;
        }
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

class LessonDay {
    day;
    date;
    lessons = [];

    constructor(day, date, ...lessons) {
        this.day = day;
        this.date = date;
        this.lessons = lessons;
    }

    serialize(format){
        switch (format.toLowerCase()) {
            case "json":
                return JSON.stringify(this);
            case "tsv":
                return this.lessons
                    .map(l => [this.date, l.serialize(format)].join("\t"))
                    .join("\n")
            default:
                return this;
        }
    }
}

class LessonWeek {
    days = [];

    constructor(...days) {
        this.days = days;
    }
}

class LessonWeeks {
    list = [];

    constructor(...lessonWeeks) {
        this.list = lessonWeeks
    }
}