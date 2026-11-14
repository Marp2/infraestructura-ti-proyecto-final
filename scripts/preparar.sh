#!/usr/bin/env bash
# Deja la infraestructura de la EPA arrancando sola al prender el PC.
# Se ejecuta UNA sola vez:  sudo bash preparar.sh
set -u
[ "$EUID" -eq 0 ] || { echo "Ejecútalo así:  sudo bash $0"; exit 1; }

VM=srv-epa
IP=192.168.122.10
USUARIO=andres-linux
LLAVE=/home/$USUARIO/.ssh/id_ed25519_epa
SSH="sudo -u $USUARIO ssh -i $LLAVE -o ConnectTimeout=5 epa@$IP"

echo "== 1. La VM arranca sola con el PC"
systemctl enable --now libvirtd
virsh net-autostart default
virsh autostart "$VM"
virsh domstate "$VM" | grep -q running || virsh start "$VM"

echo "== Esperando a que srv-epa responda..."
for i in $(seq 1 45); do ping -c1 -W1 "$IP" >/dev/null 2>&1 && break; sleep 2; done
ping -c1 -W1 "$IP" >/dev/null 2>&1 && echo "   srv-epa responde" || echo "   srv-epa no responde todavía"

echo "== 2. Servicios de srv-epa habilitados al arranque (puede pedir la clave de epa)"
sudo -u $USUARIO ssh -t -i $LLAVE -o ConnectTimeout=5 epa@$IP \
  'sudo systemctl enable rpcbind ypserv yppasswdd ypxfrd nfs-server smbd nmbd chrony cups docker 2>/dev/null; systemctl is-enabled ypserv nfs-server smbd chrony cups docker'

echo "== 3. Carpetas NFS que se montan solas al abrirlas"
mkdir -p /mnt/empresa /mnt/publico
grep -q "$IP:/srv/nfs/empresa" /etc/fstab || \
  echo "$IP:/srv/nfs/empresa /mnt/empresa nfs defaults,_netdev,nofail,x-systemd.automount,x-systemd.mount-timeout=15 0 0" >> /etc/fstab
grep -q "$IP:/srv/nfs/publico" /etc/fstab || \
  echo "$IP:/srv/nfs/publico /mnt/publico nfs ro,_netdev,nofail,x-systemd.automount,x-systemd.mount-timeout=15 0 0" >> /etc/fstab
systemctl daemon-reload
systemctl restart remote-fs.target

echo "== 4. Cliente NIS: reintenta hasta que la VM esté arriba"
mkdir -p /etc/systemd/system/ypbind.service.d
cat > /etc/systemd/system/ypbind.service.d/sustentacion.conf <<'CONF'
[Unit]
After=network-online.target libvirtd.service
Wants=network-online.target

[Service]
Restart=on-failure
RestartSec=10
CONF
systemctl daemon-reload
systemctl enable rpcbind ypbind
systemctl restart ypbind

echo
echo "Listo. Desde ahora, al prender el PC todo arranca solo."
echo "Antes de sustentar solo corre:  bash estado.sh"
