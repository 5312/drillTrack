"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "./ui/button"
import { Settings,  LogOut } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import { exit } from "@tauri-apps/plugin-process"

export function AppHeader() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await exit(0)
    } catch (error) {
      console.error("退出程序失败:", error)
    }
  }

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
          钻孔轨迹仪数据处理系统
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

          <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Settings className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>系统设置</SheetTitle>
                <SheetDescription>
                  在这里管理您的系统设置和账户
                </SheetDescription>
              </SheetHeader>
              <div className="p-4 space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>退出程序</span>
                </Button>
              </div>
     
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}

