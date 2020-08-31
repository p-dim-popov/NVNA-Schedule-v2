export function showError(content) {
    document.getElementById("error-info-box").classList.remove("d-none")
    document.getElementById("error-info-box").textContent = content;
    const hideError = () => document.getElementById("error-info-box").classList.add("d-none")
    const hideErrorTimeoutFn = setTimeout(hideError, 3000);
    document.getElementById("error-info-box")
        .addEventListener("click", function hideErrorHandler() {
            document.getElementById("error-info-box").removeEventListener("click", hideErrorHandler);
            clearTimeout(hideErrorTimeoutFn);
            hideError();
        })
}