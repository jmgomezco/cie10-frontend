# CIE-10-MC Frontend

Frontend simple, vanilla (HTML+CSS+JS), para consulta y selección de códigos CIE-10.

## Estructura

- `index.html`: Página principal única.
- `main.js`: Lógica JS (peticiones, renderizado dinámico, interacción).
- `style.css`: Todos los estilos.
- `README.md`: Este archivo.

## Despliegue

Listo para ser conectado a AWS Amplify Hosting y GitHub.  
No requiere frameworks ni dependencias locales.  
API esperada:
- POST `/analyze` → retorna `{ codigos: [...] }`
- POST `/select` → recibe `{ codigo }`
