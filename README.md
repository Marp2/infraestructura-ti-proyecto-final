# Proyecto final: Infraestructura TI para EPA Armenia

**Curso:** Administración de Infraestructura de TI, Universidad del Quindío
**Empresa:** Empresas Públicas de Armenia E.S.P. (acueducto, alcantarillado y aseo)

Infraestructura de servicios de la EPA sobre un servidor local: **Dokploy** como PaaS para la web y la base de datos, más los servicios Linux tradicionales (**NTP, NFS, NIS, CUPS y Samba**).

## Documento y presentación

- 📄 **Documento del proyecto (Google Docs):** [Proyecto final: Infraestructura de TI para EPA Armenia](https://docs.google.com/document/d/1f6aSg6igFoL7xtZqNiyOYAE4ZpGhPJv29QTNsPPD5l0/edit?tab=t.ri6oxz1dskgg). Descripción, arquitectura, comandos de cada servicio con su explicación, 59 capturas, problemas y conclusiones.
- 📊 **Presentación de la sustentación:** [Infraestructura de TI para EPA Armenia](https://claude.ai/artifact/7yrXQEQibTgjpjPrHNMXiE) (14 diapositivas).
- 🎬 **Guion del video:** [docs/guion-video.md](docs/guion-video.md), con la diapositiva que va en cada momento.

## Resumen

| Elemento | Valor |
|---|---|
| Servidor | VM `srv-epa`: Ubuntu Server 24.04.5 LTS, 2 vCPU, 4 GB RAM, 40 GB, IP fija **192.168.122.10** (KVM/libvirt) |
| Sitio web | **https://www.epa.lan** (Traefik + certificado autofirmado `*.epa.lan`) |
| Panel Dokploy | http://192.168.122.10:3000 |
| Base de datos | PostgreSQL 16 (`bd-epa`) creada en Dokploy y conectada a la app |
| NIS | Dominio `epanis`, usuarios de prueba `lgomez` y `cruiz` |
| NFS | `/srv/nfs/empresa` (rw) y `/srv/nfs/publico` (ro) |
| Samba | `\\srv-epa\empresa` (grupo) y `\\srv-epa\gerencia` (privada) |
| NTP / CUPS | chrony (`allow` red local, `local stratum 10`) e impresora virtual `PDF` compartida por IPP |

## Distribución del trabajo

| Integrante | Responsabilidad |
|---|---|
| 1 — Coordinación e integración | Anfitrión, VM Ubuntu Server, Dokploy, dominio/HTTPS, aplicación web y base de datos; integración de aportes |
| 2 — Archivos | NFS y Samba: permisos, clientes Linux/Windows y evidencias |
| 3 — Usuarios | NIS: autenticación centralizada, usuarios de prueba y verificación desde cliente Linux |
| 4 — Servicios auxiliares | NTP y CUPS: sincronización de cliente, cola de impresión y evidencias |

## Estructura del repositorio

```
├── analisis.md          # Necesidades, justificación, tabla de requisitos, costo-beneficio
├── diagrama.mmd         # Diagrama de arquitectura (Mermaid)
├── documentacion.md     # Índice técnico, verificación rápida, problemas
├── docs/                # Un documento por servicio (comandos + para qué + capturas)
│   └── evidencias/      # Capturas por servicio (vm, dokploy, web, bd, nfs, samba, nis, ntp, cups)
├── scripts/             # preparar.sh (arranque automático) y estado.sh (revisión antes de sustentar)
├── configs/             # Configuraciones usadas (cloud-init, traefik, exports, smb.conf, nis, chrony)
└── codigo/web-epa/      # Sitio institucional EPA (Node.js + PostgreSQL, Dockerfile)
```

Empieza por [documentacion.md](documentacion.md).
