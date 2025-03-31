import React from 'react';
import { Form, Input, Button, Space } from 'antd';

interface ControlPanelProps {
  onCalculate: () => void;
  onHoleAngleChange: (value: number) => void;
  onGeoPositionChange: (value: number) => void;
  onToolDirectionChange: (value: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onCalculate,
  onHoleAngleChange,
  onGeoPositionChange,
  onToolDirectionChange,
}) => {
  return (
    <div className="control-panel">
      <Form layout="inline">
        <Form.Item label="开孔角度">
          <Input
            type="number"
            onChange={(e) => onHoleAngleChange(Number(e.target.value))}
            placeholder="0.0"
          />
        </Form.Item>
        <Form.Item label="地理方位角">
          <Input
            type="number"
            onChange={(e) => onGeoPositionChange(Number(e.target.value))}
            placeholder="0.0"
          />
        </Form.Item>
        <Form.Item label="地磁偏角">
          <Input
            type="number"
            onChange={(e) => onToolDirectionChange(Number(e.target.value))}
            placeholder="0.0"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={onCalculate}>
            重新计算
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ControlPanel; 