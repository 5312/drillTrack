use crate::models::user::User;
use crate::services::db::{self, DbError, DbStatus};
use serde::{Deserialize, Serialize};
use serde_json::Value;

// 初始化数据库
#[tauri::command]
pub async fn init_database(db_path: Option<String>) -> Result<DbStatus, String> {
    let path = match db_path {
        Some(p) => p,
        None => {
            // 使用默认路径
            let app_dir = std::env::current_dir()
                .map_err(|e| format!("无法获取当前目录: {}", e))?;
            app_dir.join("database.db")
                .to_string_lossy()
                .to_string()
        }
    };
    
    match db::init_db(&path).await {
        Ok(_) => Ok(db::get_db_status().await),
        Err(e) => Err(format!("数据库初始化失败: {}", e))
    }
}

// 获取数据库状态
#[tauri::command]
pub async fn get_db_status() -> DbStatus {
    db::get_db_status().await
}

// 关闭数据库连接
#[tauri::command]
pub async fn close_database() -> Result<(), String> {
    db::close_db().await.map_err(|e| format!("关闭数据库失败: {}", e))
}

// 执行自定义查询
#[tauri::command]
pub async fn execute_query(sql: String, params: Vec<Value>) -> Result<Vec<Value>, String> {
    // 目前参数被忽略，因为简化了实现
    // 在实际应用中，您需要将params传递给查询
    let result = db::execute_custom_query(&sql).await
        .map_err(|e| format!("查询执行失败: {}", e))?;
    
    Ok(result)
}

// 获取所有用户
#[tauri::command]
pub async fn get_all_users() -> Result<Vec<User>, String> {
    User::find_all()
        .await
        .map_err(|e| format!("获取用户列表失败: {}", e))
}

// 根据ID获取用户
#[tauri::command]
pub async fn get_user_by_id(id: i64) -> Result<Option<User>, String> {
    User::find_by_id(id)
        .await
        .map_err(|e| format!("获取用户失败: {}", e))
}

// 搜索用户
#[tauri::command]
pub async fn search_users(query: String) -> Result<Vec<User>, String> {
    User::search_by_name(&query)
        .await
        .map_err(|e| format!("搜索用户失败: {}", e))
}

// 创建或更新用户
#[tauri::command]
pub async fn save_user(user: User) -> Result<i64, String> {
    user.save()
        .await
        .map_err(|e| format!("保存用户失败: {}", e))
}

// 删除用户
#[tauri::command]
pub async fn delete_user(id: i64) -> Result<bool, String> {
    User::delete(id)
        .await
        .map_err(|e| format!("删除用户失败: {}", e))
} 