
document.getElementById("menuIcon").addEventListener("click", () => {
    let menu = document.getElementById("menu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
});

const localStorageKey = 'recentlyWatched';
const autoPlayKey = 'autoPlayPref';

function getRecentlyWatched() {
    let v = localStorage.getItem(localStorageKey);
    let arr = v ? JSON.parse(v) : [];
    const now = Date.now();
    arr = arr.filter(video => video.isPinned || ((now - video.timestamp) / (1000 * 60 * 60) <= 24));
    localStorage.setItem(localStorageKey, JSON.stringify(arr));
    return arr;
}

function getVideoId(url) {
    let id = '';
    if (url.includes('youtu.be')) id = url.split('youtu.be/')[1].split('?')[0];
    else if (url.includes('youtube.com') || url.includes('yout-ube.com')) {
        if (url.includes('/live/')) {
            let p = url.split('/live/')[1];
            id = p ? p.split('?')[0] : '';
        } else {
            let p = new URLSearchParams(url.split('?')[1] || '');
            id = p.get('v') || '';
        }
    }
    return id;
}

function getThumbnailUrl(id) {
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : 'adstptumb.png';
}

async function getVideoTitle(url) {
    try {
        let res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (!res.ok) return 'Unknown Title';
        let d = await res.json();
        return d.title || 'Unknown Title';
    } catch {
        return 'Unknown Title';
    }
}

async function addRecentlyWatched(url) {
    let videos = getRecentlyWatched();
    let vid = getVideoId(url);
    if (!videos.some(v => v.url === url) && vid) {
        let title = await getVideoTitle(url);
        videos.unshift({
            url,
            title,
            thumbnail: getThumbnailUrl(vid),
            isPinned: false,
            timestamp: Date.now()
        });
        if (videos.length > 10) videos.pop();
        localStorage.setItem(localStorageKey, JSON.stringify(videos));
    }
}

// === AUTO PLAY TOGGLE ===
const autoToggle = document.getElementById('autoPlayToggle');
const submitContainer = document.getElementById('submitContainer');

// Load saved preference
const savedAuto = localStorage.getItem(autoPlayKey);
if (savedAuto !== null) {
    autoToggle.checked = (savedAuto === 'true');
}
updateSubmitButton();

autoToggle.addEventListener('change', () => {
    localStorage.setItem(autoPlayKey, autoToggle.checked);
    updateSubmitButton();
    restartClipboardMagic(); // 🔥 RESTART ON TOGGLE
});

function updateSubmitButton() {
    submitContainer.innerHTML = '';
    if (!autoToggle.checked) {
        submitContainer.innerHTML = `
            <button onclick="manualPlay()" style="width: 45%; max-width:150px; white-space: nowrap;">
                Play Now 🔥
            </button>`;
    }
}

async function extractAndModifyYouTubeLink(inputText) {
    if (!inputText) return;

    const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|yout-ube\.com)\/(watch\?v=)?([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})/i;
    const match = inputText.match(youtubeRegex);

    if (!match) {
        document.getElementById("result").innerHTML = "NO LINK FOUND!";
        return;
    }

    let vidId = match[5] || match[6] || '';
    if (!vidId) {
        const urlPart = inputText.split(/[&\s\n]/).find(part => part.includes('v=') || part.includes('youtu.be'));
        if (urlPart) vidId = getVideoId(urlPart) || '';
    }

    if (!vidId) {
        document.getElementById("result").innerHTML = "BAD LINK!";
        return;
    }

    const modifiedLink = `https://www.yout-ube.com/watch?v=${vidId}`;
    document.getElementById("userLink").value = modifiedLink;
    document.getElementById("result").innerHTML = "";

    await addRecentlyWatched(modifiedLink);
    updateSubmitButton();

    if (autoToggle.checked) {
        playVideo(modifiedLink);
        showNotification("AUTO-PASTED & PLAYED 🔥");
    } else {
        showNotification("PASTED! HIT PLAY");
    }
}

function manualPlay() {
    let url = document.getElementById("userLink").value.trim();
    if (url) playVideo(url);
}

function playVideo(url) {
    window.open(url, "_self");
}

function clearInput() {
    document.getElementById("userLink").value = "";
}

function showRecommendations(searchQuery = '') {
    const section = document.getElementById('recommendationSection');
    const list = document.getElementById('videoList');
    let videos = getRecentlyWatched();
    if (searchQuery) videos = videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));

    list.innerHTML = '';
    if (videos.length === 0) {
        list.innerHTML = '<li>NO VIDS!</li>';
    } else {
        videos.forEach(video => {
            let li = document.createElement('li');
            li.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <img src="${video.thumbnail}" class="thumbnail-circle">
                    <a href="${video.url}" target="_self">#BS// ${video.title} //Adstoper</a>
                </div>
                <div class="action-buttons">
                    <i class="fa-solid ${video.isPinned ? 'fa-toggle-on' : 'fa-toggle-off'}"
                       onclick="togglePinned('${video.url}')"></i>
                    <button onclick="copyToClipboard('${video.url}')">Copy</button>
                    <button onclick="deleteVideo('${video.url}')">Remove</button>
                </div>`;
            list.appendChild(li);
        });
    }
    section.style.display = 'block';
}

function closeRecommendations() {
    document.getElementById('recommendationSection').style.display = 'none';
}

function searchHistory() {
    const q = document.getElementById('searchHistory').value;
    showRecommendations(q);
}

function togglePinned(url) {
    let videos = getRecentlyWatched();
    let v = videos.find(v => v.url === url);
    if (v) {
        v.isPinned = !v.isPinned;
        localStorage.setItem(localStorageKey, JSON.stringify(videos));
        showNotification(v.isPinned ? 'PINNED!' : 'UNPINNED!');
        showRecommendations();
    }
}

function copyToClipboard(link) {
    navigator.clipboard.writeText(link).then(() => showNotification("COPIED!"));
}

function deleteVideo(url) {
    let videos = getRecentlyWatched();
    videos = videos.filter(v => v.url !== url);
    localStorage.setItem(localStorageKey, JSON.stringify(videos));
    showRecommendations();
    showNotification("DELETED!");
}

function showNotification(msg) {
    let box = document.getElementById("notificationBox");
    box.textContent = msg;
    box.classList.add("show");
    setTimeout(() => box.classList.remove("show"), 2000);
}

document.getElementById("userLink").addEventListener("input", () => {
    const text = document.getElementById("userLink").value;
    if (text.length > 10) {
        extractAndModifyYouTubeLink(text);
    }
});

let clipboardInterval = null;
let hasPermission = false; // Track permission

async function checkClipboardForYouTube() {
    if (!navigator.clipboard?.readText) return;

    try {
        const text = await navigator.clipboard.readText();
        const trimmed = text.trim();

        if (trimmed.length > 10 && 
            (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) &&
            document.getElementById("userLink").value === "") {

            document.getElementById("userLink").value = trimmed;
            await extractAndModifyYouTubeLink(trimmed);
            hasPermission = true; // Got it!
        }
    } catch (err) {
        hasPermission = false;
    }
}

function restartClipboardMagic() {
    if (clipboardInterval) clearInterval(clipboardInterval);

    if (autoToggle.checked) {
        checkClipboardForYouTube();
        clipboardInterval = setInterval(checkClipboardForYouTube, 1500);
        showNotification("AUTO-PASTE ACTIVATED 🔥");
    } else {
        setTimeout(checkClipboardForYouTube, 800);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateSubmitButton();
    restartClipboardMagic(); // 🔥 START MAGIC

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
        if (customMenu) customMenu.style.display = "none";
    });
});

