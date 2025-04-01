import { useDrillingData } from "../context/drilling-data-context"
import { Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export function Chart2D() {
  const { drillingData, isLoading } = useDrillingData()

  // 转换数据为图表格式
  const chartData = drillingData.map((point) => ({
    depth: Number.parseFloat(point.depth),
    leftRightDeviation: Number.parseFloat(point.leftRightDeviation),
    upDownDeviation: Number.parseFloat(point.upDownDeviation),
    inclination: Number.parseFloat(point.inclination),
  }))

  if (isLoading) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
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
          <XAxis dataKey="depth" label={{ value: "深度 (m)", position: "insideBottomRight", offset: -5 }} />
          <YAxis label={{ value: "位移/倾角", angle: -90, position: "insideLeft" }} />
          <Tooltip formatter={(value) => [`${value}`, ""]} labelFormatter={(label) => `深度: ${label}m`} />
          <Legend />
          <Line
            type="monotone"
            dataKey="leftRightDeviation"
            name="左右位移"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
          <Line type="monotone" dataKey="upDownDeviation" name="上下位移" stroke="#82ca9d" strokeWidth={2} />
          <Line
            type="monotone"
            dataKey="inclination"
            name="倾角"
            stroke="#ff7300"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

