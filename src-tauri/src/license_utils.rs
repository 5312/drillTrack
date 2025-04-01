use data_encoding::BASE64;
use ring::signature;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::Read;
use std::path::PathBuf;
use sysinfo::{System, SystemExt};
use std::process::Command;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct License {
    pub machine_id: String,
    pub expiration: Option<String>,
    pub features: Vec<String>,
    pub signature: String,
}

// 使用适当的签名验证验证许可证文件
pub fn verify_license_file(path: &PathBuf, public_key: &[u8]) -> Result<bool, String> {
    // 读取许可证文件
    let mut file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut contents = Vec::new();
    file.read_to_end(&mut contents).map_err(|e| e.to_string())?;

    // 解析许可证
    let license: License = serde_json::from_slice(&contents).map_err(|e| e.to_string())?;

    // 提取签名
    let signature_bytes = BASE64
        .decode(license.signature.as_bytes())
        .map_err(|e| format!("Invalid signature encoding: {}", e))?;

    // 创建没有签名的许可证副本用于验证
    let mut license_for_verification = license.clone();
    license_for_verification.signature = String::new();
    let message = serde_json::to_vec(&license_for_verification)
        .map_err(|e| format!("Failed to serialize license: {}", e))?;

    // 创建公钥对象
    let public_key =
        signature::UnparsedPublicKey::new(&signature::ED25519, public_key);

    // 验证签名
    match public_key.verify(&message, &signature_bytes) {
        Ok(_) => {
            // 验证机器ID是否匹配
            let current_machine_id = generate_hardware_id();
            if license.machine_id != current_machine_id {
                return Ok(false);
            }
            
            // 检查许可证是否过期
            if let Some(expiration) = &license.expiration {
                if expiration < &chrono::Utc::now().to_rfc3339() {
                    return Ok(false);
                }
            }

            Ok(true)
        }
        Err(_) => Ok(false),
    }
}

// 生成防篡改的硬件ID
pub fn generate_hardware_id() -> String {
    let mut system_info = String::new();
    
    // 初始化系统信息
    let mut system = System::new_all();
    system.refresh_all();
    
    // 获取主机名和系统信息
    if let Some(hostname) = system.host_name() {
        system_info.push_str(&format!("hostname:{}\n", hostname));
    }

    if let Some(system_name) = system.name() {
        system_info.push_str(&format!("system:{}\n", system_name));
    }

    if let Some(kernel_version) = system.kernel_version() {
        system_info.push_str(&format!("kernel:{}\n", kernel_version));
    }
    
    // 获取系统UUID
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = Command::new("wmic").args(["csproduct", "get", "UUID"]).output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if let Some(uuid_line) = stdout.lines().nth(1) {
                system_info.push_str(&format!("uuid:{}\n", uuid_line.trim()));
            }
        }
    }
    
    // 对收集的信息进行哈希处理
    let mut hasher = Sha256::new();
    hasher.update(system_info.as_bytes());
    let result = hasher.finalize();

    // 返回前32个字符作为十六进制格式
    format!("{:x}", result)[..32].to_string()
}

// 创建许可证数据
pub fn create_license(machine_id: &str, expiration: Option<String>, features: Vec<String>, private_key: &[u8]) -> Result<String, String> {
    let license = License {
        machine_id: machine_id.to_string(),
        expiration,
        features,
        signature: String::new(),
    };
    
    // 序列化许可证数据
    let license_data = serde_json::to_vec(&license)
        .map_err(|e| format!("Failed to serialize license: {}", e))?;
    
    // 使用私钥签名
    let private_key = signature::Ed25519KeyPair::from_pkcs8(private_key)
        .map_err(|_| "Invalid private key".to_string())?;
    
    let signature_bytes = private_key.sign(license_data.as_ref());
    
    // 创建带有签名的完整许可证
    let mut signed_license = license;
    signed_license.signature = BASE64.encode(signature_bytes.as_ref());
    
    // 序列化完整的许可证并返回
    let signed_license_data = serde_json::to_string(&signed_license)
        .map_err(|e| format!("Failed to serialize signed license: {}", e))?;
    
    Ok(BASE64.encode(signed_license_data.as_bytes()))
}
