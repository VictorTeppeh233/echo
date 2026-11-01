# ECHO Setup & Operating Guide

## System Prerequisites
- **Python**: 3.10+ (tested on Python 3.13)
- **Node.js**: v18+ (tested on v22)
- **Ollama**: Local AI runner (https://ollama.com)

---

## 1. Operating System Installation Commands

### Ubuntu / Debian
```bash
# System packages
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm curl

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
```

### Fedora / RHEL
```bash
# System packages
sudo dnf install -y python3 python3-pip nodejs npm curl

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
```

---

## 2. Ollama Model Preparation

Start the Ollama daemon:
```bash
ollama serve
```

Pull the recommended conversational and embedding models:
```bash
# Pull chat model (e.g., Gemma 4 or Llama 3)
ollama pull gemma4:latest

# Pull embedding model (lightweight, high-speed 45MB embedding model)
ollama pull all-minilm:latest
```

---

## 3. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run the FastAPI server
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will be live on `http://localhost:8000`.

---

## 4. Frontend Setup

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Running Tests

```bash
# Backend pytest suite
cd backend
PYTHONPATH=. .venv/bin/pytest tests/
```
