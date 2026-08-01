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

  // Carrusel del hero: 5s por pieza, crossfade de 2s, alternando
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
        setInterval(avanzarHero, 5000);
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

    // Estrella de 5 puntas centrada exactamente en la posición del dato:
    // marca el último dato de cada gráfico (radio externo ~1.35× el del
    // círculo que reemplaza, para igualar su tamaño óptico).
    var estrella = function (cx, cy, r, svg, clase) {
      var puntas = [];
      for (var k = 0; k < 10; k++) {
        var ang = -Math.PI / 2 + k * Math.PI / 5;
        var rad = k % 2 === 0 ? r : r * 0.45;
        puntas.push((cx + rad * Math.cos(ang)).toFixed(2) + ' ' + (cy + rad * Math.sin(ang)).toFixed(2));
      }
      return nodo('path', { 'class': clase, d: 'M' + puntas.join(' L') + ' Z', fill: 'var(--gold)' }, svg);
    };

    // Geometría común: área de trazado x 24..316, base y=124, rango 86
    // (el dato máximo llega a y=38: quedan ~24px de headroom para los
    // rótulos sin tocar la escala).
    var X0 = 24, ANCHO = 292, BASE = 124, RANGO = 86;
    // Separación uniforme rótulo→dato en los CUATRO gráficos: la
    // baseline de cada rótulo de valor queda SEP_ROTULO px (en unidades
    // del viewBox) sobre su dato —tope de barra, vértice de línea,
    // punto del área o cabeza del lollipop—. 16 despeja el peor caso
    // (el tramo ascendente de «Crecimiento mes a mes» bajo el rótulo
    // +$192.086) y deja aire sobre estrellas (r 5,5–6,5) y puntos.
    var SEP_ROTULO = 16;
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
        // Acento de datos: punto dorado en el extremo superior; el último
        // dato va marcado con estrella.
        var cap = i === datos.length - 1
          ? estrella(cx, y, 5.5, svg, 'anim-fade')
          : nodo('circle', { 'class': 'anim-fade', cx: cx, cy: y, r: 4, fill: 'var(--gold)' }, svg);
        retrasar(cap, i * 150 + 200);
        retrasar(rotulo(cx, y - SEP_ROTULO, '$' + fmtCL(v), svg, 'anim-fade'), i * 150 + 250);
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
        // Acento de datos: vértices en oro; el último dato, con estrella
        var punto = i === puntos.length - 1
          ? estrella(p.x, p.y, 5.5, svg, 'anim-fade')
          : nodo('circle', { 'class': 'anim-fade', cx: p.x, cy: p.y, r: 4, fill: 'var(--gold)' }, svg);
        retrasar(punto, i * 150);
        retrasar(rotulo(p.x, p.y - SEP_ROTULO, '+$' + fmtCL(datos[i]), svg, 'anim-fade'), i * 150 + 250);
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
        // Acento de datos: los puntos del área en oro
        var punto = nodo('circle', { 'class': 'anim-fade', cx: p.x, cy: p.y, r: 3.5, fill: 'var(--gold)' }, svg);
        retrasar(punto, i * 150);
        retrasar(rotulo(p.x, p.y - SEP_ROTULO, fmtCL(datos[i]), svg, 'anim-fade'), i * 150 + 250);
        rotulo(p.x, 142, meses[i], svg);
      });
      // Último dato (agosto) con estrella; el estado «confirmadas» sigue
      // codificado por el trazo punteado y su rótulo.
      var pAgo = estrella(pa.x, pa.y, 6, svg, 'anim-fade');
      retrasar(pAgo, 3 * 150 + 300);
      retrasar(rotulo(pa.x, pa.y - SEP_ROTULO, fmtCL(datos[4]), svg, 'anim-fade'), 3 * 150 + 300);
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
        var cabeza = i === datos.length - 1
          ? estrella(cx, y, 6.5, svg, 'anim-fade')
          : nodo('circle', { 'class': 'anim-fade', cx: cx, cy: y, r: 5, fill: 'var(--gold)' }, svg);
        retrasar(cabeza, i * 150 + 150);
        retrasar(rotulo(cx, y - SEP_ROTULO, fmtCL(v), svg, 'anim-fade'), i * 150 + 300);
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
  // transición del hero (8s por grupo, crossfade de 2s). Se pausa al
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
      }, 8000);
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
    var modalCaja = modal.querySelector('.modal-caja');
    var modalEtiqueta = modal.querySelector('.modal-etiqueta');
    var modalTitulo = modal.querySelector('.modal-titulo');
    var modalCuerpo = modal.querySelector('.modal-cuerpo');
    var modalNavPrev = modal.querySelector('.modal-nav-prev');
    var modalNavNext = modal.querySelector('.modal-nav-next');
    var modalPie = modal.querySelector('.modal-pie');
    var modalContador = modal.querySelector('.modal-contador');
    var origenModal = null;
    var cierreProgramado = null;
    // Colección navegable del modal abierto: {items, indice, render(i),
    // navAria: [prev, next], amplio, modo ('texto'|'visual')}.
    var coleccionModal = null;

    var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

    var actualizarContador = function () {
      if (!coleccionModal || coleccionModal.items.length < 2) {
        modalContador.hidden = true;
        modalContador.textContent = '';
        return;
      }
      modalContador.textContent = pad2(coleccionModal.indice + 1) + '/' + pad2(coleccionModal.items.length);
      modalContador.hidden = false;
    };

    // Bordes reales de la colección: en el primer elemento se retira el
    // chevron «anterior» y en el último el «siguiente». Se ocultan (no
    // se deshabilitan): viven en el canal lateral reservado del panel,
    // así su salida no desplaza ni redimensiona el contenido. Si el foco
    // estaba en el chevron que se oculta, pasa al opuesto (siempre
    // visible en colecciones de 2+) o, en su defecto, al panel: nunca
    // queda en un elemento oculto.
    var actualizarLimites = function () {
      if (!coleccionModal || coleccionModal.items.length < 2) { return; }
      var alInicio = coleccionModal.indice === 0;
      var alFinal = coleccionModal.indice === coleccionModal.items.length - 1;
      // El foco activo se captura ANTES de ocultar: al pasar a
      // display:none el navegador ya lo habría movido a body y el
      // rescate no sabría de dónde venía.
      var activo = document.activeElement;
      modalNavPrev.hidden = alInicio;
      modalNavNext.hidden = alFinal;
      if ((activo === modalNavPrev && alInicio) || (activo === modalNavNext && alFinal)) {
        var refugio = activo === modalNavPrev ? modalNavNext : modalNavPrev;
        (refugio.hidden ? modalPanel : refugio).focus();
      }
    };

    // REGLA GENERAL de conjunto unitario: cuando el modal no tiene una
    // colección de 2+ elementos, los chevrons se RETIRAN del DOM (no
    // solo se ocultan), el pie completo se oculta, la navegación por
    // flechas queda inerte (los guards de navegarModal) y no hay
    // contador. Un único punto decide para todos los modales.
    var configurarNavegacion = function () {
      var activa = !!(coleccionModal && coleccionModal.items.length > 1);
      if (activa) {
        if (!modalNavPrev.parentNode) {
          modalPie.insertBefore(modalNavPrev, modalContador);
          modalPie.appendChild(modalNavNext);
        }
        modalNavPrev.setAttribute('aria-label', coleccionModal.navAria[0]);
        modalNavNext.setAttribute('aria-label', coleccionModal.navAria[1]);
        actualizarLimites();
      } else if (modalNavPrev.parentNode) {
        modalNavPrev.parentNode.removeChild(modalNavPrev);
        modalNavNext.parentNode.removeChild(modalNavNext);
      }
      modalPie.hidden = !activa;
      modalPanel.classList.toggle('con-nav', activa);
      actualizarContador();
    };

    var pintarModal = function (datos) {
      modalEtiqueta.textContent = datos.etiqueta || '';
      modalEtiqueta.hidden = !datos.etiqueta;
      modalTitulo.textContent = datos.titulo || '';
      modalCuerpo.innerHTML = '';
      modalCuerpo.appendChild(datos.contenido);
      if (datos.alPintar) {
        requestAnimationFrame(function () { requestAnimationFrame(datos.alPintar); });
      }
    };

    var presentarModal = function (origen, amplio) {
      origenModal = origen || null;
      clearTimeout(cierreProgramado);
      modalPanel.classList.toggle('amplio', !!amplio);
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

    // Modal simple sin navegación (ficha del caso)
    var abrirModalCon = function (etiqueta, titulo, contenido, origen, amplio) {
      coleccionModal = null;
      configurarNavegacion();
      pintarModal({ etiqueta: etiqueta, titulo: titulo, contenido: contenido });
      presentarModal(origen, amplio);
    };

    // Modal con colección: chevrons laterales y flechas del teclado
    var abrirColeccion = function (col, origen) {
      coleccionModal = col;
      configurarNavegacion();
      pintarModal(col.render(col.indice));
      presentarModal(origen, col.amplio);
    };

    // Transición por tipo de contenido. TEXTO (reseñas y servicios):
    // fundido secuencial —el saliente se apaga por completo (250ms), se
    // reemplaza y el entrante aparece (450ms) con un ascenso de 4px—,
    // sin superponer bloques largos ni desplazamiento horizontal.
    // VISUAL (fotos y gráficos): fundido cruzado de 550ms con capa
    // clonada e inerte y deslizamiento de 8px en el sentido navegado.
    // En ambos casos el alto del panel transiciona y nada se reabre.
    var animarAltoPanel = function (h0) {
      modalPanel.style.height = 'auto';
      var h1 = modalPanel.offsetHeight;
      if (h1 !== h0) {
        modalPanel.style.height = h0 + 'px';
        void modalPanel.offsetWidth;
        modalPanel.classList.add('animando-alto');
        modalPanel.style.height = h1 + 'px';
      } else {
        modalPanel.style.height = '';
      }
    };

    var limpiarAltoPanel = function () {
      modalPanel.classList.remove('animando-alto');
      modalPanel.style.height = '';
    };

    var transicionarModal = function (datos, direccion) {
      if (sinMovimiento) { pintarModal(datos); return; }
      var h0 = modalPanel.offsetHeight;
      if (coleccionModal && coleccionModal.modo === 'texto') {
        modalCaja.style.transition = 'opacity 250ms ease-in-out';
        modalCaja.style.opacity = '0';
        setTimeout(function () {
          pintarModal(datos);
          animarAltoPanel(h0);
          modalCaja.style.transition = 'none';
          modalCaja.style.transform = 'translateY(4px)';
          void modalCaja.offsetWidth;
          modalCaja.style.transition = 'opacity 450ms ease-in-out, transform 450ms ease-in-out';
          modalCaja.style.opacity = '';
          modalCaja.style.transform = '';
          setTimeout(function () {
            modalCaja.style.transition = '';
            limpiarAltoPanel();
          }, 470);
        }, 260);
        return;
      }
      var desliza = direccion > 0 ? 8 : direccion < 0 ? -8 : 0;
      var fantasma = modalCaja.cloneNode(true);
      fantasma.classList.add('modal-caja-saliente');
      fantasma.setAttribute('aria-hidden', 'true');
      fantasma.setAttribute('inert', '');
      fantasma.style.top = modalCaja.offsetTop + 'px';
      fantasma.style.left = modalCaja.offsetLeft + 'px';
      fantasma.style.width = modalCaja.offsetWidth + 'px';
      modalCaja.parentNode.appendChild(fantasma);
      pintarModal(datos);
      modalCaja.style.transition = 'none';
      modalCaja.style.opacity = '0';
      modalCaja.style.transform = desliza ? 'translateX(' + desliza + 'px)' : '';
      animarAltoPanel(h0);
      void modalCaja.offsetWidth;
      modalCaja.style.transition = '';
      modalCaja.style.opacity = '';
      modalCaja.style.transform = '';
      fantasma.style.opacity = '0';
      fantasma.style.transform = desliza ? 'translateX(' + (-desliza) + 'px)' : '';
      setTimeout(function () {
        if (fantasma.parentNode) { fantasma.parentNode.removeChild(fantasma); }
        limpiarAltoPanel();
      }, 580);
    };

    // Navegación con bordes: sin vuelta al inicio ni al final. En cada
    // extremo el chevron correspondiente está oculto y las flechas del
    // teclado quedan inertes (el guard corta antes de cualquier efecto).
    // Si la colección define preparar(i) (fotos: decodificación previa),
    // el fundido espera a que el contenido esté listo — la vista actual
    // se mantiene, con un indicador discreto si la espera pasa de
    // ~300ms; si falla, se conserva lo visible y el error queda en
    // consola.
    var contadorNavegacion = 0;
    var navegarModal = function (delta) {
      if (!coleccionModal || coleccionModal.items.length < 2) { return; }
      var col = coleccionModal;
      var destino = col.indice + delta;
      if (destino < 0 || destino >= col.items.length) { return; }
      var marca = ++contadorNavegacion;
      var aplicar = function () {
        if (coleccionModal !== col || marca !== contadorNavegacion) { return; }
        col.indice = destino;
        transicionarModal(col.render(destino), delta);
        actualizarContador();
        actualizarLimites();
        if (col.alNavegar) { col.alNavegar(destino); }
      };
      if (!col.preparar) { aplicar(); return; }
      var indicador = setTimeout(function () { modalPanel.classList.add('cargando'); }, 300);
      col.preparar(destino).then(function (ok) {
        clearTimeout(indicador);
        modalPanel.classList.remove('cargando');
        if (ok === false) { return; }
        aplicar();
      });
    };

    var cerrarModal = function () {
      modal.classList.remove('visible');
      document.body.classList.remove('modal-abierta');
      coleccionModal = null;
      modalPanel.classList.remove('animando-alto');
      modalPanel.style.height = '';
      var terminar = function () { modal.hidden = true; };
      if (sinMovimiento) { terminar(); } else { cierreProgramado = setTimeout(terminar, 300); }
      if (origenModal) { origenModal.focus(); origenModal = null; }
    };

    // ---- Servicios: una colección por módulo (las plantillas de sus
    // ítems); la etiqueta que indica el módulo sale del data-etiqueta
    // de cada plantilla («Módulo 02 · Operación digital»). ----
    var MODULOS_SERV = Array.prototype.slice.call(document.querySelectorAll('.servicios .modulo')).map(function (mod) {
      var plantillas = Array.prototype.slice.call(mod.querySelectorAll('li.servicio template'));
      return plantillas.length ? plantillas : null;
    }).filter(Boolean);

    var renderServicio = function (i) {
      var tpl = coleccionModal.items[i];
      return {
        etiqueta: tpl.getAttribute('data-etiqueta'),
        titulo: tpl.getAttribute('data-titulo'),
        contenido: tpl.content.cloneNode(true)
      };
    };

    Array.prototype.slice.call(document.querySelectorAll('.servicio-enlace')).forEach(function (boton) {
      boton.addEventListener('click', function () {
        var tpl = boton.closest('li').querySelector('template');
        for (var m = 0; m < MODULOS_SERV.length; m++) {
          var si = MODULOS_SERV[m].indexOf(tpl);
          if (si !== -1) {
            abrirColeccion({
              items: MODULOS_SERV[m],
              indice: si,
              amplio: false,
              modo: 'texto',
              navAria: ['Servicio anterior', 'Servicio siguiente'],
              render: renderServicio
            }, boton);
            return;
          }
        }
      });
    });

    // ---- Caso real: todas las tarjetas abren un modal de zoom ----
    var crearEnlaceCaso = function (contenedor, etiquetaAria) {
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'caso-enlace';
      boton.setAttribute('aria-haspopup', 'dialog');
      boton.setAttribute('aria-label', etiquetaAria);
      contenedor.appendChild(boton);
      return boton;
    };

    // Ficha de datos: modal simple, sin navegación (colección de 1).
    var fichaCaso = document.querySelector('.caso-ficha .ficha');
    if (fichaCaso) {
      var envolturaFicha = document.createElement('div');
      envolturaFicha.className = 'caso-presionable';
      fichaCaso.parentNode.insertBefore(envolturaFicha, fichaCaso);
      envolturaFicha.appendChild(fichaCaso);
      var botonFicha = crearEnlaceCaso(envolturaFicha, 'Ver la ficha del caso en grande');
      botonFicha.addEventListener('click', function () {
        abrirModalCon('Caso real', 'Ficha del caso', fichaCaso.cloneNode(true), botonFicha, false);
      });
    }

    // Graficos: coleccion de 4 en el orden del ciclo
    var renderGrafico = function (i) {
      var figura = graficos[i];
      var clon = figura.cloneNode(true);
      clon.className = 'grafico activa';
      var capDelClon = clon.querySelector('.grafico-titulo');
      if (capDelClon) { capDelClon.parentNode.removeChild(capDelClon); }
      return {
        etiqueta: 'Caso real \u00b7 estad\u00edsticas',
        titulo: figura.querySelector('.grafico-titulo').textContent,
        contenido: clon,
        // La animacion de dibujado escalonado corre en cada cambio
        alPintar: function () {
          var g = modalCuerpo.querySelector('.grafico');
          if (g) { g.classList.add('dibujar'); }
        }
      };
    };

    var cardGraficos = document.querySelector('.caso-graficos');
    if (cardGraficos && graficos.length) {
      var botonGrafico = crearEnlaceCaso(cardGraficos, 'Ver el gr\u00e1fico en grande');
      botonGrafico.addEventListener('click', function () {
        abrirColeccion({
          items: graficos,
          indice: graficoActivo,
          amplio: true,
          navAria: ['Gr\u00e1fico anterior', 'Gr\u00e1fico siguiente'],
          render: renderGrafico
        }, botonGrafico);
      });
    }

    var PIES_FOTOS = {
      'airbnb-1.jpg': 'Terraza privada de noche, con sof\u00e1 c\u00f3modo, l\u00e1mpara c\u00e1lida y conexi\u00f3n visual al dormitorio. Un rinc\u00f3n \u00edntimo y tranquilo para relajarte al aire libre o cerrar el d\u00eda con calma.',
      'airbnb-2.jpg': 'Dormitorio acogedor y luminoso, con cama king y ropa de cama en tonos c\u00e1lidos. Cuenta con cl\u00f3set, aire acondicionado fr\u00edo/calor, l\u00e1mparas de lectura y luz natural, ideal para descansar c\u00f3modamente durante la estad\u00eda.',
      'airbnb-3.jpg': 'Terraza privada de 12 m\u00b2, c\u00f3moda y tranquila, pensada para descansar al aire libre, tomar algo de noche o disfrutar un momento de calma.',
      'airbnb-4.jpg': 'Terraza privada ideal para tomar caf\u00e9, conversar o simplemente descansar al aire libre. Mobiliario de exterior c\u00f3modo y de dise\u00f1o, con acceso directo desde el living del apartamento.',
      'airbnb-5.jpg': 'Living comedor luminoso conectado a la terraza privada, con mesa redonda para 4, sof\u00e1, Smart TV y un ambiente c\u00f3modo para desayunar, trabajar o relajarse durante la estad\u00eda.',
      'airbnb-6.jpg': 'Cocina equipada para preparar tanto comidas simples como complejas, y hacer la estad\u00eda m\u00e1s c\u00f3moda y pr\u00e1ctica.',
      'airbnb-7.jpg': 'Ba\u00f1o completo equipado con toallas incluidas, secador de pelo, ventilaci\u00f3n y armario de almacenamiento. Dise\u00f1o ordenado y funcional que garantiza comodidad y privacidad.',
      'airbnb-8.jpg': 'Un ingreso c\u00f3modo con cerradura inteligente y una vista c\u00e1lida hacia el comedor, pensado para que la llegada sea simple, ordenada y tranquila desde el primer momento.'
    };

    // Fotos: las 8 en el orden de sus archivos
    var FOTOS = ['airbnb-1.jpg', 'airbnb-2.jpg', 'airbnb-3.jpg', 'airbnb-4.jpg', 'airbnb-5.jpg', 'airbnb-6.jpg', 'airbnb-7.jpg', 'airbnb-8.jpg'];

    // Precarga bajo demanda: vecinas al abrir/navegar y, tras la primera
    // apertura, el resto en un idle callback con prioridad baja. Nunca en
    // el arranque del sitio.
    var fotosPrecargadas = {};
    var precargarFoto = function (nombre) {
      if (fotosPrecargadas[nombre]) { return; }
      fotosPrecargadas[nombre] = true;
      var im = new Image();
      if ('fetchPriority' in im) { im.fetchPriority = 'low'; }
      im.src = 'assets/img/' + nombre;
    };
    // Vecinas sin vuelta circular: en los bordes solo existe una.
    var precargarVecinas = function (i) {
      if (i + 1 < FOTOS.length) { precargarFoto(FOTOS[i + 1]); }
      if (i > 0) { precargarFoto(FOTOS[i - 1]); }
    };
    var precargarResto = function () {
      var lanzar = function () { FOTOS.forEach(precargarFoto); };
      if ('requestIdleCallback' in window) { requestIdleCallback(lanzar, { timeout: 3000 }); }
      else { setTimeout(lanzar, 1500); }
    };

    // Espera la decodificación antes de fundir hacia la nueva imagen
    // (img.decode con fallback a load); en error conserva la actual.
    var prepararFoto = function (i) {
      var ruta = 'assets/img/' + FOTOS[i];
      var im = new Image();
      im.src = ruta;
      var espera = im.decode ? im.decode() : new Promise(function (listo, fallo) {
        im.onload = listo;
        im.onerror = fallo;
      });
      return espera.then(function () { return true; }).catch(function (error) {
        console.error('No se pudo cargar la foto del modal:', ruta, error);
        return false;
      });
    };

    // Reserva la altura del pie más largo al ancho actual del panel: el
    // panel no cambia de alto entre pies de distinto largo.
    var reservarPieFoto = function () {
      var pie = modalCuerpo.querySelector('.modal-foto figcaption');
      if (!pie) { return; }
      var sonda = pie.cloneNode(false);
      sonda.style.cssText = 'visibility:hidden;position:absolute;left:0;right:0;min-height:0;';
      pie.parentNode.appendChild(sonda);
      var maximo = 0;
      FOTOS.forEach(function (nombre) {
        sonda.textContent = PIES_FOTOS[nombre] || '';
        maximo = Math.max(maximo, sonda.offsetHeight);
      });
      sonda.parentNode.removeChild(sonda);
      modalPanel.style.setProperty('--pie-alto', maximo + 'px');
    };

    var renderFoto = function (i) {
      var nombre = FOTOS[i];
      var figura = document.createElement('figure');
      figura.className = 'modal-foto';
      var escenario = document.createElement('div');
      escenario.className = 'modal-escenario';
      var imagen = document.createElement('img');
      imagen.src = 'assets/img/' + nombre;
      imagen.alt = 'Fotograf\u00eda del departamento del caso real';
      escenario.appendChild(imagen);
      figura.appendChild(escenario);
      var pie = document.createElement('figcaption');
      pie.textContent = PIES_FOTOS[nombre] || '';
      figura.appendChild(pie);
      return { etiqueta: 'Caso real \u00b7 foto del anuncio', titulo: 'Nuestro departamento', contenido: figura };
    };

    // Rese\u00f1as: las 12 en orden estable (orden del documento, plano)
    var RESENAS = Array.prototype.slice.call(document.querySelectorAll('.caso-reviews .review:not(.review-foto)')).map(function (card) {
      return {
        texto: card.querySelector('blockquote p').textContent,
        autor: card.querySelector('figcaption').textContent
      };
    });

    var renderResena = function (i) {
      var datos = RESENAS[i];
      var contenido = document.createDocumentFragment();
      var estrellas = document.createElement('p');
      estrellas.className = 'modal-estrellas';
      estrellas.textContent = '\u2605\u2605\u2605\u2605\u2605';
      contenido.appendChild(estrellas);
      var cita = document.createElement('blockquote');
      cita.className = 'modal-cita';
      cita.textContent = datos.texto;
      contenido.appendChild(cita);
      return { etiqueta: 'Caso real \u00b7 rese\u00f1a de Airbnb', titulo: datos.autor, contenido: contenido };
    };

    var contadorResena = 0;
    Array.prototype.slice.call(document.querySelectorAll('.caso-reviews .review')).forEach(function (card) {
      if (card.classList.contains('review-foto')) {
        var botonFoto = crearEnlaceCaso(card, 'Ver la foto del departamento en grande');
        botonFoto.addEventListener('click', function () {
          var nombre = (card.querySelector('img').getAttribute('src') || '').split('/').pop();
          var indice = FOTOS.indexOf(nombre);
          if (indice === -1) { indice = 0; }
          abrirColeccion({
            items: FOTOS,
            indice: indice,
            amplio: true,
            navAria: ['Foto anterior', 'Siguiente foto'],
            render: renderFoto,
            preparar: prepararFoto,
            alNavegar: precargarVecinas
          }, botonFoto);
          requestAnimationFrame(function () { requestAnimationFrame(reservarPieFoto); });
          precargarVecinas(indice);
          precargarResto();
        });
      } else {
        var indiceResena = contadorResena;
        contadorResena += 1;
        var botonResena = crearEnlaceCaso(card, 'Leer completa la rese\u00f1a de ' + RESENAS[indiceResena].autor);
        botonResena.addEventListener('click', function () {
          abrirColeccion({
            items: RESENAS,
            indice: indiceResena,
            amplio: false,
            modo: 'texto',
            navAria: ['Rese\u00f1a anterior', 'Rese\u00f1a siguiente'],
            render: renderResena
          }, botonResena);
        });
      }
    });

    modalFondo.addEventListener('click', cerrarModal);
    modalCerrar.addEventListener('click', cerrarModal);
    modalNavPrev.addEventListener('click', function () { navegarModal(-1); });
    modalNavNext.addEventListener('click', function () { navegarModal(1); });

    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); cerrarModal(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); navegarModal(-1); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); navegarModal(1); return; }
      if (e.key !== 'Tab') { return; }
      // Trampa de foco: Tab circula solo entre los focalizables del panel
      // (incluye los chevrons visibles: el del borde alcanzado no cuenta)
      var focalizables = Array.prototype.filter.call(
        modalPanel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        function (el) { return !el.hidden && el.offsetParent !== null; }
      );
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

  // ---------- Encuadre de anclas del navbar ----------
  // Una sola función decide el destino: si la sección cabe completa en
  // la ventana (más un aire de 24px), se centra en el área visible bajo
  // el navbar; si no cabe, se alinea arriba usando su scroll-margin-top
  // computado (el mismo aire de las anclas que ya funcionaban). Todos
  // los valores se leen en vivo en cada invocación (alto real del
  // navbar sticky, viewport y sección), así el encuadre queda correcto
  // ante cualquier cambio de tamaño de ventana. La ventana de supresión
  // evita que el imán del snap reacomode la vista al terminar.
  var topDoc = function (el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; };
  var supresionSnap = 0;

  var encuadrarSeccion = function (seccion) {
    var headerAlto = header ? header.offsetHeight : 0;
    var vh = window.innerHeight;
    var alto = seccion.offsetHeight;
    var top = topDoc(seccion);
    var destino;
    if (alto + headerAlto + 24 <= vh) {
      destino = top - headerAlto - ((vh - headerAlto) - alto) / 2;
    } else {
      destino = top - (parseFloat(getComputedStyle(seccion).scrollMarginTop) || headerAlto + 16);
    }
    supresionSnap = Date.now() + 1600;
    window.scrollTo({ top: Math.max(0, Math.round(destino)), behavior: sinMovimiento ? 'auto' : 'smooth' });
  };

  Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"], .footer-nav a[href^="#"]')).forEach(function (enlace) {
    enlace.addEventListener('click', function (e) {
      var destino = document.querySelector(enlace.getAttribute('href'));
      if (destino && destino.matches('section')) {
        e.preventDefault();
        encuadrarSeccion(destino);
        if (history.pushState) { history.pushState(null, '', enlace.getAttribute('href')); }
      }
    });
  });

  // Los enlaces a los módulos (desde Planes) conservan el encuadre
  // nativo por scroll-margin, pero también suprimen el imán del snap:
  // era él quien reacomodaba la vista tras el salto y tapaba el título
  // del módulo 01 con el navbar.
  Array.prototype.slice.call(document.querySelectorAll('a[href^="#modulo"]')).forEach(function (enlace) {
    enlace.addEventListener('click', function () { supresionSnap = Date.now() + 1600; });
  });

  // Scroll asistido de escritorio (≥64em). Reemplaza al scroll-snap CSS
  // (velocidad no configurable, se percibía brusco) conservando su
  // lógica: al TERMINAR el scroll (scrollend, o debounce de 150ms como
  // fallback), si el inicio de la sección más cercana —o el centro del
  // módulo más cercano de Servicios— queda a menos del umbral, desliza
  // hacia él en ~500ms con easeOutCubic. Nunca durante el gesto, nunca
  // en cascada (en el objetivo no hace nada), nunca más allá del reposo
  // de Contacto (el fondo de la página siempre se puede mirar), y sin
  // snap con prefers-reduced-motion. El encuadre del snap se decide POR
  // SECCIÓN en candidatoSnap (data-snap-aire / data-snap-cubrir, con
  // scroll-margin-top como regla por defecto); las anclas del navbar
  // conservan su propia función de encuadre, que no se toca desde aquí.
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

    // Encuadre del snap POR SECCIÓN, declarado en el HTML y sin tocar el
    // encuadre de las anclas:
    // · data-snap-aire="N": en reposo quedan N px de aire entre el borde
    //   inferior del navbar y el inicio de la sección (negativo: el
    //   inicio se esconde esos px bajo el navbar).
    // · data-snap-cubrir: la sección cubre por sí sola el área visible
    //   bajo el navbar — arriba al ras; si es más alta que el área, el
    //   excedente se reparte entre arriba y abajo; si es más baja, el
    //   encuadre al ras minimiza la franja inferior inevitable.
    // · data-snap-centrar: el CONTENIDO de la sección (su .container)
    //   queda con el mismo aire arriba y abajo dentro del área visible
    //   bajo el navbar, a cualquier alto de ventana; si no cupiera, el
    //   recorte también se reparte en partes iguales.
    // · sin atributo: rige su scroll-margin-top, como siempre.
    // Cada sección declara su ajuste por separado: son independientes.
    var candidatoSnap = function (seccion) {
      var headerAlto = header ? header.offsetHeight : 0;
      var top = topDocumento(seccion);
      if (seccion.hasAttribute('data-snap-cubrir')) {
        var sobra = seccion.offsetHeight - (window.innerHeight - headerAlto);
        return top - headerAlto + Math.max(0, sobra / 2);
      }
      if (seccion.hasAttribute('data-snap-centrar')) {
        var contenido = seccion.querySelector('.container') || seccion;
        return topDocumento(contenido) - headerAlto -
          (window.innerHeight - headerAlto - contenido.offsetHeight) / 2;
      }
      if (seccion.hasAttribute('data-snap-aire')) {
        return top - headerAlto - (parseFloat(seccion.getAttribute('data-snap-aire')) || 0);
      }
      return top - (parseFloat(getComputedStyle(seccion).scrollMarginTop) || 0);
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
        considerar(candidatoSnap(seccion));
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

    var seccionContacto = document.getElementById('contacto');
    var footerEl = document.querySelector('.site-footer');

    // Reserva de recorrido final: el reposo de Contacto tiene que existir
    // como posición real de scroll. Si el tramo bajo su inicio (sección +
    // footer) no alcanza para encuadrarla, el footer extiende su padding
    // inferior en el déficit exacto: el final de la página sigue siendo
    // superficie del footer, nunca un vacío blanco. Cuando el tramo
    // alcanza por sí solo, no se agrega nada.
    var ajustarRecorridoFinal = function () {
      if (!seccionContacto || !footerEl) { return; }
      footerEl.style.paddingBottom = '';
      if (!snapDesktop.matches) { return; }
      var maxY = document.documentElement.scrollHeight - window.innerHeight;
      var deficit = Math.ceil(candidatoSnap(seccionContacto) - maxY);
      if (deficit > 0) { footerEl.style.paddingBottom = deficit + 'px'; }
    };

    ajustarRecorridoFinal();
    window.addEventListener('load', ajustarRecorridoFinal);
    var esperaRecorrido;
    window.addEventListener('resize', function () {
      clearTimeout(esperaRecorrido);
      esperaRecorrido = setTimeout(ajustarRecorridoFinal, 150);
    });

    var alSoltarScroll = function () {
      if (Date.now() < supresionSnap) { return; }
      if (!snapDesktop.matches || animacionSnap !== null) { return; }
      // La última parada del recorrido es el reposo de Contacto: más
      // abajo (zona del footer) el imán no interviene, así el fondo de
      // la página se puede mirar sin tirones.
      if (seccionContacto && window.scrollY > candidatoSnap(seccionContacto) + 2) { return; }
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
