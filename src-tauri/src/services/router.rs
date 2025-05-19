use crate::models::data::DataList;
use crate::models::repo::Repo;
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
        .map(|| {
            warp::reply::json(&serde_json::json!({
                "status": "running",
                "message": "数据服务器正在运行",
                "data":[]
            }))
        })
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
    deviceId: String,
    dataType: String,
    values: Repo,             // 不确定结构，用 serde_json::Value
    data_list: Vec<DataList>, // data_list 是对象数组
}

async fn handle_input(data: serde_json::Value) -> Result<impl warp::Reply, warp::Rejection> {
    let model: Result<Repo, _> = serde_json::from_value(data["values"].clone());

    println!("{}", data["values"].clone());

    let resp = match model {
        Ok(model) => match Repo::insert_repo(model).await {
            Ok(id) => warp::reply::with_status(
                warp::reply::json(&serde_json::json!({
                    "status": "success",
                    "message": "repo已接收并存储",
                    "id": id
                })),
                StatusCode::OK,
            ),
            Err(e) => warp::reply::with_status(
                warp::reply::json(&serde_json::json!({
                    "status": "error",
                    "message": format!("数据库写入失败: {}", e)
                })),
                StatusCode::INTERNAL_SERVER_ERROR,
            ),
        },
        Err(e) => warp::reply::with_status(
            warp::reply::json(&serde_json::json!({
                "status": "error",
                "message": format!("数据格式错误: {}", e)
            })),
            StatusCode::BAD_REQUEST,
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
