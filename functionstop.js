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
    const oneDayMs = 24 * 60 * 60 * 1000;

    return arr.filter(video => 
        video.isPinned || (now - video.timestamp) <= oneDayMs
    );
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

    videos = videos.filter(v => v.url !== url);

    let title = await getVideoTitle(url);

    const newVideo = {
        url,
        title,
        thumbnail: getThumbnailUrl(vid),
        isPinned: false,
        timestamp: Date.now()
    };

    videos.unshift(newVideo);

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    videos = videos.filter(v => v.isPinned || (now - v.timestamp) <= oneDayMs);

    if (videos.length > 100) videos = videos.slice(0, 100);

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
            <button onclick="manualPlay()" style="white-space: nowrap;">
                Play
            </button>`;
    }
}

async function extractAndModifyYouTubeLink(inputText) {
    if (!inputText) return;

    inputText = inputText
        .replace(/youtube\.com/gi, "yout-ube.com")
        .replace(/youtu\.be/gi, "yout-ube.be");

    let vidId = "";
    let extraParams = "";

    const shortMatch = inputText.match(/yout-ube\.be\/([a-zA-Z0-9_-]{11})/i);
    const watchMatch = inputText.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
    const liveMatch = inputText.match(/\/live\/([a-zA-Z0-9_-]{11})/i);
    const embedMatch = inputText.match(/embed\/([a-zA-Z0-9_-]{11})/i);

    if (shortMatch) vidId = shortMatch[1];
    else if (watchMatch) vidId = watchMatch[1];
    else if (liveMatch) vidId = liveMatch[1];
    else if (embedMatch) vidId = embedMatch[1];

    if (!vidId) {
        document.getElementById("result").innerHTML = "BAD LINK!";
        return;
    }

    const listMatch = inputText.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
    const indexMatch = inputText.match(/[?&]index=(\d+)/i);
    const timeMatch = inputText.match(/[?&]t=(\d+s?)/i);

    if (listMatch) extraParams += `&list=${listMatch[1]}`;
    if (indexMatch) extraParams += `&index=${indexMatch[1]}`;
    if (timeMatch) extraParams += `&t=${timeMatch[1]}`;

    const modifiedLink = `https://www.yout-ube.com/watch?v=${vidId}${extraParams}`;

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

    let videos = getRecentlyWatched();

    if (searchQuery) {
        videos = videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    list.innerHTML = '';
    if (videos.length === 0) {
        list.innerHTML = '<li style="color:#aaa; text-align:center;">No recently watched videos.</li>';
    } else {
        videos.forEach(video => {
            let vid = getVideoId(video.url);
            let li = document.createElement('li');
            li.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;width:100%">
                    <img src="${video.thumbnail}"
                         class="thumbnail-circle"
                         onclick="openThumbPopup('${vid}', '${escapeJsString(video.title)}', '${video.url}')"
                         style="cursor:pointer; transition:transform .2s;"
                         onmouseover="this.style.transform='scale(1.1)'"
                         onmouseout="this.style.transform='scale(1)'">
                    <div class="afterimageoptions">
    <a href="${video.url}" target="_self" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        ${video.isPinned ? 'Pinned ' : ''}#BS// ${video.title} //Adstoper
                    </a>
                    <div class="action-buttons">
                    <button style="cursor:pointer; font-size:18px; display:inline-flex; align-items:center;"
      onclick="togglePinned('${video.url}')">
  ${video.isPinned 
    ? `
      <!-- Toggle ON SVG (blue) -->
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm485-155q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35Z"/></svg>
      ` 
    : `
      <!-- Toggle OFF SVG (gray) -->
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm85-75q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35Zm115-85Z"/></svg>
    `}
</button>
                    <button onclick="copyToClipboard('${video.url}')"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M323-140q-75.85 0-129.42-53.58Q140-247.15 140-323q0-36.92 13.66-70.23 13.65-33.31 39.73-59.38L299.16-558q8.92-8.92 21.19-9.11 12.27-.2 21.57 9.11 9.31 9.31 9.31 21.08 0 11.77-9.31 21.07l-106.38 106q-17.77 17.77-26.85 40.23-9.07 22.47-9.07 46.62 0 51.31 36.03 87.15Q271.69-200 323-200q24.15 0 46.92-9.08 22.77-9.07 40.54-26.84l105.77-106q8.92-8.31 20.89-8.5 11.96-.2 21.26 9.11 9.31 9.31 9.31 21.08 0 11.77-9.31 21.07L452.61-193.77q-26.07 26.08-59.38 39.92Q359.92-140 323-140Zm54.62-238q-8.93-8.92-8.93-21.19 0-12.27 8.93-21.19l162-162q8.92-8.93 21.19-9.12 12.27-.19 21.57 9.12 9.31 9.3 9.31 21.38 0 12.08-9.31 21.38L420.38-378q-8.92 8.92-21.38 9.11-12.46.2-21.38-9.11Zm240.46-23.62q-9.31-8.92-9.12-21.07.19-12.16 9.12-21.08l106.38-105.77q17.39-17.38 26.16-39.34 8.76-21.97 8.76-46.12 0-51.92-35.73-88.46Q687.92-760 636-760q-24.15 0-46.62 9.08-22.46 9.07-39.84 26.46L443.77-618.08q-8.92 8.93-21.08 9.12-12.15.19-21.07-9.12-8.93-8.92-8.93-21.19 0-12.27 8.93-21.19l105.77-105.77q26.07-26.08 59.38-39.92Q600.08-820 637-820q75.85 0 129.11 53.77 53.27 53.77 53.27 130.23 0 36.31-13.34 69.42-13.35 33.12-39.43 59.19L660.46-401.62q-8.92 8.93-21.19 8.93-12.27 0-21.19-8.93Z"/></svg></button>
                    <button onclick="deleteVideo('${video.url}')"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m480-437.85 122.92 122.93q8.31 8.3 20.89 8.5 12.57.19 21.27-8.5 8.69-8.7 8.69-21.08 0-12.38-8.69-21.08L522.15-480l122.93-122.92q8.3-8.31 8.5-20.89.19-12.57-8.5-21.27-8.7-8.69-21.08-8.69-12.38 0-21.08 8.69L480-522.15 357.08-645.08q-8.31-8.3-20.89-8.5-12.57-.19-21.27 8.5-8.69 8.7-8.69 21.08 0 12.38 8.69 21.08L437.85-480 314.92-357.08q-8.3 8.31-8.5 20.89-.19 12.57 8.5 21.27 8.7 8.69 21.08 8.69 12.38 0 21.08-8.69L480-437.85Zm.07 337.85q-78.84 0-148.21-29.92t-120.68-81.21q-51.31-51.29-81.25-120.63Q100-401.1 100-479.93q0-78.84 29.92-148.21t81.21-120.68q51.29-51.31 120.63-81.25Q401.1-860 479.93-860q78.84 0 148.21 29.92t120.68 81.21q51.31 51.29 81.25 120.63Q860-558.9 860-480.07q0 78.84-29.92 148.21t-81.21 120.68q-51.29 51.31-120.63 81.25Q558.9-100 480.07-100Zm-.07-60q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg></button>
                </div>
</div>
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
        showNotification(v.isPinned ? 'Pinned...!' : 'Unpinned...!');
        showRecommendations();
    }
}

function copyToClipboard(link) {
    navigator.clipboard.writeText(link).then(() => showNotification("Copied...!"));
}

function deleteVideo(url) {
    let videos = getRecentlyWatched(true);
    videos = videos.filter(v => v.url !== url);
    localStorage.setItem(localStorageKey, JSON.stringify(videos));
    showRecommendations();
    showNotification("Deleted..!");
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
    } catch (err) {}
}

function restartClipboardMagic() {
    if (clipboardInterval) clearInterval(clipboardInterval);
    if (autoToggle.checked) {
        checkClipboardForYouTube();
        clipboardInterval = setInterval(checkClipboardForYouTube, 1500);
        showNotification("Auto-paste ON");
    } else {
        clearInterval(clipboardInterval);
        clipboardInterval = null;
        setTimeout(checkClipboardForYouTube, 800);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateSubmitButton();
    restartClipboardMagic();
});
