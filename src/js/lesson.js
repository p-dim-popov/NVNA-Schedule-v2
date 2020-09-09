String.prototype.stripHTML = function(){
    let doc = new DOMParser().parseFromString(this, 'text/html');
    return doc.body.textContent || "";
};

export class Lesson {
    constructor(arr) {
        this.span = []; // int[]
        this.time = ""; //
        this.name = ""; //
        this.period = ""; //
        this.variousData = [];// any

        if (arr.length <= 1) return [];
        arr = arr.map(it => it.stripHTML().trim());

        this.period = +arr.pop();
        const firstLesson = +arr.shift();
        this.span = [...Array(this.period).keys()]
            .reduce((acc, cur) => [...acc, cur + firstLesson], []);
        [this.time, this.name, ...this.variousData] = arr;
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

export class LessonDay {
    constructor(day, date, ...lessons) {
        this.day = "";
        this.date = "";
        this.lessons = [];

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

export class LessonWeek {
    constructor(...days) {
        this.days = [];

        this.days = days;
    }
}

export class LessonWeeks {
    constructor(...lessonWeeks) {
        this.list = [];

        this.list = lessonWeeks
    }
}
