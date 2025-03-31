import React from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface DrillDataType {
  id: number;
  depth: number;
  angle: number;
  geoPosition: number;
  toolDirection: number;
  horizontalOffset: number;
  verticalOffset: number;
}

const columns: ColumnsType<DrillDataType> = [
  {
    title: '序号',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '深度',
    dataIndex: 'depth',
    key: 'depth',
  },
  {
    title: '倾角',
    dataIndex: 'angle',
    key: 'angle',
  },
  {
    title: '地理方位角',
    dataIndex: 'geoPosition',
    key: 'geoPosition',
  },
  {
    title: '工具面方向',
    dataIndex: 'toolDirection',
    key: 'toolDirection',
  },
  {
    title: '左右位移',
    dataIndex: 'horizontalOffset',
    key: 'horizontalOffset',
  },
  {
    title: '上下位移',
    dataIndex: 'verticalOffset',
    key: 'verticalOffset',
  },
];

interface DrillDataTableProps {
  data: DrillDataType[];
}

const DrillDataTable: React.FC<DrillDataTableProps> = ({ data }) => {
  return (
    <div className="drill-data-table">
      <Table columns={columns} dataSource={data} pagination={false} />
    </div>
  );
};

export default DrillDataTable; 