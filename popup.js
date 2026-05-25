document.addEventListener('DOMContentLoaded', () => {
    const statusBox = document.getElementById('statusBox');
    const licenseInput = document.getElementById('licenseKey');
    const saveBtn = document.getElementById('saveBtn');
    const expiryText = document.getElementById('expiryText');

    // Initial load
    chrome.storage.local.get(['licenseKey', 'isValid', 'expiry'], (result) => {
        if (result.licenseKey) {
            licenseInput.value = result.licenseKey;
        }
        updateUI(result.isValid, result.expiry);
    });

    saveBtn.addEventListener('click', () => {
        const key = licenseInput.value.trim();
        if (!key) return;

        saveBtn.disabled = true;
        saveBtn.textContent = 'Activating...';

        chrome.runtime.sendMessage({ action: "SAVE_LICENSE", licenseKey: key }, (response) => {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Activate License';
            updateUI(response.valid, response.expiry);
            
            if (response.valid) {
                alert('License activated successfully!');
            } else {
                alert('Invalid or expired license key.');
            }
        });
    });

    function updateUI(isValid, expiry) {
        if (isValid) {
            statusBox.textContent = 'Status: ACTIVE';
            statusBox.className = 'status valid';
            if (expiry) {
                expiryText.textContent = `Expires on: ${new Date(expiry).toLocaleDateString()}`;
            }
        } else {
            statusBox.textContent = 'Status: INACTIVE';
            statusBox.className = 'status invalid';
            expiryText.textContent = '';
        }
    }
});
