use crate::models::data::DataList;
use crate::models::repo::Repo;
use crate::services::db;
use serde::{Deserialize, Serialize};
use warp::http::StatusCode;
use warp::Filter;

fn status_route() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("api")
        .and(warp::path("status"))
        .and(warp::get())
        .map(|| {
            warp::reply::json(&serde_json::json!({
                "status": "running",
                "message": "数据服务器正在运行"
            }))
        })
}

fn data_status_route() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("api")
        .and(warp::path("data"))
        .and(warp::path("status"))
        .and(warp::get())
        .and_then(handle_data_status)
}

async fn handle_data_status() -> Result<impl warp::Reply, warp::Rejection> {
    let resp = match db::query_all_repos().await {
        Ok(repos) => {
            println!("获取数据成功: {:?}", repos);
            warp::reply::json(&serde_json::json!({
                "status": "running",
                "message": "数据服务器正在运行",
                "data": repos
            }))
        }
        Err(e) => warp::reply::json(&serde_json::json!({
            "status": "error",
            "message": format!("获取数据失败: {}", e)
        })),
    };

    Ok(resp)
}

fn data_route() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("api")
        .and(warp::path("data"))
        .and(warp::post())
        .and(warp::body::json())
        .and_then(handle_input)
}

#[derive(Serialize, Deserialize, Debug)]
struct DrillData {
    timestamp: i64, // 毫秒时间戳，用 i64 表示

    #[serde(alias = "deviceId")]
    device_id: String,

    #[serde(alias = "dataType")]
    data_type: String,

    values: Repo,
    data_list: Vec<DataList>, // data_list 是对象数组
}

async fn handle_input(data: DrillData) -> Result<impl warp::Reply, warp::Rejection> {
    let model_repo = data.values;
    let mut model_data_list = data.data_list;

    println!("{:?}", model_repo);
    println!("{:?}", model_data_list);

    let resp = match Repo::insert_repo(model_repo).await {
        Ok(id) => {
            for item in &mut model_data_list {
                item.repo_id = Some(id as i32);
            }
            if let Err(e) = futures::future::try_join_all(
                model_data_list.into_iter().map(DataList::insert_data),
            )
            .await
            {
                return Ok(warp::reply::with_status(
                    warp::reply::json(&serde_json::json!({
                        "status": "error",
                        "message": format!("data_list 插入失败: {}", e)
                    })),
                    StatusCode::INTERNAL_SERVER_ERROR,
                ));
            }

            warp::reply::with_status(
                warp::reply::json(&serde_json::json!({
                    "status": "success",
                    "message": "repo 和 data_list 已接收并存储",
                    "id": id
                })),
                StatusCode::OK,
            )
        }
        Err(e) => warp::reply::with_status(
            warp::reply::json(&serde_json::json!({
                "status": "error",
                "message": format!("数据库写入失败: {}", e)
            })),
            StatusCode::INTERNAL_SERVER_ERROR,
        ),
    };

    Ok(resp)
}

pub fn init_route() -> impl warp::Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone
{
    // 把每个功能的路由提取成单独函数
    let data_route = data_route();
    let status_route = status_route();
    let data_status_route = data_status_route();
    // 更多路由可以继续添加
    // let user_route = user_route();
    // let info_route = info_route();

    // 合并所有路由
    data_route.or(status_route).or(data_status_route)
    // .or(info_route)
}
