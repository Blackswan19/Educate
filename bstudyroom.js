let imagesArray = [];
let textInputs = [];
const storageKey = 'userInputs';
let lastDeleted = null; // Store the last deleted item
let lastDeletedType = null; // Store the type of the last deleted item (image or text)

// Load saved inputs from local storage on page load
window.onload = function() {
  const savedData = JSON.parse(localStorage.getItem(storageKey));
  if (savedData) {
    imagesArray = savedData.images || [];
    textInputs = savedData.texts || [];

    // Restore images
    imagesArray.forEach(imgUrl => {
      addThumbnailFromStorage(imgUrl);
    });

    // Restore text inputs
    textInputs.forEach(text => {
      addTextInputToDOM(text);
    });

    // Show the first image if available
    if (imagesArray.length > 0) {
      document.getElementById('displayImage').src = imagesArray[0];
    }
  }
};

// Function to add thumbnail images
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

      // Add to array and create thumbnail
      imagesArray.push(imgUrl);
      addThumbnailToDOM(imgUrl, thumbnailsContainer, displayImage);
      saveToLocalStorage(); // Save to local storage
    };
    reader.readAsDataURL(file);
  }
}

// Function to add thumbnail to the DOM
function addThumbnailToDOM(imgUrl, thumbnailsContainer, displayImage) {
  const thumbnailWrapper = document.createElement('div');
  const thumbnail = document.createElement('img');
  thumbnail.src = imgUrl;

  // Create delete icon with Font Awesome
  const deleteIcon = document.createElement('span');
  deleteIcon.innerHTML = '<i class="fa-solid fa-trash delete-icon"></i>';
  deleteIcon.onclick = function() {
    deleteImage(imgUrl); // Use the delete function
  };

  thumbnail.onclick = function() {
    displayImage.src = imgUrl; // Display clicked image
  };

  thumbnailWrapper.appendChild(thumbnail);
  thumbnailWrapper.appendChild(deleteIcon); // Append delete icon
  thumbnailsContainer.appendChild(thumbnailWrapper);
}

// Function to add thumbnail from local storage (on page load)
function addThumbnailFromStorage(imgUrl) {
  const thumbnailsContainer = document.getElementById('thumbnailsContainer');
  const displayImage = document.getElementById('displayImage');
  addThumbnailToDOM(imgUrl, thumbnailsContainer, displayImage);
}

// Save inputs to local storage
function saveToLocalStorage() {
  localStorage.setItem(storageKey, JSON.stringify({ images: imagesArray, texts: textInputs }));
}

// Function to delete an image and provide undo option
function deleteImage(imgUrl) {
  const index = imagesArray.indexOf(imgUrl);
  if (index > -1) {
    lastDeleted = imgUrl;
    lastDeletedType = 'image';

    imagesArray.splice(index, 1); // Remove from array
    saveToLocalStorage(); // Save changes to local storage
    displayUndoOption(); // Show undo option
    document.getElementById('thumbnailsContainer').innerHTML = ''; // Clear thumbnails container
    imagesArray.forEach(addThumbnailFromStorage); // Re-add thumbnails to reflect deletion
  }
}

// Function to add text input and display it
function addTextInput() {
  const textValue = document.getElementById('textInput').value;

  if (textValue.trim() !== '') {
    textInputs.push(textValue); // Add to textInputs array
    addTextInputToDOM(textValue); // Display in the text section
    document.getElementById('textInput').value = ''; // Clear the input
    saveToLocalStorage(); // Save to local storage
  }
}

// Function to add text input to the DOM
function addTextInputToDOM(text) {
  const textInputsContainer = document.getElementById('textInputsContainer');
  const textWrapper = document.createElement('div');
  textWrapper.classList.add('input-group');

  const textElement = document.createElement('p');
  textElement.textContent = text;
  textElement.style.display = 'block';

  const deleteTextIcon = document.createElement('span');
  deleteTextIcon.innerHTML = '<i class="fa-solid fa-trash delete-text-icon"></i>'; // Font Awesome trash icon
  deleteTextIcon.onclick = function() {
    deleteText(text); // Use the delete function
  };

  // Append text element first, then delete icon
  textWrapper.appendChild(textElement);
  textWrapper.appendChild(deleteTextIcon);
  textInputsContainer.appendChild(textWrapper);
}

// Function to delete text and provide undo option
function deleteText(text) {
  const index = textInputs.indexOf(text);
  if (index > -1) {
    lastDeleted = text;
    lastDeletedType = 'text';

    textInputs.splice(index, 1); // Remove from array
    saveToLocalStorage(); // Save changes to local storage
    document.getElementById('textInputsContainer').innerHTML = ''; // Clear text inputs container
    textInputs.forEach(addTextInputToDOM); // Re-add text inputs to reflect deletion
    displayUndoOption(); // Show undo option
  }
}

// Function to display the undo option
function displayUndoOption() {
  const undoContainer = document.getElementById('undoContainer');
  undoContainer.style.display = 'block';

  // Set a timeout to hide the undo option after 1 minute
  setTimeout(() => {
    undoContainer.style.display = 'none';
    lastDeleted = null; // Clear the last deleted item
    lastDeletedType = null; // Clear the last deleted type
  }, 10000); // 60000 milliseconds = 1 minute

  // Add event listener for the undo button
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
      undoContainer.style.display = 'none'; // Hide the undo option
      lastDeleted = null; // Clear the last deleted item
      lastDeletedType = null; // Clear the last deleted type
    }
  };
}

// Resizable divider functionality
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
  rightSection.style.width = `calc(100% - ${newWidth}px - 10px)`; // Account for the resizer width
});

window.addEventListener('mouseup', () => {
  isResizing = false;
});

// Function to open modal with full image
function openModal() {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const displayImage = document.getElementById('displayImage');

  modalImage.src = displayImage.src; // Set modal image to current display image
  modal.style.display = 'flex'; // Show modal
}

// Function to close modal
function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none'; // Hide modal
}

// Function to handle PDF upload and display
function displayPDF() {
  const pdfInput = document.getElementById('pdfInput');
  const pdfContainer = document.getElementById('pdfContainer');
  const files = pdfInput.files;

  // Clear the container
  pdfContainer.innerHTML = '';

  // Retrieve any existing PDFs from localStorage, or initialize an empty array
  let savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs')) || [];

  // Loop through each uploaded PDF and create an object URL to display it
  Array.from(files).forEach(file => {
    if (file.type === "application/pdf") {
      const fileReader = new FileReader();

      fileReader.onload = function(e) {
        const objectURL = URL.createObjectURL(file);
        const containerDiv = document.createElement('div'); // Div container for each PDF
        const pdfElement = document.createElement('embed');
        const deleteButton = document.createElement('button');

        // Set the PDF source
        pdfElement.src = objectURL;

        // Add click event to open PDF in modal
        pdfElement.onclick = function() {
          openPDFModal(objectURL); // Open the PDF in modal
        };

        // Set up the Delete button
        deleteButton.innerText = "Delete";
        deleteButton.classList.add('delete-btn'); // Apply CSS class for styling
        deleteButton.onclick = function() {
          deletePDF(file.name); // Delete the PDF when clicked
        };

        // Append the PDF and delete button to the container
        containerDiv.classList.add('pdf-container'); // Apply CSS class for styling
        containerDiv.appendChild(pdfElement);
        containerDiv.appendChild(deleteButton);
        pdfContainer.appendChild(containerDiv);

        // Save the file to the savedPDFs array as base64
        savedPDFs.push({
          name: file.name,
          data: e.target.result // Base64 encoded PDF data
        });

        // Save updated PDFs to localStorage
        localStorage.setItem('uploadedPDFs', JSON.stringify(savedPDFs));
      };

      fileReader.readAsDataURL(file); // Convert file to base64
    } else {
      alert("Only PDF files are allowed.");
    }
  });
}

// Function to load and display saved PDFs from localStorage
function loadSavedPDFs() {
  const savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs')) || [];
  const pdfContainer = document.getElementById('pdfContainer');

  // Clear the container before loading PDFs
  pdfContainer.innerHTML = '';

  savedPDFs.forEach(pdf => {
    const containerDiv = document.createElement('div'); // Div container for each PDF
    const pdfElement = document.createElement('embed');
    const deleteButton = document.createElement('button');
    const objectURL = pdf.data; // Base64 data

    // Set the PDF source
    pdfElement.src = objectURL;

    // Add click event to open PDF in modal
    pdfElement.onclick = function() {
      openPDFModal(objectURL); // Open the PDF in modal
    };

    // Set up the Delete button
    deleteButton.innerText = "Delete";
    deleteButton.classList.add('delete-btn'); // Apply CSS class for styling
    deleteButton.onclick = function() {
      deletePDF(pdf.name); // Delete the PDF when clicked
    };

    // Append the PDF and delete button to the container
    containerDiv.classList.add('pdf-container'); // Apply CSS class for styling
    containerDiv.appendChild(pdfElement);
    containerDiv.appendChild(deleteButton);
    pdfContainer.appendChild(containerDiv);
  });
}

// Function to delete a PDF
function deletePDF(pdfName) {
  let savedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs')) || [];

  // Filter out the PDF that needs to be deleted
  savedPDFs = savedPDFs.filter(pdf => pdf.name !== pdfName);

  // Save the updated array back to localStorage
  localStorage.setItem('uploadedPDFs', JSON.stringify(savedPDFs));

  // Reload the PDFs to reflect the deletion
  loadSavedPDFs();
}

// Function to open PDF modal
function openPDFModal(pdfUrl) {
  const pdfModal = document.getElementById('pdfModal');
  const pdfModalContent = document.getElementById('pdfModalContent');

  pdfModalContent.src = pdfUrl; // Set the iframe source to the PDF URL
  pdfModal.style.display = 'block'; // Show the modal
}

// Function to close PDF modal
function closePDFModal() {
  const pdfModal = document.getElementById('pdfModal');
  pdfModal.style.display = 'none'; // Hide the modal
}

// Function to toggle full-screen mode
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

// Load saved PDFs when the page loads
document.addEventListener('DOMContentLoaded', loadSavedPDFs);
