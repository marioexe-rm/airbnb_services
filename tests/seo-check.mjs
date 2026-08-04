// Chequeos de regresión SEO de la landing. Sin dependencias:
//   node --test tests/seo-check.mjs
// Validan el contrato SEO del sitio (metadatos, datos estructurados,
// anclas, imágenes, activos y sitemap), no detalles incidentales de
// maquetación: si uno falla, hay una regresión real que corregir.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(raiz, 'index.html'), 'utf8');
const css = readFileSync(join(raiz, 'assets/css/styles.css'), 'utf8');
const js = readFileSync(join(raiz, 'assets/js/main.js'), 'utf8');

const CANONICA = 'https://marioexe-rm.github.io/airbnb_services/';

const meta = (nombre, attr = 'name') => {
  const re = new RegExp(`<meta[^>]*${attr}="${nombre}"[^>]*content="([^"]*)"`, 'i');
  const alt = new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${nombre}"`, 'i');
  return (html.match(re) || html.match(alt) || [])[1];
};

test('documento: lang, título, descripción y canónica', () => {
  assert.match(html, /<html lang="es-CL">/);
  assert.match(html, /<meta charset="UTF-8">/i);
  assert.ok(meta('viewport'), 'falta la meta viewport');

  const titulo = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
  assert.ok(titulo, 'falta <title>');
  assert.ok(titulo.length >= 15 && titulo.length <= 70,
    `largo de <title> fuera de rango (${titulo.length}): «${titulo}»`);
  assert.match(titulo, /Airbnb/, 'el título perdió el término principal');
  assert.match(titulo, /Reditu/, 'el título perdió la marca');

  const descripcion = meta('description');
  assert.ok(descripcion, 'falta la meta description');
  assert.ok(descripcion.length >= 80 && descripcion.length <= 165,
    `largo de la description fuera de rango (${descripcion.length})`);

  const canonica = (html.match(/<link rel="canonical" href="([^"]+)">/) || [])[1];
  assert.equal(canonica, CANONICA);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, 'canónica duplicada');
});

test('un solo h1, con encabezados no vacíos fuera de lo oculto', () => {
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, 'debe haber exactamente un h1');
  // Los encabezados del contenido (fuera del modal [hidden], que JS
  // rellena al abrirlo) no pueden quedar vacíos.
  const visible = html.slice(0, html.indexOf('<div class="modal" hidden>'));
  for (const m of visible.matchAll(/<h([2-3])[^>]*>([\s\S]*?)<\/h\1>/g)) {
    const texto = m[2].replace(/<[^>]+>/g, '').trim();
    assert.ok(texto.length > 0, `encabezado h${m[1]} vacío: ${m[0].slice(0, 80)}`);
  }
});

test('Open Graph y Twitter completos y coherentes', () => {
  assert.ok(meta('og:title', 'property'));
  assert.ok(meta('og:description', 'property'));
  assert.equal(meta('og:url', 'property'), CANONICA);
  assert.equal(meta('og:locale', 'property'), 'es_CL');
  assert.equal(meta('twitter:card'), 'summary_large_image');
  assert.ok(meta('og:image:alt', 'property'), 'falta og:image:alt');

  const imagen = meta('og:image', 'property');
  assert.ok(imagen && imagen.startsWith('https://'), 'og:image debe ser URL absoluta');
  const rutaLocal = imagen.replace(CANONICA, '').replace(/\?.*$/, '');
  assert.ok(existsSync(join(raiz, rutaLocal)), `og:image no existe en el repo: ${rutaLocal}`);
});

test('JSON-LD: bloques válidos con los datos mínimos', () => {
  const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]));
  assert.equal(bloques.length, 2, 'se esperan ProfessionalService y FAQPage');

  const negocio = bloques.find((b) => b['@type'] === 'ProfessionalService');
  assert.ok(negocio, 'falta el bloque ProfessionalService');
  for (const campo of ['name', 'url', 'telephone', 'email', 'description', 'areaServed']) {
    assert.ok(negocio[campo], `ProfessionalService sin ${campo}`);
  }
  assert.equal(negocio.url, CANONICA);
  for (const url of [negocio.image, negocio.logo]) {
    const ruta = url.replace(CANONICA, '').replace(/\?.*$/, '');
    assert.ok(existsSync(join(raiz, ruta)), `recurso del JSON-LD inexistente: ${ruta}`);
  }
  // Sin precios: los del sitio son provisionales y no deben quedar
  // codificados como afirmaciones estructuradas.
  assert.ok(!JSON.stringify(negocio).match(/"price/), 'el JSON-LD no debe declarar precios');
  // Sin calificaciones ni reseñas estructuradas: las reseñas visibles
  // son del departamento del caso real, no del servicio Reditu.
  for (const bloque of bloques) {
    const texto = JSON.stringify(bloque);
    assert.ok(!/"(aggregateRating|review|ratingValue)"/.test(texto),
      'el JSON-LD no debe declarar calificaciones ni reseñas del servicio');
  }
});

test('FAQPage refleja exactamente la sección #faq visible', () => {
  const faq = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
    .find((b) => b['@type'] === 'FAQPage');
  assert.ok(faq, 'falta el bloque FAQPage');

  const seccion = html.slice(html.indexOf('id="faq"'), html.indexOf('id="contacto"'));
  const visibles = [...seccion.matchAll(/<span class="faq-pregunta">([^<]+)<\/span>/g)].map((m) => m[1]);
  assert.equal(faq.mainEntity.length, visibles.length,
    'FAQPage y sección #faq tienen distinta cantidad de preguntas');

  for (const [i, pregunta] of faq.mainEntity.entries()) {
    assert.equal(pregunta.name, visibles[i], `pregunta ${i + 1} distinta entre JSON-LD y HTML`);
    const respuesta = pregunta.acceptedAnswer.text;
    assert.ok(seccion.includes(respuesta),
      `la respuesta del JSON-LD no aparece textual en la página: «${respuesta.slice(0, 60)}…»`);
  }
});

test('todas las anclas internas apuntan a un id existente', () => {
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.has(m[1]), `ancla rota: #${m[1]}`);
  }
});

test('imágenes con alt, width y height', () => {
  for (const m of html.matchAll(/<img[^>]*>/g)) {
    const img = m[0];
    assert.match(img, /alt="[^"]+"/, `img sin alt: ${img.slice(0, 90)}`);
    assert.match(img, /width="\d+"/, `img sin width: ${img.slice(0, 90)}`);
    assert.match(img, /height="\d+"/, `img sin height: ${img.slice(0, 90)}`);
  }
});

test('activos locales referenciados existen y sin restos de Google Fonts', () => {
  for (const m of html.matchAll(/(?:src|href)="(assets\/[^"?]+)/g)) {
    assert.ok(existsSync(join(raiz, m[1])), `activo inexistente: ${m[1]}`);
  }
  assert.ok(!html.includes('fonts.googleapis.com') && !html.includes('fonts.gstatic.com'),
    'la tipografía debe ser autoalojada');
  // Los woff2 de los @font-face del CSS existen (rutas relativas a assets/css/).
  for (const m of css.matchAll(/url\("\.\.\/fonts\/([^"]+)"\)/g)) {
    assert.ok(existsSync(join(raiz, 'assets/fonts', m[1])), `fuente inexistente: ${m[1]}`);
  }
  // La precarga del woff2 apunta a un archivo real del repo.
  const preload = (html.match(/<link rel="preload" href="(assets\/fonts\/[^"]+)"/) || [])[1];
  assert.ok(preload && existsSync(join(raiz, preload)), 'preload de fuente roto');
});

test('sin recursos http: (contenido mixto)', () => {
  for (const m of html.matchAll(/(?:src|href)="(http:[^"]+)"/g)) {
    assert.fail(`recurso inseguro: ${m[1]}`);
  }
});

test('los alt del rotador de fotos calzan con los del HTML', () => {
  // main.js reasigna alt al rotar: los 4 primeros de altFotos deben ser
  // los mismos alt con que las fotos 1-4 parten en el HTML estático.
  const bloque = js.match(/var altFotos = \[([\s\S]*?)\];/);
  assert.ok(bloque, 'main.js perdió el arreglo altFotos');
  const alts = [...bloque[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.equal(alts.length, 8, 'altFotos debe describir las 8 fotos');
  for (const [i, alt] of alts.slice(0, 4).entries()) {
    assert.ok(html.includes(`src="assets/img/airbnb-${i + 1}.jpg" alt="${alt}"`),
      `el alt estático de airbnb-${i + 1}.jpg no coincide con altFotos[${i}]`);
  }
});

test('sitemap.xml apunta a la canónica', () => {
  const sitemap = readFileSync(join(raiz, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.ok(sitemap.includes(`<loc>${CANONICA}</loc>`), 'el sitemap no lista la URL canónica');
  assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
});

test('404.html con noindex y vuelta a la página principal', () => {
  const p404 = readFileSync(join(raiz, '404.html'), 'utf8');
  assert.match(p404, /<meta name="robots" content="noindex">/);
  assert.match(p404, /href="\/airbnb_services\/"/);
});

test('un único número de contacto en WhatsApp, tel: y JSON-LD', () => {
  const numeros = new Set([...html.matchAll(/wa\.me\/(\d+)/g)].map((m) => m[1]));
  for (const m of html.matchAll(/href="tel:\+?(\d+)"/g)) { numeros.add(m[1]); }
  for (const m of html.matchAll(/"telephone":\s*"\+?(\d+)"/g)) { numeros.add(m[1]); }
  assert.equal(numeros.size, 1, `números de contacto distintos: ${[...numeros].join(', ')}`);
});
