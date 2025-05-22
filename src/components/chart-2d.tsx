import { DataList } from "../lib/db"
import { Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { calculateLateralDisplacement, calculateVerticalDisplacement } from "../lib/calculations"

interface Chart2DProps {
  dataList: DataList[]
  isLoading: boolean
  magneticDeclination: string
}

export function Chart2D({ dataList, isLoading, magneticDeclination }: Chart2DProps) {
  // 转换数据为图表格式
  const chartData = dataList.map((point) => ({
    depth: point.depth,
    leftRightDeviation: calculateLateralDisplacement(point, magneticDeclination),
    upDownDeviation: calculateVerticalDisplacement(point),
  }))

  if (isLoading) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="h-[800px] w-full flex flex-col gap-4">
      {/* 左右偏差图表 */}
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="depth" label={{ value: "钻杆长度 (m)", position: "insideBottomRight", offset: -5 }} />
            <YAxis label={{ value: "左右位移 (m)", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value: number) => [`${value.toFixed(5)}m`, ""]} labelFormatter={(label) => `深度: ${label}m`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="leftRightDeviation"
              name="左右位移"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 上下偏差图表 */}
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="depth" label={{ value: "钻杆长度 (m)", position: "insideBottomRight", offset: -5 }} />
            <YAxis label={{ value: "上下位移 (m)", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value: number) => [`${value.toFixed(5)}m`, ""]} labelFormatter={(label) => `深度: ${label}m`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="upDownDeviation"
              name="上下位移"
              stroke="#82ca9d"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

