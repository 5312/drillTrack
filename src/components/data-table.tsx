import { Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { DataList } from "../lib/db"
import {
  calculateLateralDisplacement,
  calculateVerticalDisplacement,
  calculateDesignVerticalDisplacement,
  calculateCADCoordinates,
  calculateCADProfileCoordinates
} from "../lib/calculations"

interface DataTableProps {
  dataList: DataList[]
  isLoading: boolean
  magneticDeclination: string // 添加磁偏角属性
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

