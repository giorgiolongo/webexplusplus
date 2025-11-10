(function() {
    document.addEventListener('keydown', function(event) {
        // Check if space key was pressed 
        if (event.code === 'Space') {
            // Prevent default space behavior (clicking buttons, scrolling, etc.)
            event.preventDefault();
            event.stopPropagation();
            //Control the video player
            videoElement = document.querySelector('video');
            if (videoElement) {
                // Toggle play/pause
                if (videoElement.paused) {
                    videoElement.play();
                } else {
                    videoElement.pause();
                }
            }
        }
    }, true);
})();