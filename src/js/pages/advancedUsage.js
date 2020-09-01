import {showError} from "../notifications";

export async function showAdvancedUsage() {
    const url = window.location.href.split("#")[0] + "#/";
    const advancedUsageInstructionsTemplate = require("../../templates/advancedUsageInstructions.hbs");
    this.content.innerHTML += advancedUsageInstructionsTemplate({location: url});

    return function () {
        const searchingFor = {};
        [searchingFor.day, searchingFor.week] = [...document.querySelectorAll(`select[id^="select-searching-for-"]`)]
        const code = {};
        [code.day, code.week] = [...document.querySelectorAll(`input[id^="code-for-"]`)];
        const copyLinkBtn = {};
        [copyLinkBtn.day, copyLinkBtn.week] = [...document.querySelectorAll(`button[id^="copy-link-for-"]`)];

        function copyLinkFor(period) {
            return async (e) => {
                if (!code[period].value) {
                    showError("Няма въведен код!");
                    return;
                }
                const link = `${url}${searchingFor[period].value}/${code[period].value}/${period}`
                try {
                    await navigator.clipboard.writeText(link);
                    const originalText = copyLinkBtn[period].textContent;
                    copyLinkBtn[period].textContent = "Копиран!";
                    copyLinkBtn[period].disabled = true;

                    setTimeout(() => {
                        copyLinkBtn[period].textContent = originalText;
                        copyLinkBtn[period].disabled = false;
                    }, 1000)
                } catch (_) {
                    document.getElementById(`fallback-copy-input-area-${period}`).value = link;
                    document.getElementById(`fallback-copy-input-area-${period}`).hidden = false;
                    document.getElementById(`fallback-copy-input-area-${period}`).select()
                }
            }
        }

        Object.entries(copyLinkBtn)
            .forEach(([k, v]) => v.addEventListener("click", copyLinkFor(k)))
    }
}
