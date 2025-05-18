use crate::services::db;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Option<i64>,
    pub name: String,
    pub email: Option<String>,
    pub created_at: String,
}

impl User {
    // 根据ID查找用户
    pub async fn find_by_id(id: i64) -> Result<Option<Self>, db::DbError> {
        let result = db::query_user_by_id(id).await?;

        Ok(result.map(|(id, name, email, created_at)| User {
            id: Some(id),
            name,
            email,
            created_at,
        }))
    }

    // 查找所有用户
    pub async fn find_all() -> Result<Vec<Self>, db::DbError> {
        let users = db::query_all_users().await?;

        Ok(users
            .into_iter()
            .map(|(id, name, email, created_at)| User {
                id: Some(id),
                name,
                email,
                created_at,
            })
            .collect())
    }

    // 根据名称搜索用户
    pub async fn search_by_name(name_query: &str) -> Result<Vec<Self>, db::DbError> {
        let users = db::search_users_by_name(name_query).await?;

        Ok(users
            .into_iter()
            .map(|(id, name, email, created_at)| User {
                id: Some(id),
                name,
                email,
                created_at,
            })
            .collect())
    }

    // 保存用户（插入或更新）
    pub async fn save(&self) -> Result<i64, db::DbError> {
        let email_ref = self.email.as_deref();
        db::save_user(self.id, &self.name, email_ref).await
    }

    // 删除用户
    pub async fn delete(id: i64) -> Result<bool, db::DbError> {
        db::delete_user(id).await
    }
}
