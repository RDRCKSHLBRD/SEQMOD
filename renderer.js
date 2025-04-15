// --- Sidebar Logic ---
const toggleButton = document.getElementById('toggle-sidebar-btn');
const closeSidebarButton = document.getElementById('close-sidebar-btn');
const sidebar = document.getElementById('info-sidebar');

if (toggleButton && sidebar) {
    toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

if (closeSidebarButton && sidebar) {
    closeSidebarButton.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
}

// --- NEW: Video Area Collapse/Expand Logic ---
const videoAreaToggleBtn = document.getElementById('toggle-video-area-btn');
const mainArea = document.querySelector('.app-main'); // Target the main container

if (videoAreaToggleBtn && mainArea) {
    videoAreaToggleBtn.addEventListener('click', () => {
        // Toggle the layout classes on the main container
        mainArea.classList.toggle('layout-collapsed');
        mainArea.classList.toggle('layout-expanded');
    });
} else {
    console.error('Could not find video area toggle button or main area element.');
}


// --- Add other renderer process logic below ---
console.log('Renderer Process Loaded.');