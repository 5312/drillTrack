"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// 定义钻孔数据类型
export interface DrillingPoint {
  id: number
  depth: string
  inclination: string
  geoOrientation: string
  toolFaceDirection: string
  leftRightDeviation: string
  upDownDeviation: string
  x?: number
  y?: number
  z?: number
}

// 定义上下文类型
interface DrillingDataContextType {
  drillingData: DrillingPoint[]
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  firstHoleAsReference: boolean
  setFirstHoleAsReference: (value: boolean) => void
  openingAngle: string
  setOpeningAngle: (value: string) => void
  geoOrientation: string
  setGeoOrientation: (value: string) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  loadDataFromFile: (filePath: string) => Promise<void>
  saveDataToFile: (filePath: string) => Promise<void>
}

// 创建上下文
const DrillingDataContext = createContext<DrillingDataContextType | undefined>(undefined)

// 创建上下文提供者组件
export function DrillingDataProvider({ children }: { children: ReactNode }) {
  const [drillingData, setDrillingData] = useState<DrillingPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [firstHoleAsReference, setFirstHoleAsReference] = useState(true)
  const [openingAngle, setOpeningAngle] = useState("1.0")
  const [geoOrientation, setGeoOrientation] = useState("0.0")
  const [activeTab, setActiveTab] = useState("table")

  // 从文件加载数据
  const loadDataFromFile = async (_filePath: string) => {
    try {
      setIsLoading(true)
      // 在实际应用中，这里会调用 Tauri 的 Rust 函数来读取文件
      // const data = await invoke("load_data_from_file", { filePath })

      // 模拟从文件加载数据
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 示例数据
      const data = [
        {
          id: 1,
          depth: "0.00",
          inclination: "0.00",
          geoOrientation: "0.00",
          toolFaceDirection: "0.00",
          leftRightDeviation: "0.00",
          upDownDeviation: "0.00",
          x: 0,
          y: 0,
          z: 0,
        },
        {
          id: 2,
          depth: "1.50",
          inclination: "0.25",
          geoOrientation: "0.15",
          toolFaceDirection: "0.10",
          leftRightDeviation: "0.05",
          upDownDeviation: "0.20",
          x: 0.05,
          y: 0.2,
          z: 1.5,
        },
        {
          id: 3,
          depth: "3.00",
          inclination: "0.50",
          geoOrientation: "0.30",
          toolFaceDirection: "0.20",
          leftRightDeviation: "0.10",
          upDownDeviation: "0.40",
          x: 0.1,
          y: 0.4,
          z: 3.0,
        },
        {
          id: 4,
          depth: "4.50",
          inclination: "0.75",
          geoOrientation: "0.45",
          toolFaceDirection: "0.30",
          leftRightDeviation: "0.15",
          upDownDeviation: "0.60",
          x: 0.15,
          y: 0.6,
          z: 4.5,
        },
        {
          id: 5,
          depth: "6.00",
          inclination: "1.00",
          geoOrientation: "0.60",
          toolFaceDirection: "0.40",
          leftRightDeviation: "0.20",
          upDownDeviation: "0.80",
          x: 0.2,
          y: 0.8,
          z: 6.0,
        },
      ]

      setDrillingData(data)
      setIsLoading(false)
    } catch (error) {
      console.error("加载数据失败:", error)
      setIsLoading(false)
    }
  }

  // 保存数据到文件
  const saveDataToFile = async (filePath: string) => {
    try {
      // 在实际应用中，这里会调用 Tauri 的 Rust 函数来保存文件
      // await invoke("save_data_to_file", { filePath, data: drillingData })

      // 模拟保存文件
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("数据已保存到:", filePath)
      return Promise.resolve()
    } catch (error) {
      console.error("保存数据失败:", error)
      return Promise.reject(error)
    }
  }

  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDataFromFile("default.xml")
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <DrillingDataContext.Provider
      value={{
        drillingData,
        isLoading,
        setIsLoading,
        firstHoleAsReference,
        setFirstHoleAsReference,
        openingAngle,
        setOpeningAngle,
        geoOrientation,
        setGeoOrientation,
        activeTab,
        setActiveTab,
        loadDataFromFile,
        saveDataToFile,
      }}
    >
      {children}
    </DrillingDataContext.Provider>
  )
}

// 创建使用上下文的钩子
export function useDrillingData() {
  const context = useContext(DrillingDataContext)
  if (context === undefined) {
    throw new Error("useDrillingData must be used within a DrillingDataProvider")
  }
  return context
}

