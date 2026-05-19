let currentSongTitle = "";
let activeCoverUrl = null;
let sizeObserver = null;
let isSettingSize = false;
// === Variabel untuk Visualizer Audio (Beat Pulse) ===
let isBeatEnabled = false;
let audioCtx = null;
let analyser = null;
let audioSource = null;
let dataArray = null;
let beatAnimationId = null;
let beatMin = 1.00;
let beatMax = 1.12;
let beatSens = 1.5;
// Variabel baru untuk Transient Detection
let movingAverage = 0;
let currentVisualScale = 1.0;

function setupAudioVisualizer() {
    const video = document.querySelector('video');
    if (!video) return;

    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256; // Diperbesar agar resolusi frekuensi lebih detail
            audioSource = audioCtx.createMediaElementSource(video);
            audioSource.connect(analyser);
            analyser.connect(audioCtx.destination);
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        } catch (e) {
            console.log("AudioContext sudah terhubung ke node lain.", e);
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function loopBeat() {
    if (!isBeatEnabled || !analyser) {
        document.documentElement.style.setProperty('--beat-scale', '1');
        const player = document.querySelector('ytmusic-player');
        if (player) player.classList.remove('beat-active');
        if (beatAnimationId) cancelAnimationFrame(beatAnimationId);
        beatAnimationId = null;
        return;
    }

    analyser.getByteFrequencyData(dataArray);

    // 1. Ambil nilai tertinggi dari area sub-bass & kick drum
    let bassPeak = Math.max(dataArray[0], dataArray[1]);

    // 2. AUTO-THRESHOLD (Rahasia utama!)
    // Melacak "volume rata-rata" dari instrumen yang sedang main.
    // Instrumen panjang/konstan akan dianggap sebagai background.
    movingAverage = (movingAverage * 0.93) + (bassPeak * 0.07);

    // 3. TRANSIENT DETECTION dengan Sensitivity UI
    let beatIntensity = 0;
    if (bassPeak > movingAverage + 15) {
        let spike = bassPeak - movingAverage;

        // Normalisasi
        beatIntensity = Math.min(spike / 80, 1.0);

        // Exaggerate lalu KALIKAN dengan slider Sensitivity dari UI
        beatIntensity = Math.pow(beatIntensity, 1.5) * beatSens;

        // Kunci agar tidak melebihi 100% (1.0) meskipun sensitivitas di-set 4.0x
        beatIntensity = Math.min(beatIntensity, 1.0);
    }

    let safeMax = Math.min(beatMax, 1.30);
    let targetScale = beatMin + (beatIntensity * (safeMax - beatMin));

    // 4. ANIMASI GAYA PEGAS (JS EASING)
    // Kalau ada beat: Kaset nendang/mengembang sangat cepat
    if (targetScale > currentVisualScale) {
        currentVisualScale += (targetScale - currentVisualScale) * 0.7; // Kecepatan ngembang 70% per frame
    }
    // Kalau beat selesai: Kaset kempes pelan-pelan dan mulus
    else {
        currentVisualScale += (targetScale - currentVisualScale) * 0.15; // Kecepatan kempes 15% per frame
    }

    document.documentElement.style.setProperty('--beat-scale', currentVisualScale.toFixed(3));
    const player = document.querySelector('ytmusic-player');
    if (player) player.classList.add('beat-active');

    beatAnimationId = requestAnimationFrame(loopBeat);
}
function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent);
}

function fixMobilePlayerSize(player) {
    if (!isMobile()) return;
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.80;
    isSettingSize = true;
    player.style.setProperty('width', `${size}px`, 'important');
    player.style.setProperty('height', `${size}px`, 'important');
    player.style.setProperty('max-width', `${size}px`, 'important');
    player.style.setProperty('max-height', `${size}px`, 'important');
    player.style.setProperty('min-width', `${size}px`, 'important');
    player.style.setProperty('min-height', `${size}px`, 'important');
    isSettingSize = false;
}

function isPlayerPage() {
    return window.location.pathname.includes('/watch');
}

function cleanPlayerInlineSize(player) {
    if (isMobile()) {
        fixMobilePlayerSize(player);
        return;
    }
    isSettingSize = true;
    ['width', 'height', 'max-width', 'max-height', 'min-width', 'min-height'].forEach(prop => {
        player.style.removeProperty(prop);
    });
    isSettingSize = false;
}

function watchPlayerStyle(player) {
    if (sizeObserver) sizeObserver.disconnect();

    sizeObserver = new MutationObserver(() => {
        if (isSettingSize) return;
        chrome.storage.sync.get(['vinylEnabled'], (result) => {
            if (result.vinylEnabled === false) return;
            sizeObserver.disconnect();
            cleanPlayerInlineSize(player);
            sizeObserver.observe(player, { attributes: true, attributeFilter: ['style'] });
        });
    });

    sizeObserver.observe(player, { attributes: true, attributeFilter: ['style'] });
}

// Cek apakah lagu saat ini punya video sungguhan (bukan cover-only)
function playerHasVideo() {
    const video = document.querySelector('ytmusic-player video');
    return !!video && video.readyState > 0 && video.videoWidth > 0;
}

function applyVinylEffect() {
    const player = document.querySelector('ytmusic-player');
    const video = document.querySelector('video');
    const titleElement = document.querySelector('ytmusic-player-bar .title');

    if (!player) return;

    if (!sizeObserver) {
        watchPlayerStyle(player);
    }

    // === MOBILE: Sembunyikan kaset utama kalau bukan halaman /watch ===
    if (isMobile()) {
        if (!isPlayerPage()) {
            isSettingSize = true;
            player.style.setProperty('display', 'none', 'important');
            isSettingSize = false;
            const pipVinyl = document.getElementById('pip-vinyl');
            if (pipVinyl) pipVinyl.classList.remove('active');
            return;
        } else {
            isSettingSize = true;
            player.style.removeProperty('display');
            isSettingSize = false;
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

    chrome.storage.sync.get(['videoOn', 'spinSpeed', 'vinylEnabled', 'vinylBeat', 'beatMin', 'beatMax'], (result) => {
        let isExtensionEnabled = result.vinylEnabled !== false;

        if (isExtensionEnabled) {
            document.body.classList.add('vinyl-active');
        } else {
            document.body.classList.remove('vinyl-active');
            if (skinEl) skinEl.style.display = 'none';
            if (pipVinyl) pipVinyl.classList.remove('active');
            player.classList.remove('hide-video');
            if (isMobile()) player.style.cssText = "";
            return;
        }

        let speed = result.spinSpeed || 6;
        document.documentElement.style.setProperty('--spin-speed', `${speed}s`);

        const isVideoOff = (result.videoOn === false);
        const isMinimized = !isMobile() && player.getAttribute('player-ui-state') === 'MINIPLAYER';
        const hasTrueVideo = playerHasVideo();

        if (activeCoverUrl) {
            skinEl.style.setProperty('background-image', `url("${activeCoverUrl}")`, 'important');
            if (pipSkin) {
                pipSkin.style.setProperty('background-image', `url("${activeCoverUrl}")`, 'important');
            }
        }

        // Tampilkan vinyl-skin jika:
        // 1. User pilih hide video (videoOn = false), ATAU
        // 2. Lagu tidak punya video sama sekali (cover-only)
        if (isVideoOff || !hasTrueVideo) {
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
        // Sinkronisasi nilai range slider secara real-time dari storage ke engine
        beatMin = result.beatMin !== undefined ? result.beatMin : 1.00;
        beatMax = result.beatMax !== undefined ? result.beatMax : 1.12;
        beatSens = result.beatSens !== undefined ? result.beatSens : 1.5;
        // === LOGIKA MENGHIDUPKAN/MEMATIKAN BEAT PULSE ===
        let wasBeatEnabled = isBeatEnabled;
        isBeatEnabled = result.vinylBeat === true;

        if (isBeatEnabled && !wasBeatEnabled) {
            setupAudioVisualizer();
            if (!beatAnimationId) loopBeat();
        } else if (!isBeatEnabled && wasBeatEnabled) {
            // Mematikan efek kalau user uncheck di popup
            if (beatAnimationId) cancelAnimationFrame(beatAnimationId);
            beatAnimationId = null;
            document.documentElement.style.setProperty('--beat-scale', '1');
            player.classList.remove('beat-active');
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