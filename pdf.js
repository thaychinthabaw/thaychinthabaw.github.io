(() => {
  'use strict';

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js';

  let pdfDoc = null;

  let currentLineHeight = 2.0;
  let currentLetterSpacing = 0;
  let currentFontSize = 25;
  let currentFontWeight = 500;


  /* ================= ELEMENTS ================= */

  const uploadInput = document.getElementById('pdf-upload');
  const uploadBtn = document.getElementById('upload-btn');
  const pagesContainer = document.getElementById('pdf-pages');
  const loadingBox = document.getElementById('pdf-loading');


  /* ================= OPEN FILE ================= */

  uploadBtn.addEventListener('click', () => {
    uploadInput.click();
  });


  uploadInput.addEventListener('change', async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('PDF ဖိုင်သာ တင်နိုင်ပါသည်');
      return;
    }

    localStorage.setItem('lastPDFName', file.name);

    document.getElementById('pdf-title').innerText = file.name;

    loadingBox.style.display = 'flex';

    const arrayBuffer = await file.arrayBuffer();

    loadPDF(arrayBuffer);

  });


  /* ================= LOAD PDF ================= */

  async function loadPDF(data) {

    pagesContainer.innerHTML = '';

    pdfDoc = await pdfjsLib.getDocument({
      data
    }).promise;

    document.getElementById('pdf-meta').innerText =
      `${pdfDoc.numPages} pages`;

    loadingBox.style.display = 'none';


    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {

      await renderPage(pageNum);

      createTOCItem(pageNum);
    }

    observePages();
  }


  /* ================= RENDER PAGE ================= */

  async function renderPage(pageNum) {

    const page = await pdfDoc.getPage(pageNum);

    const viewport = page.getViewport({
      scale: 2
    });

    const canvas = document.createElement('canvas');

    const ctx = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;


    const wrapper = document.createElement('section');

    wrapper.className = 'pdf-page';
    wrapper.id = `page-${pageNum}`;


    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;


    const pageLabel = document.createElement('div');

    pageLabel.className = 'page-number';
    pageLabel.innerText = `Page ${pageNum}`;


    wrapper.appendChild(canvas);
    wrapper.appendChild(pageLabel);

    pagesContainer.appendChild(wrapper);

    applyReaderStyles();
  }


  /* ================= TOC ================= */

  function createTOCItem(pageNum) {

    const tocList = document.getElementById('toc-list');

    const li = document.createElement('li');

    li.innerHTML = `
      <a href="#page-${pageNum}">
        စာမျက်နှာ ${pageNum}
      </a>
    `;

    tocList.appendChild(li);
  }


  function toggleTOC() {

    const overlay = document.getElementById('toc-overlay');

    overlay.style.display =
      overlay.style.display === 'block'
      ? 'none'
      : 'block';
  }


  window.toggleTOC = toggleTOC;


  /* ================= SETTINGS ================= */

  function toggleSetting() {

    const overlay = document.getElementById('setting-overlay');

    overlay.style.display =
      overlay.style.display === 'block'
      ? 'none'
      : 'block';
  }


  window.toggleSetting = toggleSetting;


  /* ================= READING MODE ================= */

  function toggleReadingMode() {

    document.body.classList.toggle('focus-mode');

    const btn = document.getElementById('fs-btn');

    btn.innerHTML =
      document.body.classList.contains('focus-mode')
      ? '✖'
      : '⛶';
  }


  window.toggleReadingMode = toggleReadingMode;


  /* ================= FONT SIZE ================= */

  function renderFontSize() {

    document.getElementById('font-size-display').innerText = currentFontSize;

    document.getElementById('font-size-display2').innerText = currentFontSize;

    applyReaderStyles();

    localStorage.setItem('pdfFontSize', currentFontSize);
  }


  function changeFontSize(amount) {

    const next = currentFontSize + amount;

    if (next < 10 || next > 70) return;

    currentFontSize = next;

    renderFontSize();
  }


  document.getElementById('font-increase').onclick = () => {
    changeFontSize(1);
  };

  document.getElementById('font-decrease').onclick = () => {
    changeFontSize(-1);
  };

  document.getElementById('size-plus-10').onclick = () => {
    changeFontSize(10);
  };

  document.getElementById('size-plus-1').onclick = () => {
    changeFontSize(1);
  };

  document.getElementById('size-minus-10').onclick = () => {
    changeFontSize(-10);
  };

  document.getElementById('size-minus-1').onclick = () => {
    changeFontSize(-1);
  };


  /* ================= FONT WEIGHT ================= */

  function applyWeight(weight) {

    currentFontWeight = weight;

    applyReaderStyles();

    localStorage.setItem('pdfFontWeight', weight);
  }


  document.querySelectorAll('#weight-buttons .preset-btn')
    .forEach(btn => {

      btn.addEventListener('click', () => {

        document.querySelectorAll('#weight-buttons .preset-btn')
          .forEach(b => b.classList.remove('active-preset'));

        btn.classList.add('active-preset');

        applyWeight(parseInt(btn.dataset.weight));
      });
    });


  /* ================= LINE HEIGHT ================= */

  function applyLineHeight() {

    document.getElementById('lh-display').innerText =
      currentLineHeight.toFixed(1);

    applyReaderStyles();

    localStorage.setItem('pdfLineHeight', currentLineHeight);
  }


  function adjustLineHeight(amount) {

    let next =
      Math.round((currentLineHeight + amount) * 10) / 10;

    if (next < 1 || next > 3) return;

    currentLineHeight = next;

    applyLineHeight();
  }


  window.adjustLineHeight = adjustLineHeight;


  /* ================= LETTER SPACING ================= */

  function applyLetterSpacing() {

    document.getElementById('ls-display').innerText =
      currentLetterSpacing;

    applyReaderStyles();

    localStorage.setItem('pdfLetterSpacing', currentLetterSpacing);
  }


  function adjustLetterSpacing(amount) {

    let next = currentLetterSpacing + amount;

    if (next < 0 || next > 10) return;

    currentLetterSpacing = next;

    applyLetterSpacing();
  }


  window.adjustLetterSpacing = adjustLetterSpacing;


  /* ================= APPLY STYLE ================= */

  function applyReaderStyles() {

    const pages = document.querySelectorAll('.pdf-page');

    pages.forEach(page => {

      page.style.fontSize = currentFontSize + 'px';

      page.style.fontWeight = currentFontWeight;

      page.style.lineHeight = currentLineHeight;

      page.style.letterSpacing =
        currentLetterSpacing + 'px';
    });
  }


  /* ================= OBSERVER ================= */

  function observePages() {

    const pages = document.querySelectorAll('.pdf-page');

    const tocLinks = document.querySelectorAll('.toc-list a');


    const observer = new IntersectionObserver(entries => {

      entries.forEach(entry => {

        if (!entry.isIntersecting) return;

        const id = '#' + entry.target.id;

        tocLinks.forEach(link => {

          link.classList.remove('active-chapter');

          if (link.getAttribute('href') === id) {
            link.classList.add('active-chapter');
          }
        });

      });

    }, {
      rootMargin: '-10% 0px -70% 0px'
    });


    pages.forEach(page => {
      observer.observe(page);
    });
  }


  /* ================= TOC SEARCH ================= */

  document.getElementById('toc-search')
    .addEventListener('input', e => {

      const value = e.target.value.toLowerCase();

      document.querySelectorAll('.toc-list li')
        .forEach(item => {

          item.style.display =
            item.innerText.toLowerCase().includes(value)
            ? 'block'
            : 'none';
        });
    });


  /* ================= TOC JUMP ================= */

  document.getElementById('toc-top-btn')
    .onclick = () => {

      document.querySelector('.toc-list')
        .scrollTo({
          top: 0,
          behavior: 'smooth'
        });
    };


  document.getElementById('toc-bottom-btn')
    .onclick = () => {

      const toc = document.querySelector('.toc-list');

      toc.scrollTo({
        top: toc.scrollHeight,
        behavior: 'smooth'
      });
    };


  /* ================= RELOAD ================= */

  document.getElementById('reload-pdf')
    .addEventListener('click', () => {

      location.reload();
    });


  /* ================= LOAD SAVED SETTINGS ================= */

  function loadSavedSettings() {

    currentFontSize =
      parseInt(localStorage.getItem('pdfFontSize')) || 25;

    currentFontWeight =
      parseInt(localStorage.getItem('pdfFontWeight')) || 500;

    currentLineHeight =
      parseFloat(localStorage.getItem('pdfLineHeight')) || 2.0;

    currentLetterSpacing =
      parseFloat(localStorage.getItem('pdfLetterSpacing')) || 0;

    renderFontSize();
    applyLineHeight();
    applyLetterSpacing();
    applyReaderStyles();
  }


  /* ================= INIT ================= */

  document.addEventListener('DOMContentLoaded', () => {

    loadSavedSettings();
  });

})();
