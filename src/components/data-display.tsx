"use client"

import { motion } from "framer-motion"
import { Tabs, TabsContent } from "./ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { DataTable } from "./data-table"
import { Chart2D } from "./chart-2d"
import { Chart3D } from "./chart-3d"
import { useDrillingData } from "../context/drilling-data-context"

export function DataDisplay() {
  const { activeTab } = useDrillingData()

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="shadow-sm hover:shadow transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle>数据显示</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} defaultValue="table">
            <TabsContent value="table" className="mt-0">
              <DataTable />
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
    </motion.div>
  )
}

