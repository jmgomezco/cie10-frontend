# Proyecto API CIE10: Guía de Arquitectura, Construcción y Uso

Este documento describe, en lenguaje claro y directo, cómo construir, desplegar y operar una API de codificación médica CIE10, utilizando tecnologías modernas pero sencillas y robustas. Se explica el flujo completo, los recursos necesarios, y se analizan las peculiaridades encontradas en la integración de inteligencia artificial y servicios externos.

---

## Índice

1. Introducción
2. Secuencia lógica de construcción
3. Recursos necesarios en AWS
4. Recursos externos
5. ¿Qué es un SDK?
6. Integración con OpenAI (embeddings y GPT)
7. Integración con Pinecone (vectorial)
8. Seguridad: autenticación máquina a máquina
9. Flujo completo de la API
10. Recomendaciones para producción
11. Enlaces útiles
12. Glosario básico

---

## 1. Introducción

El objetivo del proyecto es facilitar la codificación médica CIE10 de textos clínicos en hospitales y centros sanitarios. Un profesional introduce un texto, el sistema le sugiere una lista de códigos CIE10, y selecciona el más adecuado. El sistema está pensado para ser sencillo, seguro y fácil de integrar en el día a día, sin requerir conocimientos técnicos avanzados.

---

## 2. Secuencia lógica de construcción

### Paso a paso, desde cero:

1. **Diseño del flujo de usuario**: El usuario introduce un texto, recibe sugerencias, selecciona una y termina el proceso.
2. **Creación del frontend sencillo**: Una página web básica con tres archivos (`index.html`, `main.js`, `style.css`).
3. **Despliegue del frontend**: Usando AWS Amplify Hosting, para publicarlo de forma sencilla.
4. **Diseño del backend/API**:
   - Crear una API REST que reciba el texto y devuelva sugerencias.
   - Crear un endpoint para registrar la selección final.
5. **Implementación de la lógica de búsqueda**:
   - Utilizar IA para analizar el texto y buscar los códigos más relevantes.
   - Usar Pinecone para comparar el texto con una base de datos vectorial de códigos CIE10.
   - Filtrar los resultados con GPT (modelo de OpenAI) usando reglas médicas.
6. **Integración de seguridad**: Proteger la API con autenticación máquina a máquina.
7. **Pruebas y ajustes**: Revisar el flujo, mensajes de error, y validar que todo funcione correctamente.
8. **Despliegue del backend**: Usar AWS Lambda y API Gateway para publicar la API.

---

## 3. Recursos necesarios en AWS

- **Amplify Hosting**:
  - Permite publicar el frontend fácilmente y mantenerlo actualizado.
- **API Gateway**:
  - Es el “puente” entre el frontend y el backend. Expone la API al exterior.
- **Lambda**:
  - Ejecuta el código del backend cada vez que llega una petición.
  - No requiere mantener servidores, solo el código que responde a cada solicitud.
- **Cognito (opcional pero recomendado)**:
  - Gestiona la autenticación. Permite saber quién está usando la API y proteger el acceso.
- **CloudWatch (opcional)**:
  - Para registrar y monitorizar el funcionamiento (logs, errores, rendimiento).

---

## 4. Recursos externos

- **OpenAI**:
  - Proporciona modelos de lenguaje (GPT) y de embeddings (vectorización del texto).
  - Requiere cuenta y clave de API.
- **Pinecone**:
  - Almacena y gestiona la base de datos vectorial de códigos CIE10.
  - Permite comparar textos y encontrar los códigos más parecidos.
  - Requiere cuenta y clave de API.

---

## 5. ¿Qué es un SDK?

**SDK** son las siglas en inglés de “Software Development Kit”.  
Es un conjunto de herramientas y librerías que facilitan el acceso a un servicio desde tu propio código, evitando tener que construir todas las llamadas y formatos manualmente.

- **Ejemplo**: El SDK de Pinecone para Python te permite conectar y consultar la base de datos vectorial directamente, sin preocuparte por detalles técnicos de conexión.
- **Limitaciones**: El SDK de OpenAI, aunque está pensado para facilitar la integración, presenta problemas al usarse con AWS Lambda (no siempre es compatible, por ejemplo, por limitaciones de red, dependencias o tamaño de librerías).

---

## 6. Integración con OpenAI (embeddings y GPT)

### ¿Para qué se usa OpenAI aquí?

- **Embeddings**: Transforma el texto clínico en un “vector”, que es una forma matemática que permite comparar el texto con otros textos (como los de la base CIE10).
- **GPT**: Filtra y selecciona, aplicando reglas médicas y de contexto, los códigos más adecuados entre los candidatos encontrados.

### ¿Cómo se integra en Lambda?

- **Problema**: El SDK de OpenAI suele ser incompatible con AWS Lambda, debido a restricciones de espacio y dependencias.
- **Solución**: Usar la librería estándar `requests` de Python para conectarse a la API de OpenAI. Es más ligera y compatible.

#### Ejemplo básico de integración (con `requests`):

```python
import requests

headers = {
    "Authorization": "Bearer TU_API_KEY_OPENAI",
    "Content-Type": "application/json"
}

data = {
    "model": "text-embedding-ada-002",
    "input": "texto clínico a codificar"
}

response = requests.post(
    "https://api.openai.com/v1/embeddings",
    headers=headers,
    json=data
)

embedding = response.json()["data"][0]["embedding"]
```

---

## 7. Integración con Pinecone (vectorial)

El **SDK de Pinecone** sí funciona correctamente en Lambda y otros entornos Python.

- Permite conectar y consultar la base de datos vectorial de códigos CIE10.
- Usando el embedding generado por OpenAI, se consulta Pinecone para obtener los 50 códigos más parecidos al texto introducido.

#### Ejemplo básico con el SDK de Pinecone:

```python
import pinecone

pinecone.init(api_key="TU_API_KEY_PINECONE", environment="us-west1-gcp")
index = pinecone.Index("cie10-index")

# embedding obtenido previamente
query_embedding = [...]

result = index.query(vector=query_embedding, top_k=50)
# result contiene los códigos más relevantes
```

---

## 8. Seguridad: autenticación máquina a máquina

En entornos médicos y profesionales, la seguridad es fundamental.

- **Autenticación máquina a máquina** significa que solo sistemas autorizados pueden acceder a la API, no usuarios individuales.
- Se suele usar Cognito, que permite emitir “tokens” cuando una aplicación se identifica correctamente.
- El frontend se configura para enviar este token en cada petición; el backend lo comprueba antes de responder.

**Ventaja**:  
Esto protege el sistema de accesos no autorizados y cumple con normativas de seguridad.

---

## 9. Flujo completo de la API

### 1. El usuario ve el frontend web y escribe un texto clínico.
### 2. El frontend envía el texto al backend (API Gateway -> Lambda).
### 3. Lambda recibe el texto y:
   - **Genera el embedding** usando OpenAI (con `requests`).
   - **Consulta Pinecone** con el embedding y obtiene 50 candidatos.
   - **Filtra los candidatos** usando GPT de OpenAI, aplicando reglas médicas predefinidas.
   - Devuelve la lista final al frontend.
### 4. El usuario elige el código más adecuado.
### 5. El frontend envía la selección al backend para registro o estadística.

---

## 10. Recomendaciones para producción

- **Documentación clara**: Explica el flujo, los endpoints y ejemplos de uso.
- **Pruebas sencillas**: Valida que los mensajes de error sean comprensibles.
- **Monitorización**: Configura alertas para detectar problemas.
- **Versionado**: Si la API evoluciona, mantén versiones para no romper integraciones.
- **Cumplimiento**: Si se maneja información sensible, consulta a expertos en protección de datos.

---

## 11. Enlaces útiles

### Amplify (AWS)
- [Amplify CLI: APIs y autenticación](https://docs.amplify.aws/cli/)
- [Amplify REST API](https://docs.amplify.aws/cli/restapi/rest-api/)
- [Amplify Auth (Cognito)](https://docs.amplify.aws/cli/auth/overview/)

### OpenAI
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [OpenAI GPT Models](https://platform.openai.com/docs/models/gpt-4)

### Pinecone
- [Pinecone Docs](https://docs.pinecone.io/)
- [Pinecone Python SDK Quickstart](https://docs.pinecone.io/docs/quickstart/)
- [Pinecone y OpenAI](https://docs.pinecone.io/guides/integrations/openai/)

### AWS Cognito
- [Cognito Docs](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)

---

## 12. Glosario básico

- **API**: Punto de acceso para enviar y recibir datos entre programas.
- **Frontend**: Parte visual del sistema, lo que ve el usuario.
- **Backend**: Lógica interna que procesa la información.
- **Lambda**: Servicio que ejecuta código en la nube sin mantener servidores.
- **API Gateway**: Puerta de entrada a la API desde el exterior.
- **Amplify**: Herramienta para simplificar el despliegue web y backend en AWS.
- **Cognito**: Servicio para gestionar usuarios y autenticación en AWS.
- **OpenAI**: Plataforma de inteligencia artificial que ofrece modelos avanzados de lenguaje.
- **Pinecone**: Servicio para gestionar bases de datos vectoriales (comparación matemática de textos).
- **SDK**: Conjunto de herramientas para facilitar la conexión con servicios externos.
- **Embedding**: Representación matemática de un texto para facilitar su comparación.
- **GPT**: Modelo de lenguaje avanzado capaz de entender y generar texto.
- **Token**: Código que identifica y autoriza a una aplicación ante la API.
- **Machine-to-machine**: Comunicación segura entre dos sistemas, no entre personas.

---

**Este documento está pensado para servir de guía a profesionales sanitarios y técnicos no especializados, permitiendo construir e integrar una solución moderna de codificación médica de manera sencilla y robusta.**
