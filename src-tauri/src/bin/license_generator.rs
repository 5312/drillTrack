use std::env;
use std::fs::{self, File};
use std::io::Read;
use std::path::Path;
use chrono::{Duration, Utc};
use data_encoding::BASE64;

// 引用license_utils模块
use drilltrack::license_utils;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        println!("用法: license_generator <机器ID> [有效期天数] [特性1,特性2,...]");
        return;
    }

    let machine_id = &args[1];
    
    // 默认有效期为1年
    let days = if args.len() > 2 {
        args[2].parse::<i64>().unwrap_or(365)
    } else {
        365
    };
    
    // 默认没有特殊特性
    let features = if args.len() > 3 {
        args[3].split(',').map(|s| s.to_string()).collect()
    } else {
        Vec::new()
    };
    
    // 计算过期时间
    let expiration = if days > 0 {
        Some((Utc::now() + Duration::days(days)).to_rfc3339())
    } else {
        None // 永久许可证
    };
    
    // 读取私钥文件
    let private_key_path = Path::new("keys/private_key.der");
    if !private_key_path.exists() {
        println!("错误：找不到私钥文件。请先运行keygen工具生成密钥对。");
        return;
    }
    
    let mut private_key_file = File::open(private_key_path).expect("无法打开私钥文件");
    let mut private_key_data = Vec::new();
    private_key_file.read_to_end(&mut private_key_data).expect("无法读取私钥文件");
    
    // 创建许可证
    match license_utils::create_license(machine_id, expiration.clone(), features.clone(), &private_key_data) {
        Ok(license_key) => {
            // 保存许可证到文件
            let license_file_path = format!("licenses/{}.lic", machine_id);
            let license_dir = Path::new("licenses");
            if !license_dir.exists() {
                fs::create_dir_all(license_dir).expect("无法创建许可证目录");
            }
            
            fs::write(&license_file_path, license_key.as_bytes()).expect("无法写入许可证文件");
            
            println!("许可证创建成功！");
            println!("机器ID: {}", machine_id);
            println!("有效期: {}", expiration.unwrap_or_else(|| "永久".to_string()));
            if !features.is_empty() {
                println!("特性: {}", features.join(", "));
            }
            println!("许可证文件已保存到: {}", license_file_path);
            println!("\n许可证密钥（用于激活）:");
            println!("{}", license_key);
        },
        Err(e) => {
            println!("创建许可证失败: {}", e);
        }
    }
} 