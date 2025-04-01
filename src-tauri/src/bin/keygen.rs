use ring::rand::SystemRandom;
use ring::signature::{Ed25519KeyPair, KeyPair};
use std::env;
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;

fn main() {
    let args: Vec<String> = env::args().collect();
    let output_dir = if args.len() > 1 {
        &args[1]
    } else {
        "keys"
    };

    // 确保输出目录存在
    let output_path = Path::new(output_dir);
    if !output_path.exists() {
        fs::create_dir_all(output_path).expect("无法创建输出目录");
    }

    println!("正在生成ED25519密钥对...");
    
    // 生成随机数
    let rng = SystemRandom::new();
    
    // 生成ED25519密钥对 
    let pkcs8_bytes = Ed25519KeyPair::generate_pkcs8(&rng)
        .expect("生成密钥对失败");
    
    // 保存私钥
    let private_key_path = output_path.join("private_key.der");
    let mut private_key_file = File::create(&private_key_path).expect("无法创建私钥文件");
    private_key_file.write_all(pkcs8_bytes.as_ref()).expect("无法写入私钥文件");
    println!("私钥已保存到: {}", private_key_path.display());
    
    // 从PKCS#8数据创建密钥对
    let key_pair = Ed25519KeyPair::from_pkcs8(pkcs8_bytes.as_ref()).expect("无法从PKCS#8数据加载密钥对");
    
    // 获取公钥
    let public_key_bytes = key_pair.public_key().as_ref();
    
    // 保存公钥
    let public_key_path = output_path.join("public_key.der");
    let mut public_key_file = File::create(&public_key_path).expect("无法创建公钥文件");
    public_key_file.write_all(public_key_bytes).expect("无法写入公钥文件");
    println!("公钥已保存到: {}", public_key_path.display());
    
    println!("密钥对生成完成！");
} 