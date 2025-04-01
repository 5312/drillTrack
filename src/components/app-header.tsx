"use client"

import { motion } from "framer-motion"
import { appWindow } from "@tauri-apps/api/window"
import { Button } from "./ui/button"
import { Settings, Minus, Square, X } from "lucide-react"

export function AppHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur shadow-sm"
      data-tauri-drag-region
    >
      <div className="flex h-16 items-center justify-between px-6" data-tauri-drag-region>
        <h1 className="text-xl font-semibold" data-tauri-drag-region>
          钻孔机迹仪数据处理系统
        </h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>系统状态:</span>
            <span className="text-green-600 font-medium flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              正常
            </span>
          </div>

          <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.header>
  )
}

