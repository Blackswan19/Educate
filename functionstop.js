function clearInput() {
            document.getElementById("userLink").value = "";
        }
        // Function to store and retrieve recently watched videos
        const localStorageKey = 'recentlyWatched';

        function getRecentlyWatched() {
            const videos = localStorage.getItem(localStorageKey);
            let parsedVideos = videos ? JSON.parse(videos) : [];
            
            // Filter out unpinned videos older than 24 hours
            const now = Date.now();
            parsedVideos = parsedVideos.filter(video => {
                if (video.isPinned) return true; // Keep pinned videos permanently
                const ageInHours = (now - video.timestamp) / (1000 * 60 * 60);
                return ageInHours <= 24; // Remove unpinned videos older than 24 hours
            });
            
            localStorage.setItem(localStorageKey, JSON.stringify(parsedVideos));
            return parsedVideos;
        }

        function getVideoId(url) {
    let videoId = '';
    if (url.includes('youtu.be')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com') || url.includes('yout-ube.com')) {
        if (url.includes('/live/')) {
            // Handle YouTube live URLs like https://www.youtube.com/live/VIDEO_ID
            const parts = url.split('/live/')[1];
            videoId = parts ? parts.split('?')[0] : '';
        } else {
            // Handle standard YouTube URLs like https://www.youtube.com/watch?v=VIDEO_ID
            const urlParams = new URLSearchParams(url.split('?')[1] || '');
            videoId = urlParams.get('v') || '';
        }
    }
    return videoId;
}

        function getThumbnailUrl(videoId) {
            return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : 'adstptumb.png';
        }

        // Function to fetch video title using YouTube oEmbed API
        async function getVideoTitle(videoUrl) {
            try {
                const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
                if (!response.ok) return 'Unknown Title';
                const data = await response.json();
                return data.title || 'Unknown Title';
            } catch (error) {
                console.error('Error fetching video title:', error);
                return 'Unknown Title';
            }
        }

        async function addRecentlyWatched(videoUrl) {
            const videos = getRecentlyWatched();
            const videoId = getVideoId(videoUrl);
            if (!videos.some(video => video.url === videoUrl) && videoId) {
                const title = await getVideoTitle(videoUrl);
                videos.unshift({
                    url: videoUrl,
                    thumbnail: getThumbnailUrl(videoId),
                    title: title,
                    isPinned: false,
                    timestamp: Date.now()
                });
                if (videos.length > 10) videos.pop(); // Limit to 10 videos
                localStorage.setItem(localStorageKey, JSON.stringify(videos));
            }
        }

        // Function to toggle pinned state
        function togglePinned(videoUrl) {
            const videos = getRecentlyWatched();
            const video = videos.find(v => v.url === videoUrl);
            if (video) {
                video.isPinned = !video.isPinned;
                localStorage.setItem(localStorageKey, JSON.stringify(videos));
                showNotification(video.isPinned ? "Pinned!" : "Unpinned!");
                showRecommendations(); // Refresh the list
            }
        }

        // Function to truncate long titles
        function truncateTitle(title, maxLength = 30) {
            if (title.length > maxLength) {
                return title.substring(0, maxLength - 3) + '...';
            }
            return title;
        }

        // Function to display recently watched videos
        function showRecommendations(searchQuery = '') {
            const recommendationSection = document.getElementById('recommendationSection');
            const videoList = document.getElementById('videoList');
            let videos = getRecentlyWatched();

            if (searchQuery) {
                videos = videos.filter(video => video.title.toLowerCase().includes(searchQuery.toLowerCase()));
            }

            videoList.innerHTML = ''; // Clear previous list

            if (videos.length === 0) {
                videoList.innerHTML = '<li>No videos found.</li>';
            } else {
                videos.forEach(video => {
                    const li = document.createElement('li');
                    const displayTitle = truncateTitle(video.title || 'Unknown Title'); // Use title instead of link
                    li.innerHTML = `
                        <div style="display: flex; align-items: center;">
                            <img src="${video.thumbnail}" alt="Video Thumbnail" class="thumbnail-circle" onclick="showImagePopup('${video.thumbnail}')" style="cursor: pointer;">
                            <a href="${video.url}" target="_self">#BS// ${displayTitle} //Adstoper</a>
                        </div>
                        <div class="action-buttons">
                            <i class="fa-solid ${video.isPinned ? 'fa-toggle-on' : 'fa-toggle-off'}" 
                               onclick="togglePinned('${video.url}')" 
                               style="cursor: pointer; margin-right: 10px;"></i>
                            <button class='copybtn' onclick="copyToClipboard('${video.url}')">Copy</button>
                            <button class='deletebtn' onclick="deleteVideo('${video.url}')">Remove</button>
                        </div>
                    `;
                    videoList.appendChild(li);
                });
            }

            recommendationSection.style.display = 'block'; // Show the section
        }

        function closeRecommendations() {
            const recommendationSection = document.getElementById('recommendationSection');
            recommendationSection.style.display = 'none'; // Hide the section
        }

        async function modifyLink() {
            const userLink = document.getElementById("userLink").value.trim();
            if (!userLink) {
                document.getElementById("result").innerHTML = "Provide URL first...!";
                return;
            }

            let modifiedLink = userLink;
            const videoId = getVideoId(userLink);

            if (!videoId) {
                document.getElementById("result").innerHTML = "Invalid URL...!";
                return;
            }

            if (userLink.toLowerCase().includes("youtu.be")) {
                const queryParams = userLink.split("?")[1] || "";
                modifiedLink = `https://www.yout-ube.com/watch?v=${videoId}${queryParams ? `&${queryParams}` : ''}`;
            } else if (userLink.toLowerCase().includes("youtube.com")) {
                // Replace only the domain, preserving path and query parameters
                modifiedLink = userLink.replace(/youtube\.com/i, "yout-ube.com");
            } else {
                document.getElementById("result").innerHTML = "Not an YouTube link...!";
                return;
            }

            // Validate that the modified link has a video ID
            if (getVideoId(modifiedLink)) {
                document.getElementById("result").innerHTML = `
                    <button id="playButton" onclick="playVideo('${modifiedLink}')">Play in full screen</button>
                `;
                await addRecentlyWatched(modifiedLink); // Store the link and title in local storage
                document.getElementById("userLink").value = "";
            } else {
                document.getElementById("result").innerHTML = "Invalid URL...!";
            }
        }

        function playVideo(videoUrl) {
            window.open(videoUrl, "_self");
        }

        function copyToClipboard(link) {
            navigator.clipboard.writeText(link).then(() => {
                showNotification("Link copied..!");
            }).catch(() => {
                showNotification("Failed to copy...!");
            });
        }

        function deleteVideo(videoUrl) {
            let videos = getRecentlyWatched();
            videos = videos.filter(video => video.url !== videoUrl); // Remove the selected video
            localStorage.setItem(localStorageKey, JSON.stringify(videos));
            showRecommendations(document.getElementById('searchHistory').value); // Refresh the list with current search
        }

        function showNotification(message) {
            const notificationBox = document.getElementById("notificationBox");
            notificationBox.textContent = message;
            notificationBox.classList.add("show");
            setTimeout(() => {
                notificationBox.classList.remove("show");
            }, 2000);
        }

        // Function to show full-screen image popup
        function showImagePopup(imageUrl) {
            const popup = document.getElementById('imagePopup');
            const popupImage = document.getElementById('popupImage');
            popupImage.src = imageUrl;
            popup.style.display = 'flex';
        }

        // Function to close full-screen image popup
        function closeImagePopup() {
            const popup = document.getElementById('imagePopup');
            popup.style.display = 'none';
        }

        // New Feature: Theme Toggle
        function toggleTheme() {
            document.body.classList.toggle('light-mode');
            const themeIcon = document.getElementById('themeToggle');
            if (document.body.classList.contains('light-mode')) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        }

        // New Feature: Search History
        function searchHistory() {
            const searchQuery = document.getElementById('searchHistory').value;
            showRecommendations(searchQuery);
        }

        // New Feature: Clear All History
        function clearAllHistory() {
            if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                localStorage.removeItem(localStorageKey);
                showRecommendations();
                showNotification('History cleared!');
            }
        }

        // New Feature: Export History
        function exportHistory() {
            const videos = getRecentlyWatched();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(videos));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "watch_history.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showNotification('History exported!');
        }

        // New Feature: Import History
        function importHistory(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const importedVideos = JSON.parse(e.target.result);
                        localStorage.setItem(localStorageKey, JSON.stringify(importedVideos));
                        showRecommendations();
                        showNotification('History imported!');
                    } catch (error) {
                        showNotification('Invalid file format!');
                    }
                };
                reader.readAsText(file);
            }
        }
        document.addEventListener("DOMContentLoaded", () => {
            const customMenu = document.querySelector(".custom-menu");

            document.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                if (customMenu) {
                    customMenu.style.display = "block";
                    customMenu.style.top = `${event.pageY}px`;
                    customMenu.style.left = `${event.pageX}px`;
                }
            });

            document.addEventListener("click", () => {
                if (customMenu) {
                    customMenu.style.display = "none";
                }
            });
        });
