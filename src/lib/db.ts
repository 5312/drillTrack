import { invoke } from '@tauri-apps/api/core'

export interface User {
  id?: number;
  name: string;
  email?: string;
  created_at?: string;
}

export interface DbStatus {
  initialized: boolean;
  path?: string;
}

export interface Repo {
  id?: number;
  name: string;
  mn_time: string;
  len: number;
  mine: string;
  work: string;
  factory: string;
  drilling: string;
}

export interface DataList {
  id?: number;
  time?: string;
  depth: number;
  pitch?: number;
  roll?: number;
  heading?: number;
  repo_id?: number;
  design_pitch?: number;
  design_heading?: number;
}

// 初始化数据库
export async function initDatabase(dbPath?: string): Promise<DbStatus> {
  return await invoke('init_database', { dbPath });
}

// 获取数据库状态
export async function getDbStatus(): Promise<DbStatus> {
  return await invoke('get_db_status');
}

// 关闭数据库连接
export async function closeDatabase(): Promise<void> {
  return await invoke('close_database');
}

// 执行自定义查询
export async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  return await invoke('execute_query', { sql, params });
}

// 用户相关操作

// 获取所有用户
export async function getAllUsers(): Promise<User[]> {
  return await invoke('get_all_users');
}

// 根据ID获取用户
export async function getUserById(id: number): Promise<User | null> {
  return await invoke('get_user_by_id', { id });
}

// 搜索用户
export async function searchUsers(query: string): Promise<User[]> {
  return await invoke('search_users', { query });
}

// 保存用户（新增或更新）
export async function saveUser(user: User): Promise<number> {
  return await invoke('save_user', { user });
}

// 删除用户
export async function deleteUser(id: number): Promise<boolean> {
  return await invoke('delete_user', { id });
}

// 获取所有仓库
export async function getAllRepos(): Promise<Repo[]> {
  return await invoke('get_all_repos');
}

// 根据 repo_id 获取 data_list 数据
export async function getDataListByRepoId(repoId: number): Promise<DataList[]> {
  return await invoke('get_data_list_by_repo_id', { repoId });
}

// 数据库使用示例
export async function dbUsageExample(): Promise<void> {
  try {
    // 初始化数据库
    const dbStatus = await initDatabase();
    console.log('数据库状态:', dbStatus);

    // 添加用户
    const newUserId = await saveUser({
      name: '张三',
      email: 'zhangsan@example.com'
    });
    console.log('新用户ID:', newUserId);

    // 查询所有用户
    const users = await getAllUsers();
    console.log('所有用户:', users);

    // 更新用户
    if (users.length > 0) {
      const user = users[0];
      user.name = '张三 (已更新)';
      await saveUser(user);
      console.log('用户已更新');
    }

    // 搜索用户
    const searchResults = await searchUsers('张');
    console.log('搜索结果:', searchResults);

    // 执行自定义查询
    const customQueryResults = await executeQuery(
      'SELECT * FROM users WHERE name LIKE ?',
      ['%张%']
    );
    console.log('自定义查询结果:', customQueryResults);

  } catch (error) {
    console.error('数据库操作失败:', error);
  }
} 