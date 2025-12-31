# bun-ai-api

API REST creada con Bun.

## Instalación

```bash
bun install
```

## Ejecutar

```bash
bun run index.ts
```

El servidor se ejecutará en `http://localhost:3000` (o el puerto especificado en la variable de entorno `PORT`).

## Endpoints

### GET `/`
Información general de la API.

### GET `/health`
Health check endpoint.

### GET `/api`
Endpoint base de la API.

### GET `/api/items`
Obtener lista de items.

### POST `/api/items`
Crear un nuevo item.

**Body:**
```json
{
  "name": "Nuevo item"
}
```

### GET `/api/items/:id`
Obtener un item por ID.

## Ejemplos de uso

```bash
# Health check
curl http://localhost:3000/health

# Obtener items
curl http://localhost:3000/api/items

# Crear item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Mi item"}'
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
