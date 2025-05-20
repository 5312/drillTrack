use crate::services::db::{get_conn, DbError};
use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Repo {
    pub id: Option<i32>,
    pub name: String,

    #[serde(alias = "mnTime")]
    pub mn_time: String,

    pub len: i32,
    pub mine: String,
    pub work: String,
    pub factory: String,
    pub drilling: String,
}

impl Repo {
    pub async fn insert_repo(repo: Repo) -> Result<i64, DbError> {
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
                INSERT INTO repo (id,name, mn_time, len, mine, work, factory, drilling)
                VALUES (?,?, ?, ?, ?, ?, ?, ?)
                ",
                params![
                    repo.id,
                    repo.name,
                    repo.mn_time,
                    repo.len,
                    repo.mine,
                    repo.work,
                    repo.factory,
                    repo.drilling
                ],
            )?;
            let id = c.last_insert_rowid();
            Ok(id)
        })
        .await
        .map_err(|e| DbError::Other(e.into()))
    }

    pub async fn delete_repo_by_id(id: i32) -> Result<bool, DbError> {
        let conn_guard = get_conn().await?;
        let conn = conn_guard.as_ref().unwrap();

        conn.call(move |c| {
            let rows_affected = c.execute("DELETE FROM repo WHERE id = ?", params![id])?;
            Ok(rows_affected > 0)
        })
        .await
        .map_err(|e| DbError::Other(e.into()))
    }

    pub async fn update_repo(repo: Repo) -> Result<bool, DbError> {
        let conn_guard = get_conn().await?;
        let conn = conn_guard.as_ref().unwrap();

        let repo = repo.clone();
        if let Some(id) = repo.id {
            conn.call(move |c| {
                let rows_affected = c.execute(
                    "
                    UPDATE repo
                    SET name = ?, mn_time = ?, len = ?, mine = ?, work = ?, factory = ?, drilling = ?
                    WHERE id = ?
                    ",
                    params![
                        repo.name,
                        repo.mn_time,
                        repo.len,
                        repo.mine,
                        repo.work,
                        repo.factory,
                        repo.drilling,
                        id
                    ],
                )?;
                Ok(rows_affected > 0)
            })
            .await
            .map_err(|e| DbError::Other(e.into()))
        } else {
            Err(DbError::Other(
                anyhow::anyhow!("更新失败：ID 为 None").into(),
            ))
        }
    }

    pub async fn query_repo_by_id(id: i32) -> Result<Option<Repo>, DbError> {
        let conn_guard = get_conn().await?;
        let conn = conn_guard.as_ref().unwrap();

        conn.call(move |c| {
            let mut stmt = c.prepare(
                "SELECT id, name, mn_time, len, mine, work, factory, drilling FROM repo WHERE id = ?",
            )?;
            let mut rows = stmt.query(params![id])?;
            if let Some(row) = rows.next()? {
                Ok(Some(Repo {
                    id: Some(row.get(0)?),
                    name: row.get(1)?,
                    mn_time: row.get(2)?,
                    len: row.get(3)?,
                    mine: row.get(4)?,
                    work: row.get(5)?,
                    factory: row.get(6)?,
                    drilling: row.get(7)?,
                }))
            } else {
                Ok(None)
            }
        })
        .await
        .map_err(|e| DbError::Other(e.into()))
    }
}
