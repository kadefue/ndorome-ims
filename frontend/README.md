# Ndorome Spare Parts — Frontend (React + Vite)

## Setup

```bash
npm create vite@latest . -- --template react
npm install
npm install recharts
```

Then replace `src/App.jsx` with the provided `App.jsx` from the project root.

```bash
npm run dev
```

Frontend runs at: **http://localhost:5173**

## Environment

The frontend connects to the backend API at `http://localhost:8000` by default.  
To change this, edit the `API` constant at the top of `src/App.jsx`.