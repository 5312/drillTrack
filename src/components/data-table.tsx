import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Skeleton } from "./ui/skeleton"
import { DataList } from "../lib/db"

interface DataTableProps {
  dataList: DataList[]
  isLoading: boolean
  magneticDeclination: string // 添加磁偏角属性
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

// 计算CAD平面坐标
function calculateCADCoordinates(row: DataList, _magneticDeclination: string): { x: number, y: number } {
  const rodLength = row.depth // 钻杆长度，单位：米
  const pitchRad = (row.pitch * Math.PI) / 180 // 将俯仰角转换为弧度
  
  // 计算设计方位角（磁方位角 + 磁偏角）
  // const designHeading = (row.design_heading || 0) + Number(magneticDeclination)
  
  // 计算方位差（90 - 实际方位角）
  const headingDiffRad = (90 - (row.heading || 0)) * Math.PI / 180
  
  // X坐标 = L ⋅ cos(I) ⋅ cos(A)
  const x = rodLength * Math.cos(pitchRad) * Math.cos(headingDiffRad)
  
  // Y坐标 = L ⋅ cos(I) ⋅ sin(A)
  const y = rodLength * Math.cos(pitchRad) * Math.sin(headingDiffRad)
  
  return { x, y }
}

// 计算CAD剖面坐标
function calculateCADProfileCoordinates(row: DataList): { x: number, y: number } {
  const rodLength = row.depth // 钻杆长度，单位：米
  const pitchRad = (row.pitch * Math.PI) / 180 // 将俯仰角转换为弧度
  
  // X坐标 = L ⋅ cos(I)
  const x = rodLength * Math.cos(pitchRad)
  
  // Y坐标 = L ⋅ sin(I)
  const y = rodLength * Math.sin(pitchRad)
  
  return { x, y }
}

export function DataTable({ dataList, isLoading, magneticDeclination }: DataTableProps) {
  return (
    <div className="relative">
      <div className="max-h-[500px] overflow-auto">
        <Table>
          <TableHeader className="bg-white dark:bg-slate-950 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-16 text-left">序号</TableHead>
              <TableHead className="w-16 text-left">深度</TableHead>
              <TableHead className="w-24 text-left">俯仰角</TableHead>
              <TableHead className="w-24 text-left">方位角</TableHead>
              <TableHead className="w-24 text-left">左右位移</TableHead>
              <TableHead className="w-24 text-left">上下位移</TableHead>
              <TableHead className="w-24 text-left">左右位移(设计)</TableHead>
              <TableHead className="w-24 text-left">上下位移(设计)</TableHead>
              <TableHead className="w-24 text-left">CAD平面坐标</TableHead>
              <TableHead className="w-24 text-left">CAD剖面坐标</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="w-16 text-left">
                        <Skeleton className="h-5 w-5" />
                      </TableCell>
                      <TableCell className="w-16 text-left">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell className="w-24 text-left">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell className="w-24 text-left">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell className="w-24 text-left">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell className="w-24 text-left">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell className="w-24 text-left">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell className="w-24 text-left">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell className="w-24 text-left">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell className="w-24 text-left">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
              : dataList.map((row, index) => {
                  const cadCoords = calculateCADCoordinates(row, magneticDeclination)
                  const profileCoords = calculateCADProfileCoordinates(row)
                  return (
                    <TableRow key={row.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <TableCell className="w-16 text-left">{index + 1}</TableCell>
                      <TableCell className="w-16 text-left">{row.depth}</TableCell>
                      <TableCell className="w-24 text-left">{row.pitch}</TableCell>
                      <TableCell className="w-24 text-left">{row.heading}</TableCell>
                      <TableCell className="w-24 text-left">{calculateLateralDisplacement(row, magneticDeclination)}</TableCell>
                      <TableCell className="w-24 text-left">{calculateVerticalDisplacement(row)}</TableCell>
                      <TableCell className="w-24 text-left">0</TableCell>
                      <TableCell className="w-24 text-left">{calculateDesignVerticalDisplacement(row)}</TableCell>
                      <TableCell className="w-24 text-left">{cadCoords.x },{cadCoords.y }</TableCell>
                      <TableCell className="w-24 text-left">{profileCoords.x },{profileCoords.y }</TableCell>
                    </TableRow>
                  )
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

