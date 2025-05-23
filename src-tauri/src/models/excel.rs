use crate::models::data::DataList;
use rust_xlsxwriter::Workbook;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ExcelData {
    pub file_path: String,
    pub data: Vec<DataList>,
    pub magnetic_declination: String,
}

impl ExcelData {
    pub async fn save_to_excel(&self) -> Result<(), String> {
        let mut workbook = Workbook::new();
        let sheet = workbook.add_worksheet();

        // 写入表头
        let headers = vec![
            "序号",
            "深度",
            "俯仰角",
            "方位角",
            "左右位移",
            "上下位移",
            "左右位移(设计)",
            "上下位移(设计)",
            "CAD平面坐标",
            "CAD剖面坐标",
        ];

        for (col, header) in headers.iter().enumerate() {
            sheet
                .write_string(0, col as u16, *header)
                .map_err(|e| format!("写入表头失败: {}", e))?;
        }

        // 写入数据
        for (index, row) in self.data.iter().enumerate() {
            let row_num = (index + 1) as u32;
            let lateral_displacement = self.calculate_lateral_displacement(row);
            let vertical_displacement = self.calculate_vertical_displacement(row);
            let design_vertical_displacement = self.calculate_design_vertical_displacement(row);
            let cad_coords = self.calculate_cad_coordinates(row);
            let profile_coords = self.calculate_cad_profile_coordinates(row);

            sheet
                .write_number(row_num, 0, (index + 1) as f64)
                .map_err(|e| format!("写入数据失败: {}", e))?;
            sheet
                .write_number(row_num, 1, row.depth)
                .map_err(|e| format!("写入数据失败: {}", e))?;
            if let Some(pitch) = row.pitch {
                sheet
                    .write_number(row_num, 2, pitch)
                    .map_err(|e| format!("写入数据失败: {}", e))?;
            }
            if let Some(heading) = row.heading {
                sheet
                    .write_number(row_num, 3, heading)
                    .map_err(|e| format!("写入数据失败: {}", e))?;
            }
            sheet
                .write_number(row_num, 4, lateral_displacement)
                .map_err(|e| format!("写入数据失败: {}", e))?;
            sheet
                .write_number(row_num, 5, vertical_displacement)
                .map_err(|e| format!("写入数据失败: {}", e))?;
            sheet
                .write_number(row_num, 6, 0.0)
                .map_err(|e| format!("写入数据失败: {}", e))?;
            sheet
                .write_number(row_num, 7, design_vertical_displacement)
                .map_err(|e| format!("写入数据失败: {}", e))?;
            sheet
                .write_string(
                    row_num,
                    8,
                    &format!("@{:.5},{:.5}", cad_coords.0, cad_coords.1),
                )
                .map_err(|e| format!("写入数据失败: {}", e))?;
            sheet
                .write_string(
                    row_num,
                    9,
                    &format!("@{:.5},{:.5}", profile_coords.0, profile_coords.1),
                )
                .map_err(|e| format!("写入数据失败: {}", e))?;
        }

        workbook
            .save(&self.file_path)
            .map_err(|e| format!("保存Excel文件失败: {}", e))?;
        Ok(())
    }

    // 计算左右位移
    fn calculate_lateral_displacement(&self, row: &DataList) -> f64 {
        let rod_length = row.depth;
        let pitch_rad = (row.pitch.unwrap_or(0.0) * std::f64::consts::PI) / 180.0;
        let design_heading = row.design_heading.unwrap_or(0.0)
            + self.magnetic_declination.parse::<f64>().unwrap_or(0.0);
        let heading_diff_rad =
            ((row.heading.unwrap_or(0.0) - design_heading) * std::f64::consts::PI) / 180.0;
        rod_length * pitch_rad.cos() * heading_diff_rad.sin()
    }

    // 计算上下位移
    fn calculate_vertical_displacement(&self, row: &DataList) -> f64 {
        let rod_length = row.depth;
        let pitch_rad = (row.pitch.unwrap_or(0.0) * std::f64::consts::PI) / 180.0;
        rod_length * pitch_rad.sin()
    }

    // 计算设计上下位移
    fn calculate_design_vertical_displacement(&self, row: &DataList) -> f64 {
        let rod_length = row.depth;
        let pitch_rad = (row.design_pitch.unwrap_or(0.0) * std::f64::consts::PI) / 180.0;
        rod_length * pitch_rad.sin()
    }

    // 计算CAD平面坐标
    fn calculate_cad_coordinates(&self, row: &DataList) -> (f64, f64) {
        let lateral = self.calculate_lateral_displacement(row);
        let vertical = self.calculate_vertical_displacement(row);
        (lateral, vertical)
    }

    // 计算CAD剖面坐标
    fn calculate_cad_profile_coordinates(&self, row: &DataList) -> (f64, f64) {
        let vertical = self.calculate_vertical_displacement(row);
        (0.0, vertical)
    }
}
