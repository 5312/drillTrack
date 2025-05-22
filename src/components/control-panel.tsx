"use client"

import { motion } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Grid, BarChart2, CuboidIcon as Cube } from "lucide-react"
import { useDrillingData } from "../context/drilling-data-context"

export function ControlPanel() {
  const {
    setIsLoading,
    openingAngle,
    setOpeningAngle,
    geoOrientation,
    setGeoOrientation,
    activeTab,
    setActiveTab,
  } = useDrillingData()

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 800)
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="mb-6 shadow-sm hover:shadow transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle>显示控制</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="bg-slate-100 dark:bg-slate-800">
                  <TabsTrigger
                    value="table"
                    className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all"
                  >
                    <Grid className="h-4 w-4" />
                    表格显示
                  </TabsTrigger>
                  <TabsTrigger
                    value="2d"
                    className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all"
                  >
                    <BarChart2 className="h-4 w-4" />
                    二维图显示
                  </TabsTrigger>
                  <TabsTrigger
                    value="3d"
                    className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all"
                  >
                    <Cube className="h-4 w-4" />
                    三维图显示
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="opening-angle" className="text-sm whitespace-nowrap">
                开孔角度
              </label>
              <Input
                id="opening-angle"
                value={openingAngle}
                onChange={(e) => setOpeningAngle(e.target.value)}
                className="w-24 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="geo-orientation" className="text-sm whitespace-nowrap">
                地理方位角
              </label>
              <Input
                id="geo-orientation"
                value={geoOrientation}
                onChange={(e) => setGeoOrientation(e.target.value)}
                className="w-24 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

