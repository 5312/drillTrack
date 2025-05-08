#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod utils{
    pub mod utils;
}
mod commands {
    pub mod license;
}

use commands::license::{get_machine_id, export_machine_id, check_activation, activate_license, get_license_info_command, is_license_expired_command, import_license_from_file};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_machine_id,
            export_machine_id,
            check_activation,
            activate_license,
            get_license_info_command,
            is_license_expired_command,
            import_license_from_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
