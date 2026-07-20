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

  // Barajado Fisher-Yates, compartido por los rotadores (hero y reseñas)
  var barajar = function (lista) {
    for (var b = lista.length - 1; b > 0; b--) {
      var c = Math.floor(Math.random() * (b + 1));
      var t = lista[b]; lista[b] = lista[c]; lista[c] = t;
    }
    return lista;
  };

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

  // Cards de reseñas de tamaño idéntico: todas toman la altura de la
  // más alta de las 16, recalculada si cambia el viewport.
  var rotadorCards = document.querySelector('.resenas-rotador');
  if (rotadorCards) {
    var igualarResenas = function () {
      var cards = Array.prototype.slice.call(rotadorCards.querySelectorAll('.review'));
      var maxima = 0;
      cards.forEach(function (card) { card.style.minHeight = ''; });
      cards.forEach(function (card) { maxima = Math.max(maxima, card.offsetHeight); });
      cards.forEach(function (card) { card.style.minHeight = maxima + 'px'; });
    };
    igualarResenas();
    window.addEventListener('load', igualarResenas);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(igualarResenas); }
    var retrasoMedida;
    window.addEventListener('resize', function () {
      clearTimeout(retrasoMedida);
      retrasoMedida = setTimeout(igualarResenas, 150);
    });
  }

  // Rotador de reseñas: 4 grupos × 4 frases, misma familia de
  // transición del hero (15s por grupo, crossfade de 2s). Se pausa al
  // leer (hover/focus) y con la pestaña oculta; con
  // prefers-reduced-motion queda un único grupo estático.
  var rotador = document.querySelector('.resenas-rotador');
  if (rotador && !sinMovimiento) {
    var gruposResenas = Array.prototype.slice.call(rotador.querySelectorAll('.resenas-grupo'));
    if (gruposResenas.length > 1) {
      var grupoActivo = 0;
      gruposResenas.forEach(function (grupo, i) {
        if (grupo.classList.contains('activa')) { grupoActivo = i; }
      });

      var lecturaPausada = false;
      var pausar = function () { lecturaPausada = true; };
      var reanudar = function () { lecturaPausada = false; };
      rotador.addEventListener('mouseenter', pausar);
      rotador.addEventListener('mouseleave', reanudar);
      rotador.addEventListener('focusin', pausar);
      rotador.addEventListener('focusout', reanudar);

      // Card de foto del grid: en cada cambio avanza la imagen (barajado
      // de las 4 sin repetir hasta agotar) y su celda en el grid
      // (barajado de posiciones), asignadas al grupo entrante antes de
      // aparecer, dentro de este mismo timer.
      var pozaFotos = [
        'assets/img/airbnb-1.jpg', 'assets/img/airbnb-2.jpg',
        'assets/img/airbnb-3.jpg', 'assets/img/airbnb-4.jpg',
        'assets/img/airbnb-5.jpg', 'assets/img/airbnb-6.jpg',
        'assets/img/airbnb-7.jpg', 'assets/img/airbnb-8.jpg'
      ];
      var bolsaFotos = [], ultimaFoto = 0;
      var bolsaCeldas = [], ultimaCelda = 3;
      var sacarIndice = function (bolsa, total, ultimo) {
        if (!bolsa.length) {
          for (var n = 0; n < total; n++) { bolsa.push(n); }
          barajar(bolsa);
          if (bolsa[0] === ultimo) { bolsa.push(bolsa.shift()); }
        }
        return bolsa.shift();
      };

      // El grupo inicial no se repite dentro de su primer ciclo.
      var bolsaResenas = barajar(gruposResenas.map(function (_, i) { return i; })
        .filter(function (i) { return i !== grupoActivo; }));
      var ultimoGrupo = grupoActivo;

      setInterval(function () {
        if (document.hidden || lecturaPausada) { return; }
        if (!bolsaResenas.length) {
          bolsaResenas = barajar(gruposResenas.map(function (_, i) { return i; }));
          if (bolsaResenas[0] === ultimoGrupo) { bolsaResenas.push(bolsaResenas.shift()); }
        }
        var proximo = bolsaResenas.shift();
        var entrante = gruposResenas[proximo];
        var cardFoto = entrante.querySelector('.review-foto');
        if (cardFoto && pozaFotos.length > 1) {
          ultimaFoto = sacarIndice(bolsaFotos, pozaFotos.length, ultimaFoto);
          cardFoto.querySelector('img').src = pozaFotos[ultimaFoto];
          ultimaCelda = sacarIndice(bolsaCeldas, 4, ultimaCelda);
          cardFoto.style.order = ultimaCelda;
          var celdasLibres = [0, 1, 2, 3].filter(function (celda) { return celda !== ultimaCelda; });
          Array.prototype.slice.call(entrante.querySelectorAll('.review')).forEach(function (card) {
            if (card !== cardFoto) { card.style.order = celdasLibres.shift(); }
          });
        }
        gruposResenas[grupoActivo].classList.remove('activa');
        entrante.classList.add('activa');
        ultimoGrupo = proximo;
        grupoActivo = proximo;
      }, 15000);
    }
  }
})();
