export async function showTimetable() {
    this.content.innerHTML += (await import("../../templates/timetable.hbs")).default({});
}

export async function showLecturerCodes() {
    this.content.innerHTML +=
    `<iframe id="lecturer-codes" style="position:absolute;border:none;width:100%;height:100%"/>`
    this.content.querySelector("#lecturer-codes").outerHTML =
        (await fetch(`https://web-harvester.herokuapp.com/?url=${encodeURIComponent("https://nvna.eu/wp/wp-content/uploads/2015/12/kodove_prepodavateli_2020_2021.pdf")}`)
            .then(r => r.json())).contents;
}
