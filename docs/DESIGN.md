# Documento de Diseño de Interfaz: SportMates MVP Portal Web

## 1. Descripción General
**SportMates MVP** es un portal web donde organizadores publican partidos de fútbol 7 y jugadores se postulan para participar. El diseño se centra en la simplicidad, la legibilidad de la información de partidos y una experiencia de usuario fluida para publicar, descubrir y gestionar encuentros deportivos.

## 2. Identidad Visual (Branding)
* **Paleta de Colores:**
    * **Verde Principal (#28A745 / #00D166):** Utilizado para botones de acción primaria, estados de éxito y elementos de marca. Transmite energía y deporte (césped).
    * **Azul Institucional (#0056b3):** Utilizado para enlaces, botones secundarios e íconos informativos.
    * **Gris Neutro (#F8F9FA / #E9ECEF):** Fondo de la aplicación para mejorar la legibilidad y separar secciones.
    * **Rojo/Coral (#DC3545):** Para alertas, cancelaciones o acciones críticas.
* **Tipografía:**
    * Sin-serif (Sans Serif) de estilo moderno (posiblemente Inter o Roboto), priorizando la legibilidad en listados de partidos y formularios.

## 3. Arquitectura de Pantallas

### A. Autenticación (Login & Register)
* **Diseño:** Layout de dos columnas. La izquierda contiene una ilustración minimalista y la derecha el formulario sobre un fondo verde sólido.
* **Elementos:**
    * Campos de entrada con bordes redondeados.
    * Opciones de inicio de sesión social (Google, Facebook).
    * Botones de acción con alto contraste (texto blanco sobre azul/verde).

### B. Landing / Listado de Partidos (`/`)
* **Diseño:** Página pública con listado vertical de tarjetas de partidos disponibles.
* **Elementos:**
    * Tarjetas de partido con información clave: fecha, hora, zona, cupos disponibles.
    * Filtros por fecha o zona (dropdowns o chips).
    * Botón de acción primario para crear partido (visible para organizadores logueados).
    * Estados visuales: abierto (verde), completo (gris), cerrado (naranja).

### C. Detalle de Partido (`/matches/:id`)
* **Diseño:** Vista centrada con información completa del partido.
* **Elementos:**
    * Encabezado con fecha, hora, zona y descripción.
    * Lista de jugadores confirmados (avatars circulares).
    * Información de cupos: ocupados / totales.
    * Botón de postulación para jugadores (estado dinámico: "Postularme", "Pendiente", "Aceptado").
    * Enlace de WhatsApp del organizador (visible una vez aceptado).

### D. Crear Partido (`/matches/create`)
* **Diseño:** Formulario multi-campo centrado en una sola columna.
* **Elementos:**
    * Selector de fecha y hora.
    * Campo de zona (texto libre).
    * Campo de descripción (textarea).
    * Selector de cantidad de cupos totales.
    * Campo para enlace de grupo de WhatsApp.
    * Botón de publicación con confirmación.

### E. Gestión de Partido (`/matches/:id/manage`)
* **Diseño:** Panel de organizador dividido en secciones claras.
* **Elementos:**
    * Resumen del partido en la parte superior.
    * Lista de postulaciones con avatar, nombre y posición del jugador.
    * Acciones por postulación: Aceptar (verde), Rechazar (rojo), Expulsar (outline rojo).
    * Sección de asistencia: checkboxes para marcar quién asistió.
    * Sección de calificaciones: inputs para puntuar a jugadores asistentes.

### F. Mis Partidos (`/my-matches`)
* **Diseño:** Listado personal dividido en pestañas o secciones.
* **Elementos:**
    * Pestaña "Postulados": partidos a los que el jugador se postuló (estado pendiente).
    * Pestaña "Confirmados": partidos donde fue aceptado.
    * Tarjetas similares al listado público pero con indicador de estado personal.
    * Acceso rápido al detalle de cada partido.

### G. Perfil de Usuario (`/profile`)
* **Diseño:** Formulario de edición de perfil limpio y centrado.
* **Elementos:**
    * Avatar del usuario con opción de cambiar foto.
    * Campos de texto: nombre completo.
    * Selector de posición de juego (arquero, defensa, mediocampista, delantero).
    * Botón de guardar cambios con feedback visual.

## 4. Componentes UI Reutilizables
1.  **Navbar Superior:** Logo a la izquierda, links de navegación (Partidos, Mis Partidos, Crear), avatar de usuario y logout a la derecha.
2.  **Tarjeta de Partido:** Componente principal de la app. Muestra fecha/hora, zona, descripción breve, cupos disponibles y estado visual. Bordes redondeados (border-radius: 8px) con sombra sutil.
3.  **Badge de Estado:** Etiquetas de color para estados de partidos y postulaciones. Verde (confirmado/aceptado), Naranja (pendiente/abierto), Rojo (rechazado/cancelado), Gris (completo/cerrado).
4.  **Avatar de Jugador:** Imagen circular con fallback a iniciales del nombre. Usado en listados de jugadores y postulaciones.
5.  **Botones de Acción:** Bordes redondeados (border-radius: 8px) con efectos hover suaves. Variantes: primario (verde), secundario (azul), peligro (rojo), ghost (outline).
6.  **Lista de Postulaciones:** Tabla o lista vertical con avatar, nombre, posición y acciones (aceptar/rechazar). Filas con hover y espaciado amplio.
7.  **Filtros y Búsqueda:** Inputs y dropdowns para filtrar partidos por fecha, zona o estado. Estilo minimalista con bordes redondeados.

## 5. Experiencia de Usuario (UX)
* **Consistencia:** La barra de navegación superior se mantiene fija para facilitar la navegación global en todas las pantallas autenticadas.
* **Feedback Visual:** Uso de colores semánticos para estados (verde=éxito/aceptado, naranja=pendiente/abierto, rojo=rechazado/cancelado).
* **Visualización de Datos:** Uso de avatares para representar jugadores de manera visual en lugar de solo texto. Indicadores de cupos con barras de progreso o contadores visuales.
* **Accesibilidad:** Contraste suficiente entre texto y fondo. Estados no dependen únicamente del color (iconos + texto).
* **Flujo Mobile-First:** Todas las pantallas diseñadas primero para móvil, escalando a desktop. Tarjetas apiladas verticalmente, formularios de ancho completo, botones táctiles de tamaño mínimo 44px.
