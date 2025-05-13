"use client"

import { useState, useEffect } from "react"
import { invoke } from '@tauri-apps/api/core'
import { DrillingDataProvider } from "./context/drilling-data-context"
import { AppHeader } from "./components/app-header"
import { AppSidebar } from "./components/app-sidebar"
import { ControlPanel } from "./components/control-panel"
import { DataDisplay } from "./components/data-display"
import Activation from "./pages/Activation"
import NetworkPage from "./pages/NetworkPage"
import "./App.css"

function App() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isActivated, setIsActivated] = useState<boolean | null>(null)
  const [currentPage, setCurrentPage] = useState('main') // 默认显示主页面

  // 检查应用是否已激活
  useEffect(() => {
    const checkActivation = async () => {
      try {
        const activated: boolean = await invoke('check_activation')
        setIsActivated(activated)
      } catch (error) {
        console.error('无法检查激活状态:', error)
        setIsActivated(false)
      }
    }

    checkActivation()
  }, [])

  const handleProcess = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
    }, 2000)
  }

  // 如果激活状态正在加载，显示加载指示器
  if (isActivated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">正在检查许可证...</p>
        </div>
      </div>
    )
  }

  // 如果未激活，显示激活页面
  if (!isActivated) {
    return <Activation />
  }

  // 页面导航
  const navigateTo = (page: string) => {
    setCurrentPage(page);
  };

  // 渲染当前页面内容
  const renderPageContent = () => {
    switch (currentPage) {
      case 'network':
        return <NetworkPage />;
      case 'main':
      default:
        return (
          <>
            <ControlPanel isProcessing={isProcessing} onProcess={handleProcess} />
            <DataDisplay />
          </>
        );
    }
  };

  // 如果已激活，显示主应用
  return (
    <DrillingDataProvider>
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
        <AppHeader />

        <div className="flex flex-1">
          <AppSidebar 
            isProcessing={isProcessing} 
            onProcess={handleProcess} 
            onNavigate={navigateTo}
            currentPage={currentPage}
          />

          <main className="flex-1 p-6">
            {renderPageContent()}
          </main>
        </div>
      </div>
    </DrillingDataProvider>
  )
}

export default App

