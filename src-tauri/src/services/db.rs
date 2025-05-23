use crate::models::data::DataList;
use crate::models::repo::Repo;
use anyhow::Result;
use once_cell::sync::OnceCell;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tokio::sync::Mutex;
use tokio::sync::MutexGuard;
use tokio_rusqlite::Connection as TokioConnection;
// 全局数据库连接
static DB_CONNECTION: OnceCell<Mutex<Option<TokioConnection>>> = OnceCell::new();

/// 数据库错误类型
#[derive(Debug, thiserror::Error)]
pub enum DbError {
    #[error("数据库未初始化")]
    NotInitialized,
    #[error("SQLite错误: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("其他错误: {0}")]
    Other(#[from] anyhow::Error),
}

/// 数据库状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbStatus {
    pub initialized: bool,
    pub path: Option<String>,
}

/// 存储当前数据库路径
static DB_PATH: OnceCell<Mutex<Option<String>>> = OnceCell::new();

/// 初始化数据库
pub async fn init_db(db_path: &str) -> Result<(), DbError> {
    let path = Path::new(db_path);

    // 确保目录存在
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| DbError::Other(e.into()))?;
        }
    }

    // 使用tokio_rusqlite打开数据库连接
    let conn = TokioConnection::open(db_path)
        .await
        .map_err(|e| DbError::Other(e.into()))?;

    // 初始化表
    conn.call(|conn| {
        conn.execute_batch(
            "
            BEGIN;
            
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            
            CREATE TABLE IF NOT EXISTS repo (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                mn_time TEXT NOT NULL,
                len INTEGER NOT NULL,
                mine TEXT NOT NULL,
                work TEXT NOT NULL,
                factory TEXT NOT NULL,
                drilling TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS data_list (
                id INTEGER PRIMARY KEY,
                time TEXT,
                depth REAL NOT NULL,
                pitch REAL,
                roll REAL,
                heading REAL,
                repo_id INTEGER,
                design_pitch REAL,
                design_heading REAL,
                FOREIGN KEY (repo_id) REFERENCES repo(id)
            );

            COMMIT;
        ",
        )
    })
    .await
    .map_err(|e| DbError::Other(e.into()))?;

    // 初始化全局连接
    let conn_mutex = DB_CONNECTION.get_or_init(|| Mutex::new(None));
    let mut conn_guard = conn_mutex.lock().await;
    *conn_guard = Some(conn);

    // 保存数据库路径
    let path_mutex = DB_PATH.get_or_init(|| Mutex::new(None));
    let mut path_guard = path_mutex.lock().await;
    *path_guard = Some(db_path.to_string());

    Ok(())
}

/// 获取数据库状态
pub async fn get_db_status() -> DbStatus {
    let path_mutex = DB_PATH.get_or_init(|| Mutex::new(None));
    let path_guard = path_mutex.lock().await;

    let conn_initialized = if let Some(conn_mutex) = DB_CONNECTION.get() {
        let conn_guard = conn_mutex.lock().await;
        conn_guard.is_some()
    } else {
        false
    };

    DbStatus {
        initialized: conn_initialized,
        path: path_guard.clone(),
    }
}

/// 关闭数据库连接
pub async fn close_db() -> Result<(), DbError> {
    if let Some(conn_mutex) = DB_CONNECTION.get() {
        let mut conn_guard = conn_mutex.lock().await;
        if let Some(conn) = conn_guard.take() {
            // tokio_rusqlite会在丢弃时自动关闭连接
            drop(conn);
        }
    }

    // 清除路径信息
    if let Some(path_mutex) = DB_PATH.get() {
        let mut path_guard = path_mutex.lock().await;
        *path_guard = None;
    }

    Ok(())
}

/// 查询所有用户 - 特定实现
pub async fn query_all_users() -> Result<Vec<(i64, String, Option<String>, String)>, DbError> {
    let conn_mutex = match DB_CONNECTION.get() {
        Some(m) => m,
        None => return Err(DbError::NotInitialized),
    };

    let conn_guard = conn_mutex.lock().await;
    let conn = match &*conn_guard {
        Some(c) => c,
        None => return Err(DbError::NotInitialized),
    };

    let users = conn
        .call(|c| {
            let mut stmt =
                c.prepare("SELECT id, name, email, created_at FROM users ORDER BY id")?;
            let rows = stmt.query_map([], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
            })?;

            let mut result = Vec::new();
            for user in rows {
                result.push(user?);
            }

            Ok::<_, rusqlite::Error>(result)
        })
        .await
        .map_err(|e| DbError::Other(e.into()))?;

    Ok(users)
}

/// 通过ID查询用户 - 特定实现
pub async fn query_user_by_id(
    id: i64,
) -> Result<Option<(i64, String, Option<String>, String)>, DbError> {
    let conn_mutex = match DB_CONNECTION.get() {
        Some(m) => m,
        None => return Err(DbError::NotInitialized),
    };

    let conn_guard = conn_mutex.lock().await;
    let conn = match &*conn_guard {
        Some(c) => c,
        None => return Err(DbError::NotInitialized),
    };

    let user = conn
        .call(move |c| {
            let mut stmt =
                c.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")?;
            let mut rows = stmt.query(params![id])?;

            if let Some(row) = rows.next()? {
                Ok(Some((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)))
            } else {
                Ok(None)
            }
        })
        .await
        .map_err(|e| DbError::Other(e.into()))?;

    Ok(user)
}

/// 按名称搜索用户 - 特定实现
pub async fn search_users_by_name(
    name_pattern: &str,
) -> Result<Vec<(i64, String, Option<String>, String)>, DbError> {
    let conn_mutex = match DB_CONNECTION.get() {
        Some(m) => m,
        None => return Err(DbError::NotInitialized),
    };

    let conn_guard = conn_mutex.lock().await;
    let conn = match &*conn_guard {
        Some(c) => c,
        None => return Err(DbError::NotInitialized),
    };

    let pattern = format!("%{}%", name_pattern);

    let users = conn
        .call(move |c| {
            let mut stmt = c.prepare(
                "SELECT id, name, email, created_at FROM users WHERE name LIKE ? ORDER BY name",
            )?;
            let rows = stmt.query_map(params![pattern], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
            })?;

            let mut result = Vec::new();
            for user in rows {
                result.push(user?);
            }

            Ok::<_, rusqlite::Error>(result)
        })
        .await
        .map_err(|e| DbError::Other(e.into()))?;

    Ok(users)
}

/// 保存用户 - 特定实现
pub async fn save_user(id: Option<i64>, name: &str, email: Option<&str>) -> Result<i64, DbError> {
    let conn_mutex = match DB_CONNECTION.get() {
        Some(m) => m,
        None => return Err(DbError::NotInitialized),
    };

    let conn_guard = conn_mutex.lock().await;
    let conn = match &*conn_guard {
        Some(c) => c,
        None => return Err(DbError::NotInitialized),
    };

    let name_owned = name.to_string();
    let email_owned = email.map(|e| e.to_string());

    match id {
        Some(user_id) => {
            // 更新用户
            conn.call(move |c| {
                c.execute(
                    "UPDATE users SET name = ?, email = ? WHERE id = ?",
                    params![name_owned, email_owned, user_id],
                )?;
                Ok::<_, rusqlite::Error>(user_id)
            })
            .await
            .map_err(|e| DbError::Other(e.into()))
        }
        None => {
            // 插入新用户
            conn.call(move |c| {
                c.execute(
                    "INSERT INTO users (name, email) VALUES (?, ?)",
                    params![name_owned, email_owned],
                )?;
                Ok(c.last_insert_rowid())
            })
            .await
            .map_err(|e| DbError::Other(e.into()))
        }
    }
}

/// 删除用户 - 特定实现
pub async fn delete_user(id: i64) -> Result<bool, DbError> {
    let conn_mutex = match DB_CONNECTION.get() {
        Some(m) => m,
        None => return Err(DbError::NotInitialized),
    };

    let conn_guard = conn_mutex.lock().await;
    let conn = match &*conn_guard {
        Some(c) => c,
        None => return Err(DbError::NotInitialized),
    };

    let rows = conn
        .call(move |c| {
            let rows = c.execute("DELETE FROM users WHERE id = ?", params![id])?;
            Ok::<_, rusqlite::Error>(rows)
        })
        .await
        .map_err(|e| DbError::Other(e.into()))?;

    Ok(rows > 0)
}

/// 执行自定义查询 - 基本实现
#[allow(dead_code)]
pub async fn execute_custom_query(sql: &str) -> Result<Vec<serde_json::Value>, DbError> {
    let conn_mutex = match DB_CONNECTION.get() {
        Some(m) => m,
        None => return Err(DbError::NotInitialized),
    };

    let conn_guard = conn_mutex.lock().await;
    let conn = match &*conn_guard {
        Some(c) => c,
        None => return Err(DbError::NotInitialized),
    };

    let sql_owned = sql.to_string();

    let result = conn
        .call(move |c| {
            let mut stmt = c.prepare(&sql_owned)?;
            let column_names: Vec<String> = stmt
                .column_names()
                .into_iter()
                .map(|s| s.to_string())
                .collect();

            let rows = stmt.query_map([], |row| {
                let mut map = serde_json::Map::new();

                for (i, col_name) in column_names.iter().enumerate() {
                    let value = match row.get_ref(i)? {
                        rusqlite::types::ValueRef::Null => serde_json::Value::Null,
                        rusqlite::types::ValueRef::Integer(i) => {
                            serde_json::Value::Number(i.into())
                        }
                        rusqlite::types::ValueRef::Real(f) => {
                            if let Some(n) = serde_json::Number::from_f64(f) {
                                serde_json::Value::Number(n)
                            } else {
                                serde_json::Value::String(f.to_string())
                            }
                        }
                        rusqlite::types::ValueRef::Text(t) => {
                            serde_json::Value::String(String::from_utf8_lossy(t).to_string())
                        }
                        rusqlite::types::ValueRef::Blob(b) => {
                            serde_json::Value::String(format!("<BLOB: {} bytes>", b.len()))
                        }
                    };

                    map.insert(col_name.clone(), value);
                }

                Ok(serde_json::Value::Object(map))
            })?;

            let mut result = Vec::new();
            for row in rows {
                result.push(row?);
            }

            Ok::<_, rusqlite::Error>(result)
        })
        .await
        .map_err(|e| DbError::Other(e.into()))?;

    Ok(result)
}

/// 查询所有 repo
pub async fn query_all_repos() -> Result<Vec<Repo>, DbError> {
    let conn_mutex = match DB_CONNECTION.get() {
        Some(m) => m,
        None => return Err(DbError::NotInitialized),
    };
    let conn_guard = conn_mutex.lock().await;
    let conn = match &*conn_guard {
        Some(c) => c,
        None => return Err(DbError::NotInitialized),
    };
    let repos = conn.call(|c| {
        let mut stmt = c.prepare("SELECT id, name, mn_time, len, mine, work, factory, drilling FROM repo ORDER BY id")?;
        let rows = stmt.query_map([], |row| {
            Ok(Repo {
                id: row.get(0)?,
                name: row.get(1)?,
                mn_time: row.get(2)?,
                len: row.get(3)?,
                mine: row.get(4)?,
                work: row.get(5)?,
                factory: row.get(6)?,
                drilling: row.get(7)?,
            })
        })?;
        let mut result = Vec::new();
        for repo in rows {
            result.push(repo?);
        }
        Ok::<_, rusqlite::Error>(result)
    }).await.map_err(|e| DbError::Other(e.into()))?;
    Ok(repos)
}

/// 获取全局连接的锁
pub async fn get_conn() -> Result<MutexGuard<'static, Option<TokioConnection>>, DbError> {
    let conn_mutex = DB_CONNECTION.get().ok_or(DbError::NotInitialized)?;

    let guard = conn_mutex.lock().await;

    if guard.is_none() {
        Err(DbError::NotInitialized)
    } else {
        Ok(guard)
    }
}

/// 根据 repo_id 查询 data_list 数据
pub async fn query_data_list_by_repo_id(repo_id: i32) -> Result<Vec<DataList>, DbError> {
    let conn_mutex = match DB_CONNECTION.get() {
        Some(m) => m,
        None => return Err(DbError::NotInitialized),
    };
    let conn_guard = conn_mutex.lock().await;
    let conn = match &*conn_guard {
        Some(c) => c,
        None => return Err(DbError::NotInitialized),
    };
    let data_list = conn
        .call(move |c| {
            let mut stmt = c.prepare(
            "SELECT id, time, depth, pitch, roll, heading, repo_id, design_pitch, design_heading 
             FROM data_list 
             WHERE repo_id = ? 
             ORDER BY depth"
        )?;
            let rows = stmt.query_map(params![repo_id], |row| {
                Ok(DataList {
                    id: Some(row.get(0)?),
                    time: row.get(1)?,
                    depth: row.get(2)?,
                    pitch: row.get(3)?,
                    roll: row.get(4)?,
                    heading: row.get(5)?,
                    repo_id: Some(row.get(6)?),
                    design_pitch: row.get(7)?,
                    design_heading: row.get(8)?,
                })
            })?;
            let mut result = Vec::new();
            for data in rows {
                result.push(data?);
            }
            Ok::<_, rusqlite::Error>(result)
        })
        .await
        .map_err(|e| DbError::Other(e.into()))?;
    Ok(data_list)
}

/// 检查数据库连接状态
pub async fn check_db_connection() -> Result<(), DbError> {
    let conn_mutex = DB_CONNECTION.get().ok_or(DbError::NotInitialized)?;
    let conn_guard = conn_mutex.lock().await;

    if conn_guard.is_none() {
        Err(DbError::NotInitialized)
    } else {
        Ok(())
    }
}

/// 带重试机制的获取数据库连接
pub async fn get_conn_with_retry(
    max_retries: u32,
) -> Result<MutexGuard<'static, Option<TokioConnection>>, DbError> {
    let mut retries = 0;
    while retries < max_retries {
        match get_conn().await {
            Ok(conn) => return Ok(conn),
            Err(DbError::NotInitialized) => {
                retries += 1;
                if retries < max_retries {
                    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                    continue;
                }
                return Err(DbError::NotInitialized);
            }
            Err(e) => return Err(e),
        }
    }
    Err(DbError::NotInitialized)
}
