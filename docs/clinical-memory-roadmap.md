# Clinical Memory Roadmap

## Objetivo

Pasar de un sistema que hoy genera:

- resumen por documento
- reporte ejecutivo con IA

a un sistema con **memoria clínica longitudinal**, capaz de:

- conservar patologías, diagnósticos y antecedentes relevantes sin repetirlos
- detectar medicamentos nuevos, cambios de dosis o suspensiones
- proponer controles futuros como sugerencias revisables
- alimentar un resumen clínico general más estable que el reporte de “últimos meses”
- mejorar el PDF ejecutivo usando contexto histórico consolidado

## Problema actual

Hoy la app ya hace varias cosas bien:

- resume documentos individuales con IA
- genera un PDF ejecutivo con IA
- conserva el resumen asociado al documento

Pero todavía hay límites importantes:

1. La información importante queda repartida entre muchos documentos.
2. Si hay muchas citas, hallazgos viejos relevantes pueden perder visibilidad.
3. El PDF ejecutivo depende bastante del rango reciente y no de una memoria acumulada.
4. La IA resume, pero todavía no propone acciones estructuradas como:
   - agregar medicamento
   - actualizar patología
   - sugerir control en X meses
5. Si un resumen ya fue generado y cambian prompts/modelo, hace falta una forma más clara de regenerarlo y re-evaluarlo.

## Principios de diseño

### 1. No confiar solo en texto libre

Cada documento debe seguir generando:

- un resumen legible para humanos
- y además una extracción estructurada

La memoria longitudinal no debe depender únicamente de un bloque de texto.

### 2. Diferenciar conocimiento estable de hallazgos recientes

No todo debe vivir en el mismo lugar.

Separar:

- hechos clínicos persistentes
- hallazgos recientes
- sugerencias de actualización
- acciones pendientes

### 3. Evitar automatismos clínicos ciegos

La IA puede proponer.
La app no debería modificar automáticamente datos sensibles sin un grado de revisión.

Regla recomendada:

- automático: solo estados técnicos o tareas claramente seguras
- sugerido con aprobación: medicamentos, patologías, controles, estudios

### 4. Mantener trazabilidad

Toda pieza de memoria clínica debe poder responder:

- de qué documento salió
- cuándo se detectó
- si fue confirmada o solo sugerida

## Resultado deseado

Al final, la app debería tener cuatro capas:

1. `Resumen por documento`
2. `Extracción estructurada por documento`
3. `Memoria clínica general`
4. `Sugerencias clínicas revisables`

## Modelo conceptual

### A. Resumen por documento

Mantener lo existente, pero mejorarlo con:

- botón `Regenerar resumen`
- historial mínimo de reintentos/versionado lógico
- posibilidad futura de cambiar prompt/modelo y volver a evaluar

### B. Extracción estructurada por documento

Cada documento procesado por IA debería devolver también:

- `detectedDiagnoses`
- `detectedConditions`
- `detectedMedications`
- `detectedMedicationChanges`
- `detectedAllergies`
- `detectedPendingStudies`
- `detectedFollowUps`
- `detectedFollowUpInterval`
- `confidenceNotes`

### C. Memoria clínica general

Una memoria consolidada del paciente, por ejemplo:

- `problemList`
- `activeMedications`
- `historicalMedications`
- `knownDiagnoses`
- `recentFindings`
- `pendingStudies`
- `followUpRecommendations`
- `lastUpdatedAt`

### D. Sugerencias clínicas

Una bandeja de propuestas generadas por IA:

- agregar medicamento
- actualizar dosis
- marcar medicamento como suspendido
- agregar patología
- actualizar estado de patología
- sugerir control en X meses
- sugerir estudio pendiente

Cada sugerencia debería tener:

- `type`
- `status`: `pending | accepted | dismissed | applied`
- `sourceDocumentId`
- `sourceAppointmentId`
- `confidence`
- `payload`

## Fases de implementación

### Fase 1: Fortalecer resúmenes por documento

Estado: `planned`

Objetivos:

- mejorar el ciclo de vida del resumen individual
- dejar base para regeneración y futura comparación

Tareas:

- [ ] exponer botón claro de `Regenerar resumen` para documentos ya procesados
- [ ] permitir re-ejecutar resumen incluso si el estado es `completed`
- [ ] guardar metadatos mínimos de regeneración:
  - proveedor usado
  - modelo usado
  - fecha de regeneración
- [ ] diferenciar en UI:
  - `Generar`
  - `Reintentar`
  - `Regenerar`

Resultado esperado:

- cualquier documento puede volver a procesarse si cambian prompts, modelos o calidad del OCR/resultado

### Fase 2: Extracción estructurada por documento

Estado: `planned`

Objetivos:

- dejar de depender solo del resumen narrativo
- empezar a capturar señales clínicas útiles

Tareas:

- [ ] ampliar el pipeline de IA para devolver JSON estructurado
- [ ] guardar esa extracción por documento
- [ ] normalizar categorías mínimas:
  - medicamentos
  - patologías
  - controles
  - estudios
- [ ] guardar referencias al documento origen

Resultado esperado:

- cada documento no solo tiene un resumen, sino también datos clínicos explotables

### Fase 3: Memoria clínica general

Estado: `planned`

Objetivos:

- construir una capa longitudinal estable
- evitar repetición innecesaria en PDFs o revisiones

Tareas:

- [ ] crear entidad o agregado de memoria clínica general
- [ ] definir secciones mínimas:
  - patologías activas
  - patologías históricas
  - medicamentos activos
  - hallazgos importantes
  - estudios pendientes
  - controles sugeridos
- [ ] construir lógica de actualización incremental
- [ ] evitar duplicación cuando el documento reafirma algo ya conocido

Resultado esperado:

- la app conserva lo importante aunque existan muchas citas y documentos

### Fase 4: Sugerencias revisables

Estado: `planned`

Objetivos:

- convertir la extracción en acciones concretas
- mantener control humano antes de aplicar cambios sensibles

Tareas:

- [ ] crear bandeja de sugerencias clínicas
- [ ] soportar sugerencias de:
  - medicamentos
  - patologías
  - controles
  - estudios pendientes
- [ ] permitir:
  - aceptar
  - descartar
  - posponer
- [ ] guardar trazabilidad de qué documento originó la sugerencia

Resultado esperado:

- la IA deja de ser solo “lectora” y se vuelve un asistente operativo revisable

### Fase 5: Controles sugeridos automáticos

Estado: `planned`

Objetivos:

- detectar instrucciones tipo `control en 3 meses`
- transformarlas en agenda revisable

Tareas:

- [ ] detectar intervalos de seguimiento en el pipeline estructurado
- [ ] calcular fecha sugerida
- [ ] crear `scheduled appointment suggestion` o control sugerido
- [ ] permitir confirmarlo antes de convertirlo en cita programada real

Regla:

- no crear una cita definitiva en silencio
- sí crear una sugerencia lista para confirmar

Resultado esperado:

- cuando la historia diga `control en 3 meses`, la app puede proponerte esa agenda automáticamente

### Fase 6: Integración con PDF ejecutivo

Estado: `planned`

Objetivos:

- hacer que el PDF use memoria longitudinal, no solo eventos recientes

Tareas:

- [ ] mantener la capa de resumen reciente por rango
- [ ] sumar la memoria general como contexto fijo
- [ ] mostrar:
  - problemas activos
  - tratamientos activos
  - estudios pendientes
  - evolución reciente
- [ ] evitar repetir patologías o medicamentos ya consolidados

Resultado esperado:

- un reporte más profesional, longitudinal y menos frágil al rango temporal

## Estrategia de automatización recomendada

### Lo que sí puede ser automático

- generar resumen por documento
- regenerar resumen a demanda
- extraer estructura del documento
- actualizar campos técnicos de estado
- crear sugerencias pendientes

### Lo que no debería aplicarse sin revisión

- agregar un medicamento al plan activo
- marcar un diagnóstico como definitivo
- modificar patologías conocidas
- agendar una cita real cerrada sin confirmación humana

## Riesgos a controlar

1. La IA puede repetir información ya conocida.
2. La IA puede interpretar mal una orden médica ambigua.
3. Un medicamento mencionado en contexto histórico puede confundirse con uno activo.
4. Un control sugerido puede ser interpretado como obligatorio cuando solo era recomendación.

Mitigación:

- guardar fuente
- usar estados `pending/accepted/dismissed`
- requerir revisión para cambios clínicos sensibles

## Diseño mínimo sugerido para base de datos

### Posibles entidades nuevas

- `ClinicalMemory`
- `DocumentInsight`
- `ClinicalSuggestion`

### Relación conceptual

- un `Document` genera un `DocumentInsight`
- varios `DocumentInsight` alimentan un `ClinicalMemory`
- de esos insights salen `ClinicalSuggestion`

## Orden recomendado de implementación real

1. `Regenerar resumen`
2. extracción estructurada por documento
3. entidad de memoria clínica general
4. bandeja de sugerencias
5. sugerencias automáticas de controles
6. integración fuerte con PDF ejecutivo

## Decisión de producto recomendada

No implementar esto como “un único texto general que la IA reescribe cada vez”.

Mejor enfoque:

- resumen libre por documento
- extracción estructurada por documento
- memoria clínica consolidada
- sugerencias revisables

Ese enfoque es más confiable, más trazable y más útil cuando el historial crece.

## Siguiente paso recomendado

La mejor primera entrega incremental es:

1. agregar `Regenerar resumen`
2. hacer que cada documento produzca también una salida estructurada mínima
3. empezar con solo dos dominios:
   - medicamentos
   - patologías

Eso da valor real sin intentar automatizar demasiado desde el día uno.
