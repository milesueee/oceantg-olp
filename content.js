(function() {
    'use strict';

    // Helper to check license status
    async function checkLicense() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "CHECK_LICENSE" }, (response) => {
                resolve(response && response.valid);
            });
        });
    }

    function findAPI(win) {
        try {
            while (win) {
                if (win.API) return win.API;
                if (win.parent === win) break;
                win = win.parent;
            }
        } catch (e) { console.error("no API found:", e); }
        return null;
    }

    function getRandomTimeWithinMinutes(minutes) {
        const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
        const mins = (minutes % 60).toString().padStart(2, '0');
        const secs = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        return `${hours}:${mins}:${secs}`;
    }

    function showPopup(message) {
        const popup = document.createElement('div');
        popup.textContent = message;
        Object.assign(popup.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '12px',
            fontFamily: 'system-ui',
            fontSize: '16px',
            zIndex: '10000'
        });
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 3000);
    }

    function modifySCORM(api, randomTime, score = null) {
        if (!api) return console.warn("No API found.");

        if (score !== null) {
            api.LMSSetValue("cmi.core.score.raw", score.toString());
        }

        api.LMSSetValue("cmi.core.lesson_status", "passed");
        api.LMSSetValue("cmi.core.session_time", randomTime);
        api.LMSCommit("");

        setTimeout(() => api.LMSFinish(""), 2000);
        setTimeout(() => window.open('', '_self').close(), 3000);
    }

    function showScoreInputPopup(api, randomTime) {
        const box = document.createElement('div');
        Object.assign(box.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(30,30,30,0.9)',
            padding: '20px',
            borderRadius: '12px',
            color: '#fff',
            zIndex: '10000',
            fontFamily: 'system-ui',
            textAlign: 'center'
        });

        const label = document.createElement('div');
        label.textContent = "Enter desired score:";
        label.style.marginBottom = "10px";

        const input = document.createElement('input');
        input.type = 'number';
        input.min = 0;
        input.max = 100;
        input.value = 100;
        input.style.padding = '8px';
        input.style.borderRadius = '6px';
        input.style.width = '100px';
        input.style.textAlign = 'center';

        function styleButton(btn) {
            Object.assign(btn.style, {
                marginTop: '10px',
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                color: '#fff',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                width: '150px',
                fontSize: '14px',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto'
            });
        }

        const btnScore = document.createElement('button');
        btnScore.textContent = "Submit Score";
        styleButton(btnScore);
        btnScore.onclick = () => {
            const score = parseInt(input.value);
            if (isNaN(score) || score < 0 || score > 100) return alert("Enter a score 0–100");
            document.body.removeChild(box);
            showPopup(`Score set to ${score}`);
            modifySCORM(api, randomTime, score);
        };

        const btnNoScore = document.createElement('button');
        btnNoScore.textContent = "NO SCORE";
        styleButton(btnNoScore);
        btnNoScore.style.background = "linear-gradient(135deg, #e11d48, #f43f5e)";
        btnNoScore.onclick = () => {
            document.body.removeChild(box);
            showPopup("No score applied");
            modifySCORM(api, randomTime, null);
        };

        box.append(label, input, document.createElement('br'), btnScore, btnNoScore);
        document.body.appendChild(box);
    }

    async function init() {
        const isValid = await checkLicense();
        if (!isValid) {
            console.log("OLP Extension: No valid license found. Please enter a key in the extension popup.");
            return;
        }

        const api = findAPI(window);
        if (!api) return;

        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
        });

        const minutesList = [2,5,8,10,15,20,30,45,60,80,90,100,120,150,180,200];

        minutesList.forEach(min => {
            const btn = document.createElement('button');
            btn.textContent = `${min} min`;
            Object.assign(btn.style, {
                padding: '8px 14px',
                background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px'
            });

            btn.onclick = () => {
                const randomTime = getRandomTimeWithinMinutes(min);
                showPopup(`Generated Time: ${randomTime}`);
                showScoreInputPopup(api, randomTime);
            };

            container.appendChild(btn);
        });

        document.body.appendChild(container);
    }

    setTimeout(init, 2000);

})();
