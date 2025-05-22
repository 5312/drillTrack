"use client"

import { motion } from "framer-motion"
import { Tabs, TabsContent } from "./ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { DataTable } from "./data-table"
import { Chart2D } from "./chart-2d"
import { Chart3D } from "./chart-3d"
import { useDrillingData } from "../context/drilling-data-context"
import { useEffect, useState } from "react"
import { getAllRepos, getDataListByRepoId, Repo, DataList } from "../lib/db"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Loader2, RefreshCw, Compass } from "lucide-react"
import { Button } from "./ui/button"
import { MagneticDeclinationDialog } from "./magnetic-declination-dialog"

export function DataDisplay() {
  const { activeTab } = useDrillingData()
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepoId, setSelectedRepoId] = useState<string>("")
  const [dataList, setDataList] = useState<DataList[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showMagneticDialog, setShowMagneticDialog] = useState(false)
  const [selectedMagneticDeclination, setSelectedMagneticDeclination] = useState("-4.44") // 默认选中第一个值
  const [selectedMagneticId, setSelectedMagneticId] = useState("1") // 默认选中第一个序号

  // 获取所有 repo
  useEffect(() => {
    const fetchRepos = async () => {
      setIsLoadingRepos(true)
      try {
        const data = await getAllRepos()
        setRepos(data)
      } catch (err) {
        console.error('获取仓库数据失败:', err)
      } finally {
        setIsLoadingRepos(false)
      }
    }
    fetchRepos()
  }, [])

  // 当选择 repo 时获取对应的 dataList
  useEffect(() => {
    const fetchDataList = async () => {
      if (!selectedRepoId) return
      setIsLoading(true)
      try {
        const data = await getDataListByRepoId(parseInt(selectedRepoId))
        setDataList(data)
      } catch (err) {
        console.error('获取数据列表失败:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDataList()
  }, [selectedRepoId])

  const handleRefresh = async () => {
    if (!selectedRepoId) return
    setIsRefreshing(true)
    try {
      const data = await getDataListByRepoId(parseInt(selectedRepoId))
      setDataList(data)
    } catch (err) {
      console.error('重新获取数据失败:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="shadow-sm hover:shadow transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <CardTitle>数据显示</CardTitle>
            <div className="flex items-center gap-2">
              {isLoadingRepos ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Select value={selectedRepoId} onValueChange={setSelectedRepoId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="选择仓库" />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id?.toString() || ""}>
                        {repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => setShowMagneticDialog(true)}
                >
                  <Compass className="h-4 w-4" />
                  <span>地磁偏角</span>
                  <span className="text-sm text-muted-foreground">
                    当前值: {selectedMagneticDeclination}°
                  </span>
                </Button>
              </div>
              <Button
                variant="outline"
                className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={handleRefresh}
                disabled={!selectedRepoId || isRefreshing}
              >
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span>重新计算</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} defaultValue="table">
            <TabsContent value="table" className="mt-0">
              <DataTable 
                dataList={dataList} 
                isLoading={isLoading || isRefreshing} 
                magneticDeclination={selectedMagneticDeclination}
              />
            </TabsContent>

            <TabsContent value="2d" className="mt-0">
              <Chart2D />
            </TabsContent>

            <TabsContent value="3d" className="mt-0">
              <Chart3D />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <MagneticDeclinationDialog
        open={showMagneticDialog}
        onOpenChange={setShowMagneticDialog}
        selectedValue={selectedMagneticDeclination}
        onSelect={setSelectedMagneticDeclination}
        selectedId={selectedMagneticId}
        onSelectId={setSelectedMagneticId}
      />
    </motion.div>
  )
}


