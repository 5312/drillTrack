import { Table } from "antd"
import type { ColumnsType } from "antd/es/table"
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
  const columns: ColumnsType<DataList> = [
    {
      title: "序号",
      dataIndex: "index",
      key: "index",
      width: 80,
      fixed: "left",
      render: (_, __, index) => index + 1,
    },
    {
      title: "深度",
      dataIndex: "depth",
      key: "depth",
      width: 80,
    },
    {
      title: "俯仰角",
      dataIndex: "pitch",
      key: "pitch",
      width: 100,
    },
    {
      title: "方位角",
      dataIndex: "heading",
      key: "heading",
      width: 100,
    },
    {
      title: "左右位移",
      key: "lateralDisplacement",
      width: 100,
      render: (_, record) => calculateLateralDisplacement(record, magneticDeclination).toFixed(5),
    },
    {
      title: "上下位移",
      key: "verticalDisplacement",
      width: 100,
      render: (_, record) => calculateVerticalDisplacement(record).toFixed(5),
    },
    {
      title: "左右位移(设计)",
      key: "designLateralDisplacement",
      width: 100,
      render: () => "0",
    },
    {
      title: "上下位移(设计)",
      key: "designVerticalDisplacement",
      width: 100,
      render: (_, record) => calculateDesignVerticalDisplacement(record).toFixed(5),
    },
    {
      title: "CAD平面坐标",
      key: "cadCoordinates",
      width: 100,
      render: (_, record) => {
        const coords = calculateCADCoordinates(record, magneticDeclination)
        return `${coords.x.toFixed(5)},${coords.y.toFixed(5)}`
      },
    },
    {
      title: "CAD剖面坐标",
      key: "profileCoordinates",
      width: 100,
      render: (_, record) => {
        const coords = calculateCADProfileCoordinates(record)
        return `${coords.x.toFixed(5)},${coords.y.toFixed(5)}`
      },
    },
  ]
  return (
    <div className="relative w-[80vw]">
      <Table
        columns={columns}
        dataSource={dataList}
        loading={isLoading}
        rowKey={(record) => record.id || record.depth}
        pagination={false}
        size="small"
        scroll={{ x:'calc(700px + 50%)', y: '60vh'  }}
      />
    </div>
  )
}

