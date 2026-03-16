        (function() {
            'use strict';
            const dom = {
                bgLayer: document.getElementById('bg-layer'),
                searchInput: document.getElementById('searchInput'),
                enginePanel: document.getElementById('enginePanel'),
                engineList: document.getElementById('engineList'),
                currentEngineIcon: document.getElementById('currentEngineIcon'),
                searchEngineSelect: document.getElementById('searchEngineSelect'),
                clearSearchBtn: document.getElementById('clearSearchBtn'),
                searchSubmitBtn: document.getElementById('searchSubmitBtn'),
                tileGrid: document.getElementById('tileGrid'),
                contextMenu: document.getElementById('contextMenu'),
                tileModal: document.getElementById('tileModal'),
                bgModal: document.getElementById('bgModal'),
                modalName: document.getElementById('modalName'),
                modalUrl: document.getElementById('modalUrl'),
                modalImage: document.getElementById('modalImage'),
                modalTitle: document.getElementById('modalTitle'),
                modalNameLabel: document.getElementById('modalNameLabel'),
                modalUrlLabel: document.getElementById('modalUrlLabel'),
                modalCancelBtn: document.getElementById('modalCancelBtn'),
                modalSaveBtn: document.getElementById('modalSaveBtn'),
                modalCloseBtn: document.getElementById('modalCloseBtn'),
                modalUploadBtn: document.getElementById('modalUploadBtn'),
                modalFileUpload: document.getElementById('modalFileUpload'),
                bgUrlInput: document.getElementById('bgUrlInput'),
                blurSlider: document.getElementById('blurSlider'),
                blurValue: document.getElementById('blurValue'),
                bgUploadBtn: document.getElementById('bgUploadBtn'),
                bgFileInput: document.getElementById('bgFileInput'),
                bgTabs: document.querySelectorAll('.bg-tab'),
                bgRemoveBtn: document.getElementById('bgRemoveBtn'),
                bgApplyBtn: document.getElementById('bgApplyBtn'),
                bgCancelBtn: document.getElementById('bgCancelBtn'),
                bgModalClose: document.getElementById('bgModalClose'),
                bgFieldLabel: document.getElementById('bgFieldLabel'),
                bgHint: document.getElementById('bgHint'),
                menuEdit: document.getElementById('menuEdit'),
                menuDelete: document.getElementById('menuDelete'),
                menuBg: document.getElementById('menuBg'),
                menuSizeToggle: document.getElementById('menuSizeToggle'),
                sizeSubmenu: document.getElementById('sizeSubmenu'),
                sizeOptions: document.querySelectorAll('#sizeSubmenu .size-option'),
                categoryToolbar: document.getElementById('categoryToolbar'),
                homeToolbarBtn: document.getElementById('homeToolbarBtn'),
                addCategoryBtn: document.getElementById('addCategoryBtn'),
                categoryModal: document.getElementById('categoryModal'),
                catNameInput: document.getElementById('catNameInput'),
                catIconInput: document.getElementById('catIconInput'),
                catIconUploadBtn: document.getElementById('catIconUploadBtn'),
                catCancelBtn: document.getElementById('catCancelBtn'),
                catSaveBtn: document.getElementById('catSaveBtn'),
                catModalClose: document.getElementById('catModalClose'),
                iconPickerModal: document.getElementById('iconPickerModal'),
                iconGrid: document.getElementById('iconGrid'),
                iconPickerClose: document.getElementById('iconPickerClose'),
                iconPickerCancel: document.getElementById('iconPickerCancel'),
                iconPickerConfirm: document.getElementById('iconPickerConfirm'),
                githubSyncBtn: document.getElementById('githubSyncBtn'),
                githubModal: document.getElementById('githubModal'),
                githubModalClose: document.getElementById('githubModalClose'),
                githubRepo: document.getElementById('githubRepo'),
                githubFilePath: document.getElementById('githubFilePath'),
                githubToken: document.getElementById('githubToken'),
                githubTestBtn: document.getElementById('githubTestBtn'),
                githubUploadBtn: document.getElementById('githubUploadBtn'),
                githubDownloadBtn: document.getElementById('githubDownloadBtn'),
                githubStatus: document.getElementById('githubStatus'),
                autoSyncCheckbox: document.getElementById('autoSyncCheckbox')
            };
            const presetEngines = [
                { id: 'preset-0', name: 'Google', icon: 'devicon:google', url: 'https://www.google.com/search?q=%s' },
                { id: 'preset-1', name: 'Bing', icon: 'logos:bing', url: 'https://www.bing.com/search?q=%s' },
                { id: 'preset-2', name: '百度', icon: 'simple-icons:baidu', url: 'https://www.baidu.com/s?wd=%s' },
                { id: 'preset-3', name: 'DuckDuckGo', icon: 'logos:duckduckgo', url: 'https://duckduckgo.com/?q=%s' },
                { id: 'preset-4', name: 'Yandex', icon: 'vscode-icons:file-type-yandex', url: 'https://yandex.com/search/?text=%s' }
            ];
            let customEngines = [];
            try { const stored = localStorage.getItem('custom_engines'); if (stored) customEngines = JSON.parse(stored); } catch (e) {}
            let selectedEngineId = localStorage.getItem('selected_engine_id') || 'preset-0';
            let categories = [];
            let currentCategoryId = null;
            let tilesData = [];
            let sortableInstance = null;
            let currentModalMode = 'tile';
            let editTileId = null;
            let tilePressTimer = null, enginePressTimer = null, categoryPressTimer = null;
            let pressedTile = null, pressedEngine = null;
            let bgType = 'image', bgUrl = '', blurAmount = 0;
            let currentBgType = 'image';
            const colorCache = new Map();
            const iconList = [
                'hugeicons:game-controller-03', 'mingcute:tool-line', 'mynaui:box', 'ix:ai',
                'hugeicons:chat-gpt', 'proicons:crop', 'ri:movie-2-line', 'mdi-light:music',
                'streamline-plump:ai-edit-robot', 'entypo:aircraft-take-off', 'arcticons:airbrush',
                'ph:bandaids-fill', 'mdi:heart-outline', 'f7:paperplane', 'streamline-pixel:food-drink-coffee'
            ];
            const AUTO_SYNC_KEY = 'auto_sync_enabled';
            let autoSyncEnabled = localStorage.getItem(AUTO_SYNC_KEY) === 'true';
            function debounce(func, wait) {
                let timeout;
                return function(...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            }
            const queueAutoSync = debounce(function() {
                if (!autoSyncEnabled) return;
                const repo = dom.githubRepo.value.trim();
                const path = dom.githubFilePath.value.trim();
                const token = dom.githubToken.value.trim();
                if (!repo || !path || !token) return;
                uploadToGitHub().catch(err => console.error('auto sync failed', err));
            }, 2000);
            window.triggerAutoSync = function() {
                queueAutoSync();
            };
            function initAutoSync() {
                if (dom.autoSyncCheckbox) {
                    dom.autoSyncCheckbox.checked = autoSyncEnabled;
                    dom.autoSyncCheckbox.addEventListener('change', function(e) {
                        autoSyncEnabled = e.target.checked;
                        localStorage.setItem(AUTO_SYNC_KEY, autoSyncEnabled);
                    });
                }
                loadGitHubConfig();
            }
            function renderIconHtml(icon, className = '') {
                if (!icon) icon = '🌐';
                if (/^(https?:\/\/|data:image\/|blob:)/i.test(icon)) {
                    return `<img src="${icon}" class="tile-icon-img" draggable="false" crossorigin="anonymous" data-icon-url="${icon}">`;
                }
                if (icon.includes(':')) {
                    return `<iconify-icon icon="${icon}"${className ? ' class="'+className+'"' : ''}></iconify-icon>`;
                }
                return `<span${className ? ' class="'+className+'"' : ''}>${icon}</span>`;
            }
            const getAllEngines = () => [...presetEngines, ...customEngines];
            const getEngineById = (id) => getAllEngines().find(e => e.id === id) || presetEngines[0];
            const saveCustomEngines = () => {
                localStorage.setItem('custom_engines', JSON.stringify(customEngines));
                queueAutoSync();
            };
            const setSelectedEngine = (id) => { selectedEngineId = id; localStorage.setItem('selected_engine_id', id); updateCurrentEngineIcon(); };
            const updateCurrentEngineIcon = () => { const engine = getEngineById(selectedEngineId); if (engine) dom.currentEngineIcon.innerHTML = renderIconHtml(engine.icon); };
            function hideAllDeleteIcons() {
                document.querySelectorAll('.category-chip.show-delete').forEach(chip => chip.classList.remove('show-delete'));
            }
            const clearAllLongPressTimers = () => {
                if (tilePressTimer) { clearTimeout(tilePressTimer); tilePressTimer = null; }
                if (enginePressTimer) { clearTimeout(enginePressTimer); enginePressTimer = null; }
                if (categoryPressTimer) { clearTimeout(categoryPressTimer); categoryPressTimer = null; }
                pressedTile = null; pressedEngine = null;
            };
            const MULTI_PAGE_KEY = 'multipage_tiles_data';
            function loadMultipageData() {
                const stored = localStorage.getItem(MULTI_PAGE_KEY);
                if (stored) {
                    try {
                        const data = JSON.parse(stored);
                        if (data.categories && Array.isArray(data.categories) && data.currentCategoryId) {
                            categories = data.categories;
                            currentCategoryId = data.currentCategoryId;
                            categories.forEach(c => { if (!c.tiles) c.tiles = []; });
                            return;
                        }
                    } catch (e) {}
                }
                let oldTiles = [];
                try { const old = localStorage.getItem('enhanced_tiles_data'); if (old) oldTiles = JSON.parse(old); } catch {}
                if (!oldTiles.length) {
                    oldTiles = [
                        { id: 'g2', name: 'YouTube', url: 'https://youtube.com', icon: 'logos:youtube-icon', size: '2x1' },
                        { id: 'g5', name: 'GitHub', url: 'https://qq5855144.github.io/GitHub/', icon: 'icon-park:github', size: '1x1' },
                        { id: 'g6', name: 'Iconify', url: 'https://yesicon.app/', icon: 'ph:hand-fist', size: '2x1' }
                    ];
                }
                categories = [ { id: 'cat0', name: '主页', icon: 'mdi:home', tiles: oldTiles } ];
                currentCategoryId = 'cat0';
                saveMultipageData();
            }
            
            function saveMultipageData(skipAutoSync = false) {
                localStorage.setItem(MULTI_PAGE_KEY, JSON.stringify({ categories, currentCategoryId }));
                if (!skipAutoSync) {
                    queueAutoSync();
                }
            }
            function getCurrentTiles() { const cat = categories.find(c => c.id === currentCategoryId); return cat ? cat.tiles : []; }
            function setCurrentTiles(newTiles) { const cat = categories.find(c => c.id === currentCategoryId); if (cat) { cat.tiles = newTiles; tilesData = newTiles; saveMultipageData(); } }
          
            function switchCategory(catId) {
                if (catId === currentCategoryId) return;
                currentCategoryId = catId;
                tilesData = getCurrentTiles();
                renderCategoryBar();
                renderTiles();
                saveMultipageData(true);
            }
            function deleteCategory(catId) {
                if (catId === 'cat0') { alert('主页不能删除'); return; }
                if (!confirm('确定删除此分类？分类下的磁贴将一并删除')) return;
                const index = categories.findIndex(c => c.id === catId);
                if (index !== -1) {
                    categories.splice(index, 1);
                    if (currentCategoryId === catId) { currentCategoryId = 'cat0'; tilesData = getCurrentTiles(); }
                    saveMultipageData();
                    renderCategoryBar();
                    renderTiles();
                }
            }
            function renderEngineList() {
                const all = getAllEngines();
                let html = '';
                all.forEach(engine => {
                    const isPreset = engine.id.startsWith('preset-');
                    html += `<div class="item" data-engine-id="${engine.id}"><span class="engine-icon">${renderIconHtml(engine.icon)}</span><span class="name">${engine.name}</span>${!isPreset ? '<span class="delete-icon" data-delete-id="'+engine.id+'"><iconify-icon icon="mdi:close"></iconify-icon></span>' : ''}</div>`;
                });
                html += `<div class="add-engine-item" id="addEngineBtn"><span class="engine-icon"><iconify-icon icon="material-symbols:add-2"></iconify-icon></span><span class="name">添加</span></div>`;
                dom.engineList.innerHTML = html;
            }
            function renderTiles() {
                let html = '';
                tilesData.forEach(tile => {
                    let displayName = tile.name;
                    const hasChinese = /[\u4e00-\u9fff]/.test(displayName);
                    const maxLen = hasChinese ? 6 : 10;
                    if (displayName.length > maxLen) displayName = displayName.slice(0, maxLen);
                    html += `<div class="tile" data-id="${tile.id}" data-url="${tile.url}" data-size="${tile.size || '1x1'}" data-name="${tile.name.toLowerCase()}"><span class="tile-icon">${renderIconHtml(tile.icon)}</span><span class="tile-name">${displayName}</span></div>`;
                });
                html += `<div class="tile add-tile" id="addTileBtn" data-size="1x1"><span class="tile-icon"><iconify-icon icon="material-symbols:add-2"></iconify-icon></span><span class="tile-name">添加</span></div>`;
                dom.tileGrid.innerHTML = html;
                dom.tileGrid.querySelectorAll('.tile:not(.add-tile) .tile-icon img').forEach(img => {
                    img.style.pointerEvents = 'none';
                    img.setAttribute('draggable', 'false');
                });
                initDragAndDrop();
                extractEdgeColors();
            }
            function initDragAndDrop() {
                if (sortableInstance) sortableInstance.destroy();
                sortableInstance = new Sortable(dom.tileGrid, {
                    animation: 200, filter: '.add-tile', draggable: '.tile:not(.add-tile)',
                    delay: 100, delayOnTouchOnly: true, touchStartThreshold: 5,
                    forceFallback: true,
                    fallbackClass: 'sortable-drag', ghostClass: 'sortable-ghost', dragClass: 'sortable-drag',
                    chosenClass: 'sortable-chosen', scroll: true, scrollSensitivity: 30,
                    onStart: clearAllLongPressTimers,
                    onEnd: (evt) => {
                        const newOrder = [];
                        dom.tileGrid.querySelectorAll('.tile:not(.add-tile)').forEach(el => {
                            const id = el.dataset.id;
                            const tile = tilesData.find(t => t.id === id);
                            if (tile) newOrder.push(tile);
                        });
                        if (newOrder.length === tilesData.length) setCurrentTiles(newOrder);
                        else renderTiles();
                    }
                });
            }
            function extractEdgeColors() {
                const images = document.querySelectorAll('.tile:not(.add-tile) .tile-icon img.tile-icon-img');
                images.forEach(img => {
                    const tile = img.closest('.tile');
                    if (tile && tile.dataset.size === '1x1') return; 
                    const iconContainer = img.closest('.tile-icon');
                    if (!iconContainer) return;
                    const applyColor = () => {
                        if (img.complete) {
                            img.decode().then(() => setBackgroundFromImage(img, iconContainer)).catch(() => {});
                        } else {
                            img.addEventListener('load', () => {
                                img.decode().then(() => setBackgroundFromImage(img, iconContainer)).catch(() => {});
                            }, { once: true });
                            img.addEventListener('error', () => {});
                        }
                    };
                    applyColor();
                });
            }
            function setBackgroundFromImage(img, container) {
                const tile = img.closest('.tile');
                if (tile && tile.dataset.size === '1x1') return;
                const src = img.src;
                if (colorCache.has(src)) {
                    const cachedColor = colorCache.get(src);
                    if (cachedColor) {
                        container.style.setProperty('background-color', cachedColor, 'important');
                        container.style.backdropFilter = 'none';
                        container.style.webkitBackdropFilter = 'none';
                    }
                    return;
                }
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    ctx.drawImage(img, 0, 0);
                    const w = img.naturalWidth, h = img.naturalHeight;
                    const samples = [];
                    for (let row = 0; row < 9; row++) {
                        for (let col = 0; col < 9; col++) {
                            if (row === 0 || row === 8 || col === 0 || col === 8) {
                                const cellWidth = w / 9, cellHeight = h / 9;
                                const centerX = Math.floor(col * cellWidth + cellWidth / 2);
                                const centerY = Math.floor(row * cellHeight + cellHeight / 2);
                                const x = Math.min(w - 1, Math.max(0, centerX));
                                const y = Math.min(h - 1, Math.max(0, centerY));
                                const pixel = ctx.getImageData(x, y, 1, 1).data;
                                const a = pixel[3] / 255;
                                if (a > 0) samples.push({ r: pixel[0], g: pixel[1], b: pixel[2], a: a });
                            }
                        }
                    }
                    let finalR, finalG, finalB, finalA;
                    if (samples.length === 0) {
                        finalR = 255; finalG = 255; finalB = 255; finalA = 1;
                    } else {
                        const binSize = 32;
                        const bins = {};
                        samples.forEach(s => {
                            const rIdx = Math.floor(s.r / binSize);
                            const gIdx = Math.floor(s.g / binSize);
                            const bIdx = Math.floor(s.b / binSize);
                            const key = `${rIdx},${gIdx},${bIdx}`;
                            if (!bins[key]) bins[key] = { count: 0, sumR: 0, sumG: 0, sumB: 0 };
                            bins[key].count++;
                            bins[key].sumR += s.r;
                            bins[key].sumG += s.g;
                            bins[key].sumB += s.b;
                        });
                        let maxCount = 0, bestKey = null;
                        for (const key in bins) {
                            if (bins[key].count > maxCount) { maxCount = bins[key].count; bestKey = key; }
                        }
                        const bestBin = bins[bestKey];
                        finalR = Math.round(bestBin.sumR / bestBin.count);
                        finalG = Math.round(bestBin.sumG / bestBin.count);
                        finalB = Math.round(bestBin.sumB / bestBin.count);
                        finalA = 1;
                    }
                    const colorStr = `rgba(${finalR}, ${finalG}, ${finalB}, ${finalA})`;
                    colorCache.set(src, colorStr);
                    container.style.setProperty('background-color', colorStr, 'important');
                    container.style.backdropFilter = 'none';
                    container.style.webkitBackdropFilter = 'none';
                } catch (e) {
                    colorCache.set(src, null);
                }
            }
            function renderCategoryBar() {
                const toolbar = dom.categoryToolbar;
                const addBtn = dom.addCategoryBtn;
                while (toolbar.children.length > 2) toolbar.removeChild(toolbar.children[1]);
                categories.forEach(cat => {
                    if (cat.id === 'cat0') return;
                    const chip = document.createElement('div');
                    chip.className = 'category-chip' + (cat.id === currentCategoryId ? ' active' : '');
                    chip.dataset.catId = cat.id;
                    chip.innerHTML = `
                        <span class="chip-icon">${renderIconHtml(cat.icon)}</span>
                        <span class="chip-name">${cat.name}</span>
                        <span class="delete-cat-icon" data-cat-id="${cat.id}"><iconify-icon icon="mdi:close"></iconify-icon></span>
                    `;
                    toolbar.insertBefore(chip, addBtn);
                });
                dom.homeToolbarBtn.classList.toggle('active-home', currentCategoryId === 'cat0');
                document.querySelectorAll('.category-chip .delete-cat-icon').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const catId = btn.dataset.catId;
                        if (catId) { if (catId === 'cat0') { alert('主页不能删除'); hideAllDeleteIcons(); return; } deleteCategory(catId); }
                    });
                });
            }
            function isLikelyURL(str) {
                if (/\s/.test(str)) return false;
                if (/^https?:\/\//i.test(str)) return true;
                if (/^[^\s:]+\.[^\s:]+/.test(str)) return true;
                if (/^[a-zA-Z0-9-]+:\d+(\/|$)/.test(str)) return true;
                return false;
            }
            function performSearch() {
                const query = dom.searchInput.value.trim();
                if (!query) return;
                if (isLikelyURL(query)) {
                    let url = query;
                    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
                    window.location.href = url;
                    return;
                }
                const engine = getEngineById(selectedEngineId);
                if (!engine) return;
                let searchUrl = engine.url;
                if (searchUrl.includes('%s')) searchUrl = searchUrl.replace('%s', encodeURIComponent(query));
                else searchUrl += encodeURIComponent(query);
                window.location.href = searchUrl;
            }
            function closeModal() { dom.tileModal.classList.remove('show'); currentModalMode = 'tile'; editTileId = null; }
            function openTileModal(mode, tile = null) {
                currentModalMode = 'tile';
                editTileId = mode === 'edit' ? tile.id : null;
                dom.modalTitle.textContent = mode === 'edit' ? '编辑快捷方式' : '添加快捷方式';
                dom.modalNameLabel.textContent = '网站名称';
                dom.modalUrlLabel.textContent = '网站链接';
                if (mode === 'edit' && tile) { dom.modalName.value = tile.name || ''; dom.modalUrl.value = tile.url || ''; dom.modalImage.value = tile.icon || '🌐'; }
                else { dom.modalName.value = ''; dom.modalUrl.value = ''; dom.modalImage.value = ''; }
                dom.tileModal.classList.add('show');
            }
            function openModalForEngine(engine = null) {
                currentModalMode = 'engine';
                editTileId = engine ? engine.id : null;
                dom.modalTitle.textContent = engine ? '编辑搜索引擎' : '添加搜索引擎';
                dom.modalNameLabel.textContent = '搜索引擎名称';
                dom.modalUrlLabel.textContent = '搜索URL (使用 %s 代表查询词)';
                dom.modalName.value = engine ? engine.name : '';
                dom.modalUrl.value = engine ? engine.url : '';
                dom.modalImage.value = engine ? engine.icon : 'simple-icons:google';
                dom.tileModal.classList.add('show');
            }
            function handleModalSave() {
                const name = dom.modalName.value.trim();
                const url = dom.modalUrl.value.trim();
                let icon = dom.modalImage.value.trim() || '🌐';
                if (!name || !url) { alert('名称和链接不能为空'); return; }
                if (currentModalMode === 'tile') {
                    if (editTileId) { const tile = tilesData.find(t => t.id === editTileId); if (tile) { tile.name = name; tile.url = url; tile.icon = icon; } }
                    else { tilesData.push({ id: 't' + Date.now() + Math.random().toString(36).substr(2, 4), name, url, icon, size: '1x1' }); }
                    setCurrentTiles(tilesData);
                    renderTiles();
                } else {
                    if (!url.includes('%s')) { alert('请在URL中包含 %s 作为查询词占位符'); return; }
                    if (editTileId) {
                        const index = customEngines.findIndex(e => e.id === editTileId);
                        if (index !== -1) { customEngines[index] = { ...customEngines[index], name, url, icon }; saveCustomEngines(); if (selectedEngineId === editTileId) updateCurrentEngineIcon(); }
                    } else {
                        const newId = 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
                        customEngines.push({ id: newId, name, icon, url });
                        saveCustomEngines();
                        setSelectedEngine(newId);
                    }
                    renderEngineList();
                }
                closeModal();
            }
            function setBlur(blur) {
                blurAmount = blur;
                const bgEl = dom.bgLayer.querySelector('img, video');
                if (bgEl) bgEl.style.filter = `blur(${blur}px)`;
                if (dom.blurValue) dom.blurValue.textContent = blur + 'px';
                if (dom.blurSlider) dom.blurSlider.value = blur;
            }
            function applyBackground(type, url, blur = blurAmount) {
                dom.bgLayer.innerHTML = '';
                if (!url || url.trim() === '') return;
                if (type === 'image') dom.bgLayer.innerHTML = `<img src="${url}" alt="bg" crossorigin="anonymous">`;
                else if (type === 'video') dom.bgLayer.innerHTML = `<video muted autoplay loop playsinline><source src="${url}">您的浏览器不支持视频背景</video>`;
                setBlur(blur);
            }
            function saveBackground(type, url, blur = blurAmount) {
                bgType = type; bgUrl = url; blurAmount = blur;
                localStorage.setItem('background_settings', JSON.stringify({ type, url, blur }));
                applyBackground(type, url, blur);
                queueAutoSync();
            }
            function loadBackground() {
                try {
                    const stored = localStorage.getItem('background_settings');
                    if (stored) { const settings = JSON.parse(stored); bgType = settings.type || 'image'; bgUrl = settings.url || ''; blurAmount = settings.blur !== undefined ? settings.blur : 0; applyBackground(bgType, bgUrl, blurAmount); }
                    else { saveBackground('image', 'https://icdn.binmt.cc/2602/699a570336d59.jpg', 10); }
                } catch { saveBackground('image', 'https://icdn.binmt.cc/2602/699a570336d59.jpg', 10); }
            }
            function removeBackground() {
                localStorage.removeItem('background_settings');
                dom.bgLayer.innerHTML = '';
                bgType = 'image'; bgUrl = ''; blurAmount = 0;
                setBlur(0);
                queueAutoSync();
            }
            function openBgModal() {
                currentBgType = bgType;
                dom.bgUrlInput.value = bgUrl || '';
                dom.blurSlider.value = blurAmount;
                dom.blurValue.textContent = blurAmount + 'px';
                updateBgTabUI(); updateBgFieldByType(); dom.bgModal.classList.add('show');
            }
            function closeBgModal() { dom.bgModal.classList.remove('show'); }
            function updateBgTabUI() { dom.bgTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.bgType === currentBgType)); }
            function updateBgFieldByType() {
                if (currentBgType === 'image') {
                    dom.bgFieldLabel.innerHTML = '<iconify-icon icon="mdi:link"></iconify-icon> 图片/GIF URL 或 上传文件';
                    dom.bgFileInput.accept = 'image/*';
                    dom.bgHint.innerHTML = '<iconify-icon icon="mdi:information"></iconify-icon> 本地图片会转为base64 (建议<5MB)，GIF支持。';
                } else {
                    dom.bgFieldLabel.innerHTML = '<iconify-icon icon="mdi:link"></iconify-icon> 视频URL (mp4/webm)';
                    dom.bgFileInput.accept = 'video/*';
                    dom.bgHint.innerHTML = '<iconify-icon icon="mdi:information"></iconify-icon> 视频仅支持在线URL，本地视频过大无法存储。';
                }
            }
            function handleBgFile(e) {
                const file = e.target.files[0];
                if (!file) return;
                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) { alert('文件超过5MB，请使用在线URL。'); return; }
                const reader = new FileReader();
                reader.onload = (ev) => { dom.bgUrlInput.value = ev.target.result; };
                reader.readAsDataURL(file);
            }
            function applyBgSettings() { const url = dom.bgUrlInput.value.trim(); if (!url) { alert('请输入URL或上传文件'); return; } saveBackground(currentBgType, url, parseInt(dom.blurSlider.value, 10)); closeBgModal(); }
            function removeBgAndClose() { removeBackground(); dom.bgUrlInput.value = ''; dom.blurSlider.value = 0; dom.blurValue.textContent = '0px'; closeBgModal(); }
            function openCategoryModal() { dom.catNameInput.value = ''; dom.catIconInput.value = 'mdi:folder'; dom.categoryModal.classList.add('show'); }
            function closeCategoryModal() { dom.categoryModal.classList.remove('show'); }
            function createNewCategory() {
                const name = dom.catNameInput.value.trim();
                let icon = dom.catIconInput.value.trim() || 'mdi:folder';
                if (!name) { alert('请输入分类名称'); return; }
                const newId = 'cat' + Date.now() + Math.random().toString(36).substr(2, 4);
                categories.push({ id: newId, name: name, icon: icon, tiles: [] });
                saveMultipageData();
                switchCategory(newId);
                closeCategoryModal();
            }
            let selectedIcon = null;
            function renderIconGrid() { let html = ''; iconList.forEach(icon => { html += `<div class="icon-item" data-icon="${icon}"><iconify-icon icon="${icon}"></iconify-icon></div>`; }); dom.iconGrid.innerHTML = html; }
            function openIconPicker() { renderIconGrid(); dom.iconPickerModal.classList.add('show'); selectedIcon = null; document.querySelectorAll('.icon-item').forEach(item => item.classList.remove('selected')); }
            function closeIconPicker() { dom.iconPickerModal.classList.remove('show'); }
            function hideContextMenu() { dom.contextMenu.classList.remove('show'); }
            function showContextMenu(event, element, type = 'tile') {
                let clientX, clientY;
                if (event.touches) { clientX = event.touches[0].clientX; clientY = event.touches[0].clientY; } else { clientX = event.clientX; clientY = event.clientY; }
                const menu = dom.contextMenu;
                menu.style.visibility = 'hidden'; menu.classList.add('show'); menu.style.opacity = '0'; menu.style.pointerEvents = 'none';
                document.getElementById('menuBg').style.display = type === 'engine' ? 'none' : 'flex';
                document.getElementById('menuSizeToggle').style.display = type === 'engine' ? 'none' : 'flex';
                menu.dataset.contextType = type;
                menu.dataset.targetId = element.dataset.engineId || element.dataset.id;
                const menuRect = menu.getBoundingClientRect();
                let left = clientX, top = clientY;
                if (left + menuRect.width > window.innerWidth) left = window.innerWidth - menuRect.width - 8;
                if (left < 8) left = 8;
                if (top + menuRect.height > window.innerHeight) top = window.innerHeight - menuRect.height - 8;
                if (top < 8) top = 8;
                menu.style.left = left + 'px'; menu.style.top = top + 'px';
                menu.style.visibility = ''; menu.style.opacity = ''; menu.style.pointerEvents = '';
                document.getElementById('sizeSubmenu').style.display = 'none';
                setTimeout(() => { document.addEventListener('click', hideContextMenuOnClickOutside, { once: true }); }, 100);
            }
            function hideContextMenuOnClickOutside(e) { if (!dom.contextMenu.contains(e.target)) hideContextMenu(); }
            const GITHUB_CONFIG_KEY = 'github_sync_config';
            function loadGitHubConfig() {
                const saved = localStorage.getItem(GITHUB_CONFIG_KEY);
                if (saved) {
                    try {
                        const config = JSON.parse(saved);
                        dom.githubRepo.value = config.repo || '';
                        dom.githubFilePath.value = config.path || 'homepage-data.json';
                        dom.githubToken.value = config.token || '';
                    } catch (e) {}
                } else {
                    dom.githubRepo.value = '';
                    dom.githubFilePath.value = 'homepage-data.json';
                    dom.githubToken.value = '';
                }
            }
            function saveGitHubConfig() {
                const config = {
                    repo: dom.githubRepo.value.trim(),
                    path: dom.githubFilePath.value.trim(),
                    token: dom.githubToken.value.trim()
                };
                localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
            }
            function bindGitHubInputsSave() {
                [dom.githubRepo, dom.githubFilePath, dom.githubToken].forEach(input => {
                    input.addEventListener('input', saveGitHubConfig);
                });
            }
            function encodeBase64(str) {
                return btoa(unescape(encodeURIComponent(str)));
            }
            function decodeBase64(str) {
                return decodeURIComponent(escape(atob(str)));
            }

            async function getFullRepo(inputRepo, token) {
                if (inputRepo.includes('/')) {
                    const parts = inputRepo.split('/');
                    if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
                    throw new Error('仓库格式错误，应为 owner/repo 或 仓库名');
                } else {
                    if (!token) throw new Error('需要提供Token以获取所有者信息');
                    const res = await fetch('https://api.github.com/user', { headers: { 'Authorization': `token ${token}` } });
                    if (!res.ok) throw new Error(`获取用户失败: ${res.status}`);
                    const user = await res.json();
                    return { owner: user.login, repo: inputRepo };
                }
            }

            async function testGitHubConnection() {
                const token = dom.githubToken.value.trim();
                if (!token) { dom.githubStatus.textContent = '请输入 Token'; return; }
                saveGitHubConfig();
                dom.githubStatus.textContent = '测试中...';
                try {
                    const res = await fetch('https://api.github.com/user', {
                        headers: { 'Authorization': `token ${token}` }
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    const data = await res.json();
                    dom.githubStatus.textContent = `连接成功: ${data.login}`;
                } catch (err) {
                    dom.githubStatus.textContent = `连接失败: ${err.message}`;
                }
            }
            async function uploadToGitHub() {
                const repoInput = dom.githubRepo.value.trim();
                const path = dom.githubFilePath.value.trim();
                const token = dom.githubToken.value.trim();
                if (!repoInput || !path || !token) { dom.githubStatus.textContent = '请填写完整信息'; return; }
                saveGitHubConfig();
                try {
                    const { owner, repo } = await getFullRepo(repoInput, token);
                    const backup = {
                        multipage: { categories, currentCategoryId },
                        customEngines,
                        selectedEngineId,
                        background: (() => {
                            const bg = localStorage.getItem('background_settings');
                            return bg ? JSON.parse(bg) : null;
                        })()
                    };
                    const contentBase64 = encodeBase64(JSON.stringify(backup, null, 2));
                    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
                    const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
                    dom.githubStatus.textContent = '正在获取文件信息...';
                    let sha = null;
                    const getRes = await fetch(apiUrl, { headers });
                    if (getRes.status === 404) {
                        sha = null;
                    } else if (getRes.ok) {
                        const data = await getRes.json();
                        sha = data.sha;
                    } else {
                        throw new Error(`获取文件失败: ${getRes.status}`);
                    }
                    const body = { message: 'Update homepage data via web', content: contentBase64 };
                    if (sha) body.sha = sha;
                    dom.githubStatus.textContent = '正在上传...';
                    const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
                    if (putRes.ok) {
                        dom.githubStatus.textContent = '上传成功！';
                    } else {
                        const err = await putRes.json();
                        throw new Error(err.message);
                    }
                } catch (err) {
                    dom.githubStatus.textContent = `上传失败: ${err.message}`;
                }
            }
            async function downloadFromGitHub() {
                const repoInput = dom.githubRepo.value.trim();
                const path = dom.githubFilePath.value.trim();
                const token = dom.githubToken.value.trim();
                if (!repoInput || !path || !token) { dom.githubStatus.textContent = '请填写完整信息'; return; }
                saveGitHubConfig();
                try {
                    const { owner, repo } = await getFullRepo(repoInput, token);
                    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
                    const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
                    dom.githubStatus.textContent = '正在下载...';
                    const res = await fetch(apiUrl, { headers });
                    if (!res.ok) throw new Error(`下载失败: ${res.status}`);
                    const data = await res.json();
                    const decoded = decodeBase64(data.content.replace(/\n/g, ''));
                    const backup = JSON.parse(decoded);
                    if (confirm('导入将覆盖所有现有数据（分类、磁贴、搜索引擎、背景设置）。确定继续？')) {
                        try {
                            if (backup.multipage) localStorage.setItem(MULTI_PAGE_KEY, JSON.stringify(backup.multipage));
                            if (backup.customEngines) localStorage.setItem('custom_engines', JSON.stringify(backup.customEngines));
                            if (backup.selectedEngineId) localStorage.setItem('selected_engine_id', backup.selectedEngineId);
                            if (backup.background) localStorage.setItem('background_settings', JSON.stringify(backup.background));
                        } catch (e) {
                            dom.githubStatus.textContent = '保存失败: ' + e.message;
                            return;
                        }
                        window.triggerAutoSync();
                        setTimeout(() => {
                            dom.githubModal.classList.remove('show');
                            dom.tileModal.classList.remove('show');
                            location.reload();
                        }, 1500);
                        dom.githubStatus.textContent = '已保存，同步中……即将刷新';
                    } else {
                        dom.githubStatus.textContent = '';
                    }
                } catch (err) {
                    dom.githubStatus.textContent = `下载失败: ${err.message}`;
                }
            }
            function bindEvents() {
                dom.engineList.addEventListener('click', (e) => {
                    const deleteBtn = e.target.closest('.delete-icon');
                    if (deleteBtn) {
                        e.stopPropagation();
                        const id = deleteBtn.dataset.deleteId;
                        if (id) { customEngines = customEngines.filter(e => e.id !== id); saveCustomEngines(); if (selectedEngineId === id) setSelectedEngine('preset-0'); renderEngineList(); }
                        return;
                    }
                    const item = e.target.closest('.item');
                    if (item) { const id = item.dataset.engineId; if (id) { setSelectedEngine(id); dom.enginePanel.classList.remove('active'); } return; }
                    if (e.target.closest('#addEngineBtn')) openModalForEngine();
                });
                const startEngineLongPress = (e) => {
                    const item = e.target.closest('.item');
                    if (!item) return;
                    clearAllLongPressTimers();
                    pressedEngine = item;
                    enginePressTimer = setTimeout(() => { if (navigator.vibrate) navigator.vibrate(20); showContextMenu(e, item, 'engine'); pressedEngine = null; enginePressTimer = null; }, 500);
                };
                dom.engineList.addEventListener('touchstart', startEngineLongPress, { passive: true });
                dom.engineList.addEventListener('mousedown', startEngineLongPress);
                dom.engineList.addEventListener('touchmove', clearAllLongPressTimers, { passive: true });
                dom.engineList.addEventListener('touchend', () => { if (enginePressTimer) clearTimeout(enginePressTimer); enginePressTimer = null; pressedEngine = null; });
                dom.engineList.addEventListener('touchcancel', clearAllLongPressTimers);
                dom.engineList.addEventListener('mouseup', () => { if (enginePressTimer) clearTimeout(enginePressTimer); enginePressTimer = null; pressedEngine = null; });
                dom.engineList.addEventListener('mouseleave', clearAllLongPressTimers);
                dom.engineList.addEventListener('contextmenu', (e) => { const item = e.target.closest('.item'); if (item) { e.preventDefault(); showContextMenu(e, item, 'engine'); } });
                const startTileLongPress = (e) => {
                    const tile = e.target.closest('.tile:not(.add-tile)');
                    if (!tile) { clearAllLongPressTimers(); return; }
                    clearAllLongPressTimers();
                    pressedTile = tile;
                    tilePressTimer = setTimeout(() => {
                        if (navigator.vibrate) navigator.vibrate(20);
                        showContextMenu(e, tile, 'tile');
                        pressedTile = null; tilePressTimer = null;
                    }, 500);
                };
                dom.tileGrid.addEventListener('touchstart', startTileLongPress, { passive: true });
                dom.tileGrid.addEventListener('mousedown', startTileLongPress);
                dom.tileGrid.addEventListener('touchmove', clearAllLongPressTimers, { passive: true });
                dom.tileGrid.addEventListener('touchend', (e) => {
                    const tile = e.target.closest('.tile:not(.add-tile)');
                    if (!tile) { clearAllLongPressTimers(); return; }
                    if (tilePressTimer) {
                        clearTimeout(tilePressTimer);
                        tilePressTimer = null;
                        if (tile.dataset.url) window.location.href = tile.dataset.url;
                    }
                    pressedTile = null;
                });
                dom.tileGrid.addEventListener('touchcancel', clearAllLongPressTimers);
                dom.tileGrid.addEventListener('mouseup', (e) => {
                    const tile = e.target.closest('.tile:not(.add-tile)');
                    if (!tile) { clearAllLongPressTimers(); return; }
                    if (tilePressTimer) {
                        clearTimeout(tilePressTimer);
                        tilePressTimer = null;
                        if (tile.dataset.url) window.location.href = tile.dataset.url;
                    }
                    pressedTile = null;
                });
                dom.tileGrid.addEventListener('mouseleave', clearAllLongPressTimers);
                dom.tileGrid.addEventListener('contextmenu', (e) => {
                    const tile = e.target.closest('.tile:not(.add-tile)');
                    if (tile) { e.preventDefault(); showContextMenu(e, tile, 'tile'); }
                });
                dom.tileGrid.addEventListener('click', (e) => { if (e.target.closest('.add-tile')) openTileModal('add'); });
                let categoryLongPressed = false, categoryStartX = 0, categoryStartY = 0;
                function onCategoryPointerDown(e) {
                    const chip = e.target.closest('.category-chip');
                    if (!chip || e.target.closest('.delete-cat-icon')) return;
                    hideAllDeleteIcons();
                    clearAllLongPressTimers();
                    pressedEngine = chip;
                    categoryLongPressed = false;
                    categoryStartX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
                    categoryStartY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
                    categoryPressTimer = setTimeout(() => {
                        if (pressedEngine === chip) { if (navigator.vibrate) navigator.vibrate(20); chip.classList.add('show-delete'); categoryLongPressed = true; categoryPressTimer = null; }
                    }, 400);
                }
                function onCategoryPointerUp(e) {
                    if (!pressedEngine) return;
                    const targetChip = e.target.closest('.category-chip');
                    if (targetChip && targetChip === pressedEngine && !categoryLongPressed) { const catId = targetChip.dataset.catId; if (catId) { hideAllDeleteIcons(); switchCategory(catId); } }
                    clearAllLongPressTimers();
                    pressedEngine = null;
                }
                function onCategoryPointerMove(e) {
                    if (!pressedEngine) return;
                    const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
                    const clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
                    if (Math.abs(clientX - categoryStartX) > 10 || Math.abs(clientY - categoryStartY) > 10) { clearAllLongPressTimers(); }
                }
                dom.categoryToolbar.addEventListener('mousedown', onCategoryPointerDown);
                dom.categoryToolbar.addEventListener('touchstart', onCategoryPointerDown, { passive: false });
                document.addEventListener('mouseup', onCategoryPointerUp);
                document.addEventListener('touchend', onCategoryPointerUp);
                document.addEventListener('mousemove', onCategoryPointerMove);
                document.addEventListener('touchmove', onCategoryPointerMove, { passive: true });
                document.addEventListener('touchcancel', clearAllLongPressTimers);
                document.addEventListener('mouseleave', clearAllLongPressTimers);
                document.addEventListener('click', function(e) { if (!e.target.closest('.delete-cat-icon') && !e.target.closest('.category-chip')) hideAllDeleteIcons(); });
                dom.homeToolbarBtn.addEventListener('click', () => switchCategory('cat0'));
                dom.addCategoryBtn.addEventListener('click', openCategoryModal);
                dom.catCancelBtn.addEventListener('click', closeCategoryModal);
                dom.catModalClose.addEventListener('click', closeCategoryModal);
                dom.catSaveBtn.addEventListener('click', createNewCategory);
                dom.catIconUploadBtn.addEventListener('click', openIconPicker);
                dom.categoryModal.addEventListener('click', (e) => { if (e.target === dom.categoryModal) closeCategoryModal(); });
                dom.iconPickerClose.addEventListener('click', closeIconPicker);
                dom.iconPickerCancel.addEventListener('click', closeIconPicker);
                dom.iconGrid.addEventListener('click', (e) => {
                    const item = e.target.closest('.icon-item');
                    if (!item) return;
                    document.querySelectorAll('.icon-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    selectedIcon = item.dataset.icon;
                });
                dom.iconPickerConfirm.addEventListener('click', () => { if (selectedIcon) dom.catIconInput.value = selectedIcon; closeIconPicker(); });
                dom.iconPickerModal.addEventListener('click', (e) => { if (e.target === dom.iconPickerModal) closeIconPicker(); });
                dom.searchSubmitBtn.addEventListener('click', performSearch);
                dom.searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
                dom.clearSearchBtn.addEventListener('click', () => { dom.searchInput.value = ''; dom.searchInput.focus(); });
                dom.searchEngineSelect.addEventListener('click', (e) => { e.stopPropagation(); dom.enginePanel.classList.toggle('active'); });
                document.addEventListener('click', (e) => { if (!dom.searchEngineSelect.contains(e.target) && !dom.enginePanel.contains(e.target)) dom.enginePanel.classList.remove('active'); });
                dom.modalCloseBtn.addEventListener('click', closeModal);
                dom.modalCancelBtn.addEventListener('click', closeModal);
                dom.modalSaveBtn.addEventListener('click', handleModalSave);
                dom.modalUploadBtn.addEventListener('click', () => dom.modalFileUpload.click());
                dom.modalFileUpload.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => { dom.modalImage.value = event.target.result; };
                    reader.readAsDataURL(file);
                });
                dom.tileModal.addEventListener('click', (e) => { if (e.target === dom.tileModal) closeModal(); });
                dom.menuEdit.addEventListener('click', () => {
                    const menu = dom.contextMenu, type = menu.dataset.contextType, id = menu.dataset.targetId;
                    if (!id) return;
                    if (type === 'engine') {
                        const engine = getAllEngines().find(e => e.id === id);
                        if (engine && !engine.id.startsWith('preset-')) openModalForEngine(engine);
                        else alert('预设引擎不能编辑');
                    } else {
                        const tile = tilesData.find(t => t.id === id);
                        if (tile) openTileModal('edit', tile);
                    }
                    hideContextMenu();
                });
                dom.menuDelete.addEventListener('click', () => {
                    const menu = dom.contextMenu, type = menu.dataset.contextType, id = menu.dataset.targetId;
                    if (!id) return;
                    if (type === 'engine') {
                        const engine = getAllEngines().find(e => e.id === id);
                        if (engine && !engine.id.startsWith('preset-')) { if (confirm('确定删除此搜索引擎？')) { customEngines = customEngines.filter(e => e.id !== id); saveCustomEngines(); if (selectedEngineId === id) setSelectedEngine('preset-0'); renderEngineList(); } } else alert('预设引擎不能删除');
                    } else {
                        if (confirm('确定删除此快捷方式？')) { setCurrentTiles(tilesData.filter(t => t.id !== id)); renderTiles(); }
                    }
                    hideContextMenu();
                });
                dom.menuBg.addEventListener('click', () => { hideContextMenu(); openBgModal(); });
                dom.menuSizeToggle.addEventListener('click', (e) => { e.stopPropagation(); dom.sizeSubmenu.style.display = dom.sizeSubmenu.style.display === 'none' ? 'flex' : 'none'; });
                dom.sizeOptions.forEach(opt => {
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const newSize = e.target.dataset.size, id = dom.contextMenu.dataset.targetId;
                        if (id && newSize) { const tile = tilesData.find(t => t.id === id); if (tile) { tile.size = newSize; setCurrentTiles(tilesData); renderTiles(); } }
                        hideContextMenu();
                    });
                });
                dom.bgTabs.forEach(tab => { tab.addEventListener('click', () => { currentBgType = tab.dataset.bgType; updateBgTabUI(); updateBgFieldByType(); }); });
                dom.bgUploadBtn.addEventListener('click', () => dom.bgFileInput.click());
                dom.bgFileInput.addEventListener('change', handleBgFile);
                dom.blurSlider.addEventListener('input', (e) => { const val = parseInt(e.target.value, 10); dom.blurValue.textContent = val + 'px'; if (bgUrl) { setBlur(val); saveBackground(bgType, bgUrl, val); } else blurAmount = val; });
                dom.bgApplyBtn.addEventListener('click', applyBgSettings);
                dom.bgRemoveBtn.addEventListener('click', removeBgAndClose);
                dom.bgModalClose.addEventListener('click', closeBgModal);
                dom.bgCancelBtn.addEventListener('click', closeBgModal);
                dom.bgModal.addEventListener('click', (e) => { if (e.target === dom.bgModal) closeBgModal(); });
                const datetimeBar = document.getElementById('datetimeBar');
                if (datetimeBar) {
                    datetimeBar.addEventListener('click', (e) => {
                        dom.categoryToolbar.classList.toggle('toolbar-dimmed');
                    });
                }
                if (dom.githubSyncBtn) {
                    dom.githubSyncBtn.addEventListener('click', () => {
                        dom.tileModal.classList.remove('show');
                        loadGitHubConfig();
                        dom.githubModal.classList.add('show');
                    });
                }
                if (dom.githubModalClose) {
                    dom.githubModalClose.addEventListener('click', () => dom.githubModal.classList.remove('show'));
                }
                if (dom.githubModal) {
                    dom.githubModal.addEventListener('click', (e) => {
                        if (e.target === dom.githubModal) dom.githubModal.classList.remove('show');
                    });
                }
                if (dom.githubTestBtn) {
                    dom.githubTestBtn.addEventListener('click', testGitHubConnection);
                }
                if (dom.githubUploadBtn) {
                    dom.githubUploadBtn.addEventListener('click', uploadToGitHub);
                }
                if (dom.githubDownloadBtn) {
                    dom.githubDownloadBtn.addEventListener('click', downloadFromGitHub);
                }
                bindGitHubInputsSave();
            }
            // ================== 更新日期时间（带农历、节日）==================
            function updateDateTime() {
                const now = new Date();
                const month = now.getMonth() + 1;
                const day = now.getDate();
                const year = now.getFullYear();
                
                // 公历日期
                const dateStr = `${month}月${day}日`;
                // 星期（短格式）
                const weekdayStr = now.toLocaleDateString('zh-CN', { weekday:'short' });
                
                let lunarStr = '';
                let festivalStr = '';
                
                // 使用 solarlunar 库计算农历（如果可用）
                if (typeof solarlunar !== 'undefined') {
                    try {
                        const lunar = solarlunar.solar2lunar(year, month, day);
                        if (lunar) {
                            const lMonth = lunar.lMonth;       // 农历月 1-12
                            const lDay = lunar.lDay;           // 农历日 1-30
                            const isLeap = lunar.isLeap;       // 是否闰月
                            
                            const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月', 
                                                '七月', '八月', '九月', '十月', '十一月', '十二月'];
                            const dayNames = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
                                             '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
                                             '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
                            
                            let lunarMonthStr = monthNames[lMonth - 1];
                            if (isLeap) lunarMonthStr = '闰' + lunarMonthStr;
                            const lunarDayStr = dayNames[lDay - 1] || lDay + ''; // 防止越界
                            lunarStr = lunarMonthStr + lunarDayStr;
                            
                            // 农历节日 (月日两位)
                            const lunarFestivals = {
                                '0101': '春节',
                                '0115': '元宵节',
                                '0505': '端午节',
                                '0707': '七夕节',
                                '0715': '中元节',
                                '0815': '中秋节',
                                '0909': '重阳节',
                                '1208': '腊八节'
                            };
                            // 公历节日
                            const solarFestivals = {
                                '0101': '元旦',
                                '0214': '情人节',
                                '0308': '妇女节',
                                '0312': '植树节',
                                '0401': '愚人节',
                                '0501': '劳动节',
                                '0601': '儿童节',
                                '0701': '建党节',
                                '0801': '建军节',
                                '0910': '教师节',
                                '1001': '国庆节',
                                '1224': '平安夜',
                                '1225': '圣诞节'
                            };
                            
                            // 先判断农历节日
                            const lunarKey = (lMonth < 10 ? '0' + lMonth : '' + lMonth) + (lDay < 10 ? '0' + lDay : '' + lDay);
                            if (lunarFestivals[lunarKey]) {
                                festivalStr = lunarFestivals[lunarKey];
                            } else {
                                // 再判断公历节日
                                const solarKey = (month < 10 ? '0' + month : '' + month) + (day < 10 ? '0' + day : '' + day);
                                if (solarFestivals[solarKey]) {
                                    festivalStr = solarFestivals[solarKey];
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('农历转换出错', e);
                    }
                }
                
                // 组合最终字符串： 3月12日 星期四 正月廿四 植树节
                let fullDate = `${dateStr} ${weekdayStr}`;
                if (lunarStr) fullDate += ` ${lunarStr}`;
                if (festivalStr) fullDate += ` ${festivalStr}`;
                
                document.getElementById('currentDate').textContent = fullDate;
                document.getElementById('currentTime').textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
            }
            
            function init() {
                renderEngineList();
                loadMultipageData();
                tilesData = getCurrentTiles();
                renderCategoryBar();
                renderTiles();
                updateCurrentEngineIcon();
                loadBackground();
                initAutoSync();
                bindEvents();
                updateDateTime();
                setInterval(updateDateTime, 1000);

                let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
                let swipeLock = false;
                const SWIPE_THRESHOLD = 30;
                const SWIPE_TIME_MAX = 200;
                dom.tileGrid.addEventListener('touchstart', (e) => {
                    if (e.touches.length !== 1) return;
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    touchStartTime = Date.now();
                    swipeLock = false;
                }, { capture: true, passive: true });
                dom.tileGrid.addEventListener('touchmove', (e) => {
                    if (e.touches.length !== 1) return;
                    if (swipeLock) {
                        e.preventDefault();
                        return;
                    }
                    const dx = e.touches[0].clientX - touchStartX;
                    const dy = e.touches[0].clientY - touchStartY;
                    const timeDiff = Date.now() - touchStartTime;
                    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD && timeDiff < SWIPE_TIME_MAX) {
                        const direction = dx > 0 ? 'prev' : 'next';
                        const catList = categories.map(c => c.id);
                        const currentIdx = catList.indexOf(currentCategoryId);
                        let targetIdx = -1;
                        if (direction === 'next' && currentIdx < catList.length - 1) {
                            targetIdx = currentIdx + 1;
                        } else if (direction === 'prev' && currentIdx > 0) {
                            targetIdx = currentIdx - 1;
                        }
                        if (targetIdx !== -1) {
                            e.preventDefault();
                            e.stopPropagation();
                            swipeLock = true;
                            clearAllLongPressTimers();
                            switchCategory(catList[targetIdx]);
                        }
                    }
                }, { capture: true, passive: false });
                dom.tileGrid.addEventListener('touchend', (e) => {
                    swipeLock = false;
                }, { capture: true });
                dom.tileGrid.addEventListener('touchcancel', (e) => {
                    swipeLock = false;
                }, { capture: true });
            }
            
            init();
            window.addEventListener('beforeunload', function() {
                if (tilePressTimer) clearTimeout(tilePressTimer);
                if (enginePressTimer) clearTimeout(enginePressTimer);
                if (categoryPressTimer) clearTimeout(categoryPressTimer);
            });
        })();
        document.addEventListener('contextmenu', (e) => {
            if (e.defaultPrevented) return;
            if (e.target.matches('input, textarea, [contenteditable="true"]')) return;
            e.preventDefault();
        });
        document.addEventListener('selectstart', (e) => {
            if (e.target.matches('input, textarea, [contenteditable="true"]')) return;
            e.preventDefault();
        });
        (function() {
            const searchInput = document.getElementById('searchInput');
            const suggestionsBox = document.getElementById('suggestionsBox');
            if (!searchInput || !suggestionsBox) return;
            window.showSuggestions = function(data) {
                if (!data || !data.s || !suggestionsBox) return;
                const suggestions = data.s;
                if (!suggestions.length) { suggestionsBox.style.display = 'none'; return; }
                let html = '';
                suggestions.forEach(s => {
                    const safeS = s.replace(/[&<>"]/g, function(m) { return m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : '&quot;'; });
                    html += `<div class="suggestion-item" data-suggestion="${safeS}"><span class="suggestion-search-icon" data-action="search" data-suggestion="${safeS}"><iconify-icon icon="mdi:magnify"></iconify-icon></span><span class="suggestion-text" data-action="search" data-suggestion="${safeS}">${safeS}</span><span class="suggestion-fill-icon" data-action="fill" data-suggestion="${safeS}"><iconify-icon icon="mdi:arrow-top-left"></iconify-icon></span></div>`;
                });
                suggestionsBox.innerHTML = html;
                suggestionsBox.style.display = 'block';
            };
            const performSearchWithSuggestion = (suggestion) => { if (!suggestion) return; searchInput.value = suggestion; document.getElementById('searchSubmitBtn').click(); };
            const fillSearchInput = (suggestion) => { if (!suggestion) return; searchInput.value = suggestion; searchInput.focus(); searchInput.dispatchEvent(new Event('keyup', {bubbles: true})); };
            suggestionsBox.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target) return;
                const action = target.dataset.action;
                const suggestion = target.dataset.suggestion;
                if (!suggestion) return;
                if (action === 'search') { performSearchWithSuggestion(suggestion); suggestionsBox.style.display = 'none'; }
                else if (action === 'fill') { fillSearchInput(suggestion); }
                e.preventDefault(); e.stopPropagation();
            });
            suggestionsBox.addEventListener('mousedown', (e) => { if (e.target.closest('[data-action]')) e.preventDefault(); });
            let timer;
            searchInput.addEventListener('keyup', () => {
                const val = searchInput.value.trim();
                if (val.length === 0) { suggestionsBox.innerHTML = ''; suggestionsBox.style.display = 'none'; return; }
                clearTimeout(timer);
                timer = setTimeout(() => {
                    const script = document.createElement('script');
                    script.src = `https://www.baidu.com/su?wd=${encodeURIComponent(val)}&cb=showSuggestions`;
                    document.body.appendChild(script);
                    document.body.removeChild(script);
                }, 150);
            });
            searchInput.addEventListener('focus', () => { if (searchInput.value.trim().length > 0 && suggestionsBox.children.length > 0) suggestionsBox.style.display = 'block'; });
            searchInput.addEventListener('blur', () => { setTimeout(() => { if (!suggestionsBox.contains(document.activeElement)) suggestionsBox.style.display = 'none'; }, 200); });
            const exportBtn = document.getElementById('exportDataBtn');
            const importBtn = document.getElementById('importDataBtn');
            const MULTI_PAGE_KEY = 'multipage_tiles_data';
            const tileModal = document.getElementById('tileModal');
            const exportBackup = () => {
                try {
                    const backup = {
                        multipage: JSON.parse(localStorage.getItem(MULTI_PAGE_KEY) || 'null'),
                        customEngines: localStorage.getItem('custom_engines'),
                        selectedEngineId: localStorage.getItem('selected_engine_id'),
                        background: localStorage.getItem('background_settings')
                    };
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                    saveAs(blob, `startpage_backup_${new Date().toISOString().slice(0,10)}.json`);
                } catch (err) { alert('导出失败：' + err.message); }
            };
            const importBackup = () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json,application/json';
                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const data = JSON.parse(ev.target.result);
                            if (confirm('导入将覆盖所有现有数据（分类、磁贴、搜索引擎、背景设置）。确定继续？')) {
                                try {
                                    if (data.multipage) localStorage.setItem(MULTI_PAGE_KEY, JSON.stringify(data.multipage));
                                    if (data.customEngines) localStorage.setItem('custom_engines', data.customEngines);
                                    if (data.selectedEngineId) localStorage.setItem('selected_engine_id', data.selectedEngineId);
                                    if (data.background) localStorage.setItem('background_settings', data.background);
                                } catch (err) {
                                    alert('保存失败：' + err.message);
                                    return;
                                }
                                if (window.triggerAutoSync) window.triggerAutoSync();
                                setTimeout(() => {
                                    if (tileModal) tileModal.classList.remove('show');
                                    location.reload();
                                }, 1500);
                            }
                        } catch { alert('无效的备份文件'); }
                    };
                    reader.readAsText(file);
                };
                fileInput.click();
            };
            if (exportBtn) exportBtn.addEventListener('click', exportBackup);
            if (importBtn) importBtn.addEventListener('click', importBackup);
        })();