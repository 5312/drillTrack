import { createContext, useContext, useState,  type ReactNode } from "react"
import { DataList } from "@/lib/db"
 
import { Repo,   } from "../lib/db"
 

// 定义上下文类型
interface DrillingDataContextType {
  drillingData: DataList[],
  setDrillingData: (value: DataList[] | ((prev: DataList[]) => DataList[])) => void,
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
  repos: Repo[]
  setRepos: (value: Repo[] | ((prev: Repo[]) => Repo[])) => void
  selectedRepoId: string
  setSelectedRepoId: (value: string) => void
  isLoadingRepos: boolean
  setIsLoadingRepos: (value: boolean) => void
}

// 创建上下文
const DrillingDataContext = createContext<DrillingDataContextType | undefined>(undefined)

// 创建上下文提供者组件
export function DrillingDataProvider({ children }: { children: ReactNode }) {
  const [drillingData, setDrillingData] = useState<DataList[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [firstHoleAsReference, setFirstHoleAsReference] = useState(true)
  const [openingAngle, setOpeningAngle] = useState("1.0")
  const [geoOrientation, setGeoOrientation] = useState("0.0")
  const [activeTab, setActiveTab] = useState("table")
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepoId, setSelectedRepoId] = useState<string>("")
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)

  // 从文件加载数据
  const loadDataFromFile = async (_filePath: string) => {
    try {
      setIsLoading(true)
      // 在实际应用中，这里会调用 Tauri 的 Rust 函数来读取文件
      // const data = await invoke("load_data_from_file", { filePath })
      // 模拟从文件加载数据
      setDrillingData([]);
      await new Promise((resolve) => setTimeout(resolve, 1000))
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

  return (
    <DrillingDataContext.Provider
      value={{
        drillingData,
        setDrillingData,
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
        repos,
        setRepos,
        selectedRepoId,
        setSelectedRepoId,
        isLoadingRepos,
        setIsLoadingRepos,
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

