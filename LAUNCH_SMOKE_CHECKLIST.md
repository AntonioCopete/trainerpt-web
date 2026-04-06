# Checklist manual pre-lanzamiento (TrainerPT web)

Ejecutar en **staging** o **producción** con variables de entorno reales antes del go-live.

1. **Registro y onboarding**  
   - Abrir `/join`, crear cuenta o iniciar sesión.  
   - Completar onboarding si aplica.  
   - Comprobar redirección correcta según rol (entrenador / miembro).

2. **Flujo entrenador**  
   - Listar o invitar miembros.  
   - Crear o editar plantilla de rutina y asignar a un miembro (o flujo equivalente que uséis).  
   - Crear o enviar formulario y ver respuesta o asignación.

3. **Flujo miembro**  
   - Con cuenta de cliente, abrir rutinas asignadas y formularios pendientes.  
   - Completar un formulario si el producto lo permite en MVP.

4. **Facturación (si Stripe está activo en backend)**  
   - Desde `/trainer/billing`, iniciar checkout y (si aplica) portal de cliente de Stripe.  
   - Si el backend no tiene Stripe en ese entorno, marcar N/A y anotar fecha de prueba real.

**Rutas legales:** `/terms` y `/privacy` deben cargar sin 404.  
**SEO:** `/robots.txt` y `/sitemap.xml` deben responder con la URL base esperada (`NEXT_PUBLIC_SITE_URL` o dominio de despliegue).
