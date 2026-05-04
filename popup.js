const masterToggle = document.getElementById('masterToggle');
const toggle = document.getElementById('videoToggle');
const slider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

// Load setting saat ekstensi diklik
chrome.storage.sync.get(['videoOn', 'spinSpeed', 'vinylEnabled'], (result) => {
    masterToggle.checked = result.vinylEnabled !== false; // Default ON
    toggle.checked = result.videoOn !== false;

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

// Update angka real-time dan simpan saat slider digeser
slider.addEventListener('input', () => {
    speedValue.innerText = slider.value;
    chrome.storage.sync.set({ spinSpeed: slider.value });
});