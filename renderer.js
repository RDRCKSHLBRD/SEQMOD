// --- Element References ---
const toggleButton = document.getElementById('toggle-sidebar-btn');
const closeSidebarButton = document.getElementById('close-sidebar-btn');
const sidebar = document.getElementById('info-sidebar');
const videoAreaToggleBtn = document.getElementById('toggle-video-area-btn');
const mainArea = document.querySelector('.app-main');
const loadBtn = document.getElementById('load-btn');
const videoPlayer = document.getElementById('video-player');
const statusBar = document.querySelector('.app-footer p');
const sidebarContent = document.getElementById('info-sidebar');
const rotateLeftBtn = document.getElementById('rotate-left-btn');
const rotateRightBtn = document.getElementById('rotate-right-btn');
// NEW: Transport button references
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const skipBwd30Btn = document.getElementById('skip-bwd-30-btn');
const skipBwd10Btn = document.getElementById('skip-bwd-10-btn');
const skipFwd10Btn = document.getElementById('skip-fwd-10-btn');
const skipFwd30Btn = document.getElementById('skip-fwd-30-btn');
// Add other button refs (rewind, ffwd, keyframes, in/out, loop, macro) here later when implementing


// --- State Variables ---
let currentMetadataRotation = 0;
let currentManualRotation = 0;

// --- Sidebar Logic ---
if (toggleButton && sidebar) {
    toggleButton.addEventListener('click', () => { sidebar.classList.toggle('open'); });
}
if (closeSidebarButton && sidebar) {
    closeSidebarButton.addEventListener('click', () => { sidebar.classList.remove('open'); });
}

// --- Video Area Collapse/Expand Logic ---
if (videoAreaToggleBtn && mainArea) {
    videoAreaToggleBtn.addEventListener('click', () => {
        mainArea.classList.toggle('layout-collapsed');
        mainArea.classList.toggle('layout-expanded');
    });
} else { console.error('Could not find video area toggle button or main area element.'); }

// --- Rotation Logic ---
function applyRotation() { /* ... (rotation logic remains the same) ... */
    if (!videoPlayer) return;
    const finalRotation = ((currentMetadataRotation + currentManualRotation) % 360 + 360) % 360;
    videoPlayer.classList.remove('rotated-90', 'rotated-180', 'rotated-270');
    if (finalRotation === 90) { videoPlayer.classList.add('rotated-90'); }
    else if (finalRotation === 180) { videoPlayer.classList.add('rotated-180'); }
    else if (finalRotation === 270) { videoPlayer.classList.add('rotated-270'); }
    console.log(`Applying rotation: Meta=${currentMetadataRotation}, Manual=${currentManualRotation}, Final=${finalRotation}`);
}

if (rotateLeftBtn && videoPlayer) {
    rotateLeftBtn.addEventListener('click', () => {
        currentManualRotation = (currentManualRotation - 90 + 360) % 360;
        applyRotation();
    });
} else { console.error('Rotate Left button or video player not found.'); }

if (rotateRightBtn && videoPlayer) {
    rotateRightBtn.addEventListener('click', () => {
        currentManualRotation = (currentManualRotation + 90) % 360;
        applyRotation();
    });
} else { console.error('Rotate Right button or video player not found.'); }


// --- Metadata Display Logic ---
function displayMetadata(metadata) { /* ... (metadata display logic remains the same) ... */
    const metadataContainer = sidebarContent.querySelector('.metadata-content') || document.createElement('div');
    metadataContainer.className = 'metadata-content';
    metadataContainer.innerHTML = '';
    let rotation = 0;
    if (!metadata) { metadataContainer.innerHTML = '<p>Could not load metadata.</p>'; }
    else {
        if (metadata.format) {
            metadataContainer.innerHTML += `<p><strong>Format:</strong> ${metadata.format.format_long_name || metadata.format.format_name || 'N/A'}</p>`;
            metadataContainer.innerHTML += `<p><strong>Duration:</strong> ${metadata.format.duration ? parseFloat(metadata.format.duration).toFixed(2) + 's' : 'N/A'}</p>`;
            metadataContainer.innerHTML += `<p><strong>Size:</strong> ${metadata.format.size ? (metadata.format.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</p>`;
            metadataContainer.innerHTML += `<p><strong>Bit Rate:</strong> ${metadata.format.bit_rate ? (metadata.format.bit_rate / 1000).toFixed(0) + ' kb/s' : 'N/A'}</p>`;
        }
        const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams?.find(s => s.codec_type === 'audio');
        if (videoStream) {
             metadataContainer.innerHTML += `<hr><p><strong>Video Stream:</strong></p>`;
             metadataContainer.innerHTML += `<p>Codec: ${videoStream.codec_long_name || videoStream.codec_name || 'N/A'}</p>`;
             metadataContainer.innerHTML += `<p>Resolution: ${videoStream.width || 'N/A'}x${videoStream.height || 'N/A'}</p>`;
             metadataContainer.innerHTML += `<p>Frame Rate: ${videoStream.r_frame_rate || videoStream.avg_frame_rate || 'N/A'}</p>`;
            if (videoStream.tags?.rotate) {
                rotation = parseInt(videoStream.tags.rotate, 10);
                metadataContainer.innerHTML += `<p>Rotation Tag: ${rotation}°</p>`;
            } else { metadataContainer.innerHTML += `<p>Rotation Tag: 0°</p>`; }
        }
         if (audioStream) {
             metadataContainer.innerHTML += `<hr><p><strong>Audio Stream:</strong></p>`;
             metadataContainer.innerHTML += `<p>Codec: ${audioStream.codec_long_name || audioStream.codec_name || 'N/A'}</p>`;
             metadataContainer.innerHTML += `<p>Channels: ${audioStream.channels || 'N/A'} (${audioStream.channel_layout || ''})</p>`;
             metadataContainer.innerHTML += `<p>Sample Rate: ${audioStream.sample_rate || 'N/A'} Hz</p>`;
        }
    }
    if (!metadataContainer.parentNode) {
       const h2 = sidebarContent.querySelector('h2');
       if (h2) { h2.insertAdjacentElement('afterend', metadataContainer); }
       else { sidebarContent.appendChild(metadataContainer); }
    }
    return rotation;
 }

// --- Load Video Logic ---
if (loadBtn && videoPlayer && statusBar && window.electronAPI) {
    loadBtn.addEventListener('click', async () => { /* ... (load logic remains the same) ... */
        console.log('Load button clicked.');
        statusBar.textContent = 'Status: Opening file dialog...';
        currentManualRotation = 0;
        videoPlayer.src = '';
        const metadataContent = sidebarContent.querySelector('.metadata-content');
        if (metadataContent) metadataContent.innerHTML = '<p>Loading metadata...</p>';
        applyRotation();

        try {
            const data = await window.electronAPI.openFile();
            if (data && data.filePath) {
                const filePath = data.filePath;
                const metadata = data.metadata;
                videoPlayer.src = filePath;
                videoPlayer.load();
                const filename = filePath.split(/[\\/]/).pop();
                statusBar.textContent = `Status: Loaded - ${filename}`;
                currentMetadataRotation = displayMetadata(metadata);
                applyRotation();
                videoPlayer.onerror = (e) => { console.error('Video Error:', videoPlayer.error); statusBar.textContent = `Status: Error loading video - ${filename}`; };
                videoPlayer.onloadeddata = () => { console.log('Video data loaded successfully.'); };
            } else {
                statusBar.textContent = 'Status: File selection cancelled or failed.';
                displayMetadata(null);
                currentMetadataRotation = 0;
                applyRotation();
            }
        } catch (error) {
            console.error('Error in openFile process:', error);
            statusBar.textContent = 'Status: Error opening file.';
            displayMetadata(null);
             currentMetadataRotation = 0;
             applyRotation();
        }
     });
} else { console.error('Load button, video player, status bar or electronAPI not found.'); }


// --- NEW: Header Transport Control Logic ---

// Play Button
if (playBtn && videoPlayer) {
    playBtn.addEventListener('click', () => {
        videoPlayer.play()
            .then(() => console.log('Playback started'))
            .catch(e => console.error('Playback error:', e));
    });
} else { console.error('Play button or video player not found.'); }

// Pause Button
if (pauseBtn && videoPlayer) {
    pauseBtn.addEventListener('click', () => {
        videoPlayer.pause();
        console.log('Playback paused');
    });
} else { console.error('Pause button or video player not found.'); }

// Stop Button (Pause + Reset time)
if (stopBtn && videoPlayer) {
    stopBtn.addEventListener('click', () => {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        console.log('Playback stopped (paused and reset)');
    });
} else { console.error('Stop button or video player not found.'); }

// Skip Buttons
if (skipBwd30Btn && videoPlayer) {
    skipBwd30Btn.addEventListener('click', () => {
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 30); // Prevent going below 0
        console.log('Skipped back 30s');
    });
} else { console.error('Skip Bwd 30s button or video player not found.'); }

if (skipBwd10Btn && videoPlayer) {
    skipBwd10Btn.addEventListener('click', () => {
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
        console.log('Skipped back 10s');
    });
} else { console.error('Skip Bwd 10s button or video player not found.'); }

if (skipFwd10Btn && videoPlayer) {
    skipFwd10Btn.addEventListener('click', () => {
        // Add check for duration if needed: if (videoPlayer.currentTime + 10 < videoPlayer.duration)
        videoPlayer.currentTime += 10;
        console.log('Skipped forward 10s');
    });
} else { console.error('Skip Fwd 10s button or video player not found.'); }

if (skipFwd30Btn && videoPlayer) {
    skipFwd30Btn.addEventListener('click', () => {
        videoPlayer.currentTime += 30;
        console.log('Skipped forward 30s');
    });
} else { console.error('Skip Fwd 30s button or video player not found.'); }

// --- Optional: Update Play/Pause Button Appearance based on Video State ---
if(videoPlayer && playBtn && pauseBtn) {
    videoPlayer.addEventListener('play', () => {
        console.log('Video playing event');
        // Maybe visually disable play, enable pause
        playBtn.disabled = true;
        pauseBtn.disabled = false;
         playBtn.style.opacity = 0.5;
         pauseBtn.style.opacity = 1.0;
    });

    videoPlayer.addEventListener('pause', () => {
        console.log('Video paused event');
         // Maybe visually disable pause, enable play
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        playBtn.style.opacity = 1.0;
        pauseBtn.style.opacity = 0.5;
    });

     // Initial state (assuming video loads paused)
     pauseBtn.disabled = true;
     pauseBtn.style.opacity = 0.5;
}


// --- Add other renderer process logic below ---
console.log('Renderer Process Loaded.');