use crate::services::db;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Repo {
    pub id: Option<i32>,
    pub name: String,
    pub mn_time: String,
    pub len: i32,
    pub mine: String,
    pub work: String,
    pub factory: String,
    pub drilling: String,
}

impl Repo {}
