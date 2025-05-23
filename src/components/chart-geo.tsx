import { Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { calculateCADCoordinates } from "../lib/calculations"
import { useDrillingData } from "../context/drilling-data-context"

interface ChartGeoProps {
  isLoading: boolean
  magneticDeclination: string
}

export function ChartGeo({ isLoading, magneticDeclination }: ChartGeoProps) {
  const { drillingData } = useDrillingData()

  // 转换数据为图表格式
  const chartData = drillingData.map((point) => {
    const coords = calculateCADCoordinates(point, magneticDeclination)
    return {
      depth: point.depth,
      x: coords.x,
      y: coords.y,
    }
  })

  if (isLoading) {
    return (
      <div className="h-[63vh] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="h-[63vh] w-full flex flex-col gap-4">
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
          <XAxis dataKey="x" label={{ value: "X坐标 (m)", position: "insideBottomRight", offset: -5 }} />
          <YAxis label={{ value: "Y坐标 (m)", angle: -90, position: "insideLeft" }} />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(5)}m`, ""]} 
            labelFormatter={(label) => `深度: ${label}m`} 
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="y"
            name="Y坐标"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 