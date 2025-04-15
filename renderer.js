// --- Element References ---
const toggleButton = document.getElementById('toggle-sidebar-btn');
const closeSidebarButton = document.getElementById('close-sidebar-btn');
const sidebar = document.getElementById('info-sidebar');
const videoAreaToggleBtn = document.getElementById('toggle-video-area-btn');
const mainArea = document.querySelector('.app-main');
const loadBtn = document.getElementById('load-btn');
const videoPlayer = document.getElementById('video-player');
const statusBar = document.querySelector('.app-footer p');
const sidebarContent = document.getElementById('info-sidebar'); // Main sidebar container
const sidebarPlaceholder = document.getElementById('sidebar-placeholder'); // Initial message
const rotateLeftBtn = document.getElementById('rotate-left-btn');
const rotateRightBtn = document.getElementById('rotate-right-btn');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const skipBwd30Btn = document.getElementById('skip-bwd-30-btn');
const skipBwd10Btn = document.getElementById('skip-bwd-10-btn');
const skipFwd10Btn = document.getElementById('skip-fwd-10-btn');
const skipFwd30Btn = document.getElementById('skip-fwd-30-btn');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');
const seekBar = document.getElementById('seek-bar');
// NEW: Frame info elements
const frameInfoArea = document.getElementById('frame-info-area');
const totalFramesEl = document.getElementById('total-frames');
const currentFrameEl = document.getElementById('current-frame');


// --- State Variables ---
let currentMetadataRotation = 0;
let currentManualRotation = 0;
let currentFrameRate = 0; // NEW: Store video frame rate

// --- Helper Function: Format Time ---
function formatTime(seconds) { /* ... (formatTime unchanged) ... */
    if (isNaN(seconds) || seconds < 0) { return "-:--.--"; }
    const minutes = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); const hundredths = Math.floor((seconds * 100) % 100);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}.${hundredths < 10 ? '0' : ''}${hundredths}`;
}

// --- Helper Function: Parse FPS String (e.g., "30000/1001") ---
function parseFps(fpsString) {
    if (!fpsString) return 0;
    if (fpsString.includes('/')) {
        const parts = fpsString.split('/');
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
            return numerator / denominator;
        }
    }
    const fps = parseFloat(fpsString);
    return isNaN(fps) ? 0 : fps;
}


// --- Sidebar Logic ---
if (toggleButton && sidebar) { toggleButton.addEventListener('click', () => { sidebar.classList.toggle('open'); }); }
if (closeSidebarButton && sidebar) { closeSidebarButton.addEventListener('click', () => { sidebar.classList.remove('open'); }); }

// --- Video Area Collapse/Expand Logic ---
if (videoAreaToggleBtn && mainArea) { videoAreaToggleBtn.addEventListener('click', () => { mainArea.classList.toggle('layout-collapsed'); mainArea.classList.toggle('layout-expanded'); }); }
else { console.error('Could not find video area toggle button or main area element.'); }

// --- Rotation Logic ---
function applyRotation() { /* ... (rotation logic unchanged) ... */
    if (!videoPlayer) return; const finalRotation = ((currentMetadataRotation + currentManualRotation) % 360 + 360) % 360; videoPlayer.classList.remove('rotated-90', 'rotated-180', 'rotated-270');
    if (finalRotation === 90) { videoPlayer.classList.add('rotated-90'); } else if (finalRotation === 180) { videoPlayer.classList.add('rotated-180'); } else if (finalRotation === 270) { videoPlayer.classList.add('rotated-270'); } console.log(`Applying rotation: Meta=${currentMetadataRotation}, Manual=${currentManualRotation}, Final=${finalRotation}`);
}
if (rotateLeftBtn && videoPlayer) { rotateLeftBtn.addEventListener('click', () => { currentManualRotation = (currentManualRotation - 90 + 360) % 360; applyRotation(); }); } else { console.error('Rotate Left button or video player not found.'); }
if (rotateRightBtn && videoPlayer) { rotateRightBtn.addEventListener('click', () => { currentManualRotation = (currentManualRotation + 90) % 360; applyRotation(); }); } else { console.error('Rotate Right button or video player not found.'); }

// --- Metadata & Frame Display Logic ---
function displayMetadataAndFrames(metadata) {
    console.log("Received Metadata Object:", JSON.stringify(metadata, null, 2));
    // Ensure containers exist (create if necessary, though now static in HTML)
    let metadataContainer = sidebarContent.querySelector('.metadata-content');
    if (!metadataContainer) {
        metadataContainer = document.createElement('div');
        metadataContainer.className = 'metadata-content';
        const h2 = sidebarContent.querySelector('h2');
        if (h2) h2.insertAdjacentElement('afterend', metadataContainer);
        else sidebarContent.insertBefore(metadataContainer, frameInfoArea); // Insert before frame area if h2 missing
    }

    metadataContainer.innerHTML = ''; // Clear previous metadata
    if (totalFramesEl) totalFramesEl.textContent = 'N/A'; // Reset frame display
    if (currentFrameEl) currentFrameEl.textContent = 'N/A';
    currentFrameRate = 0; // Reset frame rate state
    let rotation = 0;

    // Hide placeholder, show info areas
    if (sidebarPlaceholder) sidebarPlaceholder.style.display = 'none';
    metadataContainer.style.display = 'block';
    if (frameInfoArea) frameInfoArea.style.display = 'block';
    if (sidebar) sidebar.classList.add('has-content'); // Add class to sidebar if needed by CSS

    if (!metadata) {
        metadataContainer.innerHTML = '<p>Could not load metadata.</p>';
    } else {
        // Display Format Info
        if (metadata.format) {
            metadataContainer.innerHTML += `<p><strong>Format:</strong> ${metadata.format.format_long_name || metadata.format.format_name || 'N/A'}</p>`;
            metadataContainer.innerHTML += `<p><strong>Duration:</strong> ${metadata.format.duration ? parseFloat(metadata.format.duration).toFixed(2) + 's' : 'N/A'}</p>`;
            // ... (other format info) ...
        }
        // Display Stream Info
        const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams?.find(s => s.codec_type === 'audio');

        if (videoStream) {
            metadataContainer.innerHTML += `<hr><p><strong>Video Stream:</strong></p>`;
            metadataContainer.innerHTML += `<p>Codec: ${videoStream.codec_long_name || videoStream.codec_name || 'N/A'}</p>`;
            metadataContainer.innerHTML += `<p>Resolution: ${videoStream.width || 'N/A'}x${videoStream.height || 'N/A'}</p>`;

            // Extract and store Frame Rate
            const fpsString = videoStream.r_frame_rate || videoStream.avg_frame_rate;
            currentFrameRate = parseFps(fpsString); // Use helper
            metadataContainer.innerHTML += `<p>Frame Rate: ${currentFrameRate > 0 ? currentFrameRate.toFixed(3) + ' fps' : (fpsString || 'N/A')}</p>`;

            // Extract Rotation
            if (videoStream.tags?.rotate) {
                rotation = parseInt(videoStream.tags.rotate, 10);
                metadataContainer.innerHTML += `<p>Rotation Tag: ${rotation}°</p>`;
            } else {
                metadataContainer.innerHTML += `<p>Rotation Tag: 0°</p>`;
            }

            // Calculate and Display Total Frames
            const duration = metadata.format?.duration ? parseFloat(metadata.format.duration) : (videoPlayer?.duration || 0);
            let calculatedTotalFrames = 0; // Initialize
            if (totalFramesEl) {
                if (currentFrameRate > 0 && duration > 0) {
                    calculatedTotalFrames = Math.round(duration * currentFrameRate); // Calculate frames
                    totalFramesEl.textContent = calculatedTotalFrames.toString();
                } else {
                    totalFramesEl.textContent = 'N/A'; // If duration/fps missing
                }
            }
            // Also log the value from metadata if present
            if (videoStream.nb_frames) {
                console.log(`Metadata nb_frames: ${videoStream.nb_frames}`);
            }
        }
        if (audioStream) { /* ... display audio metadata ... */
            metadataContainer.innerHTML += `<hr><p><strong>Audio Stream:</strong></p><p>Codec: ${audioStream.codec_long_name || aStream.codec_name || 'N/A'}</p><p>Channels: ${audioStream.channels || 'N/A'} (${audioStream.channel_layout || ''})</p><p>Sample Rate: ${audioStream.sample_rate || 'N/A'} Hz</p>`;
        }
    }
    return rotation;
}

// --- Load Video Logic ---
if (loadBtn && videoPlayer && statusBar && window.electronAPI) {
    loadBtn.addEventListener('click', async () => {
        console.log('Load button clicked.'); statusBar.textContent = 'Status: Opening file dialog...';
        currentManualRotation = 0; videoPlayer.src = ''; videoPlayer.removeAttribute('src');
        displayMetadataAndFrames(null); // Clear old metadata and frame info, hide areas
        if (sidebarPlaceholder) sidebarPlaceholder.style.display = 'block'; // Show placeholder again
        if (sidebar) sidebar.classList.remove('has-content');
        if (currentTimeEl) currentTimeEl.textContent = formatTime(0); if (totalDurationEl) totalDurationEl.textContent = formatTime(0); if (seekBar) { seekBar.value = 0; seekBar.max = 100; } applyRotation();

        try {
            const data = await window.electronAPI.openFile();
            if (data && data.filePath) {
                const filePath = data.filePath; const metadata = data.metadata;
                videoPlayer.src = filePath; videoPlayer.load();
                const filename = filePath.split(/[\\/]/).pop(); statusBar.textContent = `Status: Loaded - ${filename}`;

                // Display metadata/frames and get rotation AFTER video metadata is potentially ready
                // Use 'loadedmetadata' event on video player for duration access
                videoPlayer.onloadedmetadata = () => { // Changed from onloadeddata
                    console.log('Video metadata loaded successfully.');
                    if (totalDurationEl) totalDurationEl.textContent = formatTime(videoPlayer.duration);
                    if (seekBar) seekBar.max = videoPlayer.duration;
                    // Now display metadata and frames using potentially more accurate duration
                    currentMetadataRotation = displayMetadataAndFrames(metadata);
                    applyRotation(); // Apply rotation based on metadata
                };

                videoPlayer.onerror = (e) => { /* ... error handling ... */
                    console.error('Video Error:', videoPlayer.error); statusBar.textContent = `Status: Error loading video - ${filename}`;
                    if (sidebarPlaceholder) sidebarPlaceholder.style.display = 'block';
                    if (frameInfoArea) frameInfoArea.style.display = 'none';
                    const metaContainer = sidebarContent.querySelector('.metadata-content'); if (metaContainer) metaContainer.style.display = 'none';
                    if (sidebar) sidebar.classList.remove('has-content');
                };

            } else { /* ... handle cancellation ... */
                statusBar.textContent = 'Status: File selection cancelled or failed.'; displayMetadataAndFrames(null); currentMetadataRotation = 0; applyRotation();
                if (sidebarPlaceholder) sidebarPlaceholder.style.display = 'block'; if (sidebar) sidebar.classList.remove('has-content');
                if (currentTimeEl) currentTimeEl.textContent = formatTime(NaN); if (totalDurationEl) totalDurationEl.textContent = formatTime(NaN); if (seekBar) { seekBar.value = 0; seekBar.max = 100; }
            }
        } catch (error) { /* ... handle error ... */
            console.error('Error in openFile process:', error); statusBar.textContent = 'Status: Error opening file.'; displayMetadataAndFrames(null); currentMetadataRotation = 0; applyRotation();
            if (sidebarPlaceholder) sidebarPlaceholder.style.display = 'block'; if (sidebar) sidebar.classList.remove('has-content');
            if (currentTimeEl) currentTimeEl.textContent = formatTime(NaN); if (totalDurationEl) totalDurationEl.textContent = formatTime(NaN); if (seekBar) { seekBar.value = 0; seekBar.max = 100; }
        }
    });
} else { console.error('Load button, video player, status bar or electronAPI not found.'); }


// --- Header Transport Control Logic ---
/* ... (Transport listeners unchanged) ... */
if (playBtn && videoPlayer) { playBtn.addEventListener('click', () => { videoPlayer.play().catch(e => console.error('Playback error:', e)); }); } else { console.error('Play button or video player not found.'); }
if (pauseBtn && videoPlayer) { pauseBtn.addEventListener('click', () => { videoPlayer.pause(); }); } else { console.error('Pause button or video player not found.'); }
if (stopBtn && videoPlayer) { stopBtn.addEventListener('click', () => { videoPlayer.pause(); videoPlayer.currentTime = 0; }); } else { console.error('Stop button or video player not found.'); }
if (skipBwd30Btn && videoPlayer) { skipBwd30Btn.addEventListener('click', () => { videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 30); }); } else { console.error('Skip Bwd 30s button or video player not found.'); }
if (skipBwd10Btn && videoPlayer) { skipBwd10Btn.addEventListener('click', () => { videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10); }); } else { console.error('Skip Bwd 10s button or video player not found.'); }
if (skipFwd10Btn && videoPlayer) { skipFwd10Btn.addEventListener('click', () => { videoPlayer.currentTime += 10; }); } else { console.error('Skip Fwd 10s button or video player not found.'); }
if (skipFwd30Btn && videoPlayer) { skipFwd30Btn.addEventListener('click', () => { videoPlayer.currentTime += 30; }); } else { console.error('Skip Fwd 30s button or video player not found.'); }


// --- Video Player Event Listeners ---
if (videoPlayer) {
    // Play/Pause state sync
    if (playBtn && pauseBtn) { /* ... (play/pause sync unchanged) ... */
        videoPlayer.addEventListener('play', () => { playBtn.disabled = true; pauseBtn.disabled = false; playBtn.style.opacity = 0.5; pauseBtn.style.opacity = 1.0; });
        videoPlayer.addEventListener('pause', () => { playBtn.disabled = false; pauseBtn.disabled = true; playBtn.style.opacity = 1.0; pauseBtn.style.opacity = 0.5; });
        pauseBtn.disabled = true; pauseBtn.style.opacity = 0.5; // Initial state
    }

    /// Time update listener
if (currentTimeEl && seekBar && currentFrameEl) {
    videoPlayer.addEventListener('timeupdate', () => {
        const currentTime = videoPlayer.currentTime;
        const duration = videoPlayer.duration; // Get duration
        currentTimeEl.textContent = formatTime(currentTime);
        // Update seek bar ONLY if the user isn't currently dragging it
        // (We might add a flag later, for now update always)
        if (seekBar) seekBar.value = currentTime;

        // Update current frame number
        if (currentFrameRate > 0 && duration > 0) {
            const calculatedTotalFrames = Math.round(duration * currentFrameRate); // Recalculate or retrieve stored total
            const currentFrame = Math.floor(currentTime * currentFrameRate);
            // Clamp current frame to not exceed total frames
            currentFrameEl.textContent = Math.min(calculatedTotalFrames, currentFrame).toString();
        } else {
            currentFrameEl.textContent = 'N/A';
        }
    });
}

    // Ended listener
    videoPlayer.addEventListener('ended', () => { /* ... (ended listener unchanged) ... */
        console.log('Video ended'); if (playBtn && pauseBtn) { playBtn.disabled = false; pauseBtn.disabled = true; playBtn.style.opacity = 1.0; pauseBtn.style.opacity = 0.5; }
    });

}

// --- Seek Bar Interaction Logic ---
if (seekBar && videoPlayer) { /* ... (seek bar listener unchanged) ... */
    seekBar.addEventListener('input', () => {
        videoPlayer.currentTime = seekBar.value;
        if (currentTimeEl) { currentTimeEl.textContent = formatTime(seekBar.value); }
        // Update frame number immediately while seeking
        if (currentFrameEl && currentFrameRate > 0) {
            currentFrameEl.textContent = Math.floor(parseFloat(seekBar.value) * currentFrameRate).toString();
        } else if (currentFrameEl) {
            currentFrameEl.textContent = 'N/A';
        }
    });
} else { console.error('Seek bar or video player not found.'); }

// --- Final Log ---
console.log('Renderer Process Loaded.');