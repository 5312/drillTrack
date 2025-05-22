import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Button } from "./ui/button"
import geographyData from "../assets/geography.json"

interface MagneticDeclinationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedValue: string
  onSelect: (value: string) => void
  selectedId: string
  onSelectId: (id: string) => void
}

export function MagneticDeclinationDialog({ 
  open, 
  onOpenChange, 
  onSelect,
  selectedId,
  onSelectId
}: MagneticDeclinationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>地磁偏角数据</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[80vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>序号</TableHead>
                <TableHead>矿区</TableHead>
                <TableHead>所在地</TableHead>
                <TableHead>地磁偏角</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {geographyData.map((item) => (
                <TableRow key={item.序号}>
                  <TableCell>{item.序号}</TableCell>
                  <TableCell>{item.矿区}</TableCell>
                  <TableCell>{item.所在地}</TableCell>
                  <TableCell>{item.地磁偏角}°</TableCell>
                  <TableCell>
                    <Button
                      variant={selectedId === item.序号 ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        onSelect(item.地磁偏角)
                        onSelectId(item.序号)
                        onOpenChange(false)
                      }}
                    >
                      {selectedId === item.序号 ? "已选择" : "选择"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
} 