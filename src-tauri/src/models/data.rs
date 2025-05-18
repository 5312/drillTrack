use crate::services::db;
use serde::{Deserialize, Serialize};

struct DataListModel {
    id: Option<i32>,
    time: Option<String>,
    // 深度
    depth: f64,

    // （俯仰角）：描述物体绕横轴的旋转。可以理解为物体的“前后倾斜”。
    pitch: Option<f64>,

    // （翻滚角）：描述物体绕纵轴的旋转。可以理解为物体的“左右倾斜”。
    roll: Option<f64>,

    // （方位角）：描述物体绕垂直轴的旋转。可以理解为物体的“朝向”。
    heading: Option<f64>,

    repo_id: Option<i32>,

    // 设计俯仰角
    design_pitch: Option<f64>,

    // 设计方位角
    design_heading: Option<f64>,
}
