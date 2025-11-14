document.addEventListener('contextmenu', e => e.preventDefault());
document.getElementById("menuIcon").addEventListener("click", () => {
    let menu = document.getElementById("menu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
});

const localStorageKey = 'recentlyWatched';
const autoPlayKey = 'autoPlayPref';

function getRecentlyWatched(raw = false) {
    let v = localStorage.getItem(localStorageKey);
    let arr = v ? JSON.parse(v) : [];

    if (raw) return arr;

    const now = Date.now();
    // Keep: pinned OR within 24 hours
    arr = arr.filter(video =>
        video.isPinned || ((now - video.timestamp) / (1000 * 60 * 60) <= 24)
    );

    localStorage.setItem(localStorageKey, JSON.stringify(arr));
    return arr;
}

function getVideoId(url) {
    let id = '';
    if (url.includes('youtu.be') || url.includes('yout-ube.be')) {
        id = url.split(/youtu\.be\/|yout-ube\.be\//i)[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com') || url.includes('yout-ube.com')) {
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
    let videos = getRecentlyWatched(true);
    let vid = getVideoId(url);
    if (!vid) return;

    if (videos.some(v => v.url === url)) return;

    let title = await getVideoTitle(url);
    videos.unshift({
        url,
        title,
        thumbnail: getThumbnailUrl(vid),
        isPinned: false,
        timestamp: Date.now()
    });

    if (videos.length > 50) videos.pop();
    localStorage.setItem(localStorageKey, JSON.stringify(videos));
}

const autoToggle = document.getElementById('autoPlayToggle');
const submitContainer = document.getElementById('submitContainer');
const savedAuto = localStorage.getItem(autoPlayKey);
if (savedAuto !== null) autoToggle.checked = (savedAuto === 'true');
updateSubmitButton();

autoToggle.addEventListener('change', () => {
    localStorage.setItem(autoPlayKey, autoToggle.checked);
    updateSubmitButton();
    restartClipboardMagic();
});

function updateSubmitButton() {
    submitContainer.innerHTML = '';
    if (!autoToggle.checked) {
        submitContainer.innerHTML = `
            <button onclick="manualPlay()" style="width: 45%; max-width:150px; white-space: nowrap;">
                Play Now
            </button>`;
    }
}

async function extractAndModifyYouTubeLink(inputText) {
    if (!inputText) return;

    inputText = inputText
        .replace(/youtube\.com/gi, "yout-ube.com")
        .replace(/youtu\.be/gi, "yout-ube.be");

    let vidId = "";
    const shortMatch = inputText.match(/yout-ube\.be\/([a-zA-Z0-9_-]{11})/i);
    const watchMatch = inputText.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
    const liveMatch = inputText.match(/\/live\/([a-zA-Z0-9_-]{11})/i);

    if (shortMatch) vidId = shortMatch[1];
    else if (watchMatch) vidId = watchMatch[1];
    else if (liveMatch) vidId = liveMatch[1];

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
        showNotification("Auto-pasted & playing..!");
    } else {
        showNotification("Pasted...!");
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

// === THUMBNAIL POPUP ===
function escapeJsString(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, "\\\"");
}

function openThumbPopup(videoId, title, url) {
    const popup = document.getElementById('thumbPopup');
    const img = document.getElementById('popupImage');
    const titleEl = document.getElementById('popupTitle');
    img.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    img.onerror = () => img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    titleEl.textContent = title;
    popup.style.display = 'flex';
    titleEl.onclick = () => {
        playVideo(url);
        closeThumbPopup();
    };
    titleEl.style.cursor = 'pointer';
    titleEl.title = 'Click to play video';
}

function closeThumbPopup() {
    document.getElementById('thumbPopup').style.display = 'none';
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeThumbPopup();
});

function showRecommendations(searchQuery = '') {
    const section = document.getElementById('recommendationSection');
    const list = document.getElementById('videoList');

    let videos = getRecentlyWatched(); // Auto-cleans old unpinned

    if (searchQuery) {
        videos = videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    list.innerHTML = '';
    if (videos.length === 0) {
        list.innerHTML = '<li style="color:#aaa; text-align:center;">Not watched recently.';
    } else {
        videos.forEach(video => {
            let vid = getVideoId(video.url);
            let li = document.createElement('li');
            li.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <img src="${video.thumbnail}"
                         class="thumbnail-circle"
                         onclick="openThumbPopup('${vid}', '${escapeJsString(video.title)}', '${video.url}')"
                         style="cursor:pointer; transition:transform .2s;"
                         onmouseover="this.style.transform='scale(1.1)'"
                         onmouseout="this.style.transform='scale(1)'">
                    <a href="${video.url}" target="_self" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px;">
                        ${video.isPinned ? 'Pinned ' : ''}#BS// ${video.title} //Adstoper
                    </a>
                </div>
                <div class="action-buttons">
                    <i style="cursor:pointer; color:${video.isPinned ? '#0040ffff' : '#666'};"
                       class="fa-solid ${video.isPinned ? 'fa-toggle-on' : 'fa-toggle-off'}"
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
    const q = document.getElementById('searchHistory').value.trim();
    showRecommendations(q);
}

function togglePinned(url) {
    let videos = getRecentlyWatched(true);
    let v = videos.find(v => v.url === url);
    if (v) {
        v.isPinned = !v.isPinned;
        localStorage.setItem(localStorageKey, JSON.stringify(videos));
        showNotification(v.isPinned ? 'Pinned forever!' : 'Unpinned');
        showRecommendations();
    }
}

function copyToClipboard(link) {
    navigator.clipboard.writeText(link).then(() => showNotification("COPIED!"));
}

function deleteVideo(url) {
    let videos = getRecentlyWatched(true);
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
    const text = document.getElementById("userLink").value.trim();
    if (text.length > 10) {
        extractAndModifyYouTubeLink(text);
    }
});
let clipboardInterval = null;

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
        }
    } catch (err) {
    }
}

function restartClipboardMagic() {
    if (clipboardInterval) clearInterval(clipboardInterval);
    if (autoToggle.checked) {
        checkClipboardForYouTube();
        clipboardInterval = setInterval(checkClipboardForYouTube, 1500);
        showNotification("Auto-paste ON");
    } else {
        setTimeout(checkClipboardForYouTube, 800);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateSubmitButton();
    restartClipboardMagic();
});
