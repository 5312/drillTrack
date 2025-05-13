# DrillTrack 软件

DrillTrack 是一款用于钻井数据处理和可视化的软件，基于 Tauri 和 React 构建。

## 功能特点

- **钻井数据处理**：处理XML格式的钻井数据，转换为易于分析的格式
- **数据可视化**：通过图表直观展示钻井相关数据
- **导出功能**：支持导出数据到Excel格式
- **安全保障**：通过许可证激活系统保护软件
- **设备互联**：支持PC与Android设备间的数据传输
  - 热点创建：PC端可创建WiFi热点供Android设备连接
  - 数据接收：内置HTTP服务器接收来自Android设备的数据

## 系统要求

- **操作系统**：Windows 10/11
- **硬件**：支持WiFi热点功能的网卡

## PC与Android设备连接

DrillTrack现支持将PC作为热点，使Android设备能够连接并传输数据：

1. 在PC软件的网络页面创建热点
2. Android设备连接到该热点
3. 使用HTTP API向PC传输数据

详细连接说明请参阅 [Android客户端集成指南](./README-Android.md)。

## 开发技术

- **前端**：React, TypeScript
- **后端**：Rust, Tauri
- **网络通信**：Tokio, Warp

## 许可证

本软件需要激活后使用。请联系管理员获取许可证。

## 最近更新

### 网络功能

- 已修复局域网发现服务中`tokio::net::UdpSocket`的`.clone()`方法使用问题
- 更新了UDP广播设备发现功能，确保在局域网中正确发现Android设备
- 优化了HTTP服务器数据接收功能

### 开发说明

- `tokio::net::UdpSocket`使用`.clone()`方法而不是`.try_clone().await`进行克隆
- 确保在同一局域网内的设备间通信正常工作
- Android集成指南提供了完整的客户端开发示例
