use data_encoding::BASE64;
use ring::signature;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::Read;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct License {
    pub machine_id: String,
    pub expiration: Option<String>,
    pub features: Vec<String>,
    pub signature: String,
}

// 使用适当的签名验证验证许可证文件
#[warn(dead_code)]
pub fn verify_license_file(path: &PathBuf, public_key: &[u8]) -> Result<bool, String> {
    // Read the license file
    let mut file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut contents = Vec::new();
    file.read_to_end(&mut contents).map_err(|e| e.to_string())?;

    // Parse the license
    let license: License = serde_json::from_slice(&contents).map_err(|e| e.to_string())?;

    // Extract the signature
    let signature_bytes = BASE64
        .decode(license.signature.as_bytes())
        .map_err(|e| format!("Invalid signature encoding: {}", e))?;

    // Create a copy of the license without the signature for verification
    let mut license_for_verification = license.clone();
    license_for_verification.signature = String::new();
    let message = serde_json::to_vec(&license_for_verification)
        .map_err(|e| format!("Failed to serialize license: {}", e))?;

    // Create the public key object
    let public_key =
        signature::UnparsedPublicKey::new(&signature::RSA_PKCS1_2048_8192_SHA256, public_key);

    // Verify the signature
    match public_key.verify(&message, &signature_bytes) {
        Ok(_) => {
            // Check if the license has expired
            if let Some(expiration) = &license.expiration {
                // Parse the expiration date and compare with current date
                // This is simplified - you would use a proper date library
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
#[warn(dead_code)]
pub fn generate_hardware_id() -> String {
    let mut system_info = String::new();

    // CPU information
    if let Ok(cpuinfo) = fs::read_to_string("/proc/cpuinfo") {
        for line in cpuinfo.lines() {
            if line.starts_with("processor")
                || line.starts_with("model name")
                || line.starts_with("physical id")
            {
                system_info.push_str(line);
                system_info.push('\n');
            }
        }
    }

    // System UUID (works on Linux)
    if let Ok(uuid) = fs::read_to_string("/sys/class/dmi/id/product_uuid") {
        system_info.push_str(&uuid);
    }

    // MAC addresses
    if let Ok(entries) = fs::read_dir("/sys/class/net/") {
        for entry in entries.flatten() {
            let path = entry.path().join("address");
            if let Ok(mac) = fs::read_to_string(path) {
                if !mac.trim().is_empty() && mac.trim() != "00:00:00:00:00:00" {
                    system_info.push_str(&mac);
                    system_info.push('\n');
                }
            }
        }
    }

    // Hash the collected information
    let mut hasher = Sha256::new();
    hasher.update(system_info.as_bytes());
    let result = hasher.finalize();

    // Return the first 16 bytes as hex
    format!("{:x}", result)[..32].to_string()
}
