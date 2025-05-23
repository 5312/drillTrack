"use client"

import { useEffect, useRef } from "react"
import { useDrillingData } from "../context/drilling-data-context"
import { Loader2 } from "lucide-react"
import * as echarts from "echarts"
import "echarts-gl"
import { calculateCADCoordinates } from "../lib/calculations"

export function Chart3D() {
  const { drillingData, isLoading } = useDrillingData()
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (isLoading || !chartRef.current) return

    // 初始化图表
    const chart = echarts.init(chartRef.current)
    chartInstance.current = chart

    // 准备数据
    const points = drillingData.map((point, index) => {
      const coords = calculateCADCoordinates(point, "0")
      return {
        value: [coords.x, coords.y, -point.depth],
        name: `点${index + 1}: 深度${point.depth}m`,
      }
    })

    // 配置项
    const option = {
      backgroundColor: "#f5f5f5",
      tooltip: {
        formatter: (params: any) => params.data.name,
      },
      grid3D: {
        show: true,
        boxWidth: 10,
        boxHeight: 10,
        boxDepth: 10,
        viewControl: {
          // 视角控制
          autoRotate: true,
          autoRotateSpeed: 10,
          distance: 20,
          alpha: 30,
          beta: 30,
          minAlpha: 5,
          maxAlpha: 90,
          minBeta: 5,
          maxBeta: 90,
          minDistance: 5,
          maxDistance: 50,
        },
      },
      xAxis3D: {
        type: "value",
        name: "X",
        min: -5,
        max: 5,
      },
      yAxis3D: {
        type: "value",
        name: "Y",
        min: -5,
        max: 5,
      },
      zAxis3D: {
        type: "value",
        name: "深度",
        min: -10,
        max: 0,
      },
      series: [
        {
          type: "scatter3D",
          data: points,
          symbolSize: 10,
          itemStyle: {
            color: (params: any) => (params.dataIndex === 0 ? "#ff0000" : "#00ff00"),
          },
        },
        {
          type: "line3D",
          data: points.map((point) => point.value),
          lineStyle: {
            width: 2,
            color: "#0088ff",
          },
        },
      ],
    }

    // 设置配置项
    chart.setOption(option)

    // 处理窗口大小变化
    const handleResize = () => {
      chart.resize()
    }

    window.addEventListener("resize", handleResize)

    // 清理函数
    return () => {
      window.removeEventListener("resize", handleResize)
      chart.dispose()
    }
  }, [drillingData, isLoading])

  if (isLoading) {
    return (
      <div className="h-[63vh] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="relative h-[63vh] w-full rounded-md overflow-hidden">
      <div ref={chartRef} className="w-full h-full" />
      <div className="absolute top-2 left-2 bg-white/80 dark:bg-slate-800/80 p-2 rounded text-xs z-10">
        <p>提示: 鼠标拖动旋转视图，滚轮缩放，右键平移</p>
      </div>
    </div>
  )
}

