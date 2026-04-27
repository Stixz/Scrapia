// Use the exposed API from preload script for secure IPC

document.addEventListener('DOMContentLoaded', () => {
    const noteArea = document.getElementById('note-area');
    const saveButton = document.getElementById('saveButton');
    const minimizeButton = document.getElementById('minimizeButton');
    const maximizeButton = document.getElementById('maximizeButton');
    const closeButton = document.getElementById('closeButton');
    const fontDecrease = document.getElementById('fontDecrease');
    const fontIncrease = document.getElementById('fontIncrease');
    const statusBar = document.getElementById('status-bar');
    const themeToggle = document.getElementById('themeToggle');
    const newNoteButton = document.getElementById('newNoteButton');
    const exportButton = document.getElementById('exportButton');
    const previewButton = document.getElementById('previewButton');
    const searchInput = document.getElementById('search-input');
    const noteList = document.getElementById('note-list');
    const markdownPreview = document.getElementById('markdown-preview');
    const resizeHandle = document.getElementById('resize-handle');
    const sidebar = document.querySelector('.sidebar');
    const noteCreated = document.getElementById('note-created');
    const noteModified = document.getElementById('note-modified');
    const tagsInput = document.getElementById('tags-input');
    const currentTagsContainer = document.getElementById('current-tags');
    const undoButton = document.getElementById('undoButton');
    const redoButton = document.getElementById('redoButton');
    const syncSaveButton = document.getElementById('syncSaveButton');
    const syncLoadButton = document.getElementById('syncLoadButton');
    const settingsButton = document.getElementById('settingsButton');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const themeSelector = document.getElementById('themeSelector');
    const scrapiaToggle = document.getElementById('scrapiaToggle');
    const cursorPosition = document.getElementById('cursor-position');
    const statusText = document.getElementById('status-text');

    // Data structure for multiple notes
    let notes = [];
    let currentNoteId = null;
    let isPreviewMode = false;
    let currentFontSize = 16;
    let historyStack = [];
    let historyIndex = -1;

    let autoSaveTimeout = null;
    let countdownInterval = null;
    let autoSaveSeconds = 2;

    // Cursor position tracking
    function updateCursorPosition() {
        const text = noteArea.value;
        const cursorIndex = noteArea.selectionStart;
        
        // Calculate line and column
        const lines = text.substring(0, cursorIndex).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        cursorPosition.textContent = `Ln ${line}, Col ${column}`;
    }

    noteArea.addEventListener('input', updateCursorPosition);
    noteArea.addEventListener('click', updateCursorPosition);
    noteArea.addEventListener('keyup', updateCursorPosition);
    noteArea.addEventListener('select', updateCursorPosition);

    // Initial cursor position update
    updateCursorPosition();

    function debounceAutoSave() {
        clearTimeout(autoSaveTimeout);
        clearInterval(countdownInterval);
        autoSaveSeconds = 2;
        
        countdownInterval = setInterval(() => {
            autoSaveSeconds--;
            const count = updateWordCount();
            statusText.textContent = `✍️ ${count.words} words, ${count.chars} chars | Auto-save in ${autoSaveSeconds}s...`;
            
            if (autoSaveSeconds <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        autoSaveTimeout = setTimeout(() => {
            saveNote();
        }, 2000);
    }

    // --- 🟢 NOTE ON SAVES & PERSISTENCE (THIS IS KEY) ---
    // Saving mechanism: LocalStorage is used! 
    // This means notes are saved to the local memory/database of this specific computer 
    // and browser session, *not* to a server. They only exist until you manually clear your browser's local storage cache, or if you explicitly save them elsewhere.

    // --- Loading (Reads from Local Storage) ---
    function loadNotes() {
        try {
            const savedNotes = localStorage.getItem('notes');
            if (savedNotes !== null) {
                notes = JSON.parse(savedNotes);
            } else {
                // Create a default note if none exist
                notes = [{
                    id: Date.now().toString(),
                    title: 'Untitled Note',
                    content: '',
                    tags: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }];
            }
            
            // Load theme preference
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
            themeSelector.value = savedTheme;
            if (savedTheme === 'dark') {
                themeToggle.textContent = '☀️ Light Mode';
            } else {
                themeToggle.textContent = '🌙 Dark Mode';
            }
            
            // Load font size preference
            const savedFontSize = localStorage.getItem('fontSize');
            if (savedFontSize) {
                currentFontSize = parseInt(savedFontSize);
                noteArea.style.fontSize = currentFontSize + 'px';
            }
            
            // Select the first note or the last active note
            const lastActiveId = localStorage.getItem('lastActiveNoteId');
            if (lastActiveId && notes.find(n => n.id === lastActiveId)) {
                selectNote(lastActiveId);
            } else if (notes.length > 0) {
                selectNote(notes[0].id);
            }
            
            renderNoteList();
        } catch (error) {
            console.error('Error loading notes:', error);
            statusText.textContent = "⚠️ Error loading notes. Starting new session...";
        }
    }

    // --- Saving (Writes to Local Storage) ---
    function saveNote() {
        try {
            if (!currentNoteId) return;
            
            const note = notes.find(n => n.id === currentNoteId);
            if (note) {
                note.content = noteArea.value;
                note.title = noteArea.value.split('\n')[0].substring(0, 50) || 'Untitled Note';
                note.updatedAt = new Date().toISOString();
                
                localStorage.setItem('notes', JSON.stringify(notes));
                localStorage.setItem('lastActiveNoteId', currentNoteId);
                localStorage.setItem('fontSize', currentFontSize.toString());
                
                // Provide visual feedback for saving
                saveButton.innerText = "✅ Saved!";
                const wordCount = noteArea.value.trim() ? noteArea.value.trim().split(/\s+/).length : 0;
                const charCount = noteArea.value.length;
                statusText.textContent = `💾 Saved! ${wordCount} words, ${charCount} chars | Last saved: ${new Date().toLocaleTimeString()}`;

                setTimeout(() => {
                    saveButton.innerText = "💾 Save Note";
                }, 1500);
                
                renderNoteList();
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            statusText.textContent = "⚠️ Error saving notes. Storage may be full.";
        }
    }


    // --- Handling Application Exit (Inter-Process Communication) ---
    function exitAppGracefully() {
        // Use the exposed API from preload script
        window.electronAPI.quitApp();
    }

    // --- Theme Toggle ---
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙 Dark Mode';
            themeSelector.value = 'light';
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️ Light Mode';
            themeSelector.value = 'dark';
            localStorage.setItem('theme', 'dark');
        }
    }
    
    // Theme selector
    themeSelector.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        document.documentElement.setAttribute('data-theme', selectedTheme);
        localStorage.setItem('theme', selectedTheme);
        if (selectedTheme === 'dark') {
            themeToggle.textContent = '☀️ Light Mode';
        } else {
            themeToggle.textContent = '🌙 Dark Mode';
        }
        
        // Apply mood to Scrapia engine when theme changes
        if (scrapiaEngine) {
            scrapiaEngine.currentTheme = selectedTheme;
            applyMoodToEngine(scrapiaEngine, selectedTheme);
            
            // Initialize or clear Mint Mischief pack
            if (selectedTheme === 'mint-mischief') {
                scrapiaEngine.mintPack = new MintMischiefPack(scrapiaEngine);
            } else {
                scrapiaEngine.mintPack = null;
            }
        }
        
        // Speak theme-specific quip
        if (scrapiaConvo) {
            scrapiaConvo.speakTheme(selectedTheme);
        }
        
        statusText.textContent = `🎨 Theme changed to ${selectedTheme}`;
    });

    // --- Scrapia Engine ---
    let scrapiaEngine = null;
    let scrapiaConvo = null;
    let scrapiaEnabled = localStorage.getItem('scrapiaEnabled') === 'true';

    function initScrapia() {
        if (scrapiaEngine) return;
        
        scrapiaEngine = new ScrapiaEngine({
            editorEl: noteArea,
            rootEl: document.body,
            idleMs: 45_000,
            tickMs: 2_000
        });

        // Initialize conversation engine
        scrapiaConvo = new ScrapiaConversationEngine(scrapiaEngine);
        
        // Set convo reference on engine for distortion packs
        scrapiaEngine.convo = scrapiaConvo;
        
        // Initialize translator
        scrapiaConvo.translator = new ScrapricTranslator();

        // Apply initial mood based on current theme
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        scrapiaEngine.currentTheme = currentTheme;
        applyMoodToEngine(scrapiaEngine, currentTheme);

        // Initialize Mint Mischief pack if theme is mint-mischief
        if (currentTheme === 'mint-mischief') {
            scrapiaEngine.mintPack = new MintMischiefPack(scrapiaEngine);
        }

        if (scrapiaEnabled) {
            scrapiaEngine.setEffectsEnabled(true);
            scrapiaEngine.start();
            scrapiaToggle.textContent = '⟡· Scrapia: ON';
        } else {
            scrapiaEngine.setEffectsEnabled(false);
            scrapiaToggle.textContent = '⟡· Scrapia: OFF';
        }
    }

    // Initialize Scrapia after DOM is ready
    initScrapia();

    // Scrapia toggle
    scrapiaToggle.addEventListener('click', () => {
        scrapiaEnabled = !scrapiaEnabled;
        localStorage.setItem('scrapiaEnabled', scrapiaEnabled);
        
        if (scrapiaEngine) {
            scrapiaEngine.setEffectsEnabled(scrapiaEnabled);
            if (scrapiaEnabled) {
                scrapiaEngine.start();
                scrapiaToggle.textContent = '⟡· Scrapia: ON';
                statusText.textContent = '⟡· Scrapia activated! (idle for 45s to see effects)';
            } else {
                scrapiaEngine.stop();
                scrapiaToggle.textContent = '⟡· Scrapia: OFF';
                statusText.textContent = '⟡· Scrapia deactivated.';
            }
        }
    });

    // --- Word/Character Count ---
    function updateWordCount() {
        const text = noteArea.value;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const charCount = text.length;
        return { words: wordCount, chars: charCount };
    }

    // --- Note Management ---
    function createNote() {
        const newNote = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        notes.unshift(newNote);
        selectNote(newNote.id);
        renderNoteList();
        saveNote();
        statusText.textContent = '📝 New note created.';
    }

    function deleteNote(noteId) {
        if (notes.length <= 1) {
            statusText.textContent = '⚠️ Cannot delete the last note.';
            return;
        }
        
        const index = notes.findIndex(n => n.id === noteId);
        if (index > -1) {
            notes.splice(index, 1);
            
            // Select another note
            if (currentNoteId === noteId) {
                const newIndex = Math.min(index, notes.length - 1);
                selectNote(notes[newIndex].id);
            }
            
            renderNoteList();
            saveNote();
            statusText.textContent = '🗑️ Note deleted.';
        }
    }

    function selectNote(noteId) {
        currentNoteId = noteId;
        const note = notes.find(n => n.id === noteId);
        if (note) {
            noteArea.value = note.content;
            updatePreview();
            updateNoteMeta(note);
            // Reset history for new note
            historyStack = [note.content];
            historyIndex = 0;
        }
        renderNoteList();
    }

    function updateNoteMeta(note) {
        const createdDate = new Date(note.createdAt).toLocaleString();
        const modifiedDate = new Date(note.updatedAt).toLocaleString();
        noteCreated.textContent = `Created: ${createdDate}`;
        noteModified.textContent = `Modified: ${modifiedDate}`;
        renderTags(note.tags || []);
    }

    function renderTags(tags) {
        currentTagsContainer.innerHTML = '';
        tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'current-tag';
            tagElement.innerHTML = `${tag} <span data-tag="${tag}">×</span>`;
            currentTagsContainer.appendChild(tagElement);
        });
    }

    function addTag(tag) {
        if (!currentNoteId) return;
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            if (!note.tags) note.tags = [];
            if (!note.tags.includes(tag)) {
                note.tags.push(tag);
                renderTags(note.tags);
                saveNote();
            }
        }
    }

    function removeTag(tag) {
        if (!currentNoteId) return;
        const note = notes.find(n => n.id === currentNoteId);
        if (note && note.tags) {
            note.tags = note.tags.filter(t => t !== tag);
            renderTags(note.tags);
            saveNote();
        }
    }

    // --- Undo/Redo ---
    function pushToHistory(content) {
        // Remove any future history if we're not at the end
        if (historyIndex < historyStack.length - 1) {
            historyStack = historyStack.slice(0, historyIndex + 1);
        }
        historyStack.push(content);
        historyIndex = historyStack.length - 1;
        // Limit history to 50 items
        if (historyStack.length > 50) {
            historyStack.shift();
            historyIndex--;
        }
        updateUndoRedoButtons();
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            noteArea.value = historyStack[historyIndex];
            updatePreview();
            updateUndoRedoButtons();
        }
    }

    function redo() {
        if (historyIndex < historyStack.length - 1) {
            historyIndex++;
            noteArea.value = historyStack[historyIndex];
            updatePreview();
            updateUndoRedoButtons();
        }
    }

    function updateUndoRedoButtons() {
        undoButton.disabled = historyIndex <= 0;
        undoButton.style.opacity = historyIndex <= 0 ? '0.5' : '1';
        redoButton.disabled = historyIndex >= historyStack.length - 1;
        redoButton.style.opacity = historyIndex >= historyStack.length - 1 ? '0.5' : '1';
    }

    function renderNoteList(filterText = '') {
        noteList.innerHTML = '';
        
        const filteredNotes = filterText 
            ? notes.filter(n => 
                n.title.toLowerCase().includes(filterText.toLowerCase()) ||
                n.content.toLowerCase().includes(filterText.toLowerCase())
            )
            : notes;
        
        filteredNotes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = `note-item ${note.id === currentNoteId ? 'active' : ''}`;
            const modifiedDate = new Date(note.updatedAt).toLocaleDateString();
            const tagsHtml = (note.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
            noteItem.innerHTML = `
                <div class="note-item-title">${note.title}</div>
                <div class="note-item-preview">${note.content.substring(0, 50) || 'Empty note'}</div>
                <div class="note-item-date">${modifiedDate}</div>
                <div class="note-item-tags">${tagsHtml}</div>
                <div class="note-item-actions">
                    <button class="delete-note" data-id="${note.id}">🗑️</button>
                </div>
            `;
            
            noteItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-note')) {
                    selectNote(note.id);
                }
            });
            
            const deleteBtn = noteItem.querySelector('.delete-note');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteNote(note.id);
            });
            
            noteList.appendChild(noteItem);
        });
    }

    // --- Event Listeners ---
    saveButton.addEventListener('click', saveNote);
    themeToggle.addEventListener('click', toggleTheme);
    newNoteButton.addEventListener('click', createNote);
    
    // Window controls
    minimizeButton.addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });
    
    maximizeButton.addEventListener('click', () => {
        window.electronAPI.maximizeWindow();
    });
    
    closeButton.addEventListener('click', () => {
        window.electronAPI.quitApp();
    });
    
    // Font size controls
    fontDecrease.addEventListener('click', () => {
        if (currentFontSize > 10) {
            currentFontSize -= 2;
            noteArea.style.fontSize = currentFontSize + 'px';
            statusText.textContent = `🔤 Font size: ${currentFontSize}px`;
        }
    });
    
    fontIncrease.addEventListener('click', () => {
        if (currentFontSize < 32) {
            currentFontSize += 2;
            noteArea.style.fontSize = currentFontSize + 'px';
            statusText.textContent = `🔤 Font size: ${currentFontSize}px`;
        }
    });
    
    // Tags input
    tagsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = tagsInput.value.trim();
            if (tag) {
                addTag(tag);
                tagsInput.value = '';
            }
        }
    });
    
    currentTagsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('current-tag') || e.target.tagName === 'SPAN') {
            const tagElement = e.target.closest('.current-tag');
            const tag = tagElement.querySelector('span')?.dataset.tag;
            if (tag) {
                removeTag(tag);
            }
        }
    });
    
    searchInput.addEventListener('input', (e) => {
        renderNoteList(e.target.value);
    });

    previewButton.addEventListener('click', () => {
        isPreviewMode = !isPreviewMode;
        if (isPreviewMode) {
            noteArea.style.display = 'none';
            markdownPreview.classList.add('active');
            previewButton.textContent = '✏️ Edit';
            updatePreview();
        } else {
            noteArea.style.display = 'block';
            markdownPreview.classList.remove('active');
            previewButton.textContent = '👁️ Preview';
        }
    });

    exportButton.addEventListener('click', () => {
        if (!currentNoteId) return;
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            // For now, we'll use a simple download approach
            // In a full implementation, you'd use Electron's dialog API
            const blob = new Blob([note.content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${note.title}.md`;
            a.click();
            URL.revokeObjectURL(url);
            statusText.textContent = '📤 Note exported as .md file.';
        }
    });

    noteArea.addEventListener('input', () => {
        const count = updateWordCount();
        statusText.textContent = `✍️ ${count.words} words, ${count.chars} chars | Auto-save in ${autoSaveSeconds}s...`;
        debounceAutoSave();
        if (isPreviewMode) {
            updatePreview();
        }
        // Push to history on input (debounced)
        clearTimeout(window.historyTimeout);
        window.historyTimeout = setTimeout(() => {
            pushToHistory(noteArea.value);
        }, 500);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveNote();
        }
        // Ctrl+Q to quit
        if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            exitAppGracefully();
        }
        // Ctrl+Z to undo
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        // Ctrl+Y or Ctrl+Shift+Z to redo
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            redo();
        }
    });
    
    // Undo/Redo buttons
    undoButton.addEventListener('click', undo);
    redoButton.addEventListener('click', redo);
    
    // Settings dropdown toggle
    settingsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsDropdown.contains(e.target) && !settingsButton.contains(e.target)) {
            settingsDropdown.classList.remove('active');
        }
    });
    
    // Sync Save/Load buttons
    syncSaveButton.addEventListener('click', async () => {
        try {
            const result = await window.electronAPI.saveNotesToFile(notes);
            if (result.success) {
                statusText.textContent = `💾 Notes saved to: ${result.path}`;
            } else if (!result.cancelled) {
                statusText.textContent = `❌ Error saving: ${result.error}`;
            }
        } catch (error) {
            console.error('Sync save error:', error);
            statusText.textContent = '❌ Error syncing notes.';
        }
    });
    
    syncLoadButton.addEventListener('click', async () => {
        try {
            const result = await window.electronAPI.loadNotesFromFile();
            if (result.success) {
                if (confirm('This will replace all current notes. Continue?')) {
                    notes = result.notes;
                    renderNoteList();
                    if (notes.length > 0) {
                        selectNote(notes[0].id);
                    }
                    statusText.textContent = '📂 Notes loaded successfully.';
                }
            } else if (!result.cancelled) {
                statusText.textContent = `❌ Error loading: ${result.error}`;
            }
        } catch (error) {
            console.error('Sync load error:', error);
            statusText.textContent = '❌ Error loading notes.';
        }
    });


    // --- Markdown Preview ---
    function updatePreview() {
        const text = noteArea.value;
        let html = text
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/gim, '<pre>$1</pre>')
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
            .replace(/\n/g, '<br>');
        
        markdownPreview.innerHTML = html;
    }

    // --- Resize Handle Functionality ---
    let isResizing = false;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const containerRect = document.querySelector('.main-container').getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        
        if (newWidth >= 150 && newWidth <= 500) {
            sidebar.style.width = newWidth + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });

    // Initialization sequence: Load notes first, then set up UI status
    loadNotes(); 
});

