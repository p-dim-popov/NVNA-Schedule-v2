export async function showTimetable() {
    this.content.innerHTML += (await import("../../templates/timetable.hbs")).default({});
}

export async function showLecturerCodes() {
    this.content.innerHTML +=
    `<iframe id="lecturer-codes" style="position:absolute;border:none;width:100%;height:100%"/>`
    this.content.querySelector("#lecturer-codes").contentDocument.write(
        (await fetch(`https://web-harvester.herokuapp.com/?url=${encodeURIComponent("http://old-www.naval-acad.bg/infocenter/razpisanij/novo/kod-prepodav.htm")}`)
            .then(r => r.json())).contents);
}
