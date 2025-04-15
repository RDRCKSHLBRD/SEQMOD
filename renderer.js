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
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const skipBwd30Btn = document.getElementById('skip-bwd-30-btn');
const skipBwd10Btn = document.getElementById('skip-bwd-10-btn');
const skipFwd10Btn = document.getElementById('skip-fwd-10-btn');
const skipFwd30Btn = document.getElementById('skip-fwd-30-btn');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');
// NEW: Seek bar reference
const seekBar = document.getElementById('seek-bar');


// --- State Variables ---
let currentMetadataRotation = 0;
let currentManualRotation = 0;

// --- Helper Function: Format Time ---
function formatTime(seconds) { /* ... (formatTime unchanged) ... */
    if (isNaN(seconds) || seconds < 0) { return "-:--.--"; }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hundredths = Math.floor((seconds * 100) % 100);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}.${hundredths < 10 ? '0' : ''}${hundredths}`;
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

// --- Metadata Display Logic ---
function displayMetadata(metadata) { /* ... (metadata display logic unchanged) ... */
    const metadataContainer = sidebarContent.querySelector('.metadata-content') || document.createElement('div'); metadataContainer.className = 'metadata-content'; metadataContainer.innerHTML = ''; let rotation = 0;
    if (!metadata) { metadataContainer.innerHTML = '<p>Could not load metadata.</p>'; } else { /* ... populate metadata ... */ if (metadata.format) { metadataContainer.innerHTML += `<p><strong>Format:</strong> ${metadata.format.format_long_name||metadata.format.format_name||'N/A'}</p><p><strong>Duration:</strong> ${metadata.format.duration?parseFloat(metadata.format.duration).toFixed(2)+'s':'N/A'}</p><p><strong>Size:</strong> ${metadata.format.size?(metadata.format.size/1024/1024).toFixed(2)+' MB':'N/A'}</p><p><strong>Bit Rate:</strong> ${metadata.format.bit_rate?(metadata.format.bit_rate/1000).toFixed(0)+' kb/s':'N/A'}</p>`; } const vStream = metadata.streams?.find(s=>s.codec_type==='video'); const aStream = metadata.streams?.find(s=>s.codec_type==='audio'); if(vStream){ metadataContainer.innerHTML+=`<hr><p><strong>Video Stream:</strong></p><p>Codec: ${vStream.codec_long_name||vStream.codec_name||'N/A'}</p><p>Resolution: ${vStream.width||'N/A'}x${vStream.height||'N/A'}</p><p>Frame Rate: ${vStream.r_frame_rate||vStream.avg_frame_rate||'N/A'}</p>`; if(vStream.tags?.rotate){rotation=parseInt(vStream.tags.rotate,10);metadataContainer.innerHTML+=`<p>Rotation Tag: ${rotation}°</p>`;}else{metadataContainer.innerHTML+=`<p>Rotation Tag: 0°</p>`;}} if(aStream){ metadataContainer.innerHTML+=`<hr><p><strong>Audio Stream:</strong></p><p>Codec: ${aStream.codec_long_name||aStream.codec_name||'N/A'}</p><p>Channels: ${aStream.channels||'N/A'} (${aStream.channel_layout||''})</p><p>Sample Rate: ${aStream.sample_rate||'N/A'} Hz</p>`;} }
    if (!metadataContainer.parentNode) { const h2 = sidebarContent.querySelector('h2'); if(h2) { h2.insertAdjacentElement('afterend', metadataContainer); } else { sidebarContent.appendChild(metadataContainer); } } return rotation;
}

// --- Load Video Logic ---
if (loadBtn && videoPlayer && statusBar && window.electronAPI) {
    loadBtn.addEventListener('click', async () => { /* ... (load logic mostly unchanged) ... */
        console.log('Load button clicked.'); statusBar.textContent = 'Status: Opening file dialog...';
        currentManualRotation = 0; videoPlayer.src = ''; videoPlayer.removeAttribute('src'); // Ensure it's really cleared
        const metadataContent = sidebarContent.querySelector('.metadata-content'); if(metadataContent) metadataContent.innerHTML = '<p>Loading metadata...</p>';
        if(currentTimeEl) currentTimeEl.textContent = formatTime(0); if(totalDurationEl) totalDurationEl.textContent = formatTime(0); if(seekBar) seekBar.value = 0; // Reset seek bar
        applyRotation();

        try {
            const data = await window.electronAPI.openFile();
            if (data && data.filePath) {
                const filePath = data.filePath; const metadata = data.metadata;
                videoPlayer.src = filePath; videoPlayer.load();
                const filename = filePath.split(/[\\/]/).pop(); statusBar.textContent = `Status: Loaded - ${filename}`;
                currentMetadataRotation = displayMetadata(metadata); applyRotation();
                videoPlayer.onerror = (e) => { console.error('Video Error:', videoPlayer.error); statusBar.textContent = `Status: Error loading video - ${filename}`; };
                videoPlayer.onloadeddata = () => {
                    console.log('Video data loaded successfully.');
                    if (totalDurationEl) totalDurationEl.textContent = formatTime(videoPlayer.duration);
                    if (seekBar) seekBar.max = videoPlayer.duration; // Set seek bar max value
                };
            } else {
                statusBar.textContent = 'Status: File selection cancelled or failed.'; displayMetadata(null); currentMetadataRotation = 0; applyRotation();
                if(currentTimeEl) currentTimeEl.textContent = formatTime(NaN); if(totalDurationEl) totalDurationEl.textContent = formatTime(NaN); if(seekBar) { seekBar.value = 0; seekBar.max = 100; } // Reset seek bar
            }
        } catch (error) {
            console.error('Error in openFile process:', error); statusBar.textContent = 'Status: Error opening file.'; displayMetadata(null); currentMetadataRotation = 0; applyRotation();
            if(currentTimeEl) currentTimeEl.textContent = formatTime(NaN); if(totalDurationEl) totalDurationEl.textContent = formatTime(NaN); if(seekBar) { seekBar.value = 0; seekBar.max = 100; } // Reset seek bar
        }
     });
} else { console.error('Load button, video player, status bar or electronAPI not found.'); }

// --- Header Transport Control Logic ---
if (playBtn && videoPlayer) { playBtn.addEventListener('click', () => { videoPlayer.play().catch(e => console.error('Playback error:', e)); }); } else { console.error('Play button or video player not found.'); }
if (pauseBtn && videoPlayer) { pauseBtn.addEventListener('click', () => { videoPlayer.pause(); }); } else { console.error('Pause button or video player not found.'); }
if (stopBtn && videoPlayer) { stopBtn.addEventListener('click', () => { videoPlayer.pause(); videoPlayer.currentTime = 0; }); } else { console.error('Stop button or video player not found.'); }
if (skipBwd30Btn && videoPlayer) { skipBwd30Btn.addEventListener('click', () => { videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 30); }); } else { console.error('Skip Bwd 30s button or video player not found.'); }
if (skipBwd10Btn && videoPlayer) { skipBwd10Btn.addEventListener('click', () => { videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10); }); } else { console.error('Skip Bwd 10s button or video player not found.'); }
if (skipFwd10Btn && videoPlayer) { skipFwd10Btn.addEventListener('click', () => { videoPlayer.currentTime += 10; }); } else { console.error('Skip Fwd 10s button or video player not found.'); }
if (skipFwd30Btn && videoPlayer) { skipFwd30Btn.addEventListener('click', () => { videoPlayer.currentTime += 30; }); } else { console.error('Skip Fwd 30s button or video player not found.'); }

// --- Video Player Event Listeners ---
if(videoPlayer) {
    // Play/Pause state sync
    if (playBtn && pauseBtn) {
        videoPlayer.addEventListener('play', () => { playBtn.disabled = true; pauseBtn.disabled = false; playBtn.style.opacity = 0.5; pauseBtn.style.opacity = 1.0; });
        videoPlayer.addEventListener('pause', () => { playBtn.disabled = false; pauseBtn.disabled = true; playBtn.style.opacity = 1.0; pauseBtn.style.opacity = 0.5; });
        // Initial state
         pauseBtn.disabled = true; pauseBtn.style.opacity = 0.5;
    }

    // Time update listener (updates current time display AND seek bar)
    if (currentTimeEl && seekBar) {
        videoPlayer.addEventListener('timeupdate', () => {
            currentTimeEl.textContent = formatTime(videoPlayer.currentTime);
            // Update seek bar position
            seekBar.value = videoPlayer.currentTime;
        });
    }

    // Loaded data listener (updates duration display AND seek bar max) - Moved inside loadBtn logic

    // Ended listener (optional: reset play/pause buttons)
    videoPlayer.addEventListener('ended', () => {
        console.log('Video ended');
        if (playBtn && pauseBtn) {
             playBtn.disabled = false; pauseBtn.disabled = true; playBtn.style.opacity = 1.0; pauseBtn.style.opacity = 0.5;
        }
        // Optionally reset currentTime? seekBar.value = 0; videoPlayer.currentTime = 0;
    });

}

// --- NEW: Seek Bar Interaction Logic ---
if (seekBar && videoPlayer) {
    seekBar.addEventListener('input', () => {
        // Update video time as the user drags the seek bar
        videoPlayer.currentTime = seekBar.value;
        // Update the time display immediately while dragging
        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(seekBar.value);
        }
    });
     // Optional: Add 'change' listener if you only want to seek when dragging stops
     // seekBar.addEventListener('change', () => {
     //    videoPlayer.currentTime = seekBar.value;
     // });
} else { console.error('Seek bar or video player not found.'); }

// --- Add other renderer process logic below ---
console.log('Renderer Process Loaded.');