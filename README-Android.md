# DrillTrack Android 客户端集成指南

本文档介绍如何将您的Android应用程序与DrillTrack PC端软件集成，实现通过局域网发现和数据传输功能。

## 功能概述

DrillTrack PC软件现在支持以下功能：

1. 局域网设备发现：PC软件使用UDP广播在局域网中发布自己的存在
2. 数据接收服务器：PC软件内置HTTP服务器，接收来自Android应用的数据
3. 简单的REST API：Android应用可通过HTTP POST请求发送数据

## 连接步骤

### 1. 在PC端配置

1. 打开DrillTrack软件
2. 点击左侧菜单 "网络连接"
3. 在 "局域网发现服务" 部分设置服务名称和UDP端口
4. 点击 "启动发现服务" 按钮
5. 在 "数据接收服务器" 部分设置HTTP端口
6. 点击 "启动服务器" 按钮
7. PC和Android设备必须连接在同一局域网中

### 2. Android客户端发现和通信流程

1. Android应用在局域网中发送UDP广播消息
2. PC端服务器接收到广播后回复自己的地址和端口
3. Android应用获取服务器信息并建立HTTP连接
4. 使用HTTP API发送数据

## Android应用示例代码

以下是在Android应用程序中实现服务器发现和数据发送功能的示例代码：

### 1. 服务器发现部分

```kotlin
// 1. 添加网络相关权限到AndroidManifest.xml
// <uses-permission android:name="android.permission.INTERNET" />
// <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
// <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

// 2. 创建服务器发现类
class ServerDiscovery {
    private val serverInfoMap = ConcurrentHashMap<String, ServerInfo>()
    private var discoverySocket: DatagramSocket? = null
    private var listening = false
    
    data class ServerInfo(
        val name: String,
        val ipAddress: String,
        val httpPort: Int,
        val discoveryPort: Int
    )
    
    // 开始发现服务器
    fun startDiscovery(callback: (List<ServerInfo>) -> Unit) {
        if (listening) return
        listening = true
        
        // 创建广播套接字
        discoverySocket = DatagramSocket().apply {
            broadcast = true
        }
        
        // 启动监听线程
        Thread {
            val receiveBuffer = ByteArray(1024)
            val receivePacket = DatagramPacket(receiveBuffer, receiveBuffer.size)
            
            try {
                // 创建监听套接字
                DatagramSocket(9091).use { listenSocket ->
                    listenSocket.soTimeout = 5000 // 5秒超时
                    
                    while (listening) {
                        try {
                            // 接收服务器回复
                            listenSocket.receive(receivePacket)
                            val message = String(receivePacket.data, 0, receivePacket.length)
                            
                            // 解析JSON响应
                            val json = JSONObject(message)
                            if (json.getString("type") == "server_announce" || 
                                json.getString("type") == "server_response") {
                                
                                val serverInfo = ServerInfo(
                                    name = json.getString("name"),
                                    ipAddress = json.getString("ip"),
                                    httpPort = json.getInt("http_port"),
                                    discoveryPort = json.optInt("discovery_port", 9090)
                                )
                                
                                // 存储服务器信息
                                serverInfoMap[serverInfo.ipAddress] = serverInfo
                                
                                // 回调更新的服务器列表
                                callback(serverInfoMap.values.toList())
                            }
                        } catch (e: SocketTimeoutException) {
                            // 超时，发送新的广播
                            sendDiscoveryBroadcast()
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }.start()
        
        // 立即发送第一次广播
        sendDiscoveryBroadcast()
    }
    
    // 发送发现广播
    private fun sendDiscoveryBroadcast() {
        try {
            val discoveryMessage = JSONObject().apply {
                put("type", "client_discovery")
                put("client_id", Build.MODEL)
            }.toString()
            
            val messageBytes = discoveryMessage.toByteArray()
            
            // 广播地址
            val broadcastAddress = InetAddress.getByName("255.255.255.255")
            
            // 发送到服务器广播端口
            val packet = DatagramPacket(
                messageBytes, 
                messageBytes.size, 
                broadcastAddress, 
                9090 // 默认发现端口
            )
            
            discoverySocket?.send(packet)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    // 停止发现
    fun stopDiscovery() {
        listening = false
        discoverySocket?.close()
        discoverySocket = null
        serverInfoMap.clear()
    }
    
    // 获取已发现的服务器列表
    fun getDiscoveredServers(): List<ServerInfo> {
        return serverInfoMap.values.toList()
    }
}
```

### 2. 数据发送部分

```kotlin
// 1. 添加依赖（在app/build.gradle中）
// implementation 'com.squareup.retrofit2:retrofit:2.9.0'
// implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
// implementation 'com.google.code.gson:gson:2.10.1'

// 2. 创建API接口
interface DrillTrackApi {
    @POST("api/data")
    suspend fun sendData(@Body data: Map<String, Any>): Response<Map<String, String>>
}

// 3. 创建数据发送服务
class DataSenderService(private val serverInfo: ServerDiscovery.ServerInfo) {
    private val retrofit: Retrofit
    private val api: DrillTrackApi
    
    init {
        // 使用服务器信息创建Retrofit实例
        val baseUrl = "http://${serverInfo.ipAddress}:${serverInfo.httpPort}/"
        
        retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        
        api = retrofit.create(DrillTrackApi::class.java)
    }
    
    // 发送数据到服务器
    suspend fun sendData(dataMap: Map<String, Any>): Result<String> {
        return try {
            val response = api.sendData(dataMap)
            
            if (response.isSuccessful) {
                Result.success("数据发送成功: ${response.body()}")
            } else {
                Result.failure(Exception("发送失败: ${response.code()} - ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 3. 集成到Android应用中

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var serverDiscovery: ServerDiscovery
    private var dataSender: DataSenderService? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // 初始化服务器发现
        serverDiscovery = ServerDiscovery()
        
        // 开始服务器发现
        val buttonDiscover = findViewById<Button>(R.id.buttonDiscover)
        buttonDiscover.setOnClickListener {
            discoverServers()
        }
        
        // 发送数据按钮
        val buttonSend = findViewById<Button>(R.id.buttonSend)
        buttonSend.setOnClickListener {
            sendSampleData()
        }
    }
    
    private fun discoverServers() {
        serverDiscovery.startDiscovery { servers ->
            runOnUiThread {
                // 更新服务器列表UI
                val serverListView = findViewById<ListView>(R.id.serverList)
                val adapter = ArrayAdapter(
                    this,
                    android.R.layout.simple_list_item_1,
                    servers.map { "${it.name} (${it.ipAddress}:${it.httpPort})" }
                )
                serverListView.adapter = adapter
                
                // 点击选择服务器
                serverListView.setOnItemClickListener { _, _, position, _ ->
                    val selectedServer = servers[position]
                    dataSender = DataSenderService(selectedServer)
                    Toast.makeText(this, "已选择服务器: ${selectedServer.name}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    
    private fun sendSampleData() {
        val currentSender = dataSender ?: run {
            Toast.makeText(this, "请先选择服务器", Toast.LENGTH_SHORT).show()
            return
        }
        
        lifecycleScope.launch {
            try {
                // 创建示例数据
                val dataToSend = mapOf(
                    "timestamp" to System.currentTimeMillis(),
                    "deviceId" to Build.MODEL,
                    "dataType" to "DrillData",
                    "values" to listOf(
                        mapOf("key" to "depth", "value" to 123.45),
                        mapOf("key" to "pressure", "value" to 67.89)
                    )
                )
                
                // 发送数据
                val result = currentSender.sendData(dataToSend)
                
                // 显示结果
                withContext(Dispatchers.Main) {
                    result.fold(
                        onSuccess = { message ->
                            Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show()
                        },
                        onFailure = { error ->
                            Toast.makeText(this@MainActivity, "发送失败: ${error.message}", Toast.LENGTH_SHORT).show()
                        }
                    )
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "发送错误: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        serverDiscovery.stopDiscovery()
    }
}
```

## 数据格式

发送到DrillTrack PC端的数据应使用以下JSON格式：

```json
{
  "timestamp": 1686123456789,
  "deviceId": "Android-Device-001",
  "dataType": "DrillData",
  "values": [
    {"key": "depth", "value": 123.45},
    {"key": "pressure", "value": 67.89},
    {"key": "temperature", "value": 72.1}
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| timestamp | long | 数据采集的时间戳（毫秒） |
| deviceId | string | 设备标识符 |
| dataType | string | 数据类型标识符 |
| values | array | 数据键值对数组 |

## 连接问题排查

如果无法发现PC服务器或发送数据，请检查：

1. 确保PC和Android设备在同一局域网中
2. 检查PC防火墙设置（确保允许UDP和TCP端口访问）
3. 确认发现服务和数据服务器都已启动
4. 尝试手动设置服务器IP地址和端口进行测试
5. 检查网络连接状态和限制

## 最佳实践

1. 添加自动重连机制
2. 实现数据缓存，当网络断开时存储数据
3. 网络恢复后自动发送缓存的数据
4. 添加数据压缩以提高传输效率
5. 使用HTTPS提高安全性（生产环境中推荐）
6. 实现服务器认证机制，以防止连接到伪造的服务器 