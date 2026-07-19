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

  // Carrusel del hero: 12s por pieza, crossfade de 2s, alternando
  // siempre día y noche (barajado por grupo, sin repetir hasta agotar
  // el ciclo). La clase `noche` del contenedor anima la máscara del
  // astro (sol → media luna) en sincronía con el fundido. En pausa
  // con la pestaña oculta; estático con prefers-reduced-motion.
  var arte = document.querySelector('.hero-art');
  if (arte && !sinMovimiento) {
    var escenas = Array.prototype.slice.call(arte.querySelectorAll('.escena'));
    if (escenas.length > 1) {
      var actual = 0;
      escenas.forEach(function (escena, i) {
        if (escena.classList.contains('activa')) { actual = i; }
      });

      var grupoDe = function (i) {
        return escenas[i].classList.contains('escena-noche') ? 'noche' : 'dia';
      };

      var grupos = { dia: [], noche: [] };
      escenas.forEach(function (_, i) { grupos[grupoDe(i)].push(i); });

      var bolsas = { dia: [], noche: [] };
      var ultimo = { dia: -1, noche: -1 };
      ultimo[grupoDe(actual)] = actual;

      var barajar = function (lista) {
        for (var i = lista.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var t = lista[i]; lista[i] = lista[j]; lista[j] = t;
        }
        return lista;
      };

      var sacar = function (grupo) {
        if (!bolsas[grupo].length) {
          bolsas[grupo] = barajar(grupos[grupo].slice());
          if (bolsas[grupo][0] === ultimo[grupo]) {
            bolsas[grupo].push(bolsas[grupo].shift());
          }
        }
        var indice = bolsas[grupo].shift();
        ultimo[grupo] = indice;
        return indice;
      };

      // La pieza inicial no debe repetirse dentro de su primer ciclo.
      bolsas.dia = barajar(grupos.dia.filter(function (i) { return i !== actual; }));

      var grupoActual = grupoDe(actual);

      setInterval(function () {
        if (document.hidden) { return; }
        var grupoSiguiente = grupoActual === 'dia' ? 'noche' : 'dia';
        var siguiente = sacar(grupoSiguiente);
        escenas[actual].classList.remove('activa');
        escenas[siguiente].classList.add('activa');
        arte.classList.toggle('noche', grupoSiguiente === 'noche');
        actual = siguiente;
        grupoActual = grupoSiguiente;
      }, 12000);
    }
  }
})();
