export async function showTimetable() {
    this.content.innerHTML += (await import("../../templates/timetable.hbs")).default({});
}

export async function showLecturerCodes() {
    this.content.innerHTML += `<p>Work in progress...</p>`;
    // `<iframe style="position:absolute;border:none;width:100%;height:100%" src="https://bit.ly/32IoUe2"/>`
}