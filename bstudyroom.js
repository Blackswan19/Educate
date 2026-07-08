document.addEventListener('contextmenu', e => e.preventDefault());
let imagesArray = [];
let textInputs = [];
const storageKey = 'userInputs';
let lastDeleted = null;
let lastDeletedType = null;

window.onload = function() {
  const savedData = JSON.parse(localStorage.getItem(storageKey));
  if (savedData) {
    imagesArray = savedData.images || [];
    textInputs = savedData.texts || [];
    imagesArray.forEach(imgUrl => {
      addThumbnailFromStorage(imgUrl);
    });
    textInputs.forEach(text => {
      addTextInputToDOM(text);
    });
    if (imagesArray.length > 0) {
      document.getElementById('displayImage').src = imagesArray[0];
    }
  }
};

function addThumbnail() {
  const fileInput = document.getElementById('imageInput');
  const thumbnailsContainer = document.getElementById('thumbnailsContainer');
  const displayImage = document.getElementById('displayImage');
  const files = fileInput.files;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();

    reader.onload = function(e) {
      const imgUrl = e.target.result;
      imagesArray.push(imgUrl);
      addThumbnailToDOM(imgUrl, thumbnailsContainer, displayImage);
      saveToLocalStorage();
    };
    reader.readAsDataURL(file);
  }
}

function addThumbnailToDOM(imgUrl, thumbnailsContainer, displayImage) {
  const thumbnailWrapper = document.createElement('div');
  const thumbnail = document.createElement('img');
  thumbnail.src = imgUrl;

  const deleteIcon = document.createElement('span');
  deleteIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-437.85 277.08-234.92q-8.31 8.3-20.89 8.5-12.57.19-21.27-8.5-8.69-8.7-8.69-21.08 0-12.38 8.69-21.08L437.85-480 234.92-682.92q-8.3-8.31-8.5-20.89-.19-12.57 8.5-21.27 8.7-8.69 21.08-8.69 12.38 0 21.08 8.69L480-522.15l202.92-202.93q8.31-8.3 20.89-8.5 12.57-.19 21.27 8.5 8.69 8.7 8.69 21.08 0 12.38-8.69 21.08L522.15-480l202.93 202.92q8.3 8.31 8.5 20.89.19 12.57-8.5 21.27-8.7 8.69-21.08 8.69-12.38 0-21.08-8.69L480-437.85Z"/></svg>';
  deleteIcon.onclick = function() {
    deleteImage(imgUrl);
  };

  thumbnail.onclick = function() {
    displayImage.src = imgUrl;
  };

  thumbnailWrapper.appendChild(thumbnail);
  thumbnailWrapper.appendChild(deleteIcon);
  thumbnailsContainer.appendChild(thumbnailWrapper);
}

function addThumbnailFromStorage(imgUrl) {
  const thumbnailsContainer = document.getElementById('thumbnailsContainer');
  const displayImage = document.getElementById('displayImage');
  addThumbnailToDOM(imgUrl, thumbnailsContainer, displayImage);
}

function saveToLocalStorage() {
  localStorage.setItem(storageKey, JSON.stringify({ images: imagesArray, texts: textInputs }));
}

function deleteImage(imgUrl) {
  const index = imagesArray.indexOf(imgUrl);
  if (index > -1) {
    lastDeleted = imgUrl;
    lastDeletedType = 'image';
    imagesArray.splice(index, 1);
    saveToLocalStorage();
    displayUndoOption();
    document.getElementById('thumbnailsContainer').innerHTML = '';
    imagesArray.forEach(addThumbnailFromStorage);
  }
}

function addTextInput() {
  const textValue = document.getElementById('textInput').value;
  if (textValue.trim() !== '') {
    textInputs.push(textValue);
    addTextInputToDOM(textValue);
    document.getElementById('textInput').value = '';
    saveToLocalStorage();
  }
}

function addTextInputToDOM(text) {
  const textInputsContainer = document.getElementById('textInputsContainer');
  const textWrapper = document.createElement('div');
  textWrapper.classList.add('input-group');

  const textElement = document.createElement('p');
  textElement.textContent = text;
  textElement.style.display = 'block';

  const deleteTextIcon = document.createElement('span');
  deleteTextIcon.innerHTML = '<i class="fa-solid fa-ban delete-icon"></i>';
  deleteTextIcon.onclick = function() {
    deleteText(text);
  };

  textWrapper.appendChild(textElement);
  textWrapper.appendChild(deleteTextIcon);
  textInputsContainer.appendChild(textWrapper);
}

function deleteText(text) {
  const index = textInputs.indexOf(text);
  if (index > -1) {
    lastDeleted = text;
    lastDeletedType = 'text';
    textInputs.splice(index, 1);
    saveToLocalStorage();
    document.getElementById('textInputsContainer').innerHTML = '';
    textInputs.forEach(addTextInputToDOM);
    displayUndoOption();
  }
}

function displayUndoOption() {
  const undoContainer = document.getElementById('undoContainer');
  undoContainer.style.display = 'block';

  setTimeout(() => {
    undoContainer.style.display = 'none';
    lastDeleted = null;
    lastDeletedType = null;
  }, 10000);

  const undoButton = document.getElementById('undoButton');
  undoButton.onclick = function() {
    if (lastDeleted && lastDeletedType) {
      if (lastDeletedType === 'image') {
        imagesArray.push(lastDeleted);
        addThumbnailToDOM(lastDeleted, document.getElementById('thumbnailsContainer'), document.getElementById('displayImage'));
      } else if (lastDeletedType === 'text') {
        textInputs.push(lastDeleted);
        addTextInputToDOM(lastDeleted);
      }
      saveToLocalStorage();
      undoContainer.style.display = 'none';
      lastDeleted = null;
      lastDeletedType = null;
    }
  };
}

const resizer = document.getElementById('resizer');
const leftSection = document.getElementById('leftSection');
const rightSection = document.getElementById('rightSection');

let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
  isResizing = true;
});

window.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const newWidth = e.clientX - leftSection.offsetLeft;
  leftSection.style.width = `${newWidth}px`;
  rightSection.style.width = `calc(100% - ${newWidth}px - 10px)`;
});

window.addEventListener('mouseup', () => {
  isResizing = false;
});

function openModal() {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const displayImage = document.getElementById('displayImage');
  modalImage.src = displayImage.src;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
}

function displayPDF() {
  const pdfInput = document.getElementById('pdfInput');
  const pdfContainer = document.getElementById('pdfContainer');
  const files = pdfInput.files;
  pdfContainer.innerHTML = '';
  let savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs')) || [];

  Array.from(files).forEach(file => {
    if (file.type === "application/pdf") {
      const fileReader = new FileReader();
      fileReader.onload = function(e) {
        const objectURL = URL.createObjectURL(file);
        const containerDiv = document.createElement('div');
        const pdfElement = document.createElement('embed');
        const deleteButton = document.createElement('button');
        pdfElement.src = objectURL;

        pdfElement.onclick = function() {
          openPDFModal(objectURL);
        };

        deleteButton.innerText = "Delete this PDF";
        deleteButton.classList.add('delete-btn');
        deleteButton.onclick = function() {
          deletePDF(file.name);
        };

        containerDiv.classList.add('pdf-container');
        containerDiv.appendChild(pdfElement);
        containerDiv.appendChild(deleteButton);
        pdfContainer.appendChild(containerDiv);

        savedPDFs.push({
          name: file.name,
          data: e.target.result
        });

        localStorage.setItem('uploadedPDFs', JSON.stringify(savedPDFs));
      };

      fileReader.readAsDataURL(file);
    } else {
      alert("Only PDF files are allowed.");
    }
  });
}

function loadSavedPDFs() {
  const savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs')) || [];
  const pdfContainer = document.getElementById('pdfContainer');
  pdfContainer.innerHTML = '';

  savedPDFs.forEach(pdf => {
    const containerDiv = document.createElement('div');
    const pdfElement = document.createElement('embed');
    const deleteButton = document.createElement('button');
    const objectURL = pdf.data;
    pdfElement.src = objectURL;

    pdfElement.onclick = function() {
      openPDFModal(objectURL);
    };

    deleteButton.innerText = "Delete this PDF";
    deleteButton.classList.add('delete-btn');
    deleteButton.onclick = function() {
      deletePDF(pdf.name);
    };

    containerDiv.classList.add('pdf-container');
    containerDiv.appendChild(pdfElement);
    containerDiv.appendChild(deleteButton);
    pdfContainer.appendChild(containerDiv);
  });
}

function deletePDF(pdfName) {
  let savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs')) || [];
  savedPDFs = savedPDFs.filter(pdf => pdf.name !== pdfName);
  localStorage.setItem('uploadedPDFs', JSON.stringify(savedPDFs));
  loadSavedPDFs();
}

function openPDFModal(pdfUrl) {
  const pdfModal = document.getElementById('pdfModal');
  const pdfModalContent = document.getElementById('pdfModalContent');
  pdfModalContent.src = pdfUrl;
  pdfModal.style.display = 'block';
}

function closePDFModal() {
  const pdfModal = document.getElementById('pdfModal');
  pdfModal.style.display = 'none';
}

function toggleFullScreen() {
  const pdfContainer = document.getElementById('pdfContainer');
  if (!document.fullscreenElement) {
    pdfContainer.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

document.addEventListener('DOMContentLoaded', loadSavedPDFs);
