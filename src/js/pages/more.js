export function showTimetable() {
    this.content.innerHTML += require("../../templates/timetable.hbs")({});
}

export async function showLecturerCodes() {
    this.content.innerHTML +=
        `<iframe style="position:absolute;border:none;width:100%;height:100%" src="https://bit.ly/32IoUe2"/>`
}