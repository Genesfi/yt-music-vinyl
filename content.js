let currentSongTitle = "";
let activeCoverUrl = null;

function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent);
}

function fixMobilePlayerSize(player) {
    if (!isMobile()) return;
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.80;
    player.style.setProperty('width', `${size}px`, 'important');
    player.style.setProperty('height', `${size}px`, 'important');
    player.style.setProperty('max-width', `${size}px`, 'important');
    player.style.setProperty('max-height', `${size}px`, 'important');
    player.style.setProperty('min-width', `${size}px`, 'important');
    player.style.setProperty('min-height', `${size}px`, 'important');
}

function isPlayerPage() {
    return window.location.pathname.includes('/watch');
}

function applyVinylEffect() {
    const player = document.querySelector('ytmusic-player');
    const video = document.querySelector('video');
    const titleElement = document.querySelector('ytmusic-player-bar .title');

    if (!player) return;

    // === MOBILE: Sembunyikan kaset utama kalau bukan halaman /watch ===
    if (isMobile()) {
        if (!isPlayerPage()) {
            // Bukan halaman player — sembunyikan kaset utama, jangan tampilkan PiP
            player.style.setProperty('display', 'none', 'important');
            const pipVinyl = document.getElementById('pip-vinyl');
            if (pipVinyl) pipVinyl.classList.remove('active');
            return; // Tidak perlu lanjut
        } else {
            // Halaman player — tampilkan kaset utama, fix ukurannya
            player.style.removeProperty('display');
            fixMobilePlayerSize(player);
        }
    }

    // === SETUP ELEMEN ===
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

    // === STATE PAUSE ===
    const isPaused = video ? video.paused : false;
    if (isPaused) {
        player.classList.add('is-paused');
        pipVinyl.classList.add('pip-paused');
    } else {
        player.classList.remove('is-paused');
        pipVinyl.classList.remove('pip-paused');
    }

    // === COVER ART ===
    let newSongTitle = titleElement ? titleElement.innerText : "";
    if (newSongTitle !== currentSongTitle) {
        currentSongTitle = newSongTitle;
        activeCoverUrl = null;
    }

    const thumbImg = document.querySelector('ytmusic-player-bar img');
    if (thumbImg && thumbImg.src && thumbImg.src.startsWith('http')) {
        let src = thumbImg.src;
        if (src.match(/w\d+-h\d+/)) {
            src = src.replace(/w\d+-h\d+/, 'w1080-h1080');
        }
        activeCoverUrl = src;
    }

    chrome.storage.sync.get(['videoOn', 'spinSpeed', 'vinylEnabled'], (result) => {
        // === LOGIKA MASTER ENABLE/DISABLE (BARU) ===
        let isExtensionEnabled = result.vinylEnabled !== false;

        if (isExtensionEnabled) {
            document.body.classList.add('vinyl-active');
        } else {
            document.body.classList.remove('vinyl-active');

            // Bersihkan gaya secara real-time saat dimatikan
            if (skinEl) skinEl.style.display = 'none';
            if (pipVinyl) pipVinyl.classList.remove('active');
            player.classList.remove('hide-video');
            if (isMobile()) player.style.cssText = ""; // Hapus paksaan ukuran di mobile
            return; // Berhenti di sini, jangan proses efek vinyl
        }

        // === LOGIKA EFEK VINYL LAMA ===
        let speed = result.spinSpeed || 6;
        document.documentElement.style.setProperty('--spin-speed', `${speed}s`);

        const isVideoOff = (result.videoOn === false);

        // Desktop: MINIPLAYER attribute | Mobile: tidak akan sampai sini kalau bukan /watch
        const isMinimized = !isMobile() && player.getAttribute('player-ui-state') === 'MINIPLAYER';

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

        // PiP hanya untuk desktop minimize
        if (isMinimized) {
            pipVinyl.classList.add('active');
        } else {
            pipVinyl.classList.remove('active');
        }
    });
}

setInterval(applyVinylEffect, 300);

window.addEventListener('resize', () => {
    const player = document.querySelector('ytmusic-player');
    if (player) fixMobilePlayerSize(player);
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.spinSpeed) document.documentElement.style.setProperty('--spin-speed', `${changes.spinSpeed.newValue}s`);
});