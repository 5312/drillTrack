#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod license_utils;

use license_utils::generate_hardware_id;
use license_utils::verify_license_file;
use std::fs;
use std::path::PathBuf;

// 根据硬件信息获取唯一的机器ID
#[tauri::command]
fn get_machine_id() -> String {
    generate_hardware_id()
}

// 导出机器ID到文件
#[tauri::command]
fn export_machine_id(file_path: &str) -> Result<(), String> {
    let machine_id = generate_hardware_id();
    fs::write(file_path, machine_id).map_err(|e| e.to_string())
}

// 检查应用程序是否已激活
#[tauri::command]
fn check_activation() -> bool {
    let path = match get_license_path() {
        Some(p) => p,
        None => return false,
    };
    if !path.exists() {
        return false;
    }
    // 发布模式：验证许可证内容
    let public_key = include_bytes!("../keys/public_key.der");
    match verify_license_file(&path, public_key) {
        Ok(valid) => valid,
        Err(_) => false,
    }
}

// 使用提供的密钥激活许可证
#[tauri::command]
fn activate_license(license_key: &str) -> Result<bool, String> {
    // 从base64解码许可证密钥
    let license_data = match data_encoding::BASE64.decode(license_key.as_bytes()) {
        Ok(data) => data,
        Err(_) => return Err("无效的许可证密钥格式".into()),
    };

    // 保存许可证文件
    match get_license_path() {
        Some(path) => {
            if let Some(parent) = path.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                }
            }

            fs::write(&path, &license_data).map_err(|e| e.to_string())?;

            // 验证许可证文件
            #[cfg(debug_assertions)]
            {
                // 在调试模式下，假设许可证有效
                Ok(true)
            }

            #[cfg(not(debug_assertions))]
            {
                // 在生产模式下使用正确的验证
                let public_key = include_bytes!("../keys/public_key.der");
                match verify_license_file(&path, public_key) {
                    Ok(valid) => Ok(valid),
                    Err(e) => Err(e),
                }
            }
        }
        None => Err("无法确定许可证文件路径".into()),
    }
}

// 获取许可文件的路径
fn get_license_path() -> Option<PathBuf> {
    let home_dir = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .ok()
        .map(PathBuf::from);
    
    home_dir.map(|dir| dir.join(".drilltrack").join("license.dat"))
}

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
            activate_license
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
