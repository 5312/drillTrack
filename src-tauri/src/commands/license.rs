use std::fs;

use crate::utils::license::{generate_hardware_id, verify_license_file, get_license_path, get_license_info, is_license_expired, License};

// 根据硬件信息获取唯一的机器ID
#[tauri::command]
pub fn get_machine_id() -> String {
    generate_hardware_id()
}

// 导出机器ID到文件
#[tauri::command]
pub fn export_machine_id(file_path: &str) -> Result<(), String> {
    let machine_id = generate_hardware_id();
    fs::write(file_path, machine_id).map_err(|e| e.to_string())
}

// 检查应用程序是否已激活
#[tauri::command]
pub fn check_activation() -> bool {
    
    let path = match get_license_path() {
        Some(p) => p,
        None => return false,
    };
  

    if !path.exists() {
        return false;
    }
    println!("路径地址：{:?}",path);
    return true;
   /*  // 发布模式：验证许可证内容
    let public_key = include_bytes!("../../keys/public_key.der");
    match verify_license_file(&path, public_key) {
        Ok(valid) => valid,
        Err(_) => false,
    } */
}

// 使用提供的密钥激活许可证
#[tauri::command]
pub fn activate_license(license_key: &str) -> Result<bool, String> {
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

            // 在生产模式下使用正确的验证
            let public_key = include_bytes!("../../keys/public_key.der");
            match verify_license_file(&path, public_key) {
                Ok(valid) => Ok(valid),
                Err(e) => Err(e),
            }
        }
        None => Err("无法确定许可证文件路径".into()),
    }
}

// 获取许可证信息
#[tauri::command]
pub fn get_license_info_command() -> Result<License, String> {
    let path = match get_license_path() {
        Some(p) => p,
        None => return Err("无法确定许可证文件路径".into()),
    };

    if !path.exists() {
        return Err("许可证文件不存在".into());
    }

    // 获取许可证信息
    let license = get_license_info(&path)?;
    
    // 验证许可证是否有效
    let public_key = include_bytes!("../../keys/public_key.der");
    let is_valid = verify_license_file(&path, public_key).map_err(|e| e.to_string())?;
    
    if !is_valid {
        return Err("许可证无效".into());
    }
    
    Ok(license)
}

// 检查许可证是否过期
#[tauri::command]
pub fn is_license_expired_command() -> Result<bool, String> {
    let path = match get_license_path() {
        Some(p) => p,
        None => return Err("无法确定许可证文件路径".into()),
    };

    if !path.exists() {
        return Err("许可证文件不存在".into());
    }

    // 获取许可证信息
    let license = get_license_info(&path)?;
    
    Ok(is_license_expired(&license))
}

// 从文件导入许可证
#[tauri::command]
pub fn import_license_from_file(file_path: &str) -> Result<bool, String> {
    // 读取许可证文件
    let license_data = match fs::read(file_path) {
        Ok(data) => data,
        Err(e) => return Err(format!("无法读取许可证文件: {}", e)),
    };

    // 保存许可证文件到应用程序目录
    match get_license_path() {
        Some(path) => {
            if let Some(parent) = path.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                }
            }

            fs::write(&path, &license_data).map_err(|e| e.to_string())?;

            // 验证许可证文件
            let public_key = include_bytes!("../../keys/public_key.der");
            match verify_license_file(&path, public_key) {
                Ok(valid) => {
                    if valid {
                        Ok(true)
                    } else {
                        // 如果验证失败，删除导入的许可证
                        let _ = fs::remove_file(&path);
                        Err("许可证无效或与此机器不匹配".into())
                    }
                }
                Err(e) => {
                    // 如果验证出错，删除导入的许可证
                    let _ = fs::remove_file(&path);
                    Err(e)
                }
            }
        }
        None => Err("无法确定许可证文件路径".into()),
    }
}
