import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core'
import { getAllRepos, Repo } from '../lib/db';
import { HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

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

  // 仓库数据
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState('');

  // 刷新状态
  const refreshStatus = async () => {
    try {
      const discoveryData = await invoke<DiscoveryStatus>('get_discovery_status');
      setDiscoveryStatus(discoveryData);
      
      // 使用新的命令获取数据服务器状态
      try {
        const dataServerStatus = await invoke<DataServerStatus>('get_data_server_status');
        setServerStatus(dataServerStatus);
      } catch (serverErr) {
        console.error('获取数据服务器状态失败:', serverErr);
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

  const fetchRepos = async () => {
    setRepoLoading(true);
    setRepoError('');
    try {
      const data = await getAllRepos();
      setRepos(data);
    } catch (err: any) {
      setRepoError('获取仓库数据失败: ' + err.toString());
    } finally {
      setRepoLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">网络设置</h1>
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
              <HelpCircle className="h-4 w-4" />
              <span>使用说明</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>网络设置使用说明</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-medium">连接步骤：</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>确保PC和Android设备连接到同一局域网。</li>
                <li>在PC端启动局域网发现服务，设置服务名称和UDP端口。</li>
                <li>启动数据接收服务器，设置HTTP端口。</li>
                <li>Android设备可以通过UDP广播发现PC服务器，然后通过HTTP协议发送数据。</li>
                <li>Android客户端示例代码已在集成指南中提供。</li>
              </ol>
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="font-medium mb-2">注意事项：</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>端口号范围必须在1-65535之间</li>
                  <li>确保防火墙不会阻止相关端口的通信</li>
                  <li>建议使用默认端口号，除非有特殊需求</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 局域网发现服务配置 */}
        <div className="bg-white shadow-md rounded p-4">
          <h2 className="text-lg font-semibold mb-3">局域网发现服务</h2>

          <div className="mb-3">
            <div className="flex items-center mb-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${discoveryStatus.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{discoveryStatus.active ? '发现服务已开启' : '发现服务已关闭'}</span>
            </div>

            {discoveryStatus.active && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                <p><span className="font-medium">服务名称:</span> {discoveryStatus.server_name}</p>
                <p><span className="font-medium">UDP端口:</span> {discoveryStatus.port}</p>
                <p><span className="font-medium">已发现客户端:</span> {discoveryStatus.discovered_clients.length}</p>
                {discoveryStatus.discovered_clients.length > 0 && (
                  <div className="mt-1">
                    <p className="font-medium">客户端列表:</p>
                    <ul className="list-disc ml-4 text-xs">
                      {discoveryStatus.discovered_clients.map((client, index) => (
                        <li key={index}>{client}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              服务名称
            </label>
            <input
              type="text"
              disabled
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-1 px-2 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              UDP端口
            </label>
            <input
              type="number"
              disabled
              value={discoveryPort}
              onChange={(e) => setDiscoveryPort(e.target.value)}
              className="shadow appearance-none border rounded w-full py-1 px-2 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleStartDiscovery}
              disabled={discoveryStatus.active}
              className={`bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline ${discoveryStatus.active ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              启动发现服务
            </button>
            <button
              onClick={handleStopDiscovery}
              disabled={!discoveryStatus.active}
              className={`bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline ${!discoveryStatus.active ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              停止发现服务
            </button>
          </div>
        </div>

        {/* 数据服务器配置 */}
        <div className="bg-white shadow-md rounded p-4">
          <h2 className="text-lg font-semibold mb-3">数据接收服务器</h2>

          <div className="mb-3">
            <div className="flex items-center mb-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${serverStatus.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{serverStatus.running ? '服务器已启动' : '服务器已停止'}</span>
            </div>

            {serverStatus.running && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                <p><span className="font-medium">IP地址:</span> {serverStatus.ip_address}</p>
                <p><span className="font-medium">HTTP端口:</span> {serverStatus.port}</p>
                <p><span className="font-medium">已接收数据条数:</span> {serverStatus.received_data_count}</p>
                <p className="mt-1 text-xs"><span className="font-medium">API地址:</span> http://{serverStatus.ip_address}:{serverStatus.port}/api/data</p>
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              HTTP端口
            </label>
            <input
              disabled
              type="number"
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              className="shadow appearance-none border rounded w-full py-1 px-2 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleStartServer}
              disabled={serverStatus.running}
              className={`bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline ${serverStatus.running ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              启动服务器
            </button>
            <button
              onClick={handleStopServer}
              disabled={!serverStatus.running}
              className={`bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline ${!serverStatus.running ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              停止服务器
            </button>
          </div>
        </div>
      </div>

      {/* 仓库数据 */}
      <div className="bg-white shadow-md rounded p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">报表数据</h2>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded"
            onClick={fetchRepos}
            disabled={repoLoading}
          >
            {repoLoading ? '加载中...' : '刷新'}
          </button>
        </div>
        {repoError && <div className="text-red-500 text-sm mb-2">{repoError}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-xs">ID</th>
                <th className="border px-2 py-1 text-xs">报表名称</th>
                <th className="border px-2 py-1 text-xs">钻杆长度</th>
                <th className="border px-2 py-1 text-xs">矿区</th>
                <th className="border px-2 py-1 text-xs">工作面</th>
                <th className="border px-2 py-1 text-xs">钻厂</th>
                <th className="border px-2 py-1 text-xs">钻孔</th>
                <th className="border px-2 py-1 text-xs">时间</th>

              </tr>
            </thead>
            <tbody>
              {repos.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-2 text-sm">暂无数据</td></tr>
              ) : (
                repos.map(repo => (
                  <tr key={repo.id}>
                    <td className="border px-2 py-1 text-xs">{repo.id}</td>
                    <td className="border px-2 py-1 text-xs">{repo.name}</td>
                    <td className="border px-2 py-1 text-xs">{repo.len}</td>
                    <td className="border px-2 py-1 text-xs">{repo.mine}</td>
                    <td className="border px-2 py-1 text-xs">{repo.work}</td>
                    <td className="border px-2 py-1 text-xs">{repo.factory}</td>
                    <td className="border px-2 py-1 text-xs">{repo.drilling}</td>
                    <td className="border px-2 py-1 text-xs">{repo.mn_time}</td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NetworkPage; 