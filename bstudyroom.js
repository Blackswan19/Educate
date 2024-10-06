let imagesArray = [];
    let textInputs = [];
    const storageKey = 'userInputs';

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
        const index = imagesArray.indexOf(imgUrl);
        if (index > -1) {
          imagesArray.splice(index, 1); // Remove from array
          thumbnailWrapper.remove(); // Remove from DOM
          saveToLocalStorage(); // Save changes to local storage
        }
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
        const index = textInputs.indexOf(text);
        if (index > -1) {
          textInputs.splice(index, 1); // Remove from array
          textWrapper.remove(); // Remove from DOM
          saveToLocalStorage(); // Save changes to local storage
        }
      };

      // Append text element first, then delete icon
      textWrapper.appendChild(textElement);
      textWrapper.appendChild(deleteTextIcon);
      textInputsContainer.appendChild(textWrapper);
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