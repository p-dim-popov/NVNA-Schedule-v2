window.addEventListener('beforeinstallprompt', saveBeforeInstallPromptEvent);
window.addEventListener('appinstalled', logAppInstalled);
const footerForInstall = document.getElementsByTagName('footer')[0];
const installButton = footerForInstall.getElementsByTagName('button')[0];

let deferredInstallPrompt;

function saveBeforeInstallPromptEvent(e)
{
    e.preventDefault();
    deferredInstallPrompt = e;
    footerForInstall.removeAttribute('hidden');
    deferredInstallPrompt.userChoice
        .then((choice) => {
            if (choice.outcome === 'accepted')
            {
                console.log('User accepted the A2HS prompt', choice);
                footerForInstall.setAttribute('hidden', true);
            }
            else
            {
                console.log('User dismissed the A2HS prompt', choice);
            }
            deferredInstallPrompt = null;
        });

}

function logAppInstalled(e)
{
    console.log('Schedule app was installed.', e);
}

installButton.addEventListener('click', () => {
    deferredInstallPrompt.prompt();
});