export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const response = await navigator.serviceWorker.register('./service-worker.js');
                console.log('SW registered: ', response)
            }
            catch (err) {
                console.log('SW registration failed: ', err)
            }
        });
    }
}

export function installPrompt(){
    setTimeout(() => {
        window.addEventListener('beforeinstallprompt', saveBeforeInstallPromptEvent);
        window.addEventListener('appinstalled', logAppInstalled);
        const footerForInstall = document.getElementById("footer-for-install")
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
    }, 5000);
}
