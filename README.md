# OnSleep

Open cmd and put this comand:
```bash
netsh advfirewall firewall add rule name="Permitir ping" protocol=icmpv4:8,any dir=in action=allow
```
