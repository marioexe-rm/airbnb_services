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

  // Carrusel del hero: 8s por pieza, crossfade de 2s, alternando
  // siempre día y noche (barajado por grupo, sin repetir hasta agotar
  // el ciclo). La clase `noche` del contenedor anima la máscara del
  // astro (sol → media luna) en sincronía con el fundido. En pausa
  // con la pestaña oculta; estático con prefers-reduced-motion.
  // La palabra dorada del h1 rota EN EL MISMO tick (un solo timer, sin
  // segundo temporizador que se desfase): rédito → ganancia →
  // rendimiento → utilidad → renta → beneficio, cíclico. Su transición
  // corta (2 tramos de 200ms) vive en CSS; con prefers-reduced-motion
  // este bloque no corre y queda «rédito.» fijo del markup.
  var PALABRAS = ['rédito', 'ganancia', 'rendimiento', 'utilidad', 'renta', 'beneficio'];
  var palabraActiva = document.querySelector('.palabra-activa');
  var indicePalabra = 0;

  // La palabra rota letra a letra durante los mismos 2s del crossfade,
  // en la dirección en que se DESPLAZA el ocultador de la máscara del
  // astro (ver CSS .astro-oculto): al entrar la noche viaja de
  // translateX(72) a 0 —la sombra avanza de derecha a izquierda—, y al
  // entrar el día se retira de 0 a 72 —de izquierda a derecha—. La
  // dirección se deriva del mismo estado (grupo entrante) del
  // controlador, nunca hardcodeada por palabra.
  var CROSSFADE = 2000;   // == transition de .escena y .astro-oculto
  var DURACION_LETRA = 800;

  var armarLetras = function (contenedor, palabra, opacidadInicial) {
    contenedor.textContent = '';
    return (palabra + '.').split('').map(function (caracter) {
      var letra = document.createElement('span');
      letra.className = 'letra';
      letra.textContent = caracter;
      letra.style.opacity = String(opacidadInicial);
      letra.style.transition = 'opacity ' + DURACION_LETRA + 'ms ease-in-out';
      contenedor.appendChild(letra);
      return letra;
    });
  };

  // Escalonado en función del nº de letras: la primera parte en t=0 y la
  // última termina exactamente en t=CROSSFADE, para todo largo de palabra.
  var asignarDelays = function (letras, derechaAIzquierda) {
    var n = letras.length;
    var paso = n > 1 ? (CROSSFADE - DURACION_LETRA) / (n - 1) : 0;
    letras.forEach(function (letra, i) {
      var orden = derechaAIzquierda ? (n - 1 - i) : i;
      letra.style.transitionDelay = Math.round(orden * paso) + 'ms';
    });
  };

  var rotarPalabra = function (entraNoche) {
    if (!palabraActiva) { return; }
    var saliente = PALABRAS[indicePalabra];
    indicePalabra = (indicePalabra + 1) % PALABRAS.length;
    var entrante = PALABRAS[indicePalabra];

    // Capa saliente superpuesta que se desvanece letra a letra mientras
    // la entrante aparece: mismo crossfade que las escenas del hero.
    var capaSaliente = document.createElement('span');
    capaSaliente.className = 'palabra-saliente';
    capaSaliente.setAttribute('aria-hidden', 'true');
    palabraActiva.parentNode.appendChild(capaSaliente);

    var letrasSalen = armarLetras(capaSaliente, saliente, 1);
    var letrasEntran = armarLetras(palabraActiva, entrante, 0);
    asignarDelays(letrasSalen, entraNoche);
    asignarDelays(letrasEntran, entraNoche);

    void capaSaliente.offsetWidth; // pinta los estados iniciales
    letrasSalen.forEach(function (letra) { letra.style.opacity = '0'; });
    letrasEntran.forEach(function (letra) { letra.style.opacity = '1'; });

    setTimeout(function () {
      if (capaSaliente.parentNode) { capaSaliente.parentNode.removeChild(capaSaliente); }
    }, CROSSFADE + 100);
  };

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

      var avanzarHero = function () {
        // En pausa con la pestaña oculta o con un modal de servicio abierto
        if (document.hidden || document.body.classList.contains('modal-abierta')) { return; }
        var grupoSiguiente = grupoActual === 'dia' ? 'noche' : 'dia';
        var siguiente = sacar(grupoSiguiente);
        escenas[actual].classList.remove('activa');
        escenas[siguiente].classList.add('activa');
        arte.classList.toggle('noche', grupoSiguiente === 'noche');
        actual = siguiente;
        grupoActual = grupoSiguiente;
        // Mismo tick: la palabra viaja con la escena, y su dirección se
        // deriva del mismo estado que mueve la máscara del astro.
        rotarPalabra(grupoSiguiente === 'noche');
      };

      // Transición inicial ~1,5s tras el primer render (bien pasados los
      // 300ms sin movimiento de la carga): el visitante alcanza a leer
      // «rédito» y ve la primera transformación sin esperar el ciclo
      // completo. Desde ahí, cadencia normal de 8s. Con
      // prefers-reduced-motion este bloque entero no corre.
      setTimeout(function () {
        avanzarHero();
        setInterval(avanzarHero, 8000);
      }, 1500);
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

  // ---------- Caso real · ficha de gráficos (SVG propio, sin librerías) ----------
  // Cuatro minigráficos con datos reales del departamento: barras
  // (ingresos), líneas (crecimiento), área (noches promedio, con agosto
  // punteado en oro = reservas confirmadas) y lollipop (noches
  // reservadas) — tipos intercalados para que dos consecutivos nunca se
  // repitan, incluido el cierre del ciclo (lollipop → barras). Rotan en
  // el MISMO tick de 15s del rotador de reseñas y se dibujan mes a mes
  // (~150ms de desfase por mes) al entrar al viewport y en cada cambio;
  // con prefers-reduced-motion el CSS los deja en su estado final.
  var rotadorGraficos = document.querySelector('.graficos-rotador');
  var graficos = [];
  var graficoActivo = 0;

  var redibujarGrafico = function (figura) {
    figura.classList.remove('dibujar');
    void figura.offsetWidth; // reinicia las transiciones escalonadas
    figura.classList.add('dibujar');
  };

  var avanzarGrafico = function () {
    if (graficos.length < 2) { return; }
    graficos[graficoActivo].classList.remove('activa');
    graficos[graficoActivo].classList.remove('dibujar');
    graficoActivo = (graficoActivo + 1) % graficos.length;
    graficos[graficoActivo].classList.add('activa');
    redibujarGrafico(graficos[graficoActivo]);
  };

  if (rotadorGraficos) {
    var NS = 'http://www.w3.org/2000/svg';
    var fmtCL = function (n) { return n.toLocaleString('es-CL'); };
    var nodo = function (etiqueta, attrs, padre) {
      var e = document.createElementNS(NS, etiqueta);
      for (var k in attrs) { e.setAttribute(k, attrs[k]); }
      if (padre) { padre.appendChild(e); }
      return e;
    };
    var rotulo = function (x, y, contenido, padre, clase) {
      var t = nodo('text', clase ? { 'class': clase } : {}, padre);
      t.setAttribute('x', x);
      t.setAttribute('y', y);
      t.setAttribute('text-anchor', 'middle');
      t.textContent = contenido;
      return t;
    };
    var retrasar = function (el, ms) { el.style.transitionDelay = ms + 'ms'; };

    // Geometría común: área de trazado x 24..316, base y=150, rango 108
    var X0 = 24, ANCHO = 292, BASE = 124, RANGO = 86;
    var centroDe = function (i, n) { return X0 + (i + 0.5) * (ANCHO / n); };
    var yDe = function (v, max) { return BASE - (v / max) * RANGO; };

    var crearFigura = function (titulo) {
      var figura = document.createElement('figure');
      figura.className = 'grafico';
      var cap = document.createElement('figcaption');
      cap.className = 'grafico-titulo';
      cap.textContent = titulo;
      figura.appendChild(cap);
      var svg = nodo('svg', { viewBox: '0 0 340 160', focusable: 'false' });
      figura.appendChild(svg);
      nodo('line', { 'class': 'eje', x1: X0, y1: BASE, x2: X0 + ANCHO, y2: BASE }, svg);
      rotadorGraficos.appendChild(figura);
      graficos.push(figura);
      return svg;
    };

    // (a) Barras verticales · Ingresos mensuales (CLP)
    (function () {
      var datos = [456441, 648527, 993826, 1341597];
      var meses = ['abr', 'may', 'jun', 'jul'];
      var svg = crearFigura('Ingresos mensuales');
      datos.forEach(function (v, i) {
        var cx = centroDe(i, 4), w = 44, x = cx - w / 2, y = yDe(v, 1341597);
        var barra = nodo('path', {
          'class': 'anim-barra',
          d: 'M' + x + ' ' + BASE + ' V' + (y + 4) + ' Q' + x + ' ' + y + ' ' + (x + 4) + ' ' + y +
             ' H' + (x + w - 4) + ' Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + 4) + ' V' + BASE + ' Z',
          fill: 'var(--acento)'
        }, svg);
        retrasar(barra, i * 150);
        retrasar(rotulo(cx, y - 8, '$' + fmtCL(v), svg, 'anim-fade'), i * 150 + 250);
        rotulo(cx, 142, meses[i], svg);
      });
    })();

    // (b) Líneas · Crecimiento mes a mes (CLP)
    (function () {
      var datos = [192086, 345299, 347771];
      var tramos = ['abr→may', 'may→jun', 'jun→jul'];
      var svg = crearFigura('Crecimiento mes a mes');
      var puntos = datos.map(function (v, i) { return { x: centroDe(i, 3), y: yDe(v, 347771) }; });
      puntos.slice(1).forEach(function (p, i) {
        var a = puntos[i];
        var seg = nodo('line', { 'class': 'anim-trazo', x1: a.x, y1: a.y, x2: p.x, y2: p.y, stroke: 'var(--acento)', 'stroke-width': 2, 'stroke-linecap': 'round' }, svg);
        seg.style.setProperty('--largo', Math.hypot(p.x - a.x, p.y - a.y).toFixed(1));
        retrasar(seg, i * 150 + 100);
      });
      puntos.forEach(function (p, i) {
        var punto = nodo('circle', { 'class': 'anim-fade', cx: p.x, cy: p.y, r: 4, fill: 'var(--acento)' }, svg);
        retrasar(punto, i * 150);
        retrasar(rotulo(p.x, p.y - 10, '+$' + fmtCL(datos[i]), svg, 'anim-fade'), i * 150 + 250);
        rotulo(p.x, 142, tramos[i], svg);
      });
    })();

    // (c) Área · Promedio de noches por estadía (agosto = confirmadas)
    (function () {
      var datos = [2.25, 2.5, 4.4, 5.6, 12.5];
      var meses = ['abr', 'may', 'jun', 'jul', 'ago'];
      var svg = crearFigura('Promedio de noches por estadía');
      var puntos = datos.map(function (v, i) { return { x: centroDe(i, 5), y: yDe(v, 12.5) }; });
      var d = 'M' + puntos[0].x + ' ' + BASE;
      puntos.slice(0, 4).forEach(function (p) { d += ' L' + p.x + ' ' + p.y; });
      d += ' L' + puntos[3].x + ' ' + BASE + ' Z';
      nodo('path', { 'class': 'anim-area', d: d, fill: 'var(--acento)', 'fill-opacity': '0.12' }, svg);
      puntos.slice(1, 4).forEach(function (p, i) {
        var a = puntos[i];
        var seg = nodo('line', { 'class': 'anim-trazo', x1: a.x, y1: a.y, x2: p.x, y2: p.y, stroke: 'var(--acento)', 'stroke-width': 2, 'stroke-linecap': 'round' }, svg);
        seg.style.setProperty('--largo', Math.hypot(p.x - a.x, p.y - a.y).toFixed(1));
        retrasar(seg, i * 150 + 100);
      });
      // Tramo julio→agosto punteado en oro y punto hueco: reservas ya
      // confirmadas, no un mes cerrado (codificación doble: trazo + texto).
      var pj = puntos[3], pa = puntos[4];
      var punteado = nodo('line', { 'class': 'anim-fade', x1: pj.x, y1: pj.y, x2: pa.x, y2: pa.y, stroke: 'var(--gold)', 'stroke-width': 2, 'stroke-dasharray': '4 4', 'stroke-linecap': 'round' }, svg);
      retrasar(punteado, 3 * 150 + 150);
      puntos.slice(0, 4).forEach(function (p, i) {
        var punto = nodo('circle', { 'class': 'anim-fade', cx: p.x, cy: p.y, r: 3.5, fill: 'var(--acento)' }, svg);
        retrasar(punto, i * 150);
        retrasar(rotulo(p.x, p.y - 9, fmtCL(datos[i]), svg, 'anim-fade'), i * 150 + 250);
        rotulo(p.x, 142, meses[i], svg);
      });
      var pAgo = nodo('circle', { 'class': 'anim-fade', cx: pa.x, cy: pa.y, r: 4.5, fill: 'var(--blanco)', stroke: 'var(--gold)', 'stroke-width': 2 }, svg);
      retrasar(pAgo, 3 * 150 + 300);
      retrasar(rotulo(pa.x, pa.y - 10, fmtCL(datos[4]), svg, 'anim-fade'), 3 * 150 + 300);
      rotulo(pa.x, 142, meses[4], svg);
      retrasar(rotulo(pa.x, 155, 'confirmadas', svg, 'anim-fade grafico-marca'), 3 * 150 + 300);
    })();

    // (d) Lollipop · Noches reservadas (≠ área, ≠ barras verticales)
    (function () {
      var datos = [17, 20, 23, 27];
      var meses = ['abr', 'may', 'jun', 'jul'];
      var svg = crearFigura('Noches reservadas');
      datos.forEach(function (v, i) {
        var cx = centroDe(i, 4), y = yDe(v, 27);
        var tallo = nodo('rect', { 'class': 'anim-barra', x: cx - 1, y: y, width: 2, height: BASE - y, fill: 'var(--acento)' }, svg);
        retrasar(tallo, i * 150);
        var cabeza = nodo('circle', { 'class': 'anim-fade', cx: cx, cy: y, r: 5, fill: 'var(--gold)' }, svg);
        retrasar(cabeza, i * 150 + 150);
        retrasar(rotulo(cx, y - 12, fmtCL(v), svg, 'anim-fade'), i * 150 + 300);
        rotulo(cx, 142, meses[i], svg);
      });
    })();

    graficos[0].classList.add('activa');

    // Se dibuja cada vez que la sección entra al viewport (y se rearma
    // al salir); con reduced-motion el CSS ya muestra el estado final.
    if ('IntersectionObserver' in window && !sinMovimiento) {
      var observadorGraficos = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) { redibujarGrafico(graficos[graficoActivo]); }
          else { graficos[graficoActivo].classList.remove('dibujar'); }
        });
      }, { threshold: 0.3 });
      observadorGraficos.observe(rotadorGraficos);
    } else {
      graficos.forEach(function (figura) { figura.classList.add('dibujar'); });
    }
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
        // También en pausa mientras un modal de servicio está abierto
        if (document.hidden || lecturaPausada || document.body.classList.contains('modal-abierta')) { return; }
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
        avanzarGrafico(); // mismo tick: la ficha de gráficos rota con las reseñas
      }, 15000);
    }
  }

  // Modal de detalle de servicios: contenedor único; cada tarjeta aporta
  // su contenido vía <template>. Foco trasladado al panel al abrir y
  // devuelto a la tarjeta al cerrar, Tab atrapado dentro, cierre con
  // Escape / clic en el fondo / botón, scroll del fondo bloqueado y
  // rotadores en pausa (body.modal-abierta) mientras esté abierto.
  var modal = document.querySelector('.modal');
  if (modal) {
    var modalPanel = modal.querySelector('.modal-panel');
    var modalFondo = modal.querySelector('.modal-fondo');
    var modalCerrar = modal.querySelector('.modal-cerrar');
    var modalEtiqueta = modal.querySelector('.modal-etiqueta');
    var modalTitulo = modal.querySelector('.modal-titulo');
    var modalCuerpo = modal.querySelector('.modal-cuerpo');
    var origenModal = null;
    var cierreProgramado = null;

    var abrirModal = function (plantilla, origen) {
      origenModal = origen || null;
      clearTimeout(cierreProgramado);
      modalEtiqueta.textContent = plantilla.getAttribute('data-etiqueta') || '';
      modalTitulo.textContent = plantilla.getAttribute('data-titulo') || '';
      modalCuerpo.innerHTML = '';
      modalCuerpo.appendChild(plantilla.content.cloneNode(true));
      modal.hidden = false;
      document.body.classList.add('modal-abierta');
      modalPanel.scrollTop = 0;
      // Doble rAF: el estado inicial (opacity 0) debe alcanzar a pintarse
      // antes de encender .visible, o la transición de entrada no corre.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { modal.classList.add('visible'); });
      });
      modalPanel.focus();
    };

    var cerrarModal = function () {
      modal.classList.remove('visible');
      document.body.classList.remove('modal-abierta');
      var terminar = function () { modal.hidden = true; };
      if (sinMovimiento) { terminar(); } else { cierreProgramado = setTimeout(terminar, 300); }
      if (origenModal) { origenModal.focus(); origenModal = null; }
    };

    Array.prototype.slice.call(document.querySelectorAll('.servicio-enlace')).forEach(function (boton) {
      boton.addEventListener('click', function () {
        var plantilla = boton.closest('li').querySelector('template');
        if (plantilla) { abrirModal(plantilla, boton); }
      });
    });

    modalFondo.addEventListener('click', cerrarModal);
    modalCerrar.addEventListener('click', cerrarModal);

    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); cerrarModal(); return; }
      if (e.key !== 'Tab') { return; }
      // Trampa de foco: Tab circula solo entre los focalizables del panel
      var focalizables = modalPanel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focalizables.length) { return; }
      var primero = focalizables[0];
      var ultimo = focalizables[focalizables.length - 1];
      if (e.shiftKey && (document.activeElement === primero || document.activeElement === modalPanel)) {
        e.preventDefault(); ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault(); primero.focus();
      }
    });
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
