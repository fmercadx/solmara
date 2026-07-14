// Solmara onboarding wizard (front-end demonstration; nothing leaves the browser)
(function () {
  var panels = document.querySelectorAll('.panel');
  var psteps = document.querySelectorAll('.p-step');
  var current = 1;

  function show(step) {
    current = step;
    panels.forEach(function (p) {
      p.classList.toggle('active', +p.dataset.step === step);
    });
    psteps.forEach(function (s) {
      var n = +s.dataset.p;
      s.classList.toggle('active', n === step);
      s.classList.toggle('done', n < step);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Validation ---
  function validateField(field) {
    var kind = field.dataset.kind || 'text';
    var ok = true;
    if (kind === 'choice') {
      ok = !!field.querySelector('input:checked');
    } else if (kind === 'photos') {
      ok = files.length > 0;
    } else if (kind === 'cardnum') {
      ok = field.querySelector('input').value.replace(/\D/g, '').length === 16;
    } else if (kind === 'expiry') {
      var v = field.querySelector('input').value.replace(/\D/g, '');
      ok = v.length === 4 && +v.slice(0, 2) >= 1 && +v.slice(0, 2) <= 12;
    } else if (kind === 'cvc') {
      var c = field.querySelector('input').value.replace(/\D/g, '');
      ok = c.length >= 3 && c.length <= 4;
    } else {
      var input = field.querySelector('input,textarea');
      ok = input.value.trim().length > 0;
      if (ok && input.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    }
    field.classList.toggle('invalid', !ok);
    return ok;
  }

  function validatePanel(step) {
    var panel = document.querySelector('.panel[data-step="' + step + '"]');
    var fields = panel.querySelectorAll('.field[data-required]');
    var allOk = true, firstBad = null;
    fields.forEach(function (f) {
      if (!validateField(f)) { allOk = false; firstBad = firstBad || f; }
    });
    if (firstBad) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return allOk;
  }

  // clear error state while typing / choosing
  document.querySelectorAll('.field[data-required]').forEach(function (f) {
    f.addEventListener('input', function () { f.classList.remove('invalid'); });
    f.addEventListener('change', function () { f.classList.remove('invalid'); });
  });

  // --- Navigation ---
  document.querySelectorAll('[data-back]').forEach(function (b) {
    b.addEventListener('click', function () { show(current - 1); });
  });

  document.querySelectorAll('[data-next]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!validatePanel(current)) return;
      if (current === 3) { simulatePayment(b); return; }
      show(current + 1);
    });
  });

  function simulatePayment(btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Processing…';
    setTimeout(function () {
      var name = (document.getElementById('f-name').value.trim().split(/\s+/)[0]) || '';
      var msg = document.getElementById('confirm-msg');
      if (name) {
        msg.textContent = name + ', your place is reserved. Your concierge is already reading your intake, and you’ll hear from them within two days to arrange your first consultation.';
      }
      var ref = 'SOL-' + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('confirm-ref').textContent = 'Season Ref · ' + ref;
      btn.disabled = false;
      btn.textContent = 'Complete Enrollment · $3,800';
      show(4);
    }, 1800);
  }

  // --- Photo upload ---
  var files = [];
  var MAX_FILES = 6;
  var MAX_SIZE = 25 * 1024 * 1024;
  var dropzone = document.getElementById('dropzone');
  var fileInput = document.getElementById('file-input');
  var thumbs = document.getElementById('thumbs');

  function openPicker() { fileInput.click(); }
  dropzone.addEventListener('click', openPicker);
  dropzone.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
  });

  ['dragenter', 'dragover'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.add('drag'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.remove('drag'); });
  });
  dropzone.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });

  function addFiles(list) {
    Array.prototype.slice.call(list).forEach(function (file) {
      if (files.length >= MAX_FILES) return;
      if (!file.type.match(/^image\//)) return;
      if (file.size > MAX_SIZE) return;
      var entry = { file: file, url: URL.createObjectURL(file) };
      files.push(entry);
      renderThumb(entry);
    });
    var field = dropzone.closest('.field');
    if (files.length) field.classList.remove('invalid');
  }

  function renderThumb(entry) {
    var div = document.createElement('div');
    div.className = 'thumb';
    var img = document.createElement('img');
    img.src = entry.url;
    img.alt = entry.file.name;
    var meta = document.createElement('div');
    meta.className = 't-meta';
    meta.textContent = entry.file.name + ' · ' + (entry.file.size / 1024 / 1024).toFixed(1) + ' MB';
    var x = document.createElement('button');
    x.className = 't-x';
    x.type = 'button';
    x.setAttribute('aria-label', 'Remove ' + entry.file.name);
    x.textContent = '×';
    x.addEventListener('click', function (e) {
      e.stopPropagation();
      URL.revokeObjectURL(entry.url);
      files.splice(files.indexOf(entry), 1);
      div.remove();
    });
    div.appendChild(img); div.appendChild(meta); div.appendChild(x);
    thumbs.appendChild(div);
  }

  // --- Card input formatting ---
  var cnum = document.getElementById('c-num');
  cnum.addEventListener('input', function () {
    var v = cnum.value.replace(/\D/g, '').slice(0, 16);
    cnum.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
  });
  var cexp = document.getElementById('c-exp');
  cexp.addEventListener('input', function () {
    var v = cexp.value.replace(/\D/g, '').slice(0, 4);
    cexp.value = v.length > 2 ? v.slice(0, 2) + ' / ' + v.slice(2) : v;
  });
  var ccvc = document.getElementById('c-cvc');
  ccvc.addEventListener('input', function () {
    ccvc.value = ccvc.value.replace(/\D/g, '').slice(0, 4);
  });
})();
