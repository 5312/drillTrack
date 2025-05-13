use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use tauri::State;
use tokio::sync::mpsc;
use tokio::sync::Mutex as TokioMutex;
use tokio::time::Duration;
use tokio::net::UdpSocket;
use warp::Filter;
use anyhow::{Result, anyhow};
use std::net::{SocketAddr, IpAddr, Ipv4Addr};
use std::collections::HashMap;
use tauri::Manager;
use chrono;

// 局域网发现服务状态
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DiscoveryStatus {
    active: bool,
    port: u16,
    server_name: String,
    discovered_clients: Vec<String>,
}

// 数据服务器状态结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataServerStatus {
    running: bool,
    port: u16,
    received_data_count: usize,
    ip_address: String,
}

// 保存状态的应用状态
pub struct NetworkState {
    discovery: TokioMutex<DiscoveryStatus>,
    data_server: TokioMutex<DataServerStatus>,
    discovery_tx: TokioMutex<Option<mpsc::Sender<()>>>, // 用于关闭发现服务
    server_tx: TokioMutex<Option<mpsc::Sender<()>>>,    // 用于关闭服务器
}

impl Default for NetworkState {
    fn default() -> Self {
        Self {
            discovery: TokioMutex::new(DiscoveryStatus {
                active: false,
                port: 9090,
                server_name: "DrillTrack".to_string(),
                discovered_clients: Vec::new(),
            }),
            data_server: TokioMutex::new(DataServerStatus {
                running: false,
                port: 8080,
                received_data_count: 0,
                ip_address: "127.0.0.1".to_string(),
            }),
            discovery_tx: TokioMutex::new(None),
            server_tx: TokioMutex::new(None),
        }
    }
}

// 获取本机所有IPv4地址
fn get_local_ipv4_addresses() -> Vec<String> {
    match local_ip_address::list_afinet_netifas() {
        Ok(netifas) => {
            let addresses: Vec<String> = netifas.iter()
                .filter_map(|(_, addr)| {
                    if let std::net::IpAddr::V4(ipv4) = addr {
                        let octets = ipv4.octets();
                        // 只保留 192.168.x.x，排除 loopback/169.254/10.x/172.16-31
                        if octets[0] == 192 && octets[1] == 168 {
                            return Some(ipv4.to_string());
                        }else{
                            None
                        }
                   
                    } else {
                        None
                    }
                })
                .collect();
            
            // 没有找到非回环地址时，添加环回地址
            if addresses.is_empty() {
                return vec!["127.0.0.1".to_string()];
            }
            
            // 打印所有找到的地址
            println!("本机IP地址: {:?}", addresses);
            addresses
        }
        Err(e) => {
            println!("获取IP地址错误: {:?}", e);
            vec!["127.0.0.1".to_string()]
        }
    }
}

// 启动局域网发现服务
#[tauri::command]
pub async fn start_discovery_service(
    port: Option<u16>,
    server_name: Option<String>,
    network_state: State<'_, NetworkState>,
) -> Result<DiscoveryStatus, String> {
    let mut discovery_state = network_state.discovery.lock().await;
    
    // 如果发现服务已经在运行，返回当前状态
    if discovery_state.active {
        return Ok(discovery_state.clone());
    }
    
    // 设置参数
    let discovery_port = port.unwrap_or(9090);
    let name = server_name.unwrap_or("DrillTrack".to_string());
    discovery_state.port = discovery_port;
    discovery_state.server_name = name.clone();
    discovery_state.active = true;
    discovery_state.discovered_clients.clear();
    
    // 获取本机IP地址
    let ip_addresses = get_local_ipv4_addresses();
    if ip_addresses.is_empty() {
        return Err("无法获取本机IP地址".to_string());
    }
    
    // 更新数据服务器IP地址
    let mut data_server = network_state.data_server.lock().await;
    data_server.ip_address = ip_addresses[0].clone();
    drop(data_server);
    
    // 创建一个通道用于关闭发现服务
    let (tx, mut rx) = mpsc::channel::<()>(1);
    
    // 记录已发现的客户端
    let clients = Arc::new(TokioMutex::new(Vec::<String>::new()));
    let clients_clone = clients.clone();
    
    // 创建UDP套接字用于广播
    let socket = match UdpSocket::bind("0.0.0.0:0").await {
        Ok(s) => s,
        Err(e) => return Err(format!("无法创建UDP套接字: {}", e)),
    };
    
    // 设置为广播模式
    if let Err(e) = socket.set_broadcast(true) {
        return Err(format!("无法设置广播模式: {}", e));
    }
    
    // 提前获取数据服务器端口，避免在异步任务中使用network_state
    let http_port = network_state.data_server.lock().await.port;
    
    let server_info = serde_json::json!({
        "type": "server_announce",
        "name": name.clone(),
        "http_port": http_port,
        "discovery_port": discovery_port,
        "ip": ip_addresses[0].clone(),
        "all_ips": ip_addresses,  // 提供所有可用IP
        "version": "1.0",
        "timestamp": chrono::Utc::now().timestamp_millis()
    }).to_string();
    
    println!("启动广播，发送信息: {}", server_info);
    
    // 使用Arc包装UdpSocket以便在不同任务间共享
    let socket = Arc::new(socket);
    let socket_sender = socket.clone();
    
    tokio::spawn(async move {
        let broadcast_addr = "255.255.255.255:9091";  // 客户端监听端口
        let mut interval = tokio::time::interval(Duration::from_secs(2));
        
        loop {
            tokio::select! {
                _ = rx.recv() => {
                    println!("停止发现服务广播");
                    break;
                }
                _ = interval.tick() => {
                    if let Err(e) = socket_sender.send_to(server_info.as_bytes(), broadcast_addr).await {
                        println!("广播消息发送失败: {}", e);
                    } else {
                        // 打印发送成功信息，但不要每次都打印完整消息
                        println!("已发送广播消息");
                    }
                }
            }
        }
    });
    
    // 启动监听客户端消息的线程
    // 提前获取所需数据的副本
    let name_clone = name.clone();
    let http_port = network_state.data_server.lock().await.port;
    
    tokio::spawn(async move {
        let mut buf = [0u8; 1024];
        let listen_addr = format!("0.0.0.0:{}", discovery_port);
        
        // 绑定UDP监听端口
        let listen_socket = match UdpSocket::bind(&listen_addr).await {
            Ok(s) => s,
            Err(e) => {
                println!("无法绑定UDP监听端口 {}: {}", discovery_port, e);
                return;
            }
        };
        
        loop {
            match listen_socket.recv_from(&mut buf).await {
                Ok((size, addr)) => {
                    if let Ok(msg) = std::str::from_utf8(&buf[..size]) {
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(msg) {
                            if json["type"] == "client_discovery" {
                                println!("收到客户端发现请求: {} 来自 {}", msg, addr);
                                
                                // 记录客户端地址
                                let client_addr = addr.ip().to_string();
                                let mut clients = clients.lock().await;
                                if !clients.contains(&client_addr) {
                                    clients.push(client_addr);
                                }
                                
                                // 直接回复客户端 - 使用事先获取的数据
                                let response = serde_json::json!({
                                    "type": "server_response",
                                    "name": name_clone,
                                    "http_port": http_port,
                                    "ip": ip_addresses[0].clone(),    // 添加服务器IP
                                    "discovery_port": discovery_port, // 添加发现服务端口
                                    "timestamp": chrono::Utc::now().timestamp_millis()
                                }).to_string();
                                
                                println!("发送回复: {} 到 {}", response, addr);
                                
                                if let Err(e) = listen_socket.send_to(response.as_bytes(), addr).await {
                                    println!("回复客户端失败: {}", e);
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    println!("接收UDP消息失败: {}", e);
                }
            }
        }
    });
    
    // 启动定期更新发现客户端的任务
    let discovery_status = Arc::new(TokioMutex::new(discovery_state.clone()));
    let clients_for_update = clients_clone.clone();
    
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(5));
        loop {
            interval.tick().await;
            let clients = clients_for_update.lock().await;
            let mut status = discovery_status.lock().await;
            status.discovered_clients = clients.clone();
            if !status.active {
                break;
            }
        }
    });
    
    // 保存通道发送端
    {
        let mut tx_guard = network_state.discovery_tx.lock().await;
        *tx_guard = Some(tx);
    }
    
    Ok(discovery_state.clone())
}

// 停止局域网发现服务
#[tauri::command]
pub async fn stop_discovery_service(
    network_state: State<'_, NetworkState>,
) -> Result<DiscoveryStatus, String> {
    let mut discovery_state = network_state.discovery.lock().await;
    
    // 如果发现服务没有运行，直接返回状态
    if !discovery_state.active {
        return Ok(discovery_state.clone());
    }
    
    // 发送停止信号
    {
        let mut tx_guard = network_state.discovery_tx.lock().await;
        if let Some(tx) = tx_guard.take() {
            if let Err(e) = tx.send(()).await {
                return Err(format!("无法发送停止信号: {}", e));
            }
        }
    }
    
    // 更新状态
    discovery_state.active = false;
    discovery_state.discovered_clients.clear();
    
    Ok(discovery_state.clone())
}

// 检查局域网发现服务状态
#[tauri::command]
pub async fn get_discovery_status(
    network_state: State<'_, NetworkState>,
) -> Result<DiscoveryStatus, String> {
    let discovery_state = network_state.discovery.lock().await;
    Ok(discovery_state.clone())
}

// 启动数据接收服务器
#[tauri::command]
pub async fn start_data_server(
    port: Option<u16>,
    network_state: State<'_, NetworkState>,
) -> Result<DataServerStatus, String> {
    let mut server_state = network_state.data_server.lock().await;
    
    // 如果服务器已经在运行，返回当前状态
    if server_state.running {
        return Ok(server_state.clone());
    }
    
    // 获取本机IP地址
    let ip_addresses = get_local_ipv4_addresses();
    if !ip_addresses.is_empty() {
        server_state.ip_address = ip_addresses[0].clone();
    }
    
    // 设置端口
    let server_port = port.unwrap_or(8080);
    server_state.port = server_port;
    server_state.running = true;
    server_state.received_data_count = 0;
    
    // 创建一个通道用于关闭服务器
    let (tx, mut rx) = mpsc::channel::<()>(1);
    
    // 创建一个非同步可变引用的计数器
    let counter = Arc::new(Mutex::new(0usize));
    let counter_clone = counter.clone();
    
    // 创建REST API路由
    let data_route = warp::path("api")
        .and(warp::path("data"))
        .and(warp::post())
        .and(warp::body::json())
        .map(move |data: serde_json::Value| {
            // 处理接收到的数据
            println!("收到数据: {:?}", data);
            
            // 更新计数器
            let mut count = counter.lock().unwrap();
            *count += 1;
            
            // 返回成功响应
            warp::reply::json(&serde_json::json!({
                "status": "success",
                "message": "数据已接收",
                "count": *count
            }))
        });
    
    // 添加检查状态路由
    let status_route = warp::path("api")
        .and(warp::path("status"))
        .and(warp::get())
        .map(|| {
            warp::reply::json(&serde_json::json!({
                "status": "running",
                "message": "数据服务器正在运行"
            }))
        });
    
    // 合并路由
    let routes = data_route.or(status_route);
    
    // 获取服务器地址
    let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)), server_port);
    
    // 启动服务器
    let (_, server) = warp::serve(routes)
        .bind_with_graceful_shutdown(addr, async move {
            rx.recv().await;
            println!("关闭数据服务器");
        });
    
    // 在后台线程中运行服务器
    tokio::spawn(server);
    
    // 保存通道发送端
    let mut tx_guard = network_state.server_tx.lock().await;
    *tx_guard = Some(tx);
    
    // 创建一个新的数据服务器状态，以避免生命周期问题
    let data_server = Arc::new(TokioMutex::new(server_state.clone()));
    
    // 启动定期更新计数器的任务
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(1));
        loop {
            interval.tick().await;
            let count = *counter_clone.lock().unwrap();
            let mut server_state = data_server.lock().await;
            if server_state.running {
                server_state.received_data_count = count;
            } else {
                break;
            }
        }
    });
    
    drop(server_state);
    
    // 返回服务器状态
    Ok(network_state.data_server.lock().await.clone())
}

// 停止数据服务器
#[tauri::command]
pub async fn stop_data_server(
    network_state: State<'_, NetworkState>,
) -> Result<DataServerStatus, String> {
    let mut server_state = network_state.data_server.lock().await;
    
    // 如果服务器没有运行，直接返回状态
    if !server_state.running {
        return Ok(server_state.clone());
    }
    
    // 发送停止信号
    {
        let mut tx_guard = network_state.server_tx.lock().await;
        if let Some(tx) = tx_guard.take() {
            if let Err(e) = tx.send(()).await {
                return Err(format!("无法发送停止信号: {}", e));
            }
        }
    }
    
    // 更新服务器状态
    server_state.running = false;
    
    Ok(server_state.clone())
}

// 初始化网络模块
pub fn init<R: tauri::Runtime>(app: &mut tauri::App<R>) -> Result<(), Box<dyn std::error::Error>> {
    // 管理NetworkState
    app.manage(NetworkState::default());
    Ok(())
} 