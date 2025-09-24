/**
 * Asocial Login Interface
 * Handles authentication and storage file management
 */

class AsocialLogin {
  constructor() {
    this.encryptedStorage = new AsocialEncryptedStorage();
    this.currentForm = 'login';
    this.init();
  }

  /**
   * Initialize the login interface
   */
  init() {
    this.forcePopupSize();
    this.setupEventListeners();
    this.loadStorageFiles();
    this.checkExistingLogin();
  }

  /**
   * Force popup to be wider
   */
  forcePopupSize() {
    // Force the popup to be wider
    document.body.style.minWidth = '500px';
    document.body.style.width = '500px';
    
    // Try to resize the popup window if possible
    if (window.resizeTo) {
      window.resizeTo(500, 600);
    }
  }

  /**
   * Load available storage files and populate dropdown
   */
  async loadStorageFiles() {
    try {
      const storageFiles = await this.encryptedStorage.getStorageFiles();
      console.log('Loaded storage files:', storageFiles);
      
      // Populate login dropdown
      const select = document.getElementById('login-storage-select');
      if (select) {
        select.innerHTML = '';
        
        if (storageFiles.length === 0) {
          select.innerHTML = '<option value="">No storage files found</option>';
          console.log('No storage files found');
        } else {
          storageFiles.forEach(file => {
            console.log('Adding storage file to dropdown:', file);
            const option = document.createElement('option');
            option.value = file.storageName;
            option.textContent = `${file.storageName} (${file.filename})`;
            select.appendChild(option);
          });
        }
      }
      
      // Populate switch user form
      const filesList = document.getElementById('storage-files-list');
      if (filesList) {
        if (storageFiles.length === 0) {
          filesList.innerHTML = '<p style="text-align: center; color: #00ff00; opacity: 0.8;">No storage files found</p>';
        } else {
          filesList.innerHTML = storageFiles.map(file => `
            <div class="storage-file-item" data-filename="${file.filename}">
              <div class="storage-file-name">${file.storageName}</div>
              <div class="storage-file-username">File: ${file.filename}</div>
              <div class="storage-file-created">Created: ${new Date(file.createdAt).toLocaleDateString()}</div>
            </div>
          `).join('');
          
          // Add click handlers
          document.querySelectorAll('.storage-file-item').forEach(item => {
            item.addEventListener('click', () => this.selectStorageFile(item));
          });
        }
      }
      
      console.log('Loaded storage files:', storageFiles);
    } catch (error) {
      console.error('Failed to load storage files:', error);
      const select = document.getElementById('login-storage-select');
      if (select) {
        select.innerHTML = '<option value="">Error loading storage files</option>';
      }
      this.showStatus('Failed to load storage files', 'error');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Login form
    document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
    document.getElementById('switch-user-btn').addEventListener('click', () => this.showSwitchUserForm());
    document.getElementById('create-account-link').addEventListener('click', () => this.showCreateAccountForm());
    
    // Create account form
    document.getElementById('create-account-btn').addEventListener('click', () => this.handleCreateAccount());
    document.getElementById('back-to-login-btn').addEventListener('click', () => this.showLoginForm());
    
    // Switch user form
    document.getElementById('back-to-login-from-switch-btn').addEventListener('click', () => this.showLoginForm());
    
    // Enter key handling
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        if (this.currentForm === 'login') {
          this.handleLogin();
        } else if (this.currentForm === 'create') {
          this.handleCreateAccount();
        }
      }
    });
  }

  /**
   * Check if user is already logged in
   */
  async checkExistingLogin() {
    try {
      const isLoggedIn = await this.encryptedStorage.isLoggedIn();
      if (isLoggedIn) {
        const currentStorageName = await this.encryptedStorage.getCurrentStorageName();
        console.log('Login page - Storage already open:', currentStorageName);
        console.log('Login page - Current storage:', this.encryptedStorage.currentStorage);
        this.showStatus(`Storage already open: ${currentStorageName}`, 'info');
        // Auto-redirect to main interface
        setTimeout(() => {
          this.redirectToMain();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to check existing login:', error);
    }
  }

  /**
   * Handle login
   */
  async handleLogin() {
    try {
      console.log('=== LOGIN START ===');
      const username = document.getElementById('login-storage-select').value.trim();
      const password = document.getElementById('login-password').value;
      
      console.log('Login form data:', { username, passwordLength: password.length });
      
      if (!username || !password) {
        this.showStatus('Please select a storage file and enter password', 'error');
        return;
      }
      
      this.setLoading(true);
      console.log('Opening storage for login...');
      
      // Open encrypted storage
      await this.encryptedStorage.openStorage(username, password);
      console.log('Storage opened successfully');
      
      // Set current storage name in session
      await this.encryptedStorage.setCurrentStorageName(username);
      
      // Store storage data temporarily for main popup to restore
      await chrome.storage.local.set({
        'asocial_temp_storage': this.encryptedStorage.currentStorage,
        'asocial_temp_storage_name': this.encryptedStorage.currentStorageName
      });
      
      // Verify authentication state
      const isLoggedIn = await this.encryptedStorage.isLoggedIn();
      console.log('Login verification - isLoggedIn:', isLoggedIn);
      console.log('Current storage name set to:', username);
      
      // Also check chrome storage directly
      const chromeStorage = await chrome.storage.local.get(['asocial_current_storage']);
      console.log('Login verification - chrome storage:', chromeStorage);
      
      this.showStatus('Login successful!', 'success');
      
      // Redirect to main interface
      setTimeout(async () => {
        await this.redirectToMain();
      }, 1500);
      
    } catch (error) {
      console.error('Login failed:', error);
      this.showStatus(`Login failed: ${error.message}`, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Handle create account
   */
  async handleCreateAccount() {
    try {
      console.log('=== CREATE ACCOUNT START ===');
      const username = document.getElementById('new-username').value.trim();
      const password = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      console.log('Form data:', { username, passwordLength: password.length, confirmPasswordLength: confirmPassword.length });
      
      if (!username || !password || !confirmPassword) {
        this.showStatus('Please fill in all fields', 'error');
        return;
      }
      
      if (password !== confirmPassword) {
        this.showStatus('Passwords do not match', 'error');
        return;
      }
      
      this.setLoading(true);
      console.log('Creating storage for:', username);
      
      // Create new encrypted storage
      const filename = await this.encryptedStorage.createStorage(username, password);
      console.log('Storage created successfully, filename:', filename);
      
      // Auto-login after creation
      console.log('Opening storage after creation...');
      await this.encryptedStorage.openStorage(username, password);
      console.log('Storage opened successfully');
      
      // Set current storage name in session
      console.log('Setting current storage name...');
      await this.encryptedStorage.setCurrentStorageName(username);
      console.log('Current storage name set');
      
      // Verify storage is loaded
      console.log('Storage created and loaded:', this.encryptedStorage.currentStorage);
      console.log('Current storage name set:', this.encryptedStorage.currentStorageName);
      
      // Store storage data temporarily for the main popup
      console.log('Storing temporary data...');
      await chrome.storage.local.set({
        'asocial_temp_storage': this.encryptedStorage.currentStorage,
        'asocial_temp_storage_name': this.encryptedStorage.currentStorageName
      });
      console.log('Temporary data stored');
      
      this.showStatus('Storage created successfully!', 'success');
      
      // Redirect to main interface
      console.log('Redirecting to main interface...');
      setTimeout(async () => {
        try {
          await this.redirectToMain();
        } catch (redirectError) {
          console.error('Redirect failed:', redirectError);
          this.showStatus(`Redirect failed: ${redirectError.message}`, 'error');
        }
      }, 1500);
      
    } catch (error) {
      console.error('Create account failed:', error);
      this.showStatus(`Failed to create storage: ${error.message}`, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Show login form
   */
  showLoginForm() {
    this.currentForm = 'login';
    document.getElementById('login-form').classList.add('active');
    document.getElementById('create-account-form').classList.remove('active');
    document.getElementById('switch-user-form').classList.remove('active');
    this.clearForm();
  }

  /**
   * Show create account form
   */
  showCreateAccountForm() {
    this.currentForm = 'create';
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('create-account-form').classList.add('active');
    document.getElementById('switch-user-form').classList.remove('active');
    this.clearForm();
  }

  /**
   * Show switch user form
   */
  async showSwitchUserForm() {
    this.currentForm = 'switch';
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('create-account-form').classList.remove('active');
    document.getElementById('switch-user-form').classList.add('active');
    
    await this.loadStorageFiles();
  }


  /**
   * Select storage file
   */
  selectStorageFile(item) {
    // Remove previous selection
    document.querySelectorAll('.storage-file-item').forEach(i => i.classList.remove('selected'));
    
    // Add selection to clicked item
    item.classList.add('selected');
    
    // Store selected filename
    this.selectedFilename = item.dataset.filename;
  }

  /**
   * Clear form fields
   */
  clearForm() {
    // Clear login form
    const loginPassword = document.getElementById('login-password');
    if (loginPassword) loginPassword.value = '';
    
    // Clear create account form
    const newUsername = document.getElementById('new-username');
    if (newUsername) newUsername.value = '';
    
    const newPassword = document.getElementById('new-password');
    if (newPassword) newPassword.value = '';
    
    const confirmPassword = document.getElementById('confirm-password');
    if (confirmPassword) confirmPassword.value = '';
    
    this.hideStatus();
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    const forms = document.querySelectorAll('.login-form');
    forms.forEach(form => {
      if (loading) {
        form.classList.add('loading');
      } else {
        form.classList.remove('loading');
      }
    });
  }

  /**
   * Show status message
   */
  showStatus(message, type) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideStatus();
    }, 5000);
  }

  /**
   * Hide status message
   */
  hideStatus() {
    const statusEl = document.getElementById('status-message');
    statusEl.className = 'status-message';
  }

  /**
   * Redirect to main interface
   */
  async redirectToMain() {
    // Ensure authentication state is properly set
    const isLoggedIn = await this.encryptedStorage.isLoggedIn();
    console.log('Redirect verification - isLoggedIn:', isLoggedIn);
    
    if (isLoggedIn) {
      console.log('Authentication successful, redirecting to main popup...');
      // Instead of closing the window, redirect to the main popup
      window.location.href = 'popup.html';
    } else {
      console.error('Authentication state not properly set, staying on login page');
      this.showStatus('Authentication failed, please try again', 'error');
    }
  }
}

// Initialize login interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    new AsocialLogin();
  } catch (error) {
    console.error('Failed to initialize login interface:', error);
    document.body.innerHTML = `
      <div style="padding: 20px; color: #ff0000; background: #000; text-align: center;">
        <h2>Initialization Error</h2>
        <p>Failed to initialize login interface: ${error.message}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #00ff00; color: #000; border: none; cursor: pointer;">Reload</button>
      </div>
    `;
  }
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.error('Error details:', event);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Promise rejection details:', event);
});
