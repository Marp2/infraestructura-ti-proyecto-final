# Guion del video (≈ 10–12 min)

Antes de grabar, en el anfitrión:
```bash
ping -c2 192.168.122.10                                    # VM arriba
sudo sed -i -E '/nis/!s/^(passwd|group|shadow):(.*)$/\1:\2 nis/' /etc/nsswitch.conf
sudo systemctl enable --now ypbind && ypwhich               # NIS activo → 192.168.122.10
sudo mount -t nfs 192.168.122.10:/srv/nfs/empresa /mnt/empresa 2>/dev/null; df -hT | grep nfs
```
Ten abiertos: dos pestañas de terminal (**Linux** y **VM** con `ssh -i ~/.ssh/id_ed25519_epa epa@192.168.122.10`), el navegador con el panel de Dokploy y https://www.epa.lan, y el repositorio en GitHub.

| # | Tiempo | Quién | Qué mostrar | Comando / acción |
|---|---|---|---|---|
| 1 | 0:00 | Integrante 1 | Presentación: EPA, problema y servicios propuestos | GitHub → `README.md` y `analisis.md` (tabla de requisitos) |
| 2 | 1:00 | Integrante 1 | Arquitectura | `diagrama.mmd` en GitHub |
| 3 | 1:45 | Integrante 1 | VM: recursos e IP fija; por qué KVM | Linux: `sudo virsh dominfo srv-epa` · VM: `hostnamectl; ip -4 -br addr` |
| 4 | 2:45 | Integrante 1 | Dokploy: proyecto, app y BD en verde; despliegue desde Git | Navegador: panel → EPA Armenia → web-epa (Provider Git, Domains HTTPS) |
| 5 | 3:45 | Integrante 1 | Web con HTTPS y BD | Navegador: https://www.epa.lan → radicar una PQR · VM: `sudo docker exec -it $(sudo docker ps -qf name=epa-armenia-bdepa) psql -U epa -d epa -c "SELECT id,tipo,nombre FROM pqr;"` |
| 6 | 5:00 | Integrante 2 | NFS: exports, montaje, rw/ro, root_squash | VM: `sudo exportfs -v` · Linux: `df -hT \| grep nfs; echo demo > /mnt/empresa/tecnica/demo.txt; touch /mnt/publico/x` |
| 7 | 6:00 | Integrante 2 | Samba: recursos y permisos | Linux: `smbclient -L //192.168.122.10 -U tecnico` · `smbclient //192.168.122.10/gerencia -U tecnico -c ls` (ACCESS_DENIED) · Archivos → `smb://192.168.122.10/empresa` |
| 8 | 7:00 | Integrante 3 | NIS: usuarios centralizados | VM: `ypcat -h localhost passwd` · Linux: `grep cruiz /etc/passwd \|\| echo "no existe local"; su - cruiz` → `whoami; hostname` |
| 9 | 8:15 | Integrante 4 | NTP | Linux: `chronyc sources` (`^* srv-epa`) · VM: `sudo chronyc clients` |
| 10 | 9:00 | Integrante 4 | CUPS: imprimir desde cliente | Linux: `lp -h 192.168.122.10 -d PDF ~/factura.txt` · VM: `lpstat -W completed -o PDF; sudo ls /var/spool/cups-pdf/ANONYMOUS/` · navegador https://192.168.122.10:631/printers/ |
| 11 | 10:00 | Integrante 1 | Problemas y soluciones, cierre | `documentacion.md` → tabla de problemas |

**Consejos:** aumenta la fuente del terminal (Ctrl + +), graba a pantalla completa (en Ubuntu: Ctrl + Alt + Shift + R inicia/detiene la grabación) y ensaya una vez antes. Si alguna compañera muestra su propia VM (NTP/CUPS con Windows), puede poner su parte grabada aparte.
