# Sitio web de la EPA y base de datos (Dokploy)

**Responsable:** Integrante 1
**URL:** https://www.epa.lan · **Código:** [`codigo/web-epa/`](../codigo/web-epa/)
**Stack:** Node.js 22 + Express, desplegado por Dokploy desde Git (Dockerfile) detrás de Traefik con HTTPS; **PostgreSQL 16** creado en Dokploy.

## 1. La aplicación

Sitio institucional académico de **Empresas Públicas de Armenia E.S.P.** con las secciones Servicios (acueducto, alcantarillado, aseo), La empresa y **PQR**. En PQR el ciudadano radica una petición, queja o reclamo, que se guarda en PostgreSQL (tabla `pqr`, creada automáticamente al arrancar). El pie de página muestra en vivo el estado de la conexión a la base de datos, y el endpoint `/api/salud` lo devuelve en JSON.

## 2. Base de datos PostgreSQL en Dokploy

Proyecto `EPA Armenia` → **Create Service → Database → PostgreSQL**: nombre `bd-epa`, base `epa`, usuario `epa`, imagen `postgres:16` → **Deploy**.

![Crear PostgreSQL](evidencias/bd/01-crear-postgresql.png)
![Deploy](evidencias/bd/02-deploy-postgresql.png)

Dokploy entrega la **URL de conexión interna**. La base solo es accesible dentro de la red de Docker (`dokploy-network`) y **no se expone a internet**.

![Credenciales internas](evidencias/bd/03-credenciales-internas.png)

## 3. Código en Git

```bash
git checkout -b feature/integrante1-dokploy-web
git add codigo/web-epa
git commit -m "feat(web): sitio institucional EPA con PQR en PostgreSQL para Dokploy"
git push -u origin feature/integrante1-dokploy-web
```
Se sube el código del sitio (Dockerfile incluido) a la rama del integrante 1.

![Git push](evidencias/web/01-git-push-codigo.png)

## 4. Aplicación en Dokploy

**Create Service → Application** `web-epa`, configurada así:

| Pestaña | Valor | Para qué |
|---|---|---|
| Environment | `DATABASE_URL=postgresql://epa:****@epa-armenia-bdepa-zq3cyn:5432/epa` | Conecta la app con la BD (el `#` de la clave se escribe `%23`) |
| General → Build Type | Dockerfile | Construye la imagen con el `Dockerfile` del repo |
| Domains | `www.epa.lan`, puerto 3000, **HTTPS**, certificado *None* | Traefik publica la app y usa el certificado `*.epa.lan` |
| General → Provider | **Git**, `https://github.com/Marp2/infraestructura-ti-proyecto-final.git`, rama `feature/integrante1-dokploy-web`, Build Path `/codigo/web-epa` | Despliegue desde el repositorio |

![Variable de entorno](evidencias/web/02-variable-database-url.png)
![Build type](evidencias/web/03-build-type-dockerfile.png)
![Dominio](evidencias/web/04-dominio-https-formulario.png)
![Dominio creado](evidencias/web/05-dominio-creado.png)
![Proveedor Git](evidencias/web/06-proveedor-git.png)

**Deploy** → Dokploy clona el repo, construye la imagen y la despliega en Swarm:

![Build completado](evidencias/web/07-build-completado.png)
![Servicios activos](evidencias/dokploy/07-servicios-web-y-bd-activos.png)

## 5. Verificación

```bash
curl -sI http://www.epa.lan | head -3          # HTTP redirige a HTTPS (308)
curl -skI https://www.epa.lan | head -3        # HTTPS responde HTTP/2 200
echo | openssl s_client -connect www.epa.lan:443 -servername www.epa.lan 2>/dev/null | openssl x509 -noout -subject -issuer
curl -sk https://www.epa.lan/api/salud         # {"bd":{"ok":true,"version":"PostgreSQL 16.16 ..."}}
```

![Pruebas](evidencias/web/08-pruebas-redireccion-https-certificado-bd.png)

En el navegador aparece la advertencia esperada de certificado autofirmado (`ERR_CERT_AUTHORITY_INVALID`). Después de aceptarla carga el sitio:

![Advertencia](evidencias/web/09-advertencia-certificado-autofirmado.png)
![Inicio](evidencias/web/10-sitio-inicio.png)
![PQR radicada](evidencias/web/11-pqr-radicada.png)

**La PQR quedó guardada en la base de datos** (consulta dentro de la VM):
```bash
sudo docker exec -it $(sudo docker ps -qf name=epa-armenia-bdepa) psql -U epa -d epa \
  -c "SELECT id, tipo, servicio, nombre, estado, creado FROM pqr;"
```
![PQR en PostgreSQL](evidencias/bd/04-pqr-guardada-en-postgresql.png)

## 6. Problemas encontrados

| Problema | Solución |
|---|---|
| La contraseña tiene `#`, y en una URL ese carácter corta todo lo que sigue | Codificarlo como `%23` en `DATABASE_URL` |
| El provider *GitHub* de Dokploy pide configurar una GitHub App | Como el repo es público, se usó el provider **Git** genérico |
| `psql` en el anfitrión dio `role "epa" does not exist` | Ese PostgreSQL era otro (el Docker del anfitrión). La consulta se hace dentro de la VM |
