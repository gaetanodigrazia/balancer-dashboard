# --------- STAGE 1: Build Angular ---------
FROM node:18 AS frontend-builder

WORKDIR /app
COPY . .

RUN npm install && npm run build --configuration=production

# --------- STAGE 2: Backend + Static Frontend ---------
FROM python:3.10-slim

WORKDIR /app

# Copia backend
COPY backend/ ./backend/
COPY backend/requirements.txt ./requirements.txt

# Copia Angular buildato
COPY --from=frontend-builder /app/dist /app/dist

# Installa i requirements Python
RUN pip install --no-cache-dir -r requirements.txt

# Serve FastAPI con Angular static
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
