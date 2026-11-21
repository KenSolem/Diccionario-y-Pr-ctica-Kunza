# Diccionario y Práctica Kunza — Lickan Antai

Plataforma web educativa, interactiva y de libre acceso dedicada a la difusión y aprendizaje de la lengua **Kunza** (*Lickan Antai*). Construida con tecnologías web nativas (HTML, CSS y JavaScript) y optimizada para funcionar de manera fluida y sin servidores en **GitHub Pages**.

## Características principales

* **📖 Diccionario Inteligente (~1,800 términos):**
  * Base de datos bidireccional (Kunza–Español y Español–Kunza) con deduplicación automática en memoria.
  * Búsqueda instantánea insensible a mayúsculas, tildes y apóstrofes (por ejemplo, buscar `aguila` o `haiti` encuentra `Águila` y `H'aiti`).
  * Filtros rápidos por categorías temáticas: *Animales, Cuerpo, Verbos, Lugares, Colores, Cosmovisión* y *Otros*.
  * **Palabra del día** destacada al inicio de la aplicación.

* **🎯 Zona de Práctica:**
  * **Quiz Bidireccional (10 preguntas):** Alterna automáticamente entre *Kunza → Español* y *Español → Kunza*, incluye pistas temáticas (`🏷️ Pista: Categoría`), barra de progreso y registro de mejor racha.
  * **Flashcards 3D:** Tarjetas interactivas giratorias para repasar vocabulario a tu propio ritmo (*"Ya la sé"* / *"Repasar luego"*).
  * Posibilidad de practicar por temática específica o únicamente con tus palabras favoritas.

* **✍️ Traductor de Oraciones:**
  * Traducción aproximada palabra por palabra en ambas direcciones (**Español ⇄ Kunza**).
  * Motor de coincidencia exacta que destaca los términos encontrados en el diccionario (con detalle al pasar el cursor) y conserva intactos los nombres propios, conectores y signos de puntuación.
  * Incluye botón de ejemplo rápido y copiado al portapapeles.

* **🎮 Juegos Didácticos (Versión Demo):**
  * Organizados por nivel de complejidad y edad recomendada, con una estructura de datos preparada para incorporar ilustraciones personalizadas en el futuro (utilizando emojis y muestras de color como respaldo visual):
  * **Memorice de Cartas (*Nivel 1 · 4–7 años*):** Empareja términos en kunza con su significado visual en español, con selector de categorías (*Colores, Animales, Cuerpo, Cosmovisión* o *Mezclado*) y tamaño de tablero (*4* o *6 parejas*).
  * **Sopa de Letras (*Nivel 2 · 8–12 años*):** Tablero 10×10 generado dinámicamente con pistas en español, selección por arrastre o toque y botón de ayuda.
  * **Wordle Kunza (*Nivel 3 · 13+ años*):** Desafío de 6 intentos para adivinar palabras kunza de 5 letras, con etiqueta de categoría, pista opcional en español y soporte para teclado físico y en pantalla.

* **⭐ Favoritos y Persistencia Local:**
  * Guarda tus palabras favoritas, tu mejor racha y tu preferencia de tema directamente en el navegador mediante `localStorage`, sin necesidad de crear cuentas.

* **🎨 Diseño Atacameño y *Mobile-First*:**
  * Dos temas visuales inspirados en el norte de Chile: **Modo Desierto (Claro)** y **Noche Altiplánica (Oscuro)**.
  * Navegación adaptable con barra inferior fija en dispositivos móviles.

* **💬 Buzón Flotante de Feedback:**
  * Globo de chat anclado en la esquina inferior derecha para que cualquier usuario pueda enviar ideas, correcciones o sugerencias directamente a los *Issues* del repositorio.

## Estructura del proyecto

```text
Diccionario-y-Pr-ctica-Kunza/
├── index.html       # Estructura semántica y vistas de la aplicación (incluye pestaña Juegos)
├── style.css        # Sistema de diseño, variables de tema (claro/oscuro) y estilos responsivos
├── app.js           # Motor de búsqueda, indexación, quiz, flashcards, traductor y chat de feedback
├── games.js         # Módulo independiente con los juegos didácticos (Memorice, Sopa de Letras y Wordle)
├── vocabulary.js    # Base de datos léxica y categorización automática (~1,800 entradas)
├── .nojekyll        # Archivo vacío para servir el sitio estático directo en GitHub Pages
└── README.md        # Documentación del proyecto
```

## Rendimiento y arquitectura

Para mantener tiempos de carga mínimos en GitHub Pages sin depender de *frameworks* externos:

1. **Pre-indexación única:** Al cargar la página, `app.js` normaliza, deduplica e indexa el vocabulario en `Map`s de búsqueda rápida.
2. **Renderizado por lotes:** El diccionario dibuja bloques de 24 tarjetas a la vez usando `DocumentFragment`, evitando bloqueos del navegador.
3. **Debounce en el buscador:** Filtra los resultados tras una pausa de 150 ms al escribir para mantener la fluidez en celulares y computadores.
4. **Arquitectura modular de juegos:** La lógica de los juegos vive aislada en `games.js`, permitiendo ampliar el catálogo de actividades o integrar ilustraciones sin afectar el rendimiento del diccionario principal.

## Uso local

1. Clona el repositorio en tu equipo:
   ```bash
   git clone https://github.com/KenSolem/Diccionario-y-Pr-ctica-Kunza.git
   ```
2. Entra a la carpeta del proyecto y abre el archivo `index.html` directamente en tu navegador (o utiliza una extensión como *Live Server* en VS Code).

## Fuente y patrimonio

El repertorio léxico de esta plataforma está basado en la valiosa recopilación de la lengua *Lickan Antai* realizada por **Julio Vilte Vilte**. Este proyecto tiene fines estrictamente educativos, comunitarios y de difusión patrimonial, con total respeto por los pueblos originarios.

## Contribuciones y feedback

¿Encontraste una palabra por corregir, quieres aportar ilustraciones o tienes una propuesta para nuevos juegos? Puedes usar el **globo de chat flotante** dentro de la misma aplicación web o abrir directamente un *Issue* en este repositorio.