import * as THREE from 'three'
import gsap from 'gsap'

/**
 * 全屏 Page Curl 翻页动画
 *
 * 整页内容作为纸张纹理，整页像纸一样翻过去。
 * 使用 PlaneGeometry 顶点变形实现真实纸张弯曲。
 * 背景颜色跟随主题动态变化。
 */

/**
 * 从 CSS 变量获取当前主题背景颜色，转换为 Three.js 颜色
 */
function getThemeBgColor() {
  const bgVar = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')
  // CSS 变量格式：#FAF9F6 或类似
  if (bgVar && bgVar.trim()) {
    const hex = bgVar.trim().replace('#', '')
    return parseInt(hex, 16)
  }
  // 默认 Light 主题背景色
  return 0xfaf9f6
}

/**
 * 检测主题亮度，决定阴影策略
 * Dark 主题（亮度 < 0.5）：使用高光（弯曲处变亮）
 * Light/Sepia 主题（亮度 >= 0.5）：使用阴影（弯曲处变暗）
 */
function getShadowMode(bgColorHex) {
  const hex = bgColorHex.toString(16).padStart(6, '0')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  // 计算亮度（YUV 模型）
  const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255
  return luminance < 0.5 ? 'lighten' : 'darken'
}

export default class PageFlipAnimation {
  /**
   * @param {HTMLElement} container 渲染容器
   * @param {Object} options
   * @param {number} options.width 视口宽
   * @param {number} options.height 视口高
   * @param {number} options.duration 动画时长 ms
   * @param {HTMLCanvasElement} options.frontCanvas 正面纹理（当前页截图）
   * @param {HTMLCanvasElement} options.backCanvas 背面纹理（目标页截图，可选）
   * @param {boolean} options.isMobile 移动端降级
   * @param {number} options.initialProgress 初始进度（反向翻页用 1）
   */
  constructor(container, options = {}) {
    this.container = container
    this.width = options.width || window.innerWidth
    this.height = options.height || window.innerHeight
    this.duration = options.duration || 1800
    this.isMobile = options.isMobile || false
    this.frontCanvas = options.frontCanvas || null
    this.backCanvas = options.backCanvas || null
    this.initialProgress = options.initialProgress || 0

    this.segX = this.isMobile ? 32 : 50
    this.segY = this.isMobile ? 24 : 40

    this.scene = null
    this.camera = null
    this.renderer = null
    this.paperGeometry = null
    this.frontMesh = null
    this.backMesh = null
    this.timeline = null
    this.progress = this.initialProgress
    this._originalPositions = null

    // 动态获取当前主题背景色
    this.PAPER_BG = getThemeBgColor()

    // 检测主题亮度，决定阴影策略：Dark 主题使用高光，Light/Sepia 使用阴影
    this.shadowMode = getShadowMode(this.PAPER_BG)

    this._init()
  }

  _init() {
    // 场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(this.PAPER_BG)

    // 透视相机：FOV 较小减少透视变形，距离刚好让全屏纸张填满视口
    const fov = 30
    const distance = (this.height / 2) / Math.tan((fov * Math.PI) / 360)
    this.camera = new THREE.PerspectiveCamera(fov, this.width / this.height, 0.1, 5000)
    this.camera.position.set(0, 0, distance)
    this.camera.lookAt(0, 0, 0)

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isMobile })
    this.renderer.setSize(this.width, this.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.container.appendChild(this.renderer.domElement)

    // 灯光
    const ambient = new THREE.AmbientLight(0xffffff, 0.85)
    this.scene.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4)
    dirLight.position.set(0, 0, 500)
    this.scene.add(dirLight)
    const fillLight = new THREE.DirectionalLight(0xf5e6d3, 0.2)
    fillLight.position.set(-300, -200, 300)
    this.scene.add(fillLight)

    // 纸张几何体（全屏尺寸）
    this.paperGeometry = new THREE.PlaneGeometry(
      this.width,
      this.height,
      this.segX,
      this.segY
    )
    this._originalPositions = this.paperGeometry.attributes.position.array.slice()

    // 顶点颜色（用于模拟弯曲阴影，增强立体感）
    const vertexCount = this._originalPositions.length / 3
    this._colorArray = new Float32Array(vertexCount * 3)
    this.paperGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this._colorArray, 3)
    )

    // 正面纹理
    const frontTexture = this.frontCanvas
      ? new THREE.CanvasTexture(this.frontCanvas)
      : null
    if (frontTexture) {
      frontTexture.needsUpdate = true
      frontTexture.colorSpace = THREE.SRGBColorSpace
    }

    // 正面 Mesh（FrontSide）：MeshBasicMaterial 不受光照影响，纯色不变灰
    // Dark 主题：材质颜色设为白色，让顶点颜色控制亮度（高光效果）
    // Light/Sepia 主题：材质颜色设为背景色，顶点颜色产生阴影效果
    const baseColor = this.shadowMode === 'lighten' ? 0xffffff : this.PAPER_BG
    const frontMaterial = new THREE.MeshBasicMaterial({
      map: frontTexture,
      color: frontTexture ? 0xffffff : baseColor,
      side: THREE.FrontSide,
      vertexColors: true
    })
    this.frontMesh = new THREE.Mesh(this.paperGeometry, frontMaterial)
    this.scene.add(this.frontMesh)

    // 背面纹理
    const backTexture = this.backCanvas
      ? new THREE.CanvasTexture(this.backCanvas)
      : null
    if (backTexture) {
      backTexture.needsUpdate = true
      backTexture.colorSpace = THREE.SRGBColorSpace
    }

    // 背面 Mesh（BackSide）
    // Dark 主题：材质颜色设为白色，让顶点颜色控制亮度
    // Light/Sepia 主题：材质颜色设为背景色
    const backMaterial = new THREE.MeshBasicMaterial({
      map: backTexture,
      color: backTexture ? 0xffffff : baseColor,
      side: THREE.BackSide,
      vertexColors: true
    })
    this.backMesh = new THREE.Mesh(this.paperGeometry, backMaterial)
    this.scene.add(this.backMesh)

    // 应用初始卷曲状态
    this._applyPageCurl(this.initialProgress)

    // 渲染循环
    this._animate = this._animate.bind(this)
    this._animate()
  }

  /**
   * Page Curl 顶点变形
   * progress: 0 = 右页平整，1 = 左页平整
   * 翻页线从右向左移动，右下角先翘起
   */
  _applyPageCurl(progress) {
    const positions = this.paperGeometry.attributes.position.array
    const original = this._originalPositions

    const halfW = this.width / 2
    const halfH = this.height / 2

    // 翻页线 X 位置：从右边缘到左边缘
    const foldX = halfW - this.width * progress

    // 卷曲半径：中间最大，模拟纸张弹性
    const radiusBase = this.width * 0.22
    const radiusFactor = Math.sin(progress * Math.PI)
    const R = radiusBase * (0.55 + radiusFactor * 0.45)

    for (let i = 0; i < positions.length; i += 3) {
      const ox = original[i]
      const oy = original[i + 1]

      // Y 因子：0 顶部 → 1 底部（右下角先翘起）
      const yFactor = (halfH - oy) / this.height

      // 有效翻页线：底部更靠左（右下角先翻）
      const cornerEffect = yFactor * (this.width * 0.12) * Math.max(0, 1 - progress * 1.5)
      const effectiveFoldX = foldX + cornerEffect

      if (ox >= effectiveFoldX) {
        // 未翻部分：保持原位
        // 起始阶段右下角轻微翘起
        if (progress < 0.12 && yFactor > 0.65) {
          const dx = ox - halfW
          const dy = oy + halfH
          const cornerDist = Math.sqrt(dx * dx + dy * dy)
          const liftRadius = this.width * 0.18
          if (cornerDist < liftRadius) {
            const liftFactor = (0.12 - progress) / 0.12
            const lift = Math.sin((cornerDist / liftRadius) * Math.PI) * 18 * liftFactor
            positions[i] = ox
            positions[i + 1] = oy
            positions[i + 2] = lift
          } else {
            positions[i] = ox
            positions[i + 1] = oy
            positions[i + 2] = 0
          }
        } else {
          positions[i] = ox
          positions[i + 1] = oy
          positions[i + 2] = 0
        }
      } else {
        // 已翻部分：圆柱卷曲
        const d = effectiveFoldX - ox
        const theta = Math.min(d / R, Math.PI * 0.95)

        // 圆柱卷曲：绕翻页线旋转
        const newX = effectiveFoldX - R * Math.sin(theta)
        const newZ = R * (1 - Math.cos(theta))

        positions[i] = newX
        positions[i + 1] = oy
        positions[i + 2] = newZ
      }
    }

    this.paperGeometry.attributes.position.needsUpdate = true
    this.paperGeometry.computeVertexNormals()

    // 根据弯曲高度更新顶点颜色（增强立体感）
    // Dark 主题：弯曲处变亮（高光）
    // Light/Sepia 主题：弯曲处变暗（阴影）
    const colors = this._colorArray
    const maxZ = this.width * 0.22 // 卷曲最大高度参考值

    for (let i = 0, ci = 0; i < positions.length; i += 3, ci += 3) {
      const z = positions[i + 2]
      // 基础效果：弯曲高度越大效果越强
      const heightEffect = (Math.abs(z) / maxZ) * 0.18
      // 翻页线附近的柔和效果（progress 0-1 时有翻页线）
      let foldEffect = 0
      if (progress > 0.01 && progress < 0.99) {
        const ox2 = positions[i]
        const distToFold = Math.abs(ox2 - foldX) / this.width
        if (distToFold < 0.08) {
          foldEffect = (1 - distToFold / 0.08) * 0.08
        }
      }

      // 根据主题模式选择阴影或高光
      let factor
      if (this.shadowMode === 'lighten') {
        // Dark 主题：材质为白色，顶点颜色直接控制亮度
        // 基础颜色（未弯曲）≈ 0.1（对应 #1a1a1a）
        // 弯曲处变亮（高光）：最多到 0.25
        const baseBrightness = 0.1 // Dark 背景色亮度
        const highlightBoost = heightEffect * 1.5 + foldEffect * 1.2
        factor = Math.min(baseBrightness + 0.15, baseBrightness + highlightBoost)
      } else {
        // Light/Sepia 主题：材质为背景色，顶点颜色是乘数
        // 弯曲处变暗（阴影）：最多降低 18%
        factor = Math.max(0.82, 1 - heightEffect - foldEffect)
      }

      colors[ci] = factor
      colors[ci + 1] = factor
      colors[ci + 2] = factor
    }
    this.paperGeometry.attributes.color.needsUpdate = true
  }

  /**
   * 正向翻页（progress 0 → 1）
   */
  playForward() {
    return new Promise((resolve) => {
      if (this.timeline) this.timeline.kill()

      const obj = { t: this.progress }
      this.timeline = gsap.to(obj, {
        t: 1,
        duration: this.duration / 1000,
        ease: 'power1.inOut',
        onUpdate: () => {
          this.progress = obj.t
          this._applyPageCurl(obj.t)
        },
        onComplete: () => {
          this.progress = 1
          resolve()
        }
      })
    })
  }

  /**
   * 反向翻页（progress 1 → 0）
   */
  playBackward() {
    return new Promise((resolve) => {
      if (this.timeline) this.timeline.kill()

      const obj = { t: this.progress }
      this.timeline = gsap.to(obj, {
        t: 0,
        duration: this.duration / 1000,
        ease: 'power1.inOut',
        onUpdate: () => {
          this.progress = obj.t
          this._applyPageCurl(obj.t)
        },
        onComplete: () => {
          this.progress = 0
          resolve()
        }
      })
    })
  }

  _animate() {
    this._rafId = requestAnimationFrame(this._animate)
    this.renderer.render(this.scene, this.camera)
  }

  destroy() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
    if (this.timeline) {
      this.timeline.kill()
      this.timeline = null
    }
    if (this.paperGeometry) {
      this.paperGeometry.dispose()
    }
    if (this.frontMesh && this.frontMesh.material) {
      if (this.frontMesh.material.map) this.frontMesh.material.map.dispose()
      this.frontMesh.material.dispose()
    }
    if (this.backMesh && this.backMesh.material) {
      if (this.backMesh.material.map) this.backMesh.material.map.dispose()
      this.backMesh.material.dispose()
    }
    if (this.renderer) {
      this.renderer.dispose()
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
      }
    }
  }
}
