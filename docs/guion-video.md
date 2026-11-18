# Guion del video y la sustentación (≈ 11 min)

**Presentación:** [Infraestructura de TI para EPA Armenia](https://claude.ai/artifact/7yrXQEQibTgjpjPrHNMXiE) (14 diapositivas). Se avanza con las flechas del teclado.

## Antes de grabar o sustentar

La VM y todos los servicios arrancan solos con el PC (se configuró una vez con `sudo bash scripts/preparar.sh`). El día de la grabación solo hay que:

1. Prender el PC y esperar 2–3 minutos (Dokploy tarda en levantar).
2. Revisar que todo esté en verde y abrir las pestañas:
   ```bash
   bash scripts/estado.sh
   ```
   Abre el sitio https://www.epa.lan, el panel de Dokploy, CUPS, la carpeta NFS `/mnt/empresa` y la carpeta Samba `smb://192.168.122.10/empresa`.
3. Abrir la presentación en otra pestaña y dos terminales: **Linux** (anfitrión) y **VM** (`ssh -i ~/.ssh/id_ed25519_epa epa@192.168.122.10`).

La columna **En vivo** es opcional: si hay poco tiempo, basta con la diapositiva y la pestaña ya abierta, sin escribir comandos.

## Recorrido

| # | Tiempo | Quién | Diapositiva | Qué decir | En vivo (opcional) |
|---|---|---|---|---|---|
| 1 | 0:00 | Integrante 1 | **1 · Portada** y **2 · El reto** | Qué es la EPA (acueducto, alcantarillado y aseo) y el objetivo: toda su infraestructura en una VM con Dokploy | — |
| 2 | 0:45 | Integrante 1 | **3 · El equipo** | Qué hizo cada integrante | — |
| 3 | 1:15 | Integrante 1 | **4 · Arquitectura** | Anfitrión con KVM → VM `srv-epa` (192.168.122.10) → servicios → clientes Linux y Windows | — |
| 4 | 2:00 | Integrante 1 | **5 · Cada servicio, su puerto** | Puerto de cada servicio; la base de datos no se expone, solo la ve la app | — |
| 5 | 2:30 | Integrante 1 | **6 · Servidor** | 2 vCPU, 4 GB, 40 GB, IP fija; cloud-init; por qué KVM y no VirtualBox (Secure Boot) | VM: `hostnamectl; ip -4 -br addr` |
| 6 | 3:30 | Integrante 1 | **7 · Web y HTTPS** | Despliegue desde Git con Dockerfile; Traefik redirige a HTTPS con certificado `*.epa.lan` | Pestaña https://www.epa.lan (candado) y panel de Dokploy → EPA Armenia en verde |
| 7 | 4:30 | Integrante 2 | **8 · Base de datos** | Formulario PQR → app Node (`DATABASE_URL`) → PostgreSQL 16 | Radicar una PQR en el sitio · VM: `sudo docker exec -it $(sudo docker ps -qf name=epa-armenia-bdepa) psql -U epa -d epa -c "SELECT id,tipo,nombre FROM pqr;"` |
| 8 | 5:30 | Integrante 2 | **9 · Archivos compartidos** (panel NFS) | Dos exports: empresa (rw, `root_squash`) y público (solo lectura) | Pestaña de la carpeta `/mnt/empresa` · Linux: `echo demo > /mnt/empresa/tecnica/demo.txt; touch /mnt/publico/x` (falla: solo lectura) |
| 9 | 6:15 | Integrante 2 | **9 · Archivos compartidos** (panel Samba) | Carpeta del grupo y carpeta privada de Gerencia con `valid users` | Pestaña `smb://192.168.122.10/empresa` · Linux: `smbclient //192.168.122.10/gerencia -U tecnico -c ls` (ACCESS_DENIED) |
| 10 | 7:00 | Integrante 3 | **10 · Usuarios y hora** (panel NIS) | Usuarios creados una vez en el servidor; el cliente los resuelve por NIS y `mkhomedir` crea su carpeta | Linux: `grep cruiz /etc/passwd \|\| echo "no existe local"; su - cruiz` → `whoami; hostname` |
| 11 | 8:00 | Integrante 3 | **10 · Usuarios y hora** (panel NTP) | `srv-epa` toma la hora de internet y la sirve a la red por el puerto 123 | Linux: `chronyc sources` (`^* srv-epa`) · VM: `sudo chronyc clients` |
| 12 | 8:45 | Integrante 4 | **11 · Impresión** | `cups-pdf` como impresora virtual, compartida por IPP (631), probada desde Windows | Pestaña de CUPS (impresora PDF compartida) · Linux: `lp -h 192.168.122.10 -d PDF ~/factura.txt` |
| 13 | 9:45 | Integrante 4 | **12 · Lo que aprendimos** | Los cuatro problemas y cómo se resolvieron | — |
| 14 | 10:30 | Integrante 4 | **13 · En resumen** y **14 · ¿Preguntas?** | Un servidor, siete servicios, cero cambios en Windows; todo está documentado en el repositorio | Pestaña de GitHub con el repositorio |

**Consejos:** aumenta la fuente del terminal (Ctrl + +), graba a pantalla completa (en Ubuntu: Ctrl + Alt + Shift + R inicia y detiene la grabación) y ensaya una vez antes. Si alguna compañera muestra su propia VM (NTP/CUPS con Windows), puede grabar su parte aparte y pegarla en las filas 11 y 12.
