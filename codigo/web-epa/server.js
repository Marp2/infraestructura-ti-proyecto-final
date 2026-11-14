// Sitio institucional (académico) de Empresas Públicas de Armenia - EPA E.S.P.
// Express + PostgreSQL (base de datos creada en Dokploy). Variable: DATABASE_URL
const express = require('express');
const path = require('path');
const os = require('os');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Crea la tabla de PQR si no existe (reintenta mientras la BD arranca)
async function initDb(intentos = 20) {
  for (let i = 1; i <= intentos; i++) {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS pqr (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL,
        servicio VARCHAR(30) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        barrio VARCHAR(100),
        descripcion TEXT NOT NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'Radicada',
        creado TIMESTAMPTZ NOT NULL DEFAULT now())`);
      console.log('BD lista: tabla pqr');
      return;
    } catch (e) {
      console.log(`Esperando BD (${i}/${intentos}): ${e.message}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function estadoBd() {
  try {
    const r = await pool.query('SELECT version() AS v, current_database() AS db, (SELECT count(*) FROM pqr) AS n');
    return { ok: true, version: r.rows[0].v.split(' on ')[0], db: r.rows[0].db, pqr: Number(r.rows[0].n) };
  } catch (e) { return { ok: false, error: e.message }; }
}

function layout(titulo, cuerpo, bd) {
  const badge = bd.ok
    ? `<span class="ok">● Base de datos conectada: ${esc(bd.version)} · BD <b>${esc(bd.db)}</b> · ${bd.pqr} PQR</span>`
    : `<span class="bad">● Base de datos sin conexión</span>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)} · EPA Armenia</title><link rel="stylesheet" href="/estilos.css"></head><body>
<header><div class="wrap nav"><a class="logo" href="/"><span class="gota">💧</span> EPA <small>Empresas Públicas de Armenia E.S.P.</small></a>
<nav><a href="/#servicios">Servicios</a><a href="/#empresa">La empresa</a><a href="/pqr">PQR</a><a href="/#contacto">Atención</a></nav></div></header>
${cuerpo}
<footer><div class="wrap"><p>${badge}</p>
<p>Servidor: ${esc(os.hostname())} · Desplegado con <b>Dokploy</b> (Traefik + HTTPS) en la VM <b>srv-epa</b></p>
<p class="disc">Sitio académico de demostración — Proyecto Final, Administración de Infraestructura de TI, Universidad del Quindío.
No es el sitio oficial de la empresa (www.epa.gov.co).</p></div></footer></body></html>`;
}

app.get('/', async (req, res) => {
  const bd = await estadoBd();
  res.send(layout('Inicio', `
<section class="hero"><div class="wrap">
<h1>La empresa de todos los armenios</h1>
<p>Prestamos los servicios públicos domiciliarios de <b>acueducto, alcantarillado y aseo</b> en Armenia, Quindío, desde 1962.</p>
<a class="btn" href="/pqr">Radicar una PQR</a></div></section>

<section id="servicios" class="wrap grid3">
<article><h3>🚰 Acueducto</h3><p>Captación, tratamiento y distribución de agua potable para la zona urbana de Armenia, con mantenimiento de redes y cuencas abastecedoras.</p></article>
<article><h3>🛠️ Alcantarillado</h3><p>Recolección y transporte de aguas residuales y lluvias; reposición y optimización de colectores en los barrios de la ciudad.</p></article>
<article><h3>♻️ Aseo</h3><p>Recolección de residuos, barrido de vías, corte de césped y campañas como <i>Basura Cero</i> para reducir puntos críticos.</p></article>
</section>

<section id="empresa" class="wrap two">
<div><h2>Quiénes somos</h2>
<p>Empresas Públicas de Armenia E.S.P. es una Empresa Industrial y Comercial del Estado del orden municipal, constituida el 15 de diciembre de 1962.</p>
<p><b>Misión:</b> trabajar por el desarrollo regional bajo el concepto de sostenibilidad en servicios públicos y negocios estratégicos, para satisfacer las demandas ciudadanas.</p></div>
<div class="datos"><div><b>+120.000</b><span>suscriptores por servicio</span></div>
<div><b>3</b><span>servicios domiciliarios</span></div><div><b>1962</b><span>año de fundación</span></div></div>
</section>

<section id="contacto" class="wrap"><h2>Atención al ciudadano</h2>
<p>Peticiones, quejas, reclamos y reportes de daños se reciben en línea en la sección <a href="/pqr">PQR</a>; cada solicitud queda radicada en la base de datos de la empresa.</p></section>`, bd));
});

app.get('/pqr', async (req, res) => {
  const bd = await estadoBd();
  let filas = '';
  try {
    const r = await pool.query('SELECT * FROM pqr ORDER BY id DESC LIMIT 10');
    filas = r.rows.map(p => `<tr><td>#${p.id}</td><td>${esc(p.tipo)}</td><td>${esc(p.servicio)}</td>
      <td>${esc(p.nombre)}</td><td>${esc(p.barrio)}</td><td>${esc(p.descripcion)}</td><td>${esc(p.estado)}</td>
      <td>${new Date(p.creado).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td></tr>`).join('');
  } catch (e) { filas = `<tr><td colspan="8">Error: ${esc(e.message)}</td></tr>`; }
  const okMsg = req.query.ok ? `<p class="aviso">✅ Su PQR quedó radicada con el número <b>#${esc(req.query.ok)}</b>.</p>` : '';
  res.send(layout('PQR', `<section class="wrap"><h1>Peticiones, quejas y reclamos</h1>${okMsg}
<form method="post" action="/pqr" class="form">
<label>Tipo<select name="tipo"><option>Petición</option><option>Queja</option><option>Reclamo</option><option>Reporte de daño</option></select></label>
<label>Servicio<select name="servicio"><option>Acueducto</option><option>Alcantarillado</option><option>Aseo</option></select></label>
<label>Nombre<input name="nombre" required maxlength="100"></label>
<label>Barrio<input name="barrio" maxlength="100"></label>
<label class="full">Descripción<textarea name="descripcion" required rows="3"></textarea></label>
<button class="btn">Radicar</button></form>
<h2>Últimas PQR radicadas</h2>
<table><thead><tr><th>N.º</th><th>Tipo</th><th>Servicio</th><th>Nombre</th><th>Barrio</th><th>Descripción</th><th>Estado</th><th>Fecha</th></tr></thead>
<tbody>${filas || '<tr><td colspan="8">Aún no hay PQR.</td></tr>'}</tbody></table></section>`, bd));
});

app.post('/pqr', async (req, res) => {
  const { tipo, servicio, nombre, barrio, descripcion } = req.body;
  if (!tipo || !servicio || !nombre || !descripcion) return res.status(400).send('Faltan datos');
  try {
    const r = await pool.query(
      'INSERT INTO pqr (tipo, servicio, nombre, barrio, descripcion) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [tipo, servicio, nombre, barrio, descripcion]);
    if (req.is('json')) return res.json({ id: r.rows[0].id });
    res.redirect(`/pqr?ok=${r.rows[0].id}`);
  } catch (e) { res.status(500).send('Error guardando la PQR: ' + esc(e.message)); }
});

app.get('/api/salud', async (req, res) => {
  const bd = await estadoBd();
  res.status(bd.ok ? 200 : 503).json({ servicio: 'web-epa', host: os.hostname(), bd });
});

app.listen(PORT, () => console.log(`web-epa escuchando en :${PORT}`));
initDb();
