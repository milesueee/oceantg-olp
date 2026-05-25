const VERCEL_API_URL = 'https://oceantg-olp.vercel.app'; // e.g., https://your-project.vercel.app

// Basic Vercel fetch wrapper for license check
async function checkLicenseFromVercel(licenseKey) {
    if (!licenseKey) return { valid: false };

    try {
        const url = `${VERCEL_API_URL}/api/check-license?licenseKey=${encodeURIComponent(licenseKey)}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Vercel returned error status:", response.status);
            return { valid: false };
        }
        const status = await response.json();
        return status;
    } catch (e) {
        console.error("Vercel check error:", e);
    }

    return { valid: false };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "CHECK_LICENSE") {
        chrome.storage.local.get(['licenseKey', 'isValid', 'expiry'], async (result) => {
            // Optimization: If we already have a valid flag in storage, use it (or re-verify periodically)
            if (result.isValid) {
                const now = new Date();
                const expiry = new Date(result.expiry);
                if (expiry > now) {
                    sendResponse({ valid: true, expiry: result.expiry });
                    return;
                }
            }

            // Otherwise check Vercel
            const status = await checkLicenseFromVercel(result.licenseKey);
            chrome.storage.local.set({ isValid: status.valid, expiry: status.expiry });
            sendResponse(status);
        });
        return true; // async
    }

    if (request.action === "SAVE_LICENSE") {
        const key = request.licenseKey;
        checkLicenseFromVercel(key).then(status => {
            chrome.storage.local.set({
                licenseKey: key,
                isValid: status.valid,
                expiry: status.expiry
            }, () => {
                sendResponse(status);
            });
        });
        return true; // async
    }
});
