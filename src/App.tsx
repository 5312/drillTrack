"use client"

import { useState } from "react"
import { DrillingDataProvider } from "./context/drilling-data-context"
import { AppHeader } from "./components/app-header"
import { AppSidebar } from "./components/app-sidebar"
import { ControlPanel } from "./components/control-panel"
import { DataDisplay } from "./components/data-display"
import "./App.css"

function App() {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcess = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
    }, 2000)
  }

  return (
    <DrillingDataProvider>
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
        <AppHeader />

        <div className="flex flex-1">
          <AppSidebar isProcessing={isProcessing} onProcess={handleProcess} />

          <main className="flex-1 p-6">
            <ControlPanel isProcessing={isProcessing} onProcess={handleProcess} />
            <DataDisplay />
          </main>
        </div>
      </div>
    </DrillingDataProvider>
  )
}

export default App

