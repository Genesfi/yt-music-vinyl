const masterToggle = document.getElementById('masterToggle');
const toggle = document.getElementById('videoToggle');
const slider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const beatToggle = document.getElementById('beatToggle');
const minScaleSlider = document.getElementById('minScaleSlider');
const minScaleValue = document.getElementById('minScaleValue');
const maxScaleSlider = document.getElementById('maxScaleSlider');
const maxScaleValue = document.getElementById('maxScaleValue');
const sensSlider = document.getElementById('sensSlider');
const sensValue = document.getElementById('sensValue');
const resetBtn = document.getElementById('resetBtn');

// Load setting saat ekstensi diklik
chrome.storage.sync.get(['videoOn', 'spinSpeed', 'vinylEnabled', 'vinylBeat', 'beatMin', 'beatMax', 'beatSens'], (result) => {
    masterToggle.checked = result.vinylEnabled !== false; // Default ON
    toggle.checked = result.videoOn !== false;
    beatToggle.checked = result.vinylBeat === true; // Default OFF

    // Ambil nilai simpanan atau gunakan default jika belum diset
    const currentMin = result.beatMin !== undefined ? result.beatMin : 1.00;
    const currentMax = result.beatMax !== undefined ? result.beatMax : 1.12;

    minScaleSlider.value = currentMin;
    minScaleValue.innerText = currentMin;

    maxScaleSlider.value = currentMax;
    maxScaleValue.innerText = currentMax;

    // Setup Sensitivity Slider
    const currentSens = result.beatSens !== undefined ? result.beatSens : 1.5;
    sensSlider.value = currentSens;
    sensValue.innerText = currentSens;

    if (result.spinSpeed) {
        slider.value = result.spinSpeed;
        speedValue.innerText = result.spinSpeed;
    }
});

// Simpan Master Toggle (BARU)
masterToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ vinylEnabled: masterToggle.checked });
});

// Simpan saat fitur video ON/OFF diubah
toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ videoOn: toggle.checked });
});

// Simpan saat fitur Beat Pulse diubah
beatToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ vinylBeat: beatToggle.checked });
});

// Simpan perubahan Min Scale
minScaleSlider.addEventListener('input', () => {
    minScaleValue.innerText = minScaleSlider.value;
    chrome.storage.sync.set({ beatMin: parseFloat(minScaleSlider.value) });
});

// Simpan perubahan Max Scale
maxScaleSlider.addEventListener('input', () => {
    maxScaleValue.innerText = maxScaleSlider.value;
    chrome.storage.sync.set({ beatMax: parseFloat(maxScaleSlider.value) });
});

// Simpan perubahan Sensitivity
sensSlider.addEventListener('input', () => {
    sensValue.innerText = sensSlider.value;
    chrome.storage.sync.set({ beatSens: parseFloat(sensSlider.value) });
});

// Fitur Reset ke Default
resetBtn.addEventListener('click', () => {
    // 1. Kembalikan angka UI ke awal
    minScaleSlider.value = 1.00;
    minScaleValue.innerText = "1.00";

    maxScaleSlider.value = 1.12;
    maxScaleValue.innerText = "1.12";

    sensSlider.value = 1.5;
    sensValue.innerText = "1.5";

    slider.value = 10;
    speedValue.innerText = "10";

    // 2. Simpan ke storage chrome
    chrome.storage.sync.set({
        beatMin: 1.00,
        beatMax: 1.12,
        beatSens: 1.5,
        spinSpeed: 10
    });

    // Opsional: Efek visual diklik biar kerasa
    resetBtn.innerText = "Resetting...";
    setTimeout(() => { resetBtn.innerText = "Reset to Default"; }, 500);
});

// Update angka real-time dan simpan saat slider digeser
slider.addEventListener('input', () => {
    speedValue.innerText = slider.value;
    chrome.storage.sync.set({ spinSpeed: slider.value });
});