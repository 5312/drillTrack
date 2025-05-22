"use client"

import { motion } from "framer-motion"
import { open, save } from "@tauri-apps/plugin-dialog"
import { Button } from "./ui/button"
import { FileText, FolderOpen, FileSpreadsheet, Save, Loader2, Wifi } from "lucide-react"
import { useDrillingData } from "../context/drilling-data-context"

interface AppSidebarProps {
  isProcessing: boolean
  onProcess: () => void
  onNavigate: (page: string) => void
  currentPage: string
}

export function AppSidebar({ isProcessing, onProcess, onNavigate, currentPage }: AppSidebarProps) {
  const { loadDataFromFile, saveDataToFile } = useDrillingData()

  const handleOpenFile = async () => {
    try {
      // 打开文件选择对话框
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "XML Files",
            extensions: ["xml"],
          },
        ],
      })

      if (selected && typeof selected === "string") {
        await loadDataFromFile(selected)
      }
    } catch (error) {
      console.error("打开文件失败:", error)
    }
  }

  const handleSaveFile = async () => {
    try {
      // 打开保存文件对话框
      const filePath = await save({
        filters: [
          {
            name: "Excel Files",
            extensions: ["xlsx"],
          },
        ],
      })

      if (filePath) {
        await saveDataToFile(filePath)
      }
    } catch (error) {
      console.error("保存文件失败:", error)
    }
  }

  const handleSaveGraph = async () => {
    try {
      // 打开保存文件对话框
      const filePath = await save({
        filters: [
          {
            name: "PNG Image",
            extensions: ["png"],
          },
        ],
      })

      if (filePath) {
        // 在实际应用中，这里会调用保存图形的函数
        console.log("图形将保存到:", filePath)
      }
    } catch (error) {
      console.error("保存图形失败:", error)
    }
  }

  return (
    <motion.aside
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="w-64 border-r bg-white dark:bg-slate-800 p-4 shadow-sm"
    >
      <div className="space-y-4">
        <div className="mb-6">
          <h2 className="font-medium text-sm text-slate-500 dark:text-slate-400 mb-2">主菜单</h2>
          <div className="space-y-2">
            <Button
              variant={currentPage === 'main' ? "default" : "outline"}
              className="w-full justify-start gap-2 hover:bg-slate-100 hover:text-blue-500 dark:hover:bg-slate-700 transition-all"
              onClick={() => onNavigate('main')}
            >
              <FileText className="h-4 w-4" />
              <span>主页面</span>
            </Button>
            <Button
              variant={currentPage === 'network' ? "default" : "outline"}
              className="w-full justify-start gap-2 hover:bg-slate-100 hover:text-blue-500 dark:hover:bg-slate-700 transition-all"
              onClick={() => onNavigate('network')}
            >
              <Wifi className="h-4 w-4" />
              <span>网络连接</span>
            </Button>
          </div>
        </div>

        <div className="mb-2">
          <h2 className="font-medium text-sm text-slate-500 dark:text-slate-400 mb-2">数据操作</h2>
        </div>
        <Button
          variant="outline"
          className="hidden w-full justify-start gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          onClick={onProcess}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          <span>预处理 XML</span>
        </Button>
        <Button
          variant="outline"
          className="hidden w-full justify-start gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          onClick={handleOpenFile}
        >
          <FolderOpen className="h-4 w-4" />
          <span>打开数据</span>
        </Button>
        <Button
          variant="outline"
          className="hidden w-full justify-start gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          onClick={handleSaveFile}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>导出 EXCEL</span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          onClick={handleSaveGraph}
        >
          <Save className="h-4 w-4" />
          <span>保存图形</span>
        </Button>
      </div>
    </motion.aside>
  )
}

