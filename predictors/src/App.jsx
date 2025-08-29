import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <header style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <img src="/logo.png" alt="Logo" className="logo" style={{ width: "80px" }} />
        <h1>Mi Página con Vite + React</h1>
      </header>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      <p className="read-the-docs">
        Ahora estás usando tu propio logo en lugar de los de Vite y React 🚀
      </p>
    </>
  )
}

export default App
