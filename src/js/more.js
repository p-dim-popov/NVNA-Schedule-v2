export function showTimetable() {
    this.content.innerHTML += require("../templates/timetable.hbs")({});
}

export function showLecturerCodes() {
    this.content.innerHTML +=
        `<iframe style="position:absolute;border:none;width:100%;height:100%" src="http://old-www.naval-acad.bg/infocenter/razpisanij/novo/kod-prepodav.htm"/>`
}