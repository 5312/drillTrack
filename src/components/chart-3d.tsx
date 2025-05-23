"use client"

import { useEffect, useRef } from "react"
import { useDrillingData } from "../context/drilling-data-context"
import { Loader2, RotateCcw } from "lucide-react"
import * as echarts from "echarts"
import "echarts-gl"
import { calculateCADCoordinates } from "../lib/calculations"
import { Button } from "./ui/button"

export function Chart3D() {
  const { drillingData, isLoading } = useDrillingData()
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const rangesRef = useRef<{ xRange: number; yRange: number; zRange: number }>({ xRange: 0, yRange: 0, zRange: 0 })

  const resetView = () => {
    if (chartInstance.current) {
      const { xRange, yRange, zRange } = rangesRef.current
      chartInstance.current.setOption({
        grid3D: {
          viewControl: {
            alpha: 30,
            beta: 30,
            distance: Math.max(xRange, yRange, zRange) * 2,
          }
        }
      })
    }
  }

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

    // 计算坐标轴范围
    const xValues = points.map(p => p.value[0])
    const yValues = points.map(p => p.value[1])
    const zValues = points.map(p => p.value[2])
    
    const xMin = Math.min(...xValues)
    const xMax = Math.max(...xValues)
    const yMin = Math.min(...yValues)
    const yMax = Math.max(...yValues)
    const zMin = Math.min(...zValues)
    const zMax = Math.max(...zValues)

    // 添加边距
    const padding = 1
    const xRange = xMax - xMin
    const yRange = yMax - yMin
    const zRange = zMax - zMin

    // 保存范围值供重置使用
    rangesRef.current = { xRange, yRange, zRange }

    // 配置项
    const option = {
      backgroundColor: "#f5f5f5",
      tooltip: {
        formatter: (params: any) => params.data.name,
      },
      grid3D: {
        show: true,
        boxWidth: xRange + padding * 2,
        boxHeight: yRange + padding * 2,
        boxDepth: zRange + padding * 2,
        viewControl: {
          // 视角控制
          autoRotate: true,
          autoRotateSpeed: 10,
          distance: Math.max(xRange, yRange, zRange) * 2,
          alpha: 30,
          beta: 30,
          minAlpha: 5,
          maxAlpha: 90,
          minBeta: 5,
          maxBeta: 90,
          minDistance: Math.max(xRange, yRange, zRange),
          maxDistance: Math.max(xRange, yRange, zRange) * 4,
        },
      },
      xAxis3D: {
        type: "value",
        name: "X",
        min: xMin - padding,
        max: xMax + padding,
        axisLabel: {
          formatter: (value: number) => value.toFixed(2)
        }
      },
      yAxis3D: {
        type: "value",
        name: "Y",
        min: yMin - padding,
        max: yMax + padding,
        axisLabel: {
          formatter: (value: number) => value.toFixed(2)
        }
      },
      zAxis3D: {
        type: "value",
        name: "深度",
        min: zMin - padding,
        max: zMax + padding,
        axisLabel: {
          formatter: (value: number) => value.toFixed(2)
        }
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
        <p>提示: 鼠标拖动旋转视图，滚轮缩放</p>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-2 right-2 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800"
        onClick={resetView}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  )
}

