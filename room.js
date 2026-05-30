(() => {
  'use strict';

  /* == GLOBAL STATE == */
  let currentLineHeight = 2.0;
  let currentLetterSpacing = 0;
  let fontResizeObserver = null;
  let currentBookId = null; // လက်ရှိ ဖတ်နေသော စာအုပ်၏ ID
  let editingBookId = null;  // လက်ရှိ ပြင်ဆင်နေသော စာအုပ်၏ ID (Edit Mode State)

  /* == STORAGE LIMIT (FIFO SYSTEM) == */
  const MAX_BOOKS = 5; // local မှာ သိမ်းဆည်းမည့် အများဆုံး စာအုပ်အရေအတွက်

  /* == SEMANTIC SYSTEM == */
  function buildSemanticParagraphs() {
    const containers = document.querySelectorAll('.raw-text');
    let globalIndex = 1;
    containers.forEach((container) => {
      const rawText = container.textContent.trim();
      // Line break အလိုက် စာပိုဒ်ခွဲခြင်း
      const paragraphs = rawText.split(/\n\s\n/).filter(p => p.trim() !== '');
      container.innerHTML = '';
      paragraphs.forEach((text) => {
        const cleanText = text.trim();

        if (cleanText === '@@gap') { 
          const gap = document.createElement('div'); 
          gap.className = 'big-gap'; 
          container.appendChild(gap); 
          return; 
        } 
        const p = document.createElement('p'); 
        p.setAttribute('data-p', globalIndex); 
        p.textContent = cleanText; 
        container.appendChild(p); 
        globalIndex++; 
      }); 
    }); 
  }

  function saveReadingPosition() {
    if (!currentBookId) return;
    const paragraphs = document.querySelectorAll('.raw-text p');
    let currentParagraph = null;
    let offsetRatio = 0;
    const viewportCenter = window.innerHeight / 2;

    paragraphs.forEach(p => { 
      const rect = p.getBoundingClientRect(); 
      if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) { 
        currentParagraph = p.dataset.p; 
        offsetRatio = (viewportCenter - rect.top) / rect.height; 
      } 
    }); 
    if (currentParagraph) { 
      localStorage.setItem( 
        `readingPos_${currentBookId}`, 
        JSON.stringify({ paragraph: currentParagraph, offsetRatio: offsetRatio }) 
      ); 
    } 
  }

  function restoreReadingPosition() {
    if (!currentBookId) return;
    const saved = localStorage.getItem(`readingPos_${currentBookId}`);
    if (!saved) return;
    let data;
    try { data = JSON.parse(saved); } catch { return; }

    const target = document.querySelector(`[data-p="${data.paragraph}"]`); 
    if (!target) return; 
    const paragraphHeight = target.offsetHeight; 
    const offsetInsideParagraph = paragraphHeight * (data.offsetRatio || 0); 
    const absoluteTop = target.getBoundingClientRect().top + window.scrollY; 
    const viewportCenter = window.innerHeight / 2; 
    const finalY = absoluteTop + offsetInsideParagraph - viewportCenter; 
    window.scrollTo({ top: finalY, behavior: 'auto' }); 
  }

  function triggerLayoutObserver() {
    if (fontResizeObserver) { fontResizeObserver.disconnect(); }
    const articleElement = document.querySelector('article');
    if (!articleElement) return;

    fontResizeObserver = new ResizeObserver((entries) => { 
      for (let entry of entries) { 
        restoreReadingPosition(); 
        fontResizeObserver.disconnect(); 
        fontResizeObserver = null; 
      } 
    }); 
    fontResizeObserver.observe(articleElement); 
  }

  /* == PASTE PROCESSING SYSTEM == */
  window.processPastedText = function() {
    const textInput = document.getElementById('paste-text-input').value.trim();
    if (!textInput) { alert('ကျေးဇူးပြု၍ စာသားတစ်ခုခု ထည့်သွင်းပါဦးဗျာ။'); return; }

    let currentBooks = JSON.parse(localStorage.getItem('room_bookshelf') || '[]');

    if (editingBookId) {
      // 📝 Edit Mode: မူရင်းဖိုင်ထဲမှာတင် အစားထိုးပြင်ဆင်ခြင်း (ဖိုင်အသစ်မပွားပါ)
      currentBooks = currentBooks.map(book => {
        if (book.id === editingBookId) {
          book.content = textInput;
          // ခေါင်းစဉ်ကို စာသားအသစ် ပထမ စာလုံး ၂၀ ဖြင့် ပြန်ပြင်ယူခြင်း
          book.title = textInput.substring(0, 20) + (textInput.length > 20 ? "..." : "");
          book.timestamp = Date.now(); // အချိန်ကိုပါ update လုပ်ပေးမည်
        }
        return book;
      });
      localStorage.setItem('room_bookshelf', JSON.stringify(currentBooks));
      alert('စာမူပြင်ဆင်ချက်များကို မူရင်းဖိုင်ထဲသို့ သိမ်းဆည်းပြီးပါပြီ။');
      cancelEditMode(); // Edit Mode အား ပိတ်သိမ်းခြင်း
    } else {
      // 🆕 ပုံမှန်အခြေအနေ: စာမူအသစ် သိမ်းဆည်းခြင်း
      const title = textInput.substring(0, 20) + (textInput.length > 20 ? "..." : "");
      const bookId = 'paste_' + Date.now();
      const bookData = { 
        id: bookId, 
        title: title, 
        type: 'paste', 
        content: textInput, 
        pinned: false, 
        timestamp: Date.now() 
      };
      saveBookToStorage(bookData);
      openBook(bookData);
      document.getElementById('paste-text-input').value = ''; 
    }
  };

  /* == EDIT SYSTEM FUNCTION (စာမူဝင်ပြင်ရန် ခလုတ်နှိပ်ခြင်း) == */
  window.enterEditMode = function(id, event) {
    if (event) event.stopPropagation();
    const currentBooks = JSON.parse(localStorage.getItem('room_bookshelf') || '[]');
    const targetBook = currentBooks.find(b => b.id === id);
    
    if (!targetBook) return;

    editingBookId = id; // လက်ရှိပြင်ဆင်နေသော ID ကို သတ်မှတ်

    // UI အား ပြင်ဆင်ရန် အခြေအနေသို့ ပြောင်းလဲခြင်း
    document.getElementById('dashboard-title').textContent = "📝 စာမူပြင်ဆင်ခြင်း ပုံစံ";
    document.getElementById('dashboard-sub-text').textContent = "မူရင်းဖိုင်ထဲတွင် စာသားများ ထပ်ပေါင်းထည့်ခြင်း/ပြင်ဆင်ခြင်းများ ပြုလုပ်နိုင်ပါသည်";
    document.getElementById('paste-text-input').value = targetBook.content;
    document.getElementById('process-btn').textContent = "💾 ပြင်ဆင်ချက်များကို သိမ်းဆည်းရန်";
    document.getElementById('cancel-edit-btn').style.display = 'block';

    // စာရိုက်သည့်နေရာသို့ Scroll ဆွဲပေးခြင်း
    document.getElementById('upload-dashboard').scrollIntoView({ behavior: 'smooth' });
  };

  window.cancelEditMode = function() {
    editingBookId = null;
    document.getElementById('dashboard-title').textContent = "📖 Сာဖတ်ခန်းသို့ စာမူသွင်းရန်";
    document.getElementById('dashboard-sub-text').textContent = "မိမိဖတ်လိုသော စာသားများကို အောက်ပါအကွက်တွင် ထည့်သွင်းပါ";
    document.getElementById('paste-text-input').value = '';
    document.getElementById('process-btn').textContent = "📖 Сာဖတ်ခန်းသို့ လွှတ်ပါ";
    document.getElementById('cancel-edit-btn').style.display = 'none';
    renderBookshelf();
  };

  /* == BOOKSHELF ENGINE (FIFO STORAGE SYSTEM WITH PIN/SAVE) == */
  function saveBookToStorage(newBook) {
    let currentBooks = JSON.parse(localStorage.getItem('room_bookshelf') || '[]');
    currentBooks = currentBooks.filter(b => b.id !== newBook.id);

    // FIFO စနစ် - ၅ အုပ်ပြည့်ပါက Pin မထားသော (pinned: false) အဟောင်းဆုံးစာအုပ်ကို ရှာဖွေဖျက်ထုတ်ခြင်း
    const unpinnedBooks = currentBooks.filter(b => !b.pinned); 
    if (currentBooks.length >= MAX_BOOKS && unpinnedBooks.length > 0) { 
      const oldestUnpinned = unpinnedBooks[0]; 
      currentBooks = currentBooks.filter(b => b.id !== oldestUnpinned.id); 
      localStorage.removeItem(`readingPos_${oldestUnpinned.id}`); 
    } 
    currentBooks.push(newBook); 
    try { 
      localStorage.setItem('room_bookshelf', JSON.stringify(currentBooks)); 
    } catch (e) { 
      alert("သိုလှောင်မှု ပြည့်သွားပါသဖြင့် အချို့စာအုပ်များကို ဖျက်ပေးတော်မူပါဦး။"); 
    } 
    renderBookshelf(); 
  }

  function togglePinBook(id, event) {
    if (event) event.stopPropagation();
    let currentBooks = JSON.parse(localStorage.getItem('room_bookshelf') || '[]');
    currentBooks = currentBooks.map(b => {
      if (b.id === id) {
        b.pinned = !b.pinned;
      }
      return b;
    });
    localStorage.setItem('room_bookshelf', JSON.stringify(currentBooks));
    renderBookshelf();
  }

  function renderBookshelf() {
    const shelfList = document.getElementById('bookshelf-list');
    const storageIndicator = document.getElementById('storage-indicator');
    const currentBooks = JSON.parse(localStorage.getItem('room_bookshelf') || '[]');

    // သိုလှောင်မှု အချိုးအစား တွက်ချက်ခြင်း
    let usedSpace = JSON.stringify(localStorage).length; 
    let spacePercent = Math.min(Math.round((usedSpace / (5 * 1024 * 1024)) * 100), 100); 
    storageIndicator.textContent = `သိုလှောင်မှု: ${spacePercent}%`; 
    
    if (currentBooks.length === 0) { 
      shelfList.innerHTML = '<p class="empty-shelf-text">စာအုပ်စင်ပေါ်တွင် စာအုပ်မရှိသေးပါ။</p>'; 
      return; 
    } 
    shelfList.innerHTML = ''; 
    
    // အသစ်တင်သောစာအုပ်ကို ထိပ်ဆုံးမှ ပြရန် Reverse ပတ်ခြင်း
    currentBooks.slice().reverse().forEach(book => { 
      const card = document.createElement('div'); 
      card.className = 'book-card'; 
      
      const info = document.createElement('div'); 
      info.className = 'book-card-info'; 
      info.onclick = () => openBook(book); 
      
      const title = document.createElement('p'); 
      title.className = 'book-card-title'; 
      title.textContent = '✍️ ' + book.title; 
      
      const meta = document.createElement('p'); 
      meta.className = 'book-card-meta'; 
      const date = new Date(book.timestamp).toLocaleDateString(); 
      meta.textContent = `တင်သွင်းရက် - ${date}`; 
      info.appendChild(title); 
      info.appendChild(meta); 
      
      const actionsWrapper = document.createElement('div'); 
      actionsWrapper.className = 'book-card-actions'; 
      
      // 📌 Save/Pin Button
      const pinBtn = document.createElement('button'); 
      pinBtn.className = `pin-book-btn ${book.pinned ? 'active-pin' : ''}`; 
      pinBtn.innerHTML = '📌'; 
      pinBtn.title = book.pinned ? 'အသေသိမ်းဆည်းမှုကို ပယ်ဖျက်ရန်' : 'စနစ်မှ အလိုအလျောက်မဖျက်စေရန် အသေသိည်းဆည်းထားမည်'; 
      pinBtn.onclick = (e) => togglePinBook(book.id, e); 
      
      // 📝 Edit Button (စာမူဝင်ပြင်ရန် ခလုတ်အသစ်)
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-book-btn';
      editBtn.innerHTML = '📝';
      editBtn.title = 'ဤစာမူကို ပြန်လည်ပြင်ဆင်ရန် သို့မဟုတ် စာသားထပ်ပေါင်းရန်';
      editBtn.onclick = (e) => enterEditMode(book.id, e);

      // × Delete Button
      const delBtn = document.createElement('button'); 
      delBtn.className = 'delete-book-btn'; 
      delBtn.textContent = '×'; 
      delBtn.onclick = (e) => { 
        e.stopPropagation(); 
        deleteBook(book.id); 
      }; 
      
      actionsWrapper.appendChild(pinBtn); 
      actionsWrapper.appendChild(editBtn); // ပြင်ရန်ခလုတ်ကို ကြားထဲထည့်ပေးခြင်း
      actionsWrapper.appendChild(delBtn); 
      card.appendChild(info); 
      card.appendChild(actionsWrapper); 
      shelfList.appendChild(card); 
    }); 
  }

  function deleteBook(id) {
    if (!confirm("ဤစာအုပ်ကို စာအုပ်စင်မှ ဖျက်ရန် သေချာပါသလား။")) return;
    let currentBooks = JSON.parse(localStorage.getItem('room_bookshelf') || '[]');
    currentBooks = currentBooks.filter(b => b.id !== id);
    localStorage.setItem('room_bookshelf', JSON.stringify(currentBooks));
    localStorage.removeItem(`readingPos_${id}`);
    if (editingBookId === id) cancelEditMode(); // ပြင်နေဆဲဖိုင်ကို ဖျက်လိုက်လျှင် edit mode ပိတ်မည်
    renderBookshelf();
  }

  /* == READ MODE MANAGEMENT == */
  function openBook(book) {
    currentBookId = book.id;
    document.getElementById('upload-dashboard').style.display = 'none';
    document.getElementById('reading-content').style.display = 'block';
    document.getElementById('floating-controls').style.display = 'flex';
    document.getElementById('close-book-btn').style.display = 'block';
    document.getElementById('book-main-title').textContent = book.title;

    const bodyContent = document.getElementById('book-body-content'); 
    bodyContent.textContent = book.content; 
    buildSemanticParagraphs(); 
    generateDynamicTOC(); 
    triggerLayoutObserver(); 
    setTimeout(() => { restoreReadingPosition(); }, 150); 
  }

  window.closeCurrentBook = function() {
    saveReadingPosition();
    currentBookId = null;
    document.getElementById('upload-dashboard').style.display = 'block';
    document.getElementById('reading-content').style.display = 'none';
    document.getElementById('floating-controls').style.display = 'none';
    document.getElementById('close-book-btn').style.display = 'none';
    toggleSetting(); // setting box ပိတ်ရန်
    renderBookshelf();
    window.scrollTo({ top: 0 });
  };

  /* == DYNAMIC TOC GENERATION == */
  function generateDynamicTOC() {
    const tocList = document.getElementById('dynamic-toc-list');
    tocList.innerHTML = '';

    const paragraphs = document.querySelectorAll('.raw-text p'); 
    let step = Math.max(1, Math.floor(paragraphs.length / 10)); // အပိုင်း ၁၀ ပိုင်းခွဲခြင်း 
    for (let i = 0; i < paragraphs.length; i += step) { 
      const li = document.createElement('li'); 
      const a = document.createElement('a'); 
      a.href = '#'; 
      a.textContent = `အပိုင်း (${Math.floor(i/step) + 1})`; 
      const targetIndex = i; 
      a.onclick = (e) => { 
        e.preventDefault(); 
        paragraphs[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'center' }); 
        toggleTOC(); 
      }; 
      li.appendChild(a); 
      tocList.appendChild(li); 
    } 
  }

  /* == ORIGINAL INTERFACES & UTILITIES == */
  function toggleTOC() {
    const tocOverlay = document.getElementById('toc-overlay');
    if (!tocOverlay) return;
    tocOverlay.style.display = (tocOverlay.style.display !== 'block') ? 'block' : 'none';
  }

  function toggleSetting() {
    const settingOverlay = document.getElementById('setting-overlay');
    if (!settingOverlay) return;
    settingOverlay.style.display = (settingOverlay.style.display === 'block') ? 'none' : 'block';
  }

  function downloadPDF() {
    toggleSetting();
    setTimeout(() => { window.print(); }, 500);
  }

  function toggleReadingMode() {
    document.body.classList.toggle('focus-mode');
    const fsBtn = document.getElementById('fs-btn');
    fsBtn.innerHTML = document.body.classList.contains('focus-mode') ? '✖' : '⛶';
    fsBtn.style.background = document.body.classList.contains('focus-mode') ? 'rgba(234, 222, 188, 0.2)' : 'rgba(234, 222, 188, 0.4)';
  }

  /* == ORIGINAL LAYOUT CORE SYSTEM == */
  function applyLineHeight() {
    const content = document.getElementById('reading-content');
    if (content) content.style.lineHeight = currentLineHeight;
    const lhDisplay = document.getElementById('lh-display');
    if (lhDisplay) lhDisplay.innerText = currentLineHeight.toFixed(1);
    document.querySelectorAll('.line-btn').forEach(btn => {
      btn.classList.toggle('active-preset', parseFloat(btn.dataset.value) === currentLineHeight);
    });
    localStorage.setItem('userLineHeight', currentLineHeight);
  }

  function adjustLineHeight(amount) {
    saveReadingPosition();
    let next = Math.round((currentLineHeight + amount) * 10) / 10;
    if (next >= 1.0 && next <= 5.0) {
      currentLineHeight = next;
      triggerLayoutObserver();
      applyLineHeight();
    }
  }

  function applyLetterSpacing() {
    const content = document.getElementById('reading-content');
    if (content) content.style.letterSpacing = currentLetterSpacing + 'px';
    const lsDisplay = document.getElementById('ls-display');
    if (lsDisplay) lsDisplay.innerText = currentLetterSpacing;
    document.querySelectorAll('.letter-btn').forEach(btn => {
      btn.classList.toggle('active-preset', parseFloat(btn.dataset.value) === currentLetterSpacing);
    });
    localStorage.setItem('userLetterSpacing', currentLetterSpacing);
  }

  function adjustLetterSpacing(amount) {
    saveReadingPosition();
    let next = Math.round((currentLetterSpacing + amount) * 10) / 10;
    if (next >= 0 && next <= 10) {
      currentLetterSpacing = next;
      triggerLayoutObserver();
      applyLetterSpacing();
    }
  }

  /* == FONT SIZE SYSTEM == */
  let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;

  function renderFontSize() {
    const articleElement = document.querySelector('article');
    if (articleElement) articleElement.style.fontSize = fontSize + 'px';
    const fontDisplay = document.getElementById('font-size-display');
    if (fontDisplay) fontDisplay.textContent = fontSize;
    const sizeTens = document.getElementById('size-tens');
    const sizeOnes = document.getElementById('size-ones');
    if (sizeTens) sizeTens.textContent = Math.floor(fontSize / 10);
    if (sizeOnes) sizeOnes.textContent = fontSize % 10;
    localStorage.setItem('userFontSize', fontSize);
  }

  function changeFontSize(amount) {
    saveReadingPosition();
    const next = fontSize + amount;
    if (next >= 10 && next <= 70) {
      fontSize = next;
      triggerLayoutObserver();
      renderFontSize();
    }
  }

  /* == FONT WEIGHT SYSTEM == */
  let currentWeight = parseInt(localStorage.getItem('userFontWeight')) || 500;

  function renderWeight() {
    const articleElement = document.querySelector('article');
    if (articleElement) articleElement.style.fontWeight = currentWeight;
    const hundreds = document.getElementById('digit-hundreds');
    const tens = document.getElementById('digit-tens');
    const ones = document.getElementById('digit-ones');
    if (hundreds) hundreds.textContent = Math.floor(currentWeight / 100);
    if (tens) tens.textContent = Math.floor((currentWeight % 100) / 10);
    if (ones) ones.textContent = currentWeight % 10;
    document.querySelectorAll('#weight-buttons .preset-btn').forEach(btn => {
      btn.classList.toggle('active-preset', parseInt(btn.dataset.weight) === currentWeight);
    });
    localStorage.setItem('userFontWeight', currentWeight);
  }

  function changeWeight(amount) {
    saveReadingPosition();
    const next = currentWeight + amount;
    if (next >= 100 && next <= 900) {
      currentWeight = next;
      triggerLayoutObserver();
      renderWeight();
    }
  }

  /* == MAIN INITIALIZATION == */
  function init() {
    const savedLH = localStorage.getItem('userLineHeight');
    if (savedLH !== null) currentLineHeight = parseFloat(savedLH);
    applyLineHeight();

    const savedLS = localStorage.getItem('userLetterSpacing'); 
    if (savedLS !== null) currentLetterSpacing = parseFloat(savedLS); 
    applyLetterSpacing(); 
    
    const savedFS = localStorage.getItem('userFontSize'); 
    if (savedFS !== null) fontSize = parseInt(savedFS); 
    renderFontSize(); 
    
    const savedFW = localStorage.getItem('userFontWeight'); 
    if (savedFW !== null) currentWeight = parseInt(savedFW); 
    renderWeight(); 
    
    renderBookshelf(); 
    
    let readingTimer; 
    window.addEventListener('scroll', () => { 
      clearTimeout(readingTimer); 
      readingTimer = setTimeout(() => { 
        saveReadingPosition(); 
      }, 200); 
    }); 
    
    /* == ATTACH CLICKS TO CONFIG BUTTONS == */ 
    document.getElementById('font-increase').onclick = () => changeFontSize(1); 
    document.getElementById('font-decrease').onclick = () => changeFontSize(-1); 
    document.getElementById('size-plus-10').onclick = () => changeFontSize(10); 
    document.getElementById('size-minus-10').onclick = () => changeFontSize(-10); 
    document.getElementById('size-plus-11').onclick = () => changeFontSize(1); 
    document.getElementById('size-minus-11').onclick = () => changeFontSize(-1); 
    
    document.querySelectorAll('.line-btn').forEach(btn => { 
      btn.addEventListener('click', () => { 
        saveReadingPosition(); 
        currentLineHeight = parseFloat(btn.dataset.value); 
        triggerLayoutObserver(); 
        applyLineHeight(); 
      }); 
    }); 
    
    document.querySelectorAll('.letter-btn').forEach(btn => { 
      btn.addEventListener('click', () => { 
        saveReadingPosition(); 
        currentLetterSpacing = parseFloat(btn.dataset.value); 
        triggerLayoutObserver(); 
        applyLetterSpacing(); 
      }); 
    }); 
    
    document.querySelectorAll('#weight-buttons .preset-btn').forEach(btn => { 
      btn.addEventListener('click', () => { 
        saveReadingPosition(); 
        currentWeight = parseInt(btn.dataset.weight); 
        triggerLayoutObserver(); 
        renderWeight(); 
      }); 
    }); 
    
    document.getElementById('weight-plus-100').onclick = () => changeWeight(100); 
    document.getElementById('weight-minus-100').onclick = () => changeWeight(-100); 
    document.getElementById('weight-plus-10').onclick = () => changeWeight(10); 
    document.getElementById('weight-minus-10').onclick = () => changeWeight(-10); 
    document.getElementById('weight-plus-1').onclick = () => changeWeight(1); 
    document.getElementById('weight-minus-1').onclick = () => changeWeight(-1); 
    
    /* == TOC SEARCH == */ 
    const tocSearch = document.getElementById('toc-search'); 
    if (tocSearch) { 
      tocSearch.addEventListener('input', () => { 
        const val = tocSearch.value.toLowerCase(); 
        document.querySelectorAll('#dynamic-toc-list li').forEach(item => { 
          item.style.display = item.textContent.toLowerCase().includes(val) ? 'block' : 'none'; 
        }); 
      }); 
    } 
    
    /* == EXPORT FUNCTIONS == */ 
    window.toggleTOC = toggleTOC; 
    window.toggleSetting = toggleSetting; 
    window.downloadPDF = downloadPDF; 
    window.toggleReadingMode = toggleReadingMode; 
    window.adjustLineHeight = adjustLineHeight; 
    window.adjustLetterSpacing = adjustLetterSpacing; 
    window.changeFontSize = changeFontSize; 
    window.changeWeight = changeWeight; 
  }

  document.addEventListener('DOMContentLoaded', init);
})();
