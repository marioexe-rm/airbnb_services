(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('menu');

  // Menú móvil
  if (header && toggle && nav) {
    toggle.addEventListener('click', function () {
      var abierto = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(abierto));
      toggle.querySelector('.visually-hidden').textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && header.classList.contains('open')) {
        header.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('open')) {
        header.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Borde del header al hacer scroll
  if (header) {
    var marcarScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    marcarScroll();
    window.addEventListener('scroll', marcarScroll, { passive: true });
  }

  // Revelado sutil de secciones
  var revelables = document.querySelectorAll('.reveal');
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !sinMovimiento) {
    var observer = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('in');
          observer.unobserve(entrada.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    revelables.forEach(function (el) { observer.observe(el); });
  } else {
    revelables.forEach(function (el) { el.classList.add('in'); });
  }

  // Año en el pie de página
  var anio = document.getElementById('anio');
  if (anio) {
    anio.textContent = String(new Date().getFullYear());
  }

  // Carrusel del hero: rotación de escenas cada 6s con crossfade de 1s.
  // Orden barajado sin repetición inmediata; en pausa con la pestaña
  // oculta; con prefers-reduced-motion queda una escena estática.
  var arte = document.querySelector('.hero-art');
  if (arte && !sinMovimiento) {
    var escenas = Array.prototype.slice.call(arte.querySelectorAll('.escena'));
    if (escenas.length > 1) {
      var actual = 0;
      escenas.forEach(function (escena, i) {
        if (escena.classList.contains('activa')) { actual = i; }
      });

      var bolsa = [];
      var rebarajar = function () {
        bolsa = escenas.map(function (_, i) { return i; });
        for (var i = bolsa.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var t = bolsa[i]; bolsa[i] = bolsa[j]; bolsa[j] = t;
        }
        if (bolsa[0] === actual) { bolsa.push(bolsa.shift()); }
      };

      setInterval(function () {
        if (document.hidden) { return; }
        if (!bolsa.length) { rebarajar(); }
        var siguiente = bolsa.shift();
        escenas[actual].classList.remove('activa');
        escenas[siguiente].classList.add('activa');
        actual = siguiente;
      }, 6000);
    }
  }
})();
