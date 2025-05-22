import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import geographyData from "../assets/geography.json"

interface MagneticDeclinationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MagneticDeclinationDialog({ open, onOpenChange }: MagneticDeclinationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>地磁偏角数据</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>序号</TableHead>
                <TableHead>矿区</TableHead>
                <TableHead>所在地</TableHead>
                <TableHead>地磁偏角</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {geographyData.map((item) => (
                <TableRow key={item.序号}>
                  <TableCell>{item.序号}</TableCell>
                  <TableCell>{item.矿区}</TableCell>
                  <TableCell>{item.所在地}</TableCell>
                  <TableCell>{item.地磁偏角}°</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
} 