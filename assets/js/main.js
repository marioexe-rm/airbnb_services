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

  // Scroll asistido de escritorio (≥64em). Reemplaza al scroll-snap CSS
  // (velocidad no configurable, se percibía brusco) conservando su
  // lógica: al TERMINAR el scroll (scrollend, o debounce de 150ms como
  // fallback), si el inicio de la sección más cercana —o el centro del
  // módulo más cercano de Servicios— queda a menos del umbral, desliza
  // hacia él en ~500ms con easeOutCubic. Nunca durante el gesto, nunca
  // en cascada (en el objetivo no hace nada), nunca con el footer a la
  // vista (el fondo de la página siempre se puede mirar), y sin snap
  // con prefers-reduced-motion. Los scroll-margin del CSS siguen siendo
  // la fuente de verdad del encuadre, igual que para las anclas.
  var snapDesktop = window.matchMedia('(min-width: 64em)');
  if (!sinMovimiento) {
    var UMBRAL_SNAP = 160;   // px de cercanía que activan el imán
    var DURACION_SNAP = 500; // ms del deslizamiento
    var animacionSnap = null;

    var cancelarSnap = function () {
      if (animacionSnap !== null) {
        cancelAnimationFrame(animacionSnap);
        animacionSnap = null;
      }
    };

    // Cualquier gesto del usuario interrumpe el deslizamiento al instante
    ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(function (evento) {
      window.addEventListener(evento, cancelarSnap, { passive: true });
    });

    // Posición de layout en el documento (cadena de offsetTop): a
    // diferencia de getBoundingClientRect, ignora los transforms del
    // reveal, así el objetivo apunta a la posición final del elemento
    // aunque aún esté a mitad de su aparición.
    var topDocumento = function (el) {
      var top = 0;
      while (el) { top += el.offsetTop; el = el.offsetParent; }
      return top;
    };

    var objetivoSnap = function () {
      var y = window.scrollY;
      var maxY = document.documentElement.scrollHeight - window.innerHeight;
      var mejor = null;
      var considerar = function (candidato) {
        candidato = Math.max(0, Math.min(Math.round(candidato), maxY));
        if (mejor === null || Math.abs(candidato - y) < Math.abs(mejor - y)) {
          mejor = candidato;
        }
      };
      document.querySelectorAll('section').forEach(function (seccion) {
        var margen = parseFloat(getComputedStyle(seccion).scrollMarginTop) || 0;
        considerar(topDocumento(seccion) - margen);
      });
      document.querySelectorAll('.modulo').forEach(function (modulo) {
        considerar(topDocumento(modulo) + modulo.offsetHeight / 2 - window.innerHeight / 2);
      });
      return mejor;
    };

    var deslizarHasta = function (destino) {
      var origen = window.scrollY;
      var delta = destino - origen;
      var t0 = null;
      var paso = function (t) {
        if (t0 === null) { t0 = t; }
        var avance = Math.min((t - t0) / DURACION_SNAP, 1);
        var suave = 1 - Math.pow(1 - avance, 3); // easeOutCubic
        // behavior instant: cada fotograma fija la posición exacta (con
        // el scroll-behavior smooth del html, cada paso lanzaría una
        // animación del navegador persiguiendo al objetivo con retraso).
        window.scrollTo({ top: origen + delta * suave, behavior: 'instant' });
        animacionSnap = avance < 1 ? requestAnimationFrame(paso) : null;
      };
      animacionSnap = requestAnimationFrame(paso);
    };

    var alSoltarScroll = function () {
      if (!snapDesktop.matches || animacionSnap !== null) { return; }
      var footer = document.querySelector('.site-footer');
      if (footer && footer.getBoundingClientRect().top < window.innerHeight) { return; }
      var destino = objetivoSnap();
      if (destino === null) { return; }
      var distancia = Math.abs(destino - window.scrollY);
      if (distancia < 2 || distancia > UMBRAL_SNAP) { return; }
      deslizarHasta(destino);
    };

    if ('onscrollend' in window) {
      window.addEventListener('scrollend', alSoltarScroll);
    } else {
      var esperaSnap;
      window.addEventListener('scroll', function () {
        clearTimeout(esperaSnap);
        esperaSnap = setTimeout(alSoltarScroll, 150);
      }, { passive: true });
    }
  }
})();
