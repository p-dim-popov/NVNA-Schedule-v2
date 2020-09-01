import flatpickr from "flatpickr";
import dayjs from "dayjs";
import {showError} from "./notifications";

const content = document.getElementById("content");

/**
 * Delegate/action to apply header, footer, attach events and etc...
 * Attaches main div to context as "content". Clears content innerHTML
 * @param   {Function}    func   normal "on" function which can return delegate/action
 * to be executed after rendering. *Note: returned function should not render new content*
 */
export function applyCommonThen(func) {
    return async function () {
        this.content = content;
        this.content.innerHTML = ""
        await showHeader.call(this);
        // Action for additional post operations
        const postLoadAction = await func.call(this);
        await showFooter.call(this);
        await postLoadActions.call(this, postLoadAction);
    }
}

async function showHeader() {
    this.content.innerHTML += require("../templates/common/header.hbs")({});
}

async function showFooter() {
    this.content.innerHTML += require("../templates/common/footer.hbs")({});
}

// attaching events to header and footer and filling input fields if has queried data
async function postLoadActions(postLoadAction) {
    flatpickr(document.getElementById("date"), {
        dateFormat: "Y-m-d",
        defaultDate: !!this.params.date ? this.params.date.format("YYYY-MM-DD") : "today",
        altFormat: "D, d M Y",
        altInput: true,
        disableMobile: true,
        locale: {
            firstDayOfWeek: 1
        },
        weekNumbers: true
    });

    document.getElementById("code").value = this.params.code || "";
    document.getElementById("searching-for").value = this.params.searchingFor || "group";
    document.getElementById("period").value = this.params.period || "day";

    if (!!this.params.weeksCount) {
        document.getElementById("weeks-count").value = this.params.weeksCount;
        document.getElementById("weeks-count").hidden = false;
    }

    // Form submit handler
    document.getElementById("submit-btn")
        .addEventListener("click", () => {
            const query = {
                searchingFor: document.getElementById("searching-for"),
                code: document.getElementById("code"),
                period: document.getElementById("period"),
                date: document.getElementById("date"),
                weeksCount: document.getElementById("weeks-count")
            }

            if (!query.code.value) {
                showError("Няма въведен код");
                return;
            }

            if (!query.period.value) query.period.value = "day";
            if (!query.date.value) query.date.value = dayjs().format("YYYY-MM-DD");

            let hash = "";
            switch (query.period.value) {
                case "day":
                case "week":
                    hash = `#/${query.searchingFor.value}/${query.code.value}/${query.period.value}/${query.date.value}`;
                    break;
                case "weeks":
                    hash = `#/${query.searchingFor.value}/${query.code.value}/${query.period.value}/${query.date.value}/${query.weeksCount.value}`;
                    break;
            }

            if (window.location.hash !== hash) {
                document.getElementById("submit-btn").disabled = true;
                document.getElementById("submit-btn").value = "Зарежда се..."
            }

            window.location.hash = hash;
        })

    // Period weeks handler
    document.getElementById("period")
        .addEventListener("change", (e) => {
            if (!e.target) return;
            document.getElementById("weeks-count").hidden =
                document.getElementById("period").value !== "weeks"
        })

    if (!!postLoadAction)
        postLoadAction.call(this)
}
