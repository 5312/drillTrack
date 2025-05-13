import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core'

interface DiscoveryStatus {
  active: boolean;
  port: number;
  server_name: string;
  discovered_clients: string[];
}

interface DataServerStatus {
  running: boolean;
  port: number;
  received_data_count: number;
  ip_address: string;
}

const NetworkPage: React.FC = () => {
  // 发现服务状态
  const [discoveryStatus, setDiscoveryStatus] = useState<DiscoveryStatus>({
    active: false,
    port: 9090,
    server_name: '钻孔轨迹仪数据处理系统',
    discovered_clients: []
  });

  // 数据服务器状态
  const [serverStatus, setServerStatus] = useState<DataServerStatus>({
    running: false,
    port: 8080,
    received_data_count: 0,
    ip_address: '127.0.0.1'
  });

  // 表单输入
  const [serverName, setServerName] = useState('钻孔轨迹仪数据处理系统');
  const [discoveryPort, setDiscoveryPort] = useState('9090');
  const [serverPort, setServerPort] = useState('8080');

  // 错误信息
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 刷新状态
  const refreshStatus = async () => {
    try {
      const discoveryData = await invoke<DiscoveryStatus>('get_discovery_status');
      setDiscoveryStatus(discoveryData);
      
      // 如果数据服务器正在运行，获取其状态
      if (serverStatus.running) {
        const dataServerStatus = await invoke<DataServerStatus>('start_data_server');
        setServerStatus(dataServerStatus);
      }
    } catch (err) {
      console.error('获取网络状态失败:', err);
    }
  };

  // 初始加载时获取状态
  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 5000); // 每5秒刷新一次
    return () => clearInterval(interval);
  }, []);

  // 启动发现服务
  const handleStartDiscovery = async () => {
    setError('');
    setSuccess('');

    try {
      const port = parseInt(discoveryPort);
      if (isNaN(port) || port <= 0 || port > 65535) {
        setError('请输入有效的发现服务端口号 (1-65535)');
        return;
      }

      const result = await invoke<DiscoveryStatus>('start_discovery_service', {
        port,
        serverName
      });

      setDiscoveryStatus(result);
      setSuccess('局域网发现服务已启动');
    } catch (err: any) {
      setError(err.toString());
    }
  };

  // 停止发现服务
  const handleStopDiscovery = async () => {
    setError('');
    setSuccess('');

    try {
      const result = await invoke<DiscoveryStatus>('stop_discovery_service');
      setDiscoveryStatus(result);
      setSuccess('局域网发现服务已停止');
    } catch (err: any) {
      setError(err.toString());
    }
  };

  // 启动数据服务器
  const handleStartServer = async () => {
    setError('');
    setSuccess('');

    try {
      const port = parseInt(serverPort);
      if (isNaN(port) || port <= 0 || port > 65535) {
        setError('请输入有效的端口号 (1-65535)');
        return;
      }

      const result = await invoke<DataServerStatus>('start_data_server', {
        port
      });

      setServerStatus(result);
      setSuccess('数据服务器已启动');
    } catch (err: any) {
      setError(err.toString());
    }
  };

  // 停止数据服务器
  const handleStopServer = async () => {
    setError('');
    setSuccess('');

    try {
      const result = await invoke<DataServerStatus>('stop_data_server');
      setServerStatus(result);
      setSuccess('数据服务器已停止');
    } catch (err: any) {
      setError(err.toString());
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">网络设置</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 局域网发现服务配置 */}
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-semibold mb-4">局域网发现服务</h2>

          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${discoveryStatus.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{discoveryStatus.active ? '发现服务已开启' : '发现服务已关闭'}</span>
            </div>

            {discoveryStatus.active && (
              <div className="mt-2 p-3 bg-gray-100 rounded">
                <p><span className="font-medium">服务名称:</span> {discoveryStatus.server_name}</p>
                <p><span className="font-medium">UDP端口:</span> {discoveryStatus.port}</p>
                <p><span className="font-medium">已发现客户端:</span> {discoveryStatus.discovered_clients.length}</p>
                {discoveryStatus.discovered_clients.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">客户端列表:</p>
                    <ul className="list-disc ml-5">
                      {discoveryStatus.discovered_clients.map((client, index) => (
                        <li key={index}>{client}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              服务名称
            </label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              UDP端口
            </label>
            <input
              type="number"
              value={discoveryPort}
              onChange={(e) => setDiscoveryPort(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleStartDiscovery}
              disabled={discoveryStatus.active}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${discoveryStatus.active ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              启动发现服务
            </button>
            <button
              onClick={handleStopDiscovery}
              disabled={!discoveryStatus.active}
              className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${!discoveryStatus.active ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              停止发现服务
            </button>
          </div>
        </div>

        {/* 数据服务器配置 */}
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-semibold mb-4">数据接收服务器</h2>

          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${serverStatus.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{serverStatus.running ? '服务器已启动' : '服务器已停止'}</span>
            </div>

            {serverStatus.running && (
              <div className="mt-2 p-3 bg-gray-100 rounded">
                <p><span className="font-medium">IP地址:</span> {serverStatus.ip_address}</p>
                <p><span className="font-medium">HTTP端口:</span> {serverStatus.port}</p>
                <p><span className="font-medium">已接收数据条数:</span> {serverStatus.received_data_count}</p>
                <p className="mt-2 text-sm"><span className="font-medium">API地址:</span> http://{serverStatus.ip_address}:{serverStatus.port}/api/data</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              HTTP端口
            </label>
            <input
              type="number"
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleStartServer}
              disabled={serverStatus.running}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${serverStatus.running ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              启动服务器
            </button>
            <button
              onClick={handleStopServer}
              disabled={!serverStatus.running}
              className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${!serverStatus.running ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              停止服务器
            </button>
          </div>
        </div>
      </div>

      {/* 帮助信息 */}
      <div className="mt-8 bg-white shadow-md rounded p-6">
        <h2 className="text-xl font-semibold mb-4">使用说明</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>确保PC和Android设备连接到同一局域网。</li>
          <li>在PC端启动局域网发现服务，设置服务名称和UDP端口。</li>
          <li>启动数据接收服务器，设置HTTP端口。</li>
          <li>Android设备可以通过UDP广播发现PC服务器，然后通过HTTP协议发送数据。</li>
          <li>Android客户端示例代码已在集成指南中提供。</li>
        </ol>
      </div>
    </div>
  );
};

export default NetworkPage; 