import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Skeleton } from "./ui/skeleton"
import { DataList } from "../lib/db"

interface DataTableProps {
  dataList: DataList[]
  isLoading: boolean
}

export function DataTable({ dataList, isLoading }: DataTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">序号</TableHead>
          <TableHead>深度</TableHead>
          <TableHead>俯仰角</TableHead>
          <TableHead>翻滚角</TableHead>
          <TableHead>方位角</TableHead>
          <TableHead>设计俯仰角</TableHead>
          <TableHead>设计方位角</TableHead>
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
          : dataList.map((row, index) => (
              <TableRow key={row.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.depth}</TableCell>
                <TableCell>{row.pitch}</TableCell>
                <TableCell>{row.roll}</TableCell>
                <TableCell>{row.heading}</TableCell>
                <TableCell>{row.design_pitch}</TableCell>
                <TableCell>{row.design_heading}</TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}

