/* AURA — локальний JS без бібліотек */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* Header shadow + burger */
  const header = $('#header');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  const burger = $('#burger');
  const nav = $('#nav');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  });
  $$('.nav__link', nav).forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  /* Active nav on scroll */
  const links = $$('.nav__link');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const ioNav = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => ioNav.observe(s));

  /* Reveal */
  const ioReveal = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); ioReveal.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => ioReveal.observe(el));

  /* Counters */
  const fmt = (v, d) => d > 0 ? v.toFixed(d).replace('.', ',') : Math.round(v).toLocaleString('uk-UA');
  const ioCount = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      ioCount.unobserve(el);
      const target = parseFloat(el.dataset.counter);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const t0 = performance.now(), dur = 1400;
      const tick = t => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased, dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  $$('[data-counter]').forEach(el => ioCount.observe(el));

  /* Promo copy */
  const toast = $('#toast');
  let toastTimer;
  const showToast = msg => {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
  };
  const promoBtn = $('#promoCopy');
  if (promoBtn) promoBtn.addEventListener('click', async () => {
    const code = promoBtn.textContent.trim();
    try { await navigator.clipboard.writeText(code); }
    catch (err) {
      const ta = document.createElement('textarea');
      ta.value = code; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { /* noop */ }
      ta.remove();
    }
    const promoInput = $('#promoInput');
    if (promoInput) { promoInput.value = code; updateCalc(); }
    showToast('Промокод ' + code + ' скопійовано (−20% на перший візит)');
  });

  /* Services filter */
  const filterBtns = $$('.filter__btn');
  const cards = $$('#servicesGrid .service');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');
    const f = btn.dataset.filter;
    cards.forEach(c => {
      const show = f === 'all' || (c.dataset.cat || '').split(' ').includes(f);
      c.style.display = show ? '' : 'none';
    });
  }));

  /* Prefill service/master from cards */
  const serviceSelect = $('#serviceSelect');
  const masterSelect = $('#masterSelect');
  const scrollToBooking = () => $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $$('[data-service]').forEach(a => a.addEventListener('click', () => {
    const name = a.dataset.service;
    const opt = Array.from(serviceSelect.options).find(o => o.text.includes(name));
    if (opt) { serviceSelect.value = opt.text; updateCalc(); }
  }));
  $$('[data-master]').forEach(b => b.addEventListener('click', () => {
    masterSelect.value = b.dataset.master;
    scrollToBooking();
    showToast('Обрано майстра: ' + b.dataset.master);
  }));
  $$('[data-open-booking]').forEach(a => a.addEventListener('click', () => {
    setTimeout(() => { const n = $('#bookForm input[name="name"]'); if (n) n.focus({ preventScroll: true }); }, 600);
  }));

  /* Price calculator */
  const calcOut = $('#calcOut');
  const priceOf = text => {
    const m = (text || '').match(/(\d[\d\s]*)\s*₴/);
    return m ? parseInt(m[1].replace(/\s/g, ''), 10) : 0;
  };
  function updateCalc() {
    const t = serviceSelect.value;
    const price = priceOf(t);
    const promo = ($('#promoInput').value || '').trim().toUpperCase();
    if (!t) { calcOut.textContent = 'Оберіть послугу у формі — порахуємо ціну з урахуванням знижки першого візиту.'; return; }
    if (price === 0) { calcOut.textContent = 'Консультація — безкоштовно. Тривалість 10 хв, онлайн або в студії.'; return; }
    if (promo === 'AURA20') {
      const d = Math.round(price * 0.8);
      calcOut.innerHTML = 'Разом з промокодом <strong>AURA20 −20%</strong>: <strong>' + d.toLocaleString('uk-UA') + ' ₴</strong> <s style="opacity:.6">' + price.toLocaleString('uk-UA') + ' ₴</s>';
    } else {
      calcOut.innerHTML = 'Орієнтовна вартість: <strong>' + price.toLocaleString('uk-UA') + ' ₴</strong>. Додайте промокод AURA20 — буде −20%.';
    }
  }
  serviceSelect.addEventListener('change', updateCalc);
  $('#promoInput').addEventListener('input', updateCalc);

  /* Free slots (псевдо-рандом за днем) */
  const freeEl = $('#freeSlots');
  if (freeEl) {
    const day = new Date().getDate();
    const n = 3 + (day % 5);
    freeEl.textContent = n + ' ' + plural(n, ['віконце', 'віконця', 'віконець']);
  }
  function plural(n, f) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return f[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return f[1];
    return f[2];
  }

  /* Reviews slider — Swiper (локально: assets/vendor/swiper/). Цілі слайди: 3 на ПК, 2 на планшеті, 1 на мобільному */
  const slider = $('#revSlider');
  if (window.Swiper && slider) {
    new Swiper(slider, {
      slidesPerView: 1,
      spaceBetween: 14,
      speed: 500,
      rewind: true,
      grabCursor: true,
      autoplay: { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true },
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: {
        enabled: true,
        prevSlideMessage: 'Попередній відгук',
        nextSlideMessage: 'Наступний відгук',
        paginationBulletMessage: 'Перейти до відгуків {{index}}'
      },
      pagination: {
        el: '#revDots',
        clickable: true,
        bulletElement: 'button',
        bulletClass: 'rev-dot',
        bulletActiveClass: 'is-active'
      },
      navigation: { prevEl: '#revPrev', nextEl: '#revNext' },
      breakpoints: {
        641: { slidesPerView: 2, spaceBetween: 18 },
        901: { slidesPerView: 3, spaceBetween: 18 }
      }
    });
  } else if (slider) {
    slider.classList.add('no-swiper');
  }

  /* Gallery lightbox (локальні фото) */
  const lb = $('#lightbox'), lbImg = $('#lightboxImg'), lbText = $('#lightboxText');
  const openLb = (src, text, alt) => {
    lbImg.src = src; lbImg.alt = alt || text;
    lbText.textContent = text;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lightboxClose').focus();
  };
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; };
  $$('#galleryGrid .g').forEach(g => g.addEventListener('click', () => {
    const img = $('img', g);
    openLb(g.dataset.src || img.src, g.dataset.full || img.alt, img.alt);
  }));
  $('#lightboxClose').addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });

  /* Accordion */
  $$('#accordion .acc').forEach(acc => {
    const btn = $('.acc__btn', acc);
    btn.addEventListener('click', () => {
      const open = acc.classList.contains('is-open');
      $$('#accordion .acc').forEach(a => { a.classList.remove('is-open'); $('.acc__btn', a).setAttribute('aria-expanded', 'false'); });
      if (!open) { acc.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* Route */
  $('#routeBtn').addEventListener('click', () => {
    const r = $('#routeOut');
    r.hidden = !r.hidden;
    if (!r.hidden) showToast('Маршрут показано нижче');
  });

  /* Form */
  const form = $('#bookForm');
  const errBox = $('#formError');
  const dateInput = $('#dateInput');
  const today = new Date();
  const iso = d => d.toISOString().slice(0, 10);
  dateInput.min = iso(today);
  const maxD = new Date(today); maxD.setDate(maxD.getDate() + 30);
  dateInput.max = iso(maxD);

  const phoneRe = /^[+\d][\d\s()\-]{8,18}$/;
  form.addEventListener('submit', e => {
    e.preventDefault();
    errBox.hidden = true;
    const fd = new FormData(form);
    const name = (fd.get('name') || '').toString().trim();
    const phone = (fd.get('phone') || '').toString().trim();
    const service = (fd.get('service') || '').toString();
    const date = (fd.get('date') || '').toString();
    const time = (fd.get('time') || '').toString();
    const errs = [];
    if (name.length < 2) errs.push('Вкажіть ім’я (мін. 2 літери).');
    if (!phoneRe.test(phone)) errs.push('Перевірте телефон — приклад: +38 (067) 123-45-67.');
    if (!service) errs.push('Оберіть послугу.');
    if (!date) errs.push('Оберіть дату.');
    if (!time) errs.push('Оберіть час.');
    if (!$('#consent').checked) errs.push('Потрібна згода на обробку даних.');
    if (errs.length) {
      errBox.textContent = errs.join(' ');
      errBox.hidden = false;
      errBox.focus();
      return;
    }
    const promo = (fd.get('promo') || '').toString().trim().toUpperCase();
    const price = priceOf(service);
    const final = promo === 'AURA20' && price ? Math.round(price * 0.8) : price;
    try {
      const prev = JSON.parse(localStorage.getItem('aura_bookings') || '[]');
      prev.push({ name, phone, service, master: fd.get('master'), date, time, promo, final, ts: Date.now() });
      localStorage.setItem('aura_bookings', JSON.stringify(prev));
    } catch (err) { /* приватний режим */ }
    $('#modalText').textContent = name + ', вашу заявку на «' + service + '» (' + date + ' о ' + time + ') прийнято.' +
      (final ? ' Орієнтовна вартість: ' + final.toLocaleString('uk-UA') + ' ₴.' : '') +
      ' Адміністратор підтвердить час протягом 10 хвилин у робочий час (9:00–21:00).';
    openModal();
    form.reset();
    $('#consent').checked = true;
    updateCalc();
  });

  /* Success modal */
  const modal = $('#successModal');
  const openModal = () => { modal.hidden = false; document.body.style.overflow = 'hidden'; $('#modalOk').focus(); };
  const closeModal = () => { modal.hidden = true; document.body.style.overflow = ''; };
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalOk').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLb(); closeModal(); }
  });

  /* Cookie + toTop */
  const cookie = $('#cookie');
  try {
    if (!localStorage.getItem('aura_cookie')) cookie.hidden = false;
  } catch (err) { cookie.hidden = false; }
  $('#cookieOk').addEventListener('click', () => {
    cookie.hidden = true;
    try { localStorage.setItem('aura_cookie', '1'); } catch (err) { /* noop */ }
  });
  const toTop = $('#toTop');
  window.addEventListener('scroll', () => toTop.classList.toggle('is-show', window.scrollY > 700), { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
