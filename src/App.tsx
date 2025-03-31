import { useState } from "react";
import DrillDataTable from "./components/DrillDataTable";
import ControlPanel from "./components/ControlPanel";
import "./App.css";

interface DrillData {
  id: number;
  depth: number;
  angle: number;
  geoPosition: number;
  toolDirection: number;
  horizontalOffset: number;
  verticalOffset: number;
}

function App() {
  const [drillData, setDrillData] = useState<DrillData[]>([
    {
      id: 1,
      depth: 0.00,
      angle: 0.00,
      geoPosition: 0.00,
      toolDirection: 0.00,
      horizontalOffset: 0.00,
      verticalOffset: 0.00
    }
  ]);
  const [holeAngle, setHoleAngle] = useState(0);
  const [geoPosition, setGeoPosition] = useState(0);
  const [toolDirection, setToolDirection] = useState(0);

  const handleCalculate = () => {
    // TODO: 实现计算逻辑
    console.log("计算中...", { holeAngle, geoPosition, toolDirection });
  };

  return (
    <div className="app-container">
      <header>
        <h1>钻孔机遍历数据处理系统</h1>
      </header>
      
      <main>
        <section className="control-section">
          <ControlPanel
            onCalculate={handleCalculate}
            onHoleAngleChange={setHoleAngle}
            onGeoPositionChange={setGeoPosition}
            onToolDirectionChange={setToolDirection}
          />
        </section>

        <section className="data-section">
          <DrillDataTable data={drillData} />
        </section>
      </main>
    </div>
  );
}

export default App;
