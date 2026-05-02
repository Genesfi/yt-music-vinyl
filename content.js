let currentSongTitle = "";
let storedSkinBg = null;

function applyVinylEffect() {
    const player = document.querySelector('ytmusic-player');
    const video = document.querySelector('video');
    const titleElement = document.querySelector('ytmusic-player-bar .title');

    if (!player) return;

    let skinEl = document.getElementById('vinyl-skin');
    if (!skinEl) {
        skinEl = document.createElement('div');
        skinEl.id = 'vinyl-skin';
        player.appendChild(skinEl);
    }

    // Pembuatan struktur baru Kaset Mini (Ada wadah, ada isian)
    let pipVinyl = document.getElementById('pip-vinyl');
    let pipSkin = document.getElementById('pip-skin');
    if (!pipVinyl) {
        pipVinyl = document.createElement('div');
        pipVinyl.id = 'pip-vinyl';

        // Isian gambarnya dipisah agar wadah luarnya bisa jadi kaca
        pipSkin = document.createElement('div');
        pipSkin.id = 'pip-skin';
        pipVinyl.appendChild(pipSkin);

        pipVinyl.addEventListener('click', () => {
            const bar = document.querySelector('ytmusic-player-bar');
            if (bar) bar.click();
        });

        document.body.appendChild(pipVinyl);
    } else {
        pipSkin = document.getElementById('pip-skin');
    }

    const isPaused = video ? video.paused : false;
    if (isPaused) {
        player.classList.add('is-paused');
        pipVinyl.classList.add('pip-paused');
    } else {
        player.classList.remove('is-paused');
        pipVinyl.classList.remove('pip-paused');
    }

    let newSongTitle = titleElement ? titleElement.innerText : "";

    chrome.storage.sync.get(['videoOn', 'spinSpeed'], (result) => {
        let speed = result.spinSpeed || 6;
        document.documentElement.style.setProperty('--spin-speed', `${speed}s`);

        const isVideoOff = (result.videoOn === false);
        const isMinimized = player.getAttribute('player-ui-state') === 'MINIPLAYER';

        if (newSongTitle !== currentSongTitle) {
            currentSongTitle = newSongTitle;
            storedSkinBg = null;
        }

        let hdThumbUrl = null;
        const thumb = document.querySelector('ytmusic-player-bar img');
        if (thumb && thumb.src && thumb.src.includes('http')) {
            hdThumbUrl = thumb.src.replace(/w\d+-h\d+/, 'w1080-h1080');
        }

        if (!storedSkinBg) {
            if (video && video.readyState >= 2 && !video.paused) {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                    storedSkinBg = canvas.toDataURL('image/jpeg');
                } catch (e) { }
            }
            if (!storedSkinBg && hdThumbUrl) storedSkinBg = hdThumbUrl;

            if (storedSkinBg) {
                skinEl.style.setProperty('background-image', `url("${storedSkinBg}")`, 'important');
            }
        }

        if (isVideoOff) {
            player.classList.add('hide-video');
            skinEl.style.display = 'block';
        } else {
            player.classList.remove('hide-video');
            skinEl.style.display = 'none';
        }

        if (isMinimized) {
            pipVinyl.classList.add('active');
            const pipBg = hdThumbUrl || storedSkinBg;
            if (pipBg && pipSkin) {
                // Terapkan background ke skin dalam, bukan ke wadah luarnya
                pipSkin.style.setProperty('background-image', `url("${pipBg}")`, 'important');
            }
        } else {
            pipVinyl.classList.remove('active');
        }
    });
}

setInterval(applyVinylEffect, 300);

chrome.storage.onChanged.addListener((changes) => {
    if (changes.videoOn) storedSkinBg = null;
    if (changes.spinSpeed) document.documentElement.style.setProperty('--spin-speed', `${changes.spinSpeed.newValue}s`);
});