import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Skeleton } from "./ui/skeleton"
import { useDrillingData } from "../context/drilling-data-context"

export function DataTable() {
  const { drillingData, isLoading } = useDrillingData()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">序号</TableHead>
          <TableHead>深度</TableHead>
          <TableHead>倾角</TableHead>
          <TableHead>地理方位角</TableHead>
          <TableHead>工具面方向</TableHead>
          <TableHead>左右位移</TableHead>
          <TableHead>上下位移</TableHead>
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
                </TableRow>
              ))
          : drillingData.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.depth}</TableCell>
                <TableCell>{row.inclination}</TableCell>
                <TableCell>{row.geoOrientation}</TableCell>
                <TableCell>{row.toolFaceDirection}</TableCell>
                <TableCell>{row.leftRightDeviation}</TableCell>
                <TableCell>{row.upDownDeviation}</TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}

