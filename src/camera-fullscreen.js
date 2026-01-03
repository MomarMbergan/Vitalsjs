// Fullscreen Camera Controller
// Add this script to handle fullscreen camera functionality

(function() {
    'use strict';
    
    // Get the charts container
    const chartsContainer = document.getElementById('charts');
    const startButton = document.getElementById('startCharts');
    
    // Function to enter fullscreen mode
    function enterFullscreen() {
        chartsContainer.style.display = 'block';
        document.body.classList.add('charts-active');
        
        // Request fullscreen API if available
        if (chartsContainer.requestFullscreen) {
            chartsContainer.requestFullscreen();
        } else if (chartsContainer.webkitRequestFullscreen) {
            chartsContainer.webkitRequestFullscreen();
        } else if (chartsContainer.msRequestFullscreen) {
            chartsContainer.msRequestFullscreen();
        } else if (chartsContainer.mozRequestFullScreen) {
            chartsContainer.mozRequestFullScreen();
        }
    }
    
    // Function to exit fullscreen mode
    function exitFullscreen() {
        chartsContainer.style.display = 'none';
        document.body.classList.remove('charts-active');
        
        // Exit fullscreen API if active
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        
        // Stop all video streams
        stopAllStreams();
    }
    
    // Function to stop all video streams
    function stopAllStreams() {
        const videoElements = chartsContainer.querySelectorAll('video');
        videoElements.forEach(video => {
            if (video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
            }
        });
    }
    
    // Add click handler to close button (using ::before pseudo-element)
    chartsContainer.addEventListener('click', function(e) {
        const rect = chartsContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if click is in the top-left corner (close button area)
        if (x <= 60 && y <= 60) {
            exitFullscreen();
        }
    });
    
    // Handle ESC key to exit fullscreen
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && chartsContainer.style.display === 'block') {
            exitFullscreen();
        }
    });
    
    // Handle fullscreen change events
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    function handleFullscreenChange() {
        const isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
        
        if (!isFullscreen && chartsContainer.style.display === 'block') {
            // User exited fullscreen via browser controls
            exitFullscreen();
        }
    }
    
    // Modify the start button behavior
    if (startButton) {
        startButton.addEventListener('click', function(e) {
            e.preventDefault();
            enterFullscreen();
        });
    }
    
    // Handle window resize to maintain aspect ratio
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (chartsContainer.style.display === 'block') {
                adjustVideoLayout();
            }
        }, 250);
    });
    
    // Function to adjust video layout on resize
    function adjustVideoLayout() {
        const videos = chartsContainer.querySelectorAll('video');
        videos.forEach(video => {
            const videoAspect = video.videoWidth / video.videoHeight;
            const containerAspect = window.innerWidth / window.innerHeight;
            
            if (videoAspect > containerAspect) {
                // Video is wider than container
                video.style.width = '100%';
                video.style.height = 'auto';
            } else {
                // Video is taller than container
                video.style.width = 'auto';
                video.style.height = '100%';
            }
        });
    }
    
    // Handle orientation change on mobile devices
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            if (chartsContainer.style.display === 'block') {
                adjustVideoLayout();
            }
        }, 300);
    });
    
    // Prevent page scroll when charts are active
    chartsContainer.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // Add swipe gesture to close (mobile)
    let touchStartY = 0;
    let touchEndY = 0;
    
    chartsContainer.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    
    chartsContainer.addEventListener('touchend', function(e) {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, false);
    
    function handleSwipe() {
        // Swipe down to close
        if (touchStartY < touchEndY && (touchEndY - touchStartY) > 100) {
            exitFullscreen();
        }
    }
    
    console.log('Fullscreen camera controller initialized');
})();
