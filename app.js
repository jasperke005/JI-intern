// Contact Directory PWA App
class ContactDirectoryApp {
    constructor() {
        this.contacts = [];
        this.isSupervisor = false;
        this.tapCount = 0;
        this.lastTapTime = 0;
        this.supervisorPassword = '1302';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadContacts();
        this.setupTripleTap();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Add contact form
        const addContactForm = document.getElementById('addContactForm');
        if (addContactForm) {
            addContactForm.addEventListener('submit', (e) => this.handleAddContact(e));
        }

        // Edit search inputs
        const editSearchInput = document.getElementById('editSearchInput');
        if (editSearchInput) {
            editSearchInput.addEventListener('input', (e) => this.handleEditSearch(e.target.value));
        }

        const deleteSearchInput = document.getElementById('deleteSearchInput');
        if (deleteSearchInput) {
            deleteSearchInput.addEventListener('input', (e) => this.handleDeleteSearch(e.target.value));
        }
    }

    setupTripleTap() {
        const banner = document.getElementById('banner');
        if (banner) {
            banner.addEventListener('click', () => this.handleBannerTap());
        }
    }

    handleBannerTap() {
        const now = Date.now();
        if (now - this.lastTapTime < 500) {
            this.tapCount++;
            if (this.tapCount >= 3) {
                this.showPasswordDialog();
                this.tapCount = 0;
            }
        } else {
            this.tapCount = 1;
        }
        this.lastTapTime = now;
    }

    async loadContacts() {
        try {
            this.showLoading(true);
            console.log('Starting to load contacts...');
            
            // Always start with embedded contacts for immediate display
            if (typeof EMBEDDED_CONTACTS !== 'undefined' && EMBEDDED_CONTACTS.length > 0) {
                console.log('Loading embedded contacts first:', EMBEDDED_CONTACTS.length, 'contacts');
                this.contacts = [...EMBEDDED_CONTACTS]; // Create a copy
                this.renderContacts(); // Show contacts immediately
                this.showDataStatus(); // Show contact count
            }
            
            // Try to load from localStorage
            try {
                const savedContacts = localStorage.getItem('contacts');
                if (savedContacts) {
                    const parsedContacts = JSON.parse(savedContacts);
                    if (parsedContacts && parsedContacts.length > 0) {
                        console.log('Loading contacts from localStorage:', parsedContacts.length, 'contacts');
                        this.contacts = parsedContacts;
                        this.renderContacts();
                        this.showDataStatus();
                    }
                }
            } catch (localStorageError) {
                console.log('localStorage error:', localStorageError.message);
            }
            
            // Try to load from CSV in the background (don't wait for it)
            this.loadContactsFromCSV().then(() => {
                console.log('CSV loading completed');
            }).catch((csvError) => {
                console.log('CSV loading failed, keeping current contacts:', csvError.message);
            });
            
        } catch (error) {
            console.error('Error loading contacts:', error);
            // Fallback to embedded contacts if everything else fails
            if (typeof EMBEDDED_CONTACTS !== 'undefined' && EMBEDDED_CONTACTS.length > 0) {
                console.log('Falling back to embedded contacts');
                this.contacts = [...EMBEDDED_CONTACTS];
                this.renderContacts();
                this.showDataStatus();
            } else {
                this.showError('Failed to load contacts');
            }
        } finally {
            this.showLoading(false);
        }
    }

    async loadContactsFromCSV() {
        try {
            console.log('Attempting to fetch list.csv...');
            console.log('Current location:', window.location.href);
            console.log('Base URL:', window.location.origin + window.location.pathname);
            
            // Try different paths for different environments
            const paths = [
                'csv-data.html',
                './csv-data.html',
                'list.csv',
                './list.csv',
                '../list.csv',
                window.location.pathname.replace(/\/[^\/]*$/, '/') + 'list.csv'
            ];
            
            let response = null;
            let csvText = null;
            
            for (const path of paths) {
                try {
                    console.log('Trying path:', path);
                    response = await fetch(path);
                    console.log('Response status for', path, ':', response.status);
                    
                    if (response.ok) {
                        let text = await response.text();
                        
                        // If this is the HTML fallback page, extract CSV data
                        if (path.includes('csv-data.html')) {
                            console.log('Using HTML fallback page, extracting CSV data...');
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(text, 'text/html');
                            const csvElement = doc.getElementById('csvData');
                            if (csvElement) {
                                csvText = csvElement.textContent;
                                console.log('CSV data extracted from HTML fallback');
                            } else {
                                console.log('Could not find CSV data in HTML fallback');
                                continue;
                            }
                        } else {
                            csvText = text;
                        }
                        
                        console.log('CSV loaded successfully from:', path);
                        break;
                    }
                } catch (pathError) {
                    console.log('Path', path, 'failed:', pathError.message);
                }
            }
            
            if (!csvText) {
                console.log('All CSV paths failed, checking what files are available...');
                // Try to list available files by checking common paths
                const testPaths = ['list.csv', 'index.html', 'app.js', 'styles.css'];
                for (const testPath of testPaths) {
                    try {
                        const testResponse = await fetch(testPath);
                        console.log('File', testPath, 'status:', testResponse.status);
                    } catch (e) {
                        console.log('File', testPath, 'not accessible');
                    }
                }
                throw new Error('Could not load CSV from any path');
            }
            
            console.log('CSV loaded, length:', csvText.length);
            console.log('First few lines:', csvText.substring(0, 200));
            
            this.contacts = this.parseCSV(csvText);
            console.log('Parsed contacts:', this.contacts.length);
            console.log('First contact:', this.contacts[0]);
            
            this.saveContacts();
        } catch (error) {
            console.error('Error loading CSV:', error);
            console.log('Falling back to embedded contacts...');
            // Use embedded contacts if CSV fails
            if (typeof EMBEDDED_CONTACTS !== 'undefined') {
                this.contacts = EMBEDDED_CONTACTS;
                console.log('Embedded contacts loaded:', this.contacts.length);
            } else {
                console.log('No embedded contacts, using sample contacts...');
                this.contacts = this.createSampleContacts();
                console.log('Sample contacts created:', this.contacts.length);
            }
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const contacts = [];
        
        console.log('Parsing CSV with', lines.length, 'lines');
        console.log('First line (headers):', lines[0]);
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(',');
            console.log(`Line ${i}:`, parts);
            
            if (parts.length >= 8) {
                const contact = {
                    firstName: parts[0].trim(),
                    lastName: parts[1].trim(),
                    internalNumber: parts[2].trim(),
                    wirelessNumber: parts[3].trim(),
                    function: parts[4].trim(),
                    directLine: parts[5].trim(),
                    gsmNumber: parts[6].trim(),
                    faxNumber: parts[7].trim()
                };
                
                console.log('Created contact:', contact);
                
                // Add if it has at least a first name OR last name, AND an internal number
                if ((contact.firstName || contact.lastName) && contact.internalNumber) {
                    console.log('Adding contact:', contact.firstName || 'No First', contact.lastName || 'No Last');
                    contacts.push(contact);
                } else {
                    console.log('Skipping contact - missing required fields:', {
                        firstName: !!contact.firstName,
                        lastName: !!contact.lastName,
                        internalNumber: !!contact.internalNumber
                    });
                }
            } else {
                console.log(`Line ${i} has only ${parts.length} parts, skipping`);
            }
        }
        
        console.log('Final contacts array:', contacts);
        return contacts;
    }

    createSampleContacts() {
        return [
            {
                firstName: 'John',
                lastName: 'Doe',
                internalNumber: '1001',
                wirelessNumber: '+32 123 456 789',
                function: 'Manager',
                directLine: '+32 123 456 790',
                gsmNumber: '+32 123 456 791',
                faxNumber: '+32 123 456 792'
            },
            {
                firstName: 'Jane',
                lastName: 'Smith',
                internalNumber: '1002',
                wirelessNumber: '+32 123 456 793',
                function: 'Developer',
                directLine: '+32 123 456 794',
                gsmNumber: '+32 123 456 795',
                faxNumber: '+32 123 456 796'
            }
        ];
    }

    handleSearch(query) {
        const filteredContacts = this.contacts.filter(contact => {
            const searchTerm = query.toLowerCase();
            return contact.firstName.toLowerCase().includes(searchTerm) ||
                   contact.lastName.toLowerCase().includes(searchTerm) ||
                   contact.function.toLowerCase().includes(searchTerm) ||
                   contact.internalNumber.includes(searchTerm);
        });
        
        this.renderContacts(filteredContacts);
        
        // Show/hide no results message
        const noResults = document.getElementById('noResults');
        if (noResults) {
            noResults.style.display = filteredContacts.length === 0 ? 'block' : 'none';
        }
    }

    renderContacts(contactsToRender = this.contacts) {
        console.log('renderContacts called with', contactsToRender.length, 'contacts');
        
        const contactList = document.getElementById('contactList');
        const noResults = document.getElementById('noResults');
        const dataStatus = document.getElementById('dataStatus');
        const contactCount = document.getElementById('contactCount');
        
        console.log('Contact list element:', contactList);
        
        if (!contactList) {
            console.error('Contact list element not found!');
            console.log('Available elements with "contact" in ID:');
            document.querySelectorAll('[id*="contact"]').forEach(el => {
                console.log('-', el.id, el.tagName, el.className);
            });
            return;
        }

        // Update contact count display
        if (dataStatus && contactCount) {
            dataStatus.style.display = 'block';
            contactCount.textContent = contactsToRender.length;
        }

        console.log('Rendering contacts:', contactsToRender.length);
        contactList.innerHTML = '';
        
        if (contactsToRender.length === 0) {
            contactList.innerHTML = '<p>No contacts available. Please check the console for errors.</p>';
            return;
        }
        
        contactsToRender.forEach((contact, index) => {
            console.log(`Creating card for contact ${index + 1}:`, contact.firstName, contact.lastName);
            const contactCard = this.createContactCard(contact);
            contactList.appendChild(contactCard);
        });
        
        console.log('Finished rendering contacts');
    }

    createContactCard(contact) {
        const card = document.createElement('div');
        card.className = 'contact-card';
        
        const name = contact.firstName && contact.lastName ? 
            `${contact.firstName} ${contact.lastName}` : 
            (contact.firstName || contact.lastName || 'Unknown');
        
        card.innerHTML = `
            <div class="contact-header">
                <div class="contact-info">
                    <h3>${name}</h3>
                    ${contact.function ? `<p>${contact.function}</p>` : ''}
                </div>
                <div class="contact-actions">
                    ${contact.internalNumber ? `
                        <span class="contact-number">${contact.internalNumber}</span>
                        <button class="btn btn-call" onclick="app.makeCall('${contact.internalNumber}', true)">
                            <span class="material-icons">call</span> Call
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="contact-details">
                ${contact.wirelessNumber ? `
                    <div class="contact-detail">
                        <span class="detail-label">Wireless:</span>
                        <span class="detail-value">${contact.wirelessNumber}</span>
                        <button class="btn btn-call" onclick="app.makeCall('${contact.wirelessNumber}', false)">
                            <span class="material-icons">call</span> Call
                        </button>
                    </div>
                ` : ''}
                ${contact.gsmNumber ? `
                    <div class="contact-detail">
                        <span class="detail-label">GSM:</span>
                        <span class="detail-value">${contact.gsmNumber}</span>
                        <button class="btn btn-call" onclick="app.makeCall('${contact.gsmNumber}', false)">
                            <span class="material-icons">call</span> Call
                        </button>
                    </div>
                ` : ''}
                ${contact.directLine ? `
                    <div class="contact-detail">
                        <span class="detail-label">Direct Line:</span>
                        <span class="detail-value">${contact.directLine}</span>
                    </div>
                ` : ''}
                ${contact.faxNumber ? `
                    <div class="contact-detail">
                        <span class="detail-label">Fax:</span>
                        <span class="detail-value">${contact.faxNumber}</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        return card;
    }

    makeCall(phoneNumber, isInternal) {
        const dialNumber = isInternal ? `+3251610764,99,${phoneNumber}` : phoneNumber;
        const telLink = `tel:${dialNumber}`;
        
        // Try to make the call using a safer approach
        try {
            // Create a temporary link element instead of changing window.location
            const link = document.createElement('a');
            link.href = telLink;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Fallback for browsers that don't support tel: links
            setTimeout(() => {
                if (confirm(`Call ${phoneNumber}?`)) {
                    window.open(telLink, '_blank');
                }
            }, 100);
        } catch (error) {
            console.log('Phone call failed, using fallback:', error);
            // Final fallback
            if (confirm(`Call ${phoneNumber}?`)) {
                window.open(telLink, '_blank');
            }
        }
    }

    showPasswordDialog() {
        const dialog = document.getElementById('passwordDialog');
        if (dialog) {
            dialog.style.display = 'flex';
            document.getElementById('supervisorPassword').focus();
        }
    }

    hidePasswordDialog() {
        const dialog = document.getElementById('passwordDialog');
        if (dialog) {
            dialog.style.display = 'none';
            document.getElementById('supervisorPassword').value = '';
            document.getElementById('passwordError').style.display = 'none';
        }
    }

    verifyPassword() {
        const password = document.getElementById('supervisorPassword').value;
        const errorElement = document.getElementById('passwordError');
        
        if (password === this.supervisorPassword) {
            this.isSupervisor = true;
            this.updateUIForSupervisor();
            this.hidePasswordDialog();
        } else {
            errorElement.style.display = 'block';
            document.getElementById('supervisorPassword').value = '';
        }
    }

    updateUIForSupervisor() {
        // Show supervisor buttons
        const supervisorButtons = document.getElementById('supervisorButtons');
        const userDownloadButton = document.getElementById('userDownloadButton');
        
        if (supervisorButtons) supervisorButtons.style.display = 'flex';
        if (userDownloadButton) userDownloadButton.style.display = 'none';
    }

    logoutSupervisor() {
        this.isSupervisor = false;
        
        // Hide supervisor buttons
        const supervisorButtons = document.getElementById('supervisorButtons');
        const userDownloadButton = document.getElementById('userDownloadButton');
        
        if (supervisorButtons) supervisorButtons.style.display = 'none';
        if (userDownloadButton) userDownloadButton.style.display = 'flex';
    }

    showAddContactDialog() {
        const dialog = document.getElementById('addContactDialog');
        if (dialog) {
            dialog.style.display = 'flex';
        }
    }

    hideAddContactDialog() {
        const dialog = document.getElementById('addContactDialog');
        if (dialog) {
            dialog.style.display = 'none';
            document.getElementById('addContactForm').reset();
        }
    }

    handleAddContact(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const contact = {
            firstName: formData.get('firstName') || document.getElementById('firstName').value,
            lastName: formData.get('lastName') || document.getElementById('lastName').value,
            internalNumber: formData.get('internalNumber') || document.getElementById('internalNumber').value,
            wirelessNumber: formData.get('wirelessNumber') || document.getElementById('wirelessNumber').value,
            function: formData.get('function') || document.getElementById('function').value,
            directLine: formData.get('directLine') || document.getElementById('directLine').value,
            gsmNumber: formData.get('gsmNumber') || document.getElementById('gsmNumber').value,
            faxNumber: formData.get('faxNumber') || document.getElementById('faxNumber').value
        };
        
        this.contacts.push(contact);
        this.saveContacts();
        this.renderContacts();
        this.hideAddContactDialog();
        
        this.showSuccess('Contact added successfully');
    }

    showEditContactDialog() {
        const dialog = document.getElementById('editContactDialog');
        if (dialog) {
            dialog.style.display = 'flex';
            this.renderEditContactList();
        }
    }

    hideEditContactDialog() {
        const dialog = document.getElementById('editContactDialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }

    handleEditSearch(query) {
        const filteredContacts = this.contacts.filter(contact => {
            const searchTerm = query.toLowerCase();
            return contact.firstName.toLowerCase().includes(searchTerm) ||
                   contact.lastName.toLowerCase().includes(searchTerm) ||
                   contact.function.toLowerCase().includes(searchTerm) ||
                   contact.internalNumber.includes(searchTerm);
        });
        
        this.renderEditContactList(filteredContacts);
    }

    renderEditContactList(contactsToRender = this.contacts) {
        const editContactList = document.getElementById('editContactList');
        if (!editContactList) return;

        editContactList.innerHTML = '';
        
        contactsToRender.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'edit-contact-item';
            item.innerHTML = `
                <strong>${contact.firstName} ${contact.lastName}</strong><br>
                <small>${contact.function} - Internal: ${contact.internalNumber}</small>
            `;
            item.addEventListener('click', () => this.editContact(contact));
            editContactList.appendChild(item);
        });
    }

    editContact(contact) {
        // Create a proper edit form with all fields
        const editForm = `
            <div class="edit-contact-form">
                <h3>Edit Contact: ${contact.firstName} ${contact.lastName}</h3>
                <form id="editContactForm">
                    <input type="text" id="editFirstName" placeholder="First Name" value="${contact.firstName}" required>
                    <input type="text" id="editLastName" placeholder="Last Name" value="${contact.lastName}" required>
                    <input type="text" id="editInternalNumber" placeholder="Internal Number" value="${contact.internalNumber || ''}" required>
                    <input type="text" id="editWirelessNumber" placeholder="Wireless Number" value="${contact.wirelessNumber || ''}">
                    <input type="text" id="editFunction" placeholder="Function" value="${contact.function || ''}">
                    <input type="text" id="editDirectLine" placeholder="Direct Line" value="${contact.directLine || ''}">
                    <input type="text" id="editGsmNumber" placeholder="GSM Number" value="${contact.gsmNumber || ''}">
                    <input type="text" id="editFaxNumber" placeholder="Fax Number" value="${contact.faxNumber || ''}">
                    <div class="button-group">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" class="btn btn-secondary" onclick="app.cancelEditContact()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        // Replace the edit dialog content
        const editDialog = document.getElementById('editContactDialog');
        if (editDialog) {
            editDialog.innerHTML = editForm;
            
            // Add form submit handler
            const form = document.getElementById('editContactForm');
            if (form) {
                form.addEventListener('submit', (e) => this.handleEditContact(e, contact));
            }
        }
    }

    handleEditContact(event, originalContact) {
        event.preventDefault();
        
        // Get all form values
        const updatedContact = {
            firstName: document.getElementById('editFirstName').value,
            lastName: document.getElementById('editLastName').value,
            internalNumber: document.getElementById('editInternalNumber').value,
            wirelessNumber: document.getElementById('editWirelessNumber').value,
            function: document.getElementById('editFunction').value,
            directLine: document.getElementById('editDirectLine').value,
            gsmNumber: document.getElementById('editGsmNumber').value,
            faxNumber: document.getElementById('editFaxNumber').value
        };
        
        // Update the contact in the array
        const contactIndex = this.contacts.findIndex(c => 
            c.firstName === originalContact.firstName && 
            c.lastName === originalContact.lastName && 
            c.internalNumber === originalContact.internalNumber
        );
        
        if (contactIndex !== -1) {
            this.contacts[contactIndex] = updatedContact;
            this.saveContacts();
            this.renderContacts();
            this.showSuccess('Contact updated successfully');
        }
        
        // Restore the original edit dialog
        this.restoreEditDialog();
    }

    cancelEditContact() {
        this.restoreEditDialog();
    }

    restoreEditDialog() {
        // Restore the original edit dialog content
        const editDialog = document.getElementById('editContactDialog');
        if (editDialog) {
            editDialog.innerHTML = `
                <div class="modal-content">
                    <h2>Edit Contact</h2>
                    <div class="search-section">
                        <input type="text" id="editSearchInput" placeholder="Search contacts to edit..." class="search-input">
                        <div id="editContactList" class="edit-contact-list"></div>
                    </div>
                </div>
            `;
            
            // Re-add the search functionality
            const searchInput = document.getElementById('editSearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => this.handleEditSearch(e.target.value));
            }
        }
    }

    showDeleteContactDialog() {
        const dialog = document.getElementById('deleteContactDialog');
        if (dialog) {
            dialog.style.display = 'flex';
            this.renderDeleteContactList();
        }
    }

    hideDeleteContactDialog() {
        const dialog = document.getElementById('deleteContactDialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }

    handleDeleteSearch(query) {
        const filteredContacts = this.contacts.filter(contact => {
            const searchTerm = query.toLowerCase();
            return contact.firstName.toLowerCase().includes(searchTerm) ||
                   contact.lastName.toLowerCase().includes(searchTerm) ||
                   contact.function.toLowerCase().includes(searchTerm) ||
                   contact.internalNumber.includes(searchTerm);
        });
        
        this.renderDeleteContactList(filteredContacts);
    }

    renderDeleteContactList(contactsToRender = this.contacts) {
        const deleteContactList = document.getElementById('deleteContactList');
        if (!deleteContactList) return;

        deleteContactList.innerHTML = '';
        
        contactsToRender.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'edit-contact-item';
            item.innerHTML = `
                <strong>${contact.firstName} ${contact.lastName}</strong><br>
                <small>${contact.function} - Internal: ${contact.internalNumber}</small>
            `;
            item.addEventListener('click', () => this.deleteContact(contact));
            deleteContactList.appendChild(item);
        });
    }

    deleteContact(contact) {
        if (confirm(`Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`)) {
            const index = this.contacts.findIndex(c => c.internalNumber === contact.internalNumber);
            if (index > -1) {
                this.contacts.splice(index, 1);
                this.saveContacts();
                this.renderContacts();
                this.hideDeleteContactDialog();
                this.showSuccess('Contact deleted successfully');
            }
        }
    }

    showUploadDialog() {
        const dialog = document.getElementById('uploadDialog');
        if (dialog) {
            dialog.style.display = 'flex';
        }
    }

    hideUploadDialog() {
        const dialog = document.getElementById('uploadDialog');
        if (dialog) {
            dialog.style.display = 'none';
            document.getElementById('csvFile').value = '';
        }
    }

    uploadCSV() {
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showError('Please select a CSV file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                const newContacts = this.parseCSV(csvText);
                this.contacts = newContacts;
                this.saveContacts();
                this.renderContacts();
                this.hideUploadDialog();
                this.showSuccess(`Successfully uploaded ${newContacts.length} contacts`);
            } catch (error) {
                this.showError('Error parsing CSV file');
            }
        };
        reader.readAsText(file);
    }

    showDownloadDialog() {
        const dialog = document.getElementById('downloadDialog');
        if (dialog) {
            dialog.style.display = 'flex';
        }
    }

    hideDownloadDialog() {
        const dialog = document.getElementById('downloadDialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }

    downloadCSV() {
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contacts.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        this.hideDownloadDialog();
    }

    generateCSV() {
        const headers = ['First Name', 'Last Name', 'Internal Number', 'Wireless Number', 'Function', 'Direct Line', 'GSM Number', 'Fax Number'];
        const csvRows = [headers.join(',')];
        
        this.contacts.forEach(contact => {
            const row = [
                contact.firstName,
                contact.lastName,
                contact.internalNumber,
                contact.wirelessNumber,
                contact.function,
                contact.directLine,
                contact.gsmNumber,
                contact.faxNumber
            ].map(field => `"${field || ''}"`).join(',');
            csvRows.push(row);
        });
        
        return csvRows.join('\n');
    }

    saveContacts() {
        localStorage.setItem('contacts', JSON.stringify(this.contacts));
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }

    showSuccess(message) {
        // Simple success notification
        alert(message);
    }

    showError(message) {
        // Simple error notification
        alert('Error: ' + message);
    }

    showDataStatus() {
        const dataStatus = document.getElementById('dataStatus');
        const contactCount = document.getElementById('contactCount');
        
        if (dataStatus && contactCount) {
            contactCount.textContent = this.contacts.length;
            dataStatus.style.display = 'block';
        }
    }
}

// Global functions for HTML onclick handlers
function showAddContactDialog() { app.showAddContactDialog(); }
function hideAddContactDialog() { app.hideAddContactDialog(); }
function showEditContactDialog() { app.showEditContactDialog(); }
function hideEditContactDialog() { app.hideEditContactDialog(); }
function showDeleteContactDialog() { app.showDeleteContactDialog(); }
function hideDeleteContactDialog() { app.hideDeleteContactDialog(); }
function showUploadDialog() { app.showUploadDialog(); }
function hideUploadDialog() { app.hideUploadDialog(); }
function showDownloadDialog() { app.showDownloadDialog(); }
function hideDownloadDialog() { app.hideDownloadDialog(); }
function showPasswordDialog() { app.showPasswordDialog(); }
function hidePasswordDialog() { app.hidePasswordDialog(); }
function verifyPassword() { app.verifyPassword(); }
function logoutSupervisor() { app.logoutSupervisor(); }
function uploadCSV() { app.uploadCSV(); }
function downloadCSV() { app.downloadCSV(); }
function refreshContacts() { 
    if (app) {
        console.log('Refreshing contacts...');
        app.loadContacts(); 
    }
}

function debugContacts() {
    console.log('🐛 Debugging Contacts...');
    console.log('=== CONTACT DEBUG INFO ===');
    
    // Check if EMBEDDED_CONTACTS is available
    if (typeof EMBEDDED_CONTACTS !== 'undefined') {
        console.log('✅ EMBEDDED_CONTACTS available:', EMBEDDED_CONTACTS.length, 'contacts');
        console.log('First contact:', EMBEDDED_CONTACTS[0]);
        console.log('Last contact:', EMBEDDED_CONTACTS[EMBEDDED_CONTACTS.length - 1]);
    } else {
        console.log('❌ EMBEDDED_CONTACTS not available');
    }
    
    // Check app instance
    if (typeof app !== 'undefined' && app) {
        console.log('✅ App instance available');
        console.log('Current contacts in app:', app.contacts.length);
        console.log('App contacts array:', app.contacts);
    } else {
        console.log('❌ App instance not available');
    }
    
    // Check localStorage
    try {
        const stored = localStorage.getItem('contacts');
        if (stored) {
            const parsed = JSON.parse(stored);
            console.log('✅ localStorage contacts:', parsed.length);
        } else {
            console.log('ℹ️ No contacts in localStorage');
        }
    } catch (e) {
        console.log('❌ localStorage error:', e.message);
    }
    
    // Check browser info
    console.log('🌐 Browser Info:');
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('Cookies Enabled:', navigator.cookieEnabled);
    console.log('Online:', navigator.onLine);
    
    // Check service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) {
                console.log('✅ Service Worker registered:', reg.scope);
            } else {
                console.log('❌ No Service Worker registration');
            }
        });
    } else {
        console.log('❌ Service Worker not supported');
    }
    
    console.log('=== END DEBUG INFO ===');
}

function testNavigation() {
    console.log('🧪 Testing Navigation...');
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    console.log('Current origin:', window.location.origin);
    
    // Test if we can access key files
    const testFiles = [
        './index.html',
        './app.js',
        './styles.css',
        './contacts-data.js',
        './manifest.json',
        './icon.png'
    ];
    
    testFiles.forEach(async (file) => {
        try {
            const response = await fetch(file);
            console.log(`✅ ${file}: ${response.status} ${response.statusText}`);
        } catch (error) {
            console.log(`❌ ${file}: ${error.message}`);
        }
    });
    
    // Test service worker status
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                console.log('✅ Service Worker registered:', registration.scope);
            } else {
                console.log('❌ No Service Worker registration found');
            }
        });
    } else {
        console.log('❌ Service Worker not supported');
    }
    
    // Test PWA manifest
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        console.log('✅ PWA is controlled by Service Worker');
    } else {
        console.log('❌ PWA not controlled by Service Worker');
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    try {
        app = new ContactDirectoryApp();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});
