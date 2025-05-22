import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Skeleton } from "./ui/skeleton"
import { DataList } from "../lib/db"

interface DataTableProps {
  dataList: DataList[]
  isLoading: boolean
}

// 计算左右位移
function calculateLateralDisplacement(row: DataList): number {
  const rodLength = row.depth // 钻杆长度，单位：米
  
  const pitchRad = (row.pitch * Math.PI) / 180 // 将俯仰角转换为弧度
  const headingDiffRad = ((row.heading - row.design_heading) * Math.PI) / 180 // 将方位差转换为弧度
  // X左右偏移 =L ⋅ cos(I) ⋅ sin(A real − A design )
  return rodLength * Math.cos(pitchRad) * Math.sin(headingDiffRad)
}

// 计算上下位移
function calculateVerticalDisplacement(row: DataList): number {
  const rodLength =  row.depth // 钻杆长度，单位：米
  const pitchRad = (row.pitch * Math.PI) / 180 // 将俯仰角转换为弧度
  // 上下位移 = L ⋅ sin(I)
  return rodLength * Math.sin(pitchRad)
}

// 计算设计上下位移
function calculateDesignVerticalDisplacement(row: DataList): number {
  const rodLength = row.depth // 钻杆长度，单位：米
  const designPitchRad = (row.design_pitch * Math.PI) / 180 // 将设计俯仰角转换为弧度
  // 设计上下位移 = L ⋅ sin(I设计)
  return rodLength * Math.sin(designPitchRad)
}

export function DataTable({ dataList, isLoading }: DataTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">序号</TableHead>
          <TableHead className="w-16">深度</TableHead>
          <TableHead>俯仰角</TableHead>
          <TableHead>方位角</TableHead>
          <TableHead>左右位移</TableHead>
          <TableHead>上下位移</TableHead>
          <TableHead>左右位移(设计)</TableHead>
          <TableHead>上下位移(设计)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array(3)
              .fill(0)
              .map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-5" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
          : dataList.map((row, index) => (
              <TableRow key={row.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.depth}</TableCell>
                <TableCell>{row.pitch}</TableCell>
                <TableCell>{row.heading}</TableCell>
                <TableCell>{calculateLateralDisplacement(row)}</TableCell>
                <TableCell>{calculateVerticalDisplacement(row)}</TableCell>
                <TableCell>0</TableCell>
                <TableCell>{calculateDesignVerticalDisplacement(row)}</TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}

