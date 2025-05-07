import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { save } from '@tauri-apps/api/dialog';

const Activation = () => {
  const [machineId, setMachineId] = useState<string>('');
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [activationError, setActivationError] = useState<string>('');
  const [activating, setActivating] = useState<boolean>(false);
  // 检查应用是否已经激活
  const checkActivation = async () => {
   
    try {
      const activated: boolean = await invoke('check_activation');
      setIsActivated(activated);
    } catch (error) {
      console.error('无法检查激活状态:', error);
    }
  };

  // 获取机器ID
  const getMachineId = async () => {
    try {
      const id: string = await invoke('get_machine_id');
      setMachineId(id);
    } catch (error) {
      console.error('无法获取机器ID:', error);
    }
  };

  // 激活许可证
  const activateLicense = async () => {
    if (!licenseKey.trim()) {
      setActivationError('请输入许可证密钥');
      return;
    }

    setActivating(true);
    setActivationError('');

    try {
      const result: boolean = await invoke('activate_license', { licenseKey });
      if (result) {
        setIsActivated(true);
        setLicenseKey('');
      } else {
        setActivationError('许可证验证失败');
      }
    } catch (error) {
      setActivationError(`激活错误: ${error}`);
    } finally {
      setActivating(false);
    }
  };

  // 导出机器ID到文件
  const exportMachineId = async () => {
    try {
      const filePath = await save({
        filters: [{ name: '文本文件', extensions: ['txt'] }],
        defaultPath: `机器ID-${machineId}.txt`,
      });
      
      if (filePath) {
        await invoke('export_machine_id', { filePath });
        alert('机器ID已成功导出！');
      }
    } catch (error) {
      alert(`导出失败: ${error}`);
    }
  };

  useEffect(() => {
    getMachineId();
    checkActivation();
  }, []);

  if (isActivated) {
    return (
      <div className="activation-page">
        <div className="activation-container">
          <h2 className="text-center text-2xl font-bold mb-6">软件已激活</h2>
          <p className="text-center text-green-600 mb-4">
            感谢您激活本软件。您现在可以使用所有功能。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="activation-page">
      <div className="activation-container bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
        <h2 className="text-center text-2xl font-bold mb-6">软件激活</h2>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">您的机器ID</label>
          <div className="flex">
            <input
              type="text"
              value={machineId}
              readOnly
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md bg-gray-100"
            />
            <button
              onClick={exportMachineId}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-r-md"
            >
              导出
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            请将此机器ID提供给软件供应商以获取许可证
          </p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="licenseKey" className="block text-gray-700 mb-2">
            许可证密钥
          </label>
          <textarea
            id="licenseKey"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="请输入您的许可证密钥"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {activationError && (
            <p className="mt-2 text-sm text-red-600">{activationError}</p>
          )}
        </div>
        
        <button
          onClick={activateLicense}
          disabled={activating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:bg-blue-400"
        >
          {activating ? '激活中...' : '激活软件'}
        </button>
      </div>
    </div>
  );
};

export default Activation; 