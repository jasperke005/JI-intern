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
            console.log('Platform:', navigator.platform);
            console.log('User Agent:', navigator.userAgent);
            
            // First, try to load from localStorage (user's saved changes)
            try {
                const savedContacts = localStorage.getItem('contacts');
                if (savedContacts) {
                    const parsedContacts = JSON.parse(savedContacts);
                    if (parsedContacts && parsedContacts.length > 0) {
                        console.log('Loading contacts from localStorage:', parsedContacts.length, 'contacts');
                        this.contacts = parsedContacts;
                        this.renderContacts();
                        this.showDataStatus();
                        this.showLoading(false);
                        return; // Use saved contacts if available
                    }
                }
            } catch (localStorageError) {
                console.log('localStorage error:', localStorageError.message);
            }
            
            // If no localStorage, start with embedded contacts
            if (typeof EMBEDDED_CONTACTS !== 'undefined' && EMBEDDED_CONTACTS.length > 0) {
                console.log('Loading embedded contacts first:', EMBEDDED_CONTACTS.length, 'contacts');
                this.contacts = [...EMBEDDED_CONTACTS]; // Create a copy
                this.renderContacts(); // Show contacts immediately
                this.showDataStatus(); // Show contact count
                
                // Save embedded contacts to localStorage for future use
                try {
                    localStorage.setItem('contacts', JSON.stringify(this.contacts));
                    console.log('Embedded contacts saved to localStorage');
                } catch (localStorageError) {
                    console.log('localStorage save failed:', localStorageError.message);
                }
            }
            
            // For iOS, try to load CSV more aggressively
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/i.test(navigator.userAgent);
            
            if (isIOS) {
                console.log('iOS detected, trying CSV loading...');
                try {
                    await this.loadContactsFromCSV();
                    console.log('iOS CSV loading completed');
                } catch (csvError) {
                    console.log('iOS CSV loading failed:', csvError.message);
                    // On iOS, if CSV fails, ensure we keep embedded contacts
                    if (this.contacts.length === 0 && typeof EMBEDDED_CONTACTS !== 'undefined') {
                        this.contacts = [...EMBEDDED_CONTACTS];
                        this.renderContacts();
                        this.showDataStatus();
                    }
                }
            } else if (isAndroid) {
                console.log('Android detected, trying CSV loading...');
                // For Android, try CSV loading but be more careful
                try {
                    await this.loadContactsFromCSV();
                    console.log('Android CSV loading completed');
                } catch (csvError) {
                    console.log('Android CSV loading failed:', csvError.message);
                    // On Android, if CSV fails, ensure we keep embedded contacts
                    if (this.contacts.length === 0 && typeof EMBEDDED_CONTACTS !== 'undefined') {
                        this.contacts = [...EMBEDDED_CONTACTS];
                        this.renderContacts();
                        this.showDataStatus();
                    }
                }
            } else {
                // For other platforms, try CSV in background
                this.loadContactsFromCSV().then(() => {
                    console.log('CSV loading completed');
                }).catch((csvError) => {
                    console.log('CSV loading failed, keeping current contacts:', csvError.message);
                });
            }
            
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
            console.log('Attempting to load contacts from CSV...');
            const response = await fetch('./list.csv');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            const lines = csvText.split('\n');
            
            // Skip header lines (first 3 lines)
            const dataLines = lines.slice(3).filter(line => line.trim() !== '');
            
            const csvContacts = [];
            
            dataLines.forEach(line => {
                const columns = line.split(',');
                if (columns.length >= 8) {
                    const contact = {
                        firstName: columns[0]?.trim() || '',
                        lastName: columns[1]?.trim() || '',
                        internalNumber: columns[2]?.trim() || '',
                        wirelessNumber: columns[3]?.trim() || '',
                        function: columns[4]?.trim() || '',
                        directLine: columns[5]?.trim() || '',
                        gsmNumber: columns[6]?.trim() || '',
                        faxNumber: columns[7]?.trim() || ''
                    };
                    
                    // Only add if we have at least a first name or last name
                    if (contact.firstName || contact.lastName) {
                        csvContacts.push(contact);
                    }
                }
            });
            
            console.log(`CSV loading successful: ${csvContacts.length} contacts loaded`);
            
            if (csvContacts.length > 0) {
                // Update contacts with CSV data
                this.contacts = csvContacts;
                this.renderContacts();
                this.showDataStatus();
                
                // Save to localStorage for future use
                try {
                    localStorage.setItem('contacts', JSON.stringify(csvContacts));
                    console.log('Contacts saved to localStorage');
                } catch (localStorageError) {
                    console.log('localStorage save failed:', localStorageError.message);
                }
            }
            
            return csvContacts;
            
        } catch (error) {
            console.log('CSV loading failed:', error.message);
            throw error;
        }
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
        this.renderContacts();
        this.hideAddContactDialog();
        
        // Save to localStorage
        try {
            localStorage.setItem('contacts', JSON.stringify(this.contacts));
            console.log('Contact added and saved to localStorage');
        } catch (localStorageError) {
            console.log('localStorage save failed:', localStorageError.message);
        }
        
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
        const editDialog = document.getElementById('editContactDialog');
        if (!editDialog) return;
        
        // Create the edit form with a close button
        editDialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Contact</h2>
                    <button class="close-btn" onclick="hideEditContactDialog()">&times;</button>
                </div>
                <form id="editContactForm" onsubmit="handleEditContact(event, ${JSON.stringify(contact).replace(/"/g, '&quot;')})">
                    <input type="text" id="editFirstName" value="${contact.firstName || ''}" placeholder="First Name" required>
                    <input type="text" id="editLastName" value="${contact.lastName || ''}" placeholder="Last Name" required>
                    <input type="text" id="editInternalNumber" value="${contact.internalNumber || ''}" placeholder="Internal Number" required>
                    <input type="text" id="editWirelessNumber" value="${contact.wirelessNumber || ''}" placeholder="Wireless Number">
                    <input type="text" id="editFunction" value="${contact.function || ''}" placeholder="Function">
                    <input type="text" id="editDirectLine" value="${contact.directLine || ''}" placeholder="Direct Line">
                    <input type="text" id="editGsmNumber" value="${contact.gsmNumber || ''}" placeholder="GSM Number">
                    <input type="text" id="editFaxNumber" value="${contact.faxNumber || ''}" placeholder="Fax Number">
                    <div class="button-group">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" class="btn btn-secondary" onclick="hideEditContactDialog()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        editDialog.style.display = 'block';
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
        
        // Find and update the contact
        const contactIndex = this.contacts.findIndex(c => c.internalNumber === originalContact.internalNumber);
        if (contactIndex !== -1) {
            this.contacts[contactIndex] = updatedContact;
            this.renderContacts();
            this.showSuccess('Contact updated successfully');
            
            // Save to localStorage
            try {
                localStorage.setItem('contacts', JSON.stringify(this.contacts));
                console.log('Contact updated and saved to localStorage');
            } catch (localStorageError) {
                console.log('localStorage save failed:', localStorageError.message);
            }
        }
        
        // Close the dialog
        hideEditContactDialog();
    }

    cancelEditContact() {
        console.log('Canceling edit contact...');
        hideEditContactDialog();
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
                this.renderContacts();
                this.hideDeleteContactDialog();
                
                // Save to localStorage
                try {
                    localStorage.setItem('contacts', JSON.stringify(this.contacts));
                    console.log('Contact deleted and saved to localStorage');
                } catch (localStorageError) {
                    console.log('localStorage save failed:', localStorageError.message);
                }
                
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
                const lines = csvText.split('\n');
                
                // Skip header lines (first 3 lines)
                const dataLines = lines.slice(3).filter(line => line.trim() !== '');
                
                const newContacts = [];
                
                dataLines.forEach(line => {
                    const columns = line.split(',');
                    if (columns.length >= 8) {
                        const contact = {
                            firstName: columns[0]?.trim() || '',
                            lastName: columns[1]?.trim() || '',
                            internalNumber: columns[2]?.trim() || '',
                            wirelessNumber: columns[3]?.trim() || '',
                            function: columns[4]?.trim() || '',
                            directLine: columns[5]?.trim() || '',
                            gsmNumber: columns[6]?.trim() || '',
                            faxNumber: columns[7]?.trim() || ''
                        };
                        
                        // Only add if we have at least a first name or last name
                        if (contact.firstName || contact.lastName) {
                            newContacts.push(contact);
                        }
                    }
                });
                
                this.contacts = newContacts;
                this.renderContacts();
                this.hideUploadDialog();
                this.showSuccess(`Successfully uploaded ${newContacts.length} contacts`);
                
                // Save to localStorage
                try {
                    localStorage.setItem('contacts', JSON.stringify(newContacts));
                    console.log('Uploaded contacts saved to localStorage');
                } catch (localStorageError) {
                    console.log('localStorage save failed:', localStorageError.message);
                }
                
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
        // This function is no longer needed since debug view was removed
        // Keep it empty to avoid errors if called elsewhere
    }
}

// Global functions that are still needed
function refreshContacts() {
    if (app) {
        app.loadContacts();
    }
}

function forceRefreshContacts() {
    if (app) {
        console.log('Force refreshing contacts...');
        // Clear localStorage and force reload from embedded contacts
        try {
            localStorage.removeItem('contacts');
            console.log('localStorage cleared');
        } catch (e) {
            console.log('Error clearing localStorage:', e.message);
        }
        
        // Force reload contacts
        if (typeof EMBEDDED_CONTACTS !== 'undefined' && EMBEDDED_CONTACTS.length > 0) {
            app.contacts = [...EMBEDDED_CONTACTS];
            app.renderContacts();
            console.log('Force refreshed with embedded contacts:', app.contacts.length);
        } else {
            app.loadContacts();
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

