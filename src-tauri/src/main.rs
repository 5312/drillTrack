#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod utils {
    pub mod license;
}
mod commands;
mod models;
mod services;

use commands::db::{
    close_database, delete_user, execute_query, get_all_repos, get_all_users, get_db_status,
    get_user_by_id, init_database, save_user, search_users,
};
use commands::license::{
    activate_license, check_activation, export_machine_id, get_license_info_command,
    get_machine_id, import_license_from_file, is_license_expired_command,
};
use commands::network::{
    get_data_server_status, get_discovery_status, start_data_server, start_discovery_service,
    stop_data_server, stop_discovery_service,
};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 初始化网络模块
            commands::network::init(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_machine_id,
            export_machine_id,
            check_activation,
            activate_license,
            get_license_info_command,
            is_license_expired_command,
            import_license_from_file,
            // 网络通信相关命令
            start_discovery_service,
            stop_discovery_service,
            get_discovery_status,
            start_data_server,
            stop_data_server,
            get_data_server_status,
            // 数据库相关命令
            init_database,
            get_db_status,
            close_database,
            execute_query,
            get_all_users,
            get_user_by_id,
            search_users,
            save_user,
            delete_user,
            get_all_repos
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
