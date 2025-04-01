"use client"

import { useRef, useEffect } from "react"
import { useDrillingData } from "../context/drilling-data-context"
import { Loader2 } from "lucide-react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

export function Chart3D() {
  const { drillingData, isLoading } = useDrillingData()
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    if (isLoading || !containerRef.current) return

    // 初始化场景
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)
    sceneRef.current = scene

    // 初始化相机
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.set(5, 5, 10)
    cameraRef.current = camera

    // 初始化渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 添加轨道控制
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controlsRef.current = controls

    // 添加坐标轴
    const axesHelper = new THREE.AxesHelper(10)
    scene.add(axesHelper)

    // 添加网格
    const gridHelper = new THREE.GridHelper(10, 10)
    scene.add(gridHelper)

    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7.5)
    scene.add(directionalLight)

    // 创建钻孔路径
    if (drillingData.length > 0) {
      // 创建路径点
      const points = drillingData.map((point) => {
        // 使用x, y, z坐标，或者根据需要计算
        return new THREE.Vector3(
          point.x || 0,
          point.y || 0,
          -Number.parseFloat(point.depth), // 负值使钻孔向下延伸
        )
      })

      // 创建曲线
      const curve = new THREE.CatmullRomCurve3(points)
      const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.1, 8, false)
      const tubeMaterial = new THREE.MeshStandardMaterial({
        color: 0x0088ff,
        metalness: 0.3,
        roughness: 0.5,
      })
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial)
      scene.add(tube)

      // 添加测点球体
      points.forEach((point, index) => {
        const sphereGeometry = new THREE.SphereGeometry(0.15, 16, 16)
        const sphereMaterial = new THREE.MeshStandardMaterial({
          color: index === 0 ? 0xff0000 : 0x00ff00,
          metalness: 0.3,
          roughness: 0.5,
        })
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        sphere.position.copy(point)
        scene.add(sphere)

        // 添加测点标签
        const div = document.createElement("div")
        div.className = "absolute text-xs bg-white px-1 py-0.5 rounded shadow pointer-events-none"
        div.textContent = `点${index + 1}: 深度${drillingData[index].depth}m`
        div.style.display = "none" // 初始隐藏

        containerRef.current.appendChild(div)

        // 在渲染循环中更新标签位置
        const updateLabel = () => {
          if (!cameraRef.current) return

          const vector = new THREE.Vector3()
          sphere.getWorldPosition(vector)

          vector.project(cameraRef.current)

          const x = (vector.x * 0.5 + 0.5) * containerRef.current!.clientWidth
          const y = (-(vector.y * 0.5) + 0.5) * containerRef.current!.clientHeight

          div.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`

          // 根据相机距离决定是否显示标签
          const distance = sphere.position.distanceTo(cameraRef.current.position)
          div.style.display = distance < 15 ? "block" : "none"
        }

        // 存储更新函数以便在动画循环中调用
        sphere.userData = { updateLabel }
      })
    }

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate)

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      // 更新所有标签位置
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.userData && object.userData.updateLabel) {
          object.userData.updateLabel()
        }
      })

      renderer.render(scene, camera)
    }

    animate()

    // 处理窗口大小变化
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return

      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener("resize", handleResize)

    // 清理函数
    return () => {
      window.removeEventListener("resize", handleResize)

      if (rendererRef.current && containerRef.current) {
        // 移除所有添加的DOM元素
        const labels = containerRef.current.querySelectorAll("div")
        labels.forEach((label) => label.remove())

        containerRef.current.removeChild(rendererRef.current.domElement)
      }

      // 释放资源
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (object.material instanceof THREE.Material) {
            object.material.dispose()
          } else if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          }
        }
      })
    }
  }, [drillingData, isLoading])

  if (isLoading) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="relative h-[400px] w-full rounded-md overflow-hidden" ref={containerRef}>
      <div className="absolute top-2 left-2 bg-white/80 dark:bg-slate-800/80 p-2 rounded text-xs z-10">
        <p>提示: 鼠标拖动旋转视图，滚轮缩放，右键平移</p>
      </div>
    </div>
  )
}

