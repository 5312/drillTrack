import { DataList } from "./db"

/**
 * 计算左右位移
 * @param row 数据行
 * @param magneticDeclination 磁偏角
 * @returns 左右位移值（米）
 */
export function calculateLateralDisplacement(row: DataList, magneticDeclination: string): number {
  const rodLength = row.depth // 钻杆长度，单位：米
  const pitchRad = (row.pitch * Math.PI) / 180 // 将俯仰角转换为弧度
  
  // 计算设计方位角（磁方位角 + 磁偏角）
  const designHeading = (row.design_heading || 0) + Number(magneticDeclination)
  
  // 计算方位差（实际方位角 - 设计方位角）
  const headingDiffRad = ((row.heading || 0) - designHeading) * Math.PI / 180
  
  // X左右偏移 = L ⋅ cos(I) ⋅ sin(A real − A design )
  return rodLength * Math.cos(pitchRad) * Math.sin(headingDiffRad)
}

/**
 * 计算上下位移
 * @param row 数据行
 * @returns 上下位移值（米）
 */
export function calculateVerticalDisplacement(row: DataList): number {
  const rodLength = row.depth // 钻杆长度，单位：米
  const pitchRad = (row.pitch * Math.PI) / 180 // 将俯仰角转换为弧度
  // 上下位移 = L ⋅ sin(I)
  return rodLength * Math.sin(pitchRad)
}

/**
 * 计算设计上下位移
 * @param row 数据行
 * @returns 设计上下位移值（米）
 */
export function calculateDesignVerticalDisplacement(row: DataList): number {
  const rodLength = row.depth // 钻杆长度，单位：米
  const designPitchRad = (row.design_pitch * Math.PI) / 180 // 将设计俯仰角转换为弧度
  // 设计上下位移 = L ⋅ sin(I设计)
  return rodLength * Math.sin(designPitchRad)
}

/**
 * 计算CAD平面坐标
 * @param row 数据行
 * @param magneticDeclination 磁偏角
 * @returns CAD平面坐标 {x, y}
 */
export function calculateCADCoordinates(row: DataList, _magneticDeclination: string): { x: number, y: number } {
  const rodLength = row.depth // 钻杆长度，单位：米
  const pitchRad = (row.pitch * Math.PI) / 180 // 将俯仰角转换为弧度
  
  // 计算方位差（90 - 实际方位角）
  const headingDiffRad = (90 - (row.heading || 0)) * Math.PI / 180
  
  // X坐标 = L ⋅ cos(I) ⋅ cos(A)
  const x = rodLength * Math.cos(pitchRad) * Math.cos(headingDiffRad)
  
  // Y坐标 = L ⋅ cos(I) ⋅ sin(A)
  const y = rodLength * Math.cos(pitchRad) * Math.sin(headingDiffRad)
  
  return { x, y }
}

/**
 * 计算CAD剖面坐标
 * @param row 数据行
 * @returns CAD剖面坐标 {x, y}
 */
export function calculateCADProfileCoordinates(row: DataList): { x: number, y: number } {
  const rodLength = row.depth // 钻杆长度，单位：米
  const pitchRad = (row.pitch * Math.PI) / 180 // 将俯仰角转换为弧度
  
  // X坐标 = L ⋅ cos(I)
  const x = rodLength * Math.cos(pitchRad)
  
  // Y坐标 = L ⋅ sin(I)
  const y = rodLength * Math.sin(pitchRad)
  
  return { x, y }
} 