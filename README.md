# DBArchitect

DBArchitect is an AI-assisted database design tool. It helps you turn natural-language requirements into DBML, visualize the schema, review the generated structure, and scaffold Spring Boot code from the final design.

The project is split into three parts:

- `agents/` - a Python FastAPI service that uses LangGraph agents to gather requirements and generate DBML.
- `backend/` - a Spring Boot 4 service that stores projects and generates Spring Boot scaffolds, previews and download the scaffolded code.
- `frontend/` - a React app that provides the DBML editor, schema visualizer, chat workflow, and code download UI.

## Prerequisites

- Node.js and npm
- Python 3.11 or newer
- JDK 21
- Maven Wrapper support, which is already included in `backend/` (or Maven, of course)
- PostgreSQL running locally (or in Docker)
- A `GROQ_API_KEY` value for the Python agent layer (see agents/.env.example)

## Local Setup

### 1. Start PostgreSQL

The Spring Boot backend expects a PostgreSQL database named `dbarchitect` with the credentials in `backend/src/main/resources/application.properties`:

- host: `localhost:5432`
- database: `dbarchitect`
- username: `admin`
- password: `admin123`

If you want to use different values, update `backend/src/main/resources/application.properties` before starting the backend.

Here's how to run locally:
```bash
sudo -u postgres psql -c "CREATE ROLE admin WITH LOGIN PASSWORD ’admin123’;"
sudo -u postgres psql -c "CREATE DATABASE dbarchitect OWNER admin;"
```

Here's how to run in Docker:
```bash
docker run -d --name dbarchitect-postgres \
-e POSTGRES_USER=admin \
-e POSTGRES_PASSWORD=admin123 \
-e POSTGRES_DB=dbarchitect \
-p 5432:5432 postgres:14
```

### 2. Start the Python agent service

From the `agents/` directory:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `GROQ_API_KEY` in `agents/.env`, then run:

```bash
python api.py
```

This starts the FastAPI service on port `8000`.

### 3. Start the Spring Boot backend

From the `backend/` directory:

```bash
./mvnw spring-boot:run
```

This starts the Java API on port `8080`.

### 4. Start the React frontend

From the `frontend/` directory:

```bash
npm install
npm start
```

This opens the UI on port `3000`.

## How It Works

1. Enter a system description in the chat panel.
2. The Python agent asks clarifying questions if needed and generates DBML.
3. The DBML is rendered in the editor and visualized as a schema graph.
4. The Java backend can scaffold Spring Boot files, generate previews, and package the generated project for download.

## Useful Endpoints

- Python agent service: `http://localhost:8000`
- Spring Boot API: `http://localhost:8080`
- Frontend: `http://localhost:3000`

## Notes

- The frontend is configured to call the backend at `http://localhost:8080` and the agent service at `http://localhost:8000`.
- If you change any port, update the matching URLs in `frontend/src/hooks/useBackend.ts`.