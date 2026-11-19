/* ONIRIKO · animaciones aditivas (no cambia HTML, enlaces ni organización)
   Sirve para guache.html (inicio), ropa.html (tienda) y contacto.html. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;

  /* ---- FILTROS de la tienda: dejan solo la categoría elegida ----
     Funciona aunque el usuario pida menos movimiento (en ese caso sin animación). */
  var shop = d.querySelector('.shop-products');
  if (shop) {
    var fbar = d.querySelector('.filters');
    var cards = Array.prototype.slice.call(shop.querySelectorAll('.product'));
    var counter = d.getElementById('productCount');
    var anim = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var applyFilter = function (f) {
      var match = cards.filter(function (c) { return f === 'all' || c.getAttribute('data-category') === f; });
      var leaving = anim ? cards.filter(function (c) { return match.indexOf(c) < 0 && c.offsetParent !== null; }) : [];
      leaving.forEach(function (c) { c.classList.add('o-out'); });
      setTimeout(function () {
        cards.forEach(function (c) {
          var on = match.indexOf(c) > -1;
          c.hidden = !on;
          c.style.display = on ? '' : 'none';
          c.classList.remove('o-out');
        });
        if (anim) match.forEach(function (c, i) {
          c.style.setProperty('--i', Math.min(i, 8));
          c.classList.remove('o-card'); void c.offsetWidth; c.classList.add('o-card');
        });
        if (counter) counter.textContent = pad(match.length) + (match.length === 1 ? ' PIEZA' : ' PIEZAS');
      }, leaving.length ? 280 : 0);
    };
    if (fbar) fbar.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.filter') : null;
      if (!b || !fbar.contains(b)) return;
      Array.prototype.slice.call(fbar.querySelectorAll('.filter')).forEach(function (x) {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      applyFilter(b.getAttribute('data-filter') || 'all');
    });
  }

  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('o-js');

  var $ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var restart = function (el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* ---- titulares en líneas con máscara ---- */
  function splitLines(h) {
    if (h.getAttribute('data-o-split')) return;
    h.setAttribute('data-o-split', '1');
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    var lines = [[]];
    Array.prototype.slice.call(h.childNodes).forEach(function (n) {
      if (n.nodeName === 'BR') lines.push([]);
      else if (!(n.nodeType === 3 && !n.textContent.trim())) lines[lines.length - 1].push(n);
    });
    h.textContent = '';
    lines.forEach(function (nodes, i) {
      if (!nodes.length) return;
      var o = d.createElement('span'), inn = d.createElement('span');
      o.className = 'o-line'; o.setAttribute('aria-hidden', 'true');
      inn.className = 'o-line-in'; inn.style.setProperty('--i', i);
      nodes.forEach(function (n) { inn.appendChild(n); });
      o.appendChild(inn); h.appendChild(o);
    });
  }
  var heads = $('.hero h1, .shop-hero h1, .contact-intro h1, main h2');
  heads.forEach(splitLines);

  /* ---- bloques que aparecen al hacer scroll (el encabezado de la tienda entra por CSS al cargar) ---- */
  var fades = $('.eyebrow, .section-intro, .filters, .story p, .principle, .manifesto-big, .manifesto-text, .contact-form, ' +
                '.shop-results, .shop-disclaimer, .shop-manifesto-bottom, .shop-contact-copy, ' +
                '.contact-info > p, .contact-note, .form-field, .privacy-check, .submit-btn, .form-footnote')
    .filter(function (el) {
      return !el.closest('.shop-hero') && !el.closest('.contact-intro') &&
             !(el.matches('.contact-form') && el.closest('.contact-page'));
    });
  fades.forEach(function (el) {
    var i;
    if (el.closest('.contact-page')) {           // en contacto: cascada campo por campo
      var p = el.parentNode; i = p.__oN || 0; p.__oN = i + 1;
    } else {
      i = Array.prototype.indexOf.call(el.parentNode.children, el);
    }
    el.style.setProperty('--i', Math.min(i, 5));
    el.classList.add('o-fade');
  });

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('o-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  heads.forEach(function (h) { io.observe(h); });
  $('.media-placeholder').forEach(function (m) { io.observe(m); });
  fades.forEach(function (f) { io.observe(f); });

  /* ---- productos: entran al verse; si un filtro los oculta y muestra, vuelven a entrar ---- */
  var box = d.getElementById('products');
  if (box) {
    var pio = new IntersectionObserver(function (es) {
      var n = 0;
      es.forEach(function (e) {
        var el = e.target;
        if (!e.isIntersecting) {
          if (el.offsetParent === null) el.classList.remove('o-card');   // oculto por un filtro
          return;
        }
        if (el.classList.contains('o-card')) return;
        el.style.setProperty('--i', Math.min(n++, 8));
        restart(el, 'o-card');
      });
    }, { threshold: 0.08 });
    var watch = function (el) { if (el.nodeType === 1) pio.observe(el); };
    Array.prototype.slice.call(box.children).forEach(watch);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { Array.prototype.slice.call(m.addedNodes).forEach(watch); });
    }).observe(box, { childList: true });
  }

  /* contador de piezas: pequeño relevo al cambiar */
  var count = d.getElementById('productCount');
  if (count) new MutationObserver(function () { restart(count, 'o-tick'); })
    .observe(count, { childList: true, characterData: true, subtree: true });

  /* ---- ventana de pieza (#modal en inicio, #productModal en tienda) ---- */
  var modal = d.getElementById('modal') || d.getElementById('productModal');
  if (modal) {
    var card = modal.querySelector('.modal-card');
    new MutationObserver(function () { if (card) restart(card, 'o-pop'); })
      .observe(modal, { attributes: true, attributeFilter: ['class', 'style', 'aria-hidden'] });
  }

  /* ---- bolsa ---- */
  var bag = d.getElementById('bag');
  function bump() { if (bag) restart(bag, 'o-bump'); }
  var add = d.getElementById('modalBag');
  if (add) add.addEventListener('click', bump);
  if (bag) new MutationObserver(bump).observe(bag, { childList: true, characterData: true, subtree: true });

  /* ---- LOGO del inicio: al pasar el cursor las letras se "desarman"
     como retazos y el símbolo gira; al salir se vuelven a coser.
     Al hacer clic el símbolo da una vuelta completa. ---- */
  var logo = d.querySelector('.hero') ? d.querySelector('.nav .logo') : null;
  if (logo) {
    var mark = logo.querySelector('.logo-mark-placeholder');
    Array.prototype.slice.call(logo.childNodes).forEach(function (n) {
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      var word = d.createElement('span');
      word.className = 'o-logo-word'; word.setAttribute('aria-hidden', 'true');
      n.textContent.trim().split('').forEach(function (ch, i) {
        var s = d.createElement('span');
        s.className = 'o-ch'; s.textContent = ch; s.style.setProperty('--i', i);
        word.appendChild(s);
      });
      logo.setAttribute('aria-label', n.textContent.trim() + ' · ir al inicio');
      logo.replaceChild(word, n);
    });
    var chars = $('.o-ch', logo);
    var rnd = function (a) { return (Math.random() * a * 2 - a).toFixed(1); };
    var unstitch = function () {
      chars.forEach(function (c) {
        c.style.setProperty('--x', rnd(4) + 'px');
        c.style.setProperty('--y', rnd(6) + 'px');
        c.style.setProperty('--r', rnd(14) + 'deg');
      });
      logo.classList.add('o-logo-on');
    };
    var stitch = function () { logo.classList.remove('o-logo-on'); };
    logo.addEventListener('mouseenter', unstitch);
    logo.addEventListener('mouseleave', stitch);
    logo.addEventListener('focus', unstitch);
    logo.addEventListener('blur', stitch);
    logo.addEventListener('click', function () {
      stitch();
      if (mark) restart(mark, 'o-spin');
    });
  }

  /* ---- red de seguridad: lo que quedó a la vista sin revelarse se muestra ---- */
  setTimeout(function () {
    $('.media-placeholder, .o-fade, #products > *').concat(heads).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (el.offsetParent === null) return;
      var isCard = el.parentNode === box;
      var done = isCard ? el.classList.contains('o-card') : el.classList.contains('o-in');
      if (!done && r.top < window.innerHeight && r.bottom > 0) el.classList.add(isCard ? 'o-card' : 'o-in');
    });
  }, 3500);

  /* ---- progreso + barra de navegación ---- */
  var bar = d.createElement('div'); bar.className = 'o-prog'; d.body.appendChild(bar);
  var nav = d.querySelector('.nav'), last = window.scrollY, tick = false;
  var navPinned = nav && /fixed|sticky/.test(getComputedStyle(nav).position);
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      var y = window.scrollY, h = root.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
      if (navPinned) {
        if (y > last + 2 && y > 140) nav.classList.add('o-hide');
        else if (y < last - 2 || y <= 140) nav.classList.remove('o-hide');
      }
      last = y; tick = false;
    });
  }, { passive: true });
})();
