let currentSongTitle = "";
let activeCoverUrl = null;

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

    let pipVinyl = document.getElementById('pip-vinyl');
    let pipSkin = document.getElementById('pip-skin');
    if (!pipVinyl) {
        pipVinyl = document.createElement('div');
        pipVinyl.id = 'pip-vinyl';

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
    if (newSongTitle !== currentSongTitle) {
        currentSongTitle = newSongTitle;
        activeCoverUrl = null; // Reset saat ganti lagu
    }

    // PERBAIKAN: HANYA ambil dari thumbnail pojok kiri bawah. 
    // Thumbnail ini tidak pernah hilang meskipun videonya sedang jalan.
    const thumbImg = document.querySelector('ytmusic-player-bar img');
    if (thumbImg && thumbImg.src && thumbImg.src.startsWith('http')) {
        let src = thumbImg.src;
        // Paksa URL-nya berubah jadi resolusi HD (1080p) biar piringannya gak buram
        if (src.match(/w\d+-h\d+/)) {
            src = src.replace(/w\d+-h\d+/, 'w1080-h1080');
        }
        activeCoverUrl = src;
    }

    chrome.storage.sync.get(['videoOn', 'spinSpeed'], (result) => {
        let speed = result.spinSpeed || 6;
        document.documentElement.style.setProperty('--spin-speed', `${speed}s`);

        const isVideoOff = (result.videoOn === false);
        const isMinimized = player.getAttribute('player-ui-state') === 'MINIPLAYER';

        // Terapkan gambar ke piringan utama dan piringan kecil (PiP)
        if (activeCoverUrl) {
            skinEl.style.setProperty('background-image', `url("${activeCoverUrl}")`, 'important');
            if (pipSkin) {
                pipSkin.style.setProperty('background-image', `url("${activeCoverUrl}")`, 'important');
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
        } else {
            pipVinyl.classList.remove('active');
        }
    });
}

setInterval(applyVinylEffect, 300);

chrome.storage.onChanged.addListener((changes) => {
    if (changes.spinSpeed) document.documentElement.style.setProperty('--spin-speed', `${changes.spinSpeed.newValue}s`);
});