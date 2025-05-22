import { Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { DataList } from "../lib/db"

interface Chart2DProps {
  dataList: DataList[]
  isLoading: boolean
  magneticDeclination: string
}

// 计算左右位移
function calculateLateralDisplacement(row: DataList, magneticDeclination: string): number {
  const rodLength = row.depth // 钻杆长度，单位：米
  const pitchRad = (row.pitch * Math.PI) / 180 // 将俯仰角转换为弧度
  
  // 计算设计方位角（磁方位角 + 磁偏角）
  const designHeading = (row.design_heading || 0) + Number(magneticDeclination)
  
  // 计算方位差（实际方位角 - 设计方位角）
  const headingDiffRad = ((row.heading || 0) - designHeading) * Math.PI / 180
  
  // X左右偏移 = L ⋅ cos(I) ⋅ sin(A real − A design )
  return rodLength * Math.cos(pitchRad) * Math.sin(headingDiffRad)
}

// 计算上下位移
function calculateVerticalDisplacement(row: DataList): number {
  const rodLength = row.depth // 钻杆长度，单位：米
  const pitchRad = (row.pitch * Math.PI) / 180 // 将俯仰角转换为弧度
  // 上下位移 = L ⋅ sin(I)
  return rodLength * Math.sin(pitchRad)
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

