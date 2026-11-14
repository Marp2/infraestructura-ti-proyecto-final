# Documentación técnica — Infraestructura TI para EPA Armenia

Cada servicio tiene su documento con los **comandos usados, para qué sirve cada uno y la captura** que lo demuestra. Las capturas están en [`docs/evidencias/`](docs/evidencias/).

| # | Servicio | Documento | Responsable | Estado |
|---|---|---|---|---|
| 0 | VM, Dokploy, dominio `epa.lan` y SSL | [docs/infraestructura-base.md](docs/infraestructura-base.md) | Integrante 1 | ✅ |
| 1 | Web (sitio EPA con HTTPS) | [docs/web-bd.md](docs/web-bd.md) | Integrante 1 | ✅ |
| 7 | Base de datos PostgreSQL (Dokploy) | [docs/web-bd.md](docs/web-bd.md) | Integrante 1 | ✅ |
| 3 | NFS | [docs/nfs.md](docs/nfs.md) | Integrante 2 | ✅ |
| 6 | Samba | [docs/samba.md](docs/samba.md) | Integrante 2 | ✅ |
| 4 | NIS | [docs/nis.md](docs/nis.md) | Integrante 3 | ✅ |
| 2 | NTP (chrony) | [docs/ntp.md](docs/ntp.md) | Integrante 4 | ✅ |
| 5 | CUPS | [docs/cups.md](docs/cups.md) | Integrante 4 | ✅ |

> La Integrante 4 implementó NTP y CUPS en su propia VM (192.168.40.5) con cliente Windows. Para la demostración integral se replicó la misma configuración en `srv-epa`: ver [docs/ntp-cups-srv-epa.md](docs/ntp-cups-srv-epa.md).

## Comandos de verificación rápida (para la demo)

| Servicio | Dónde | Comando | Resultado esperado |
|---|---|---|---|
| VM | Anfitrión | `sudo virsh list --all` | `srv-epa` en ejecución |
| Dokploy | VM | `sudo docker service ls` | dokploy, bd-epa y web-epa en 1/1 |
| Web + HTTPS | Anfitrión | `curl -skI https://www.epa.lan` | `HTTP/2 200` |
| BD | Anfitrión | `curl -sk https://www.epa.lan/api/salud` | `"ok":true` |
| NTP | Anfitrión | `chronyc sources` | `^*` en 192.168.122.10 |
| NFS | Anfitrión | `showmount -e 192.168.122.10` | `empresa` y `publico` |
| NIS | Anfitrión | `ypwhich; getent passwd lgomez` | servidor y usuario |
| CUPS | Anfitrión | `lpstat -h 192.168.122.10 -p` | impresora `PDF` inactiva (lista) |
| Samba | Anfitrión | `smbclient -L //192.168.122.10 -U tecnico` | `empresa`, `gerencia` |

## Puesta en marcha para la presentación

1. Arrancar Ubuntu desde el disco externo. La VM arranca sola (`virsh autostart`).
2. Comprobar: `ping -c2 192.168.122.10` y abrir https://www.epa.lan.
3. Montar NFS: `sudo mount -t nfs 192.168.122.10:/srv/nfs/empresa /mnt/empresa`.
4. Para el PC con Windows: `sudo socat TCP-LISTEN:445,fork,reuseaddr TCP:192.168.122.10:445`.

## Problemas encontrados (resumen)

| Problema | Solución | Detalle |
|---|---|---|
| VirtualBox no carga módulos con Secure Boot (MOK no se registra) | Se cambió a KVM/libvirt | [infraestructura-base.md §6](docs/infraestructura-base.md) |
| Sin bridged sobre Wi-Fi en KVM | Red NAT con IP fija y reenvío de puerto para Samba | [infraestructura-base.md §1](docs/infraestructura-base.md) |
| `#` en la contraseña rompe `DATABASE_URL` | Codificar `%23` | [web-bd.md §6](docs/web-bd.md) |
| Paquete `ntp` no existe en Ubuntu 24.04 | chrony | [ntp.md](docs/ntp.md) |
| Advertencia de certificado en el navegador | Esperado con autofirmado; aceptar la excepción | [web-bd.md §5](docs/web-bd.md) |
| Avisos `failed to send 'clear'` en `ypinit` | Normal si `ypserv` aún no corre | [nis.md §4](docs/nis.md) |

## Configuraciones

Están en [`configs/`](configs/): cloud-init de la VM, certificado de Traefik, `exports`, `smb.conf`, NIS, chrony y la variable de entorno de la app. El código del sitio está en [`codigo/web-epa/`](codigo/web-epa/).
