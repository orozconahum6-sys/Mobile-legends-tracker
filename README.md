# MLBB Vault — Skin Tracker

Tracker web instalable (PWA) para planificar el ahorro de Mobile Legends: Bang Bang.

## Incluye
- Navegación lateral con los tres objetivos: Legend futura, Aspirantes y Jujutsu Kaisen.
- Billetera global compartida: diamantes, pases, días restantes y precio del pase.
- **Conteo en tiempo real del pase**: cada día real suma 20 diamantes y resta 1 día, incluso si la app estuvo cerrada (se recuperan los días pasados al volver).
- Al terminar el conteo, la app pregunta si activaste un pase nuevo y cuántos.
- Objetivo prioritario de ahorro: el fondo global se asigna a un solo objetivo para no contar los mismos diamantes dos veces.
- Guardado automático en el navegador (`localStorage`) y funcionamiento sin conexión tras la primera carga.

## Reglas del pase
- Pase semanal: 80 diamantes al activar + 20 por día durante 7 días (220 en total).
- **Con días restantes**: activar suma 80 y los 7 días nuevos a los que quedan. No se suman 20 extra, porque el reclamo de hoy ya se contó.
- **Con el conteo en cero**: activar suma 80 + 20 del día, y quedan 6 días pendientes (7 en total).
- El registro usa el momento en que confirmas el pase. Si compraste antes, ajusta los días a mano.

## Publicar en GitHub Pages
1. Crea un repositorio público, por ejemplo `mlbb-vault`.
2. Sube el **contenido** de la carpeta `mlbb-vault` (no la carpeta en sí) a la raíz del repositorio.
3. En **Settings → Pages**, elige **Deploy from a branch**, la rama `main` y `/ (root)`, y guarda.
4. Abre la URL HTTPS que te da GitHub Pages.

## Instalar desde el navegador
- **Chrome / Edge (PC):** icono de instalar en la barra de direcciones, o botón **⇩ Instalar** de la app.
- **Chrome (Android):** menú ⋮ → **Instalar aplicación**.
- **Safari (iPhone / iPad):** botón Compartir → **Añadir a pantalla de inicio**. Chrome en iOS no permite instalar PWAs.

## Uso
- Edita **Diamantes disponibles** cuando gastes diamantes; el saldo sube solo 20 cada día.
- Pulsa **+ Registrar pase** cuando actives uno; también aparece la pregunta automáticamente al terminar el conteo.
- Selecciona el objetivo prioritario en el panel global. Solo ese objetivo descuenta tu fondo.
- Ajusta las metas de diamantes, tiradas y costes cuando se anuncien las reglas del evento real.
- La app no se conecta a los servidores de MLBB ni realiza compras.

## Supuestos y límites
- Los días se cuentan por día calendario en tu zona horaria; el reclamo se considera hecho al cambiar el día.
- Los resultados de eventos y patrones son estimaciones editables, no garantías. Los patrones comunitarios no predicen de forma fiable un resultado aleatorio.
- El precio del pase inicia en US$2.06 y puede variar por región, impuestos o plataforma.
- Proyecto fan-made, no afiliado a Moonton.
