#!/usr/bin/env bash
# Revisa que todo esté arriba y abre lo que se muestra en la sustentación.
# Uso:  bash estado.sh          (revisa y abre navegador y carpetas)
#       bash estado.sh --solo   (solo revisa)
VM=srv-epa
IP=192.168.122.10
LLAVE=$HOME/.ssh/id_ed25519_epa
V="\e[32m✔\e[0m"; R="\e[31m✘\e[0m"
fallas=0
ok()  { echo -e " $V $1"; }
mal() { echo -e " $R $1  →  $2"; fallas=$((fallas+1)); }

echo -e "\n\e[1m  EPA Armenia · estado de srv-epa\e[0m\n"

# VM
if ! ping -c1 -W1 $IP >/dev/null 2>&1 && ! virsh -c qemu:///system domstate $VM 2>/dev/null | grep -q running; then
  echo "   Encendiendo la VM..."; virsh -c qemu:///system start $VM >/dev/null 2>&1
fi
for i in $(seq 1 40); do ping -c1 -W1 $IP >/dev/null 2>&1 && break; sleep 2; done
ping -c1 -W1 $IP >/dev/null 2>&1 && ok "VM srv-epa encendida ($IP)" || mal "VM srv-epa" "no responde al ping"

# Servicios dentro de la VM
est=$(ssh -i "$LLAVE" -o BatchMode=yes -o ConnectTimeout=5 epa@$IP \
  'for s in docker nfs-server smbd ypserv chrony cups; do echo "$s $(systemctl is-active $s)"; done' 2>/dev/null)
if [ -z "$est" ]; then mal "SSH a srv-epa" "revisa la llave $LLAVE"; else
  ok "SSH con llave"
  while read -r s e; do [ "$e" = active ] && ok "Servicio $s activo" || mal "Servicio $s" "$e"; done <<< "$est"
fi

# Web y base de datos
c=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 8 https://www.epa.lan/api/salud)
[ "$c" = 200 ] && ok "Web https://www.epa.lan y base de datos (salud 200)" || mal "Web www.epa.lan" "código $c (Dokploy puede tardar 1-2 min al arrancar)"
c=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://www.epa.lan)
[[ "$c" =~ ^30[178]$ ]] && ok "HTTP redirige a HTTPS ($c)" || mal "Redirección HTTP→HTTPS" "código $c"
c=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://$IP:3000)
[[ "$c" =~ ^(200|30[0-9])$ ]] && ok "Panel de Dokploy (:3000)" || mal "Panel de Dokploy" "código $c"

# NFS (se monta solo al entrar)
timeout 15 ls /mnt/empresa >/dev/null 2>&1 && ok "NFS montado en /mnt/empresa" || mal "NFS /mnt/empresa" "sudo mount -a"

# Samba
timeout 3 bash -c "</dev/tcp/$IP/445" 2>/dev/null && ok "Samba escuchando (445)" || mal "Samba" "puerto 445 cerrado"

# NIS
d=$(timeout 5 ypwhich 2>/dev/null)
[ -n "$d" ] && ok "Cliente NIS unido a epanis ($d)" || mal "Cliente NIS" "sudo systemctl restart ypbind"

# CUPS
c=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://$IP:631/printers/)
[ "$c" = 200 ] && ok "CUPS e impresora compartida (:631)" || mal "CUPS" "código $c"

echo
if [ $fallas -eq 0 ]; then echo -e " \e[1;32mTodo listo para sustentar.\e[0m"; else echo -e " \e[1;31m$fallas punto(s) por revisar.\e[0m"; fi

if [ "${1:-}" != "--solo" ]; then
  xdg-open https://www.epa.lan >/dev/null 2>&1 &
  xdg-open http://$IP:3000 >/dev/null 2>&1 &
  xdg-open http://$IP:631/printers/ >/dev/null 2>&1 &
  xdg-open /mnt/empresa >/dev/null 2>&1 &
  xdg-open smb://$IP/empresa >/dev/null 2>&1 &
  echo " Abrí: sitio web, panel de Dokploy, CUPS, carpeta NFS y carpeta Samba."
fi
echo
