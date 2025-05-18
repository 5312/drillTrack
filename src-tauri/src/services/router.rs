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
        .map(|data: serde_json::Value| {
            println!("收到数据: {:?}", data);
            warp::reply::json(&serde_json::json!({
                "status": "success",
                "message": "数据已接收",
                "count": 0,
            }))
        })
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
