use crate::services::db::{get_conn, DbError};
use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataList {
    pub id: Option<i32>,
    pub time: Option<String>,
    // 深度
    pub depth: f64,

    // （俯仰角）：描述物体绕横轴的旋转。可以理解为物体的"前后倾斜"。
    pub pitch: Option<f64>,

    // （翻滚角）：描述物体绕纵轴的旋转。可以理解为物体的"左右倾斜"。
    pub roll: Option<f64>,

    // （方位角）：描述物体绕垂直轴的旋转。可以理解为物体的"朝向"。
    pub heading: Option<f64>,

    #[serde(alias = "repoId")]
    pub repo_id: Option<i32>,

    // 设计俯仰角
    #[serde(alias = "designPitch")]
    pub design_pitch: Option<f64>,

    // 设计方位角
    #[serde(alias = "designHeading")]
    pub design_heading: Option<f64>,
}

impl DataList {
    pub async fn insert_data(repo: DataList) -> Result<i64, DbError> {
        let conn_guard = get_conn().await?;
        let conn = conn_guard.as_ref().unwrap();

        let repo = repo.clone();
        match repo.id {
            Some(id) => println!("id: {}", id),
            None => println!("id is None"),
        }
        conn.call(move |c| {
            c.execute(
                "
                INSERT INTO data_list (id, time, depth, pitch, roll, heading, repo_id, design_pitch, design_heading)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ",
                params![
                    repo.id,
                    repo.time,
                    repo.depth,
                    repo.pitch,
                    repo.roll,
                    repo.heading,
                    repo.repo_id,
                    repo.design_pitch,
                    repo.design_heading
                ],
            )?;
            let id = c.last_insert_rowid();
            Ok(id)
        })
        .await
        .map_err(|e| DbError::Other(e.into()))
    }
}
