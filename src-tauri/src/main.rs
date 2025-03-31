#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod license_utils;

#[cfg(debug_assertions)]
// use license_utils::License;
#[cfg(not(debug_assertions))]
use license_utils::{generate_hardware_id, verify_license_file};

// use license_utils::{generate_hardware_id, verify_license_file, License};

use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use sysinfo::{CpuExt, System, SystemExt};
use tauri::api::path;

// 根据硬件信息获取唯一的机器ID
#[tauri::command]
fn get_machine_id() -> String {
    #[cfg(debug_assertions)]
    {
        // In debug mode, use a simpler machine ID generation 使用更简单的机器ID生成
        let mut system = System::new_all();
        system.refresh_all();

        // Collect hardware information
        let hostname = system.host_name().unwrap_or_else(|| "unknown".to_string());
        let cpu_info = system
            .cpus()
            .first()
            .map(|cpu| cpu.brand())
            .unwrap_or("unknown");
        let system_name = system.name().unwrap_or_else(|| "unknown".to_string());

        // Create a unique identifier from hardware info
        let machine_info = format!("{}:{}:{}", hostname, cpu_info, system_name);

        // Hash the machine info to create a machine ID
        let mut hasher = Sha256::new();
        hasher.update(machine_info.as_bytes());
        let result = hasher.finalize();

        // Return the first 16 bytes as hex
        format!("{:x}", result)[..32].to_string()
    }

    #[cfg(not(debug_assertions))]
    {
        // In production, use the more robust hardware ID generation 使用硬件Id生成
        generate_hardware_id()
    }
}

// 检查应用程序是否已激活
#[tauri::command]
fn check_activation() -> bool {
    match get_license_path() {
        Some(path) => {
            if path.exists() {
                // 在实际应用中，您会将公钥嵌入二进制文件中
                // 对于此示例，我们假设验证成功
                #[cfg(debug_assertions)]
                {
                    true // In debug mode, always return true if license file exists
                }

                #[cfg(not(debug_assertions))]
                {
                    // 在生产中，使用适当的验证
                    // 这是一个占位符 - 您将包含您的实际公钥
                    let public_key = include_bytes!("../public_key.der");
                    match verify_license_file(&path, public_key) {
                        Ok(valid) => valid,
                        Err(_) => false,
                    }
                }
            } else {
                false
            }
        }
        None => false,
    }
}

// 使用提供的密钥激活许可证
#[tauri::command]
fn activate_license(license_key: &str) -> Result<bool, String> {
    // Decode the license key from base64
    let license_data = match data_encoding::BASE64.decode(license_key.as_bytes()) {
        Ok(data) => data,
        Err(_) => return Err("Invalid license key format".into()),
    };

    // Save the license file
    match get_license_path() {
        Some(path) => {
            if let Some(parent) = path.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                }
            }

            fs::write(&path, &license_data).map_err(|e| e.to_string())?;

            // Verify the license file
            #[cfg(debug_assertions)]
            {
                // In debug mode, assume the license is valid
                Ok(true)
            }

            #[cfg(not(debug_assertions))]
            {
                // In production, use proper verification
                // This is a placeholder - you would include your actual public key
                let public_key = include_bytes!("../public_key.der");
                match verify_license_file(&path, public_key) {
                    Ok(valid) => Ok(valid),
                    Err(e) => Err(e),
                }
            }
        }
        None => Err("Could not determine license file path".into()),
    }
}

// 获取许可文件的路径
fn get_license_path() -> Option<PathBuf> {
    match path::app_config_dir(&tauri::Config::default()) {
        Some(app_dir) => Some(app_dir.join("license.dat")),
        None => None,
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_machine_id,
            check_activation,
            activate_license
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
