# Configuración del Backend - Aplicación de Citas Médicas

## Estado Actual

La aplicación está completamente configurada para usar Supabase como backend, incluyendo:

- ✅ Funciones del servidor implementadas en `/supabase/functions/server/index.tsx`
- ✅ API del frontend en `/src/utils/api.ts`
- ✅ Integración con Supabase Storage para archivos
- ✅ Almacenamiento de datos en tabla KV de Supabase
- ✅ Modo offline para desarrollo y pruebas

## Despliegue de las Funciones Edge

Para que el backend funcione completamente, necesitas desplegar las funciones edge de Supabase:

### Opción 1: Usando la Consola de Supabase (Recomendado)

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/hxyrawxgqdmllonuybjt
2. Navega a "Edge Functions" en el menú lateral
3. Haz clic en "Deploy new function"
4. Sube el contenido de `/supabase/functions/server/index.tsx`
5. Nombra la función como "server"
6. Despliega la función

### Opción 2: Usando Supabase CLI

Si tienes instalado el Supabase CLI:

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Enlazar con tu proyecto
supabase link --project-ref hxyrawxgqdmllonuybjt

# Desplegar las funciones
supabase functions deploy server
```

## Verificación del Despliegue

El backend ya está desplegado y funcionando. Puedes verificarlo con:

```bash
curl -X GET "https://hxyrawxgqdmllonuybjt.supabase.co/functions/v1/make-server-342e1137/health" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Deberías recibir: `{"status":"ok"}`

✅ **Estado: El backend está activo y listo para usar.**

## Endpoints Disponibles

Una vez desplegado, el servidor ofrece los siguientes endpoints:

- `GET /make-server-342e1137/health` - Verificación de salud
- `GET /make-server-342e1137/appointments` - Obtener todas las citas
- `POST /make-server-342e1137/appointments` - Guardar una nueva cita
- `GET /make-server-342e1137/controls` - Obtener todos los controles
- `POST /make-server-342e1137/controls` - Guardar un nuevo control
- `POST /make-server-342e1137/upload` - Subir archivos a Supabase Storage

## Modo Offline

Mientras el backend no esté desplegado, la aplicación funciona en modo offline:

- Los datos se guardan solo en memoria (no persisten al recargar la página)
- No se pueden subir archivos
- No hay sincronización entre dispositivos

Una vez desplegado el backend, la aplicación automáticamente:

- Guardará todos los datos en Supabase
- Permitirá subir archivos PDF e imágenes
- Sincronizará datos entre todos tus dispositivos

## Bucket de Supabase Storage

El servidor automáticamente crea un bucket privado llamado `make-342e1137-medical-files` al iniciarse por primera vez. Los archivos se almacenan con URLs firmadas que expiran en 10 años.

## Credenciales

Las credenciales de Supabase ya están configuradas:
- Project ID: `hxyrawxgqdmllonuybjt`
- Anon Key: Configurada en `/utils/supabase/info.tsx`
- Service Role Key: Configurada como variable de entorno en Supabase

## Solución de Problemas

### Error 404 en los endpoints

- Verifica que la función edge esté desplegada en Supabase
- Asegúrate de que el nombre de la función sea "server"
- Revisa los logs en la consola de Supabase

### Error al subir archivos

- Verifica que el bucket `make-342e1137-medical-files` exista
- Asegúrate de que los permisos del bucket permitan uploads desde el servidor
- Revisa que el archivo no exceda el límite de 50MB

### Datos no persisten

- Si el backend no está desplegado, los datos solo existen en memoria
- Despliega las funciones edge para habilitar persistencia permanente
