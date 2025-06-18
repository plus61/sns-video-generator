// Canvas wrapper with environment detection for Vercel compatibility

let canvasModule: any = null
let fabricModule: any = null

// Conditional imports for Canvas (Node.js native dependency)
if (typeof window === 'undefined' && !process.env.DISABLE_CANVAS && !process.env.VERCEL) {
  try {
    canvasModule = require('canvas')
  } catch (error) {
    console.warn('Canvas module not available:', error)
  }
}

// Conditional imports for Fabric.js
if (!process.env.DISABLE_CANVAS && !process.env.VERCEL) {
  try {
    fabricModule = require('fabric')
  } catch (error) {
    console.warn('Fabric.js module not available:', error)
  }
}

// Canvas utilities with fallbacks
export const createCanvas = (width: number, height: number) => {
  if (canvasModule?.createCanvas) {
    return canvasModule.createCanvas(width, height)
  }
  
  // Browser fallback
  if (typeof window !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }
  
  // Mock fallback for Vercel/serverless
  return {
    width,
    height,
    getContext: () => ({
      fillRect: () => {},
      strokeRect: () => {},
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: () => {},
      toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }),
    toBuffer: () => Buffer.alloc(0),
    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }
}

export const loadImage = async (src: string | Buffer) => {
  if (canvasModule?.loadImage) {
    return canvasModule.loadImage(src)
  }
  
  // Browser fallback
  if (typeof window !== 'undefined' && typeof src === 'string') {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }
  
  // Mock fallback for Vercel/serverless
  return {
    width: 100,
    height: 100,
    src: typeof src === 'string' ? src : 'mock-image'
  }
}

// Fabric.js utilities with fallbacks
export const createFabricCanvas = (element?: HTMLCanvasElement | string) => {
  if (fabricModule?.fabric?.Canvas) {
    return new fabricModule.fabric.Canvas(element)
  }
  
  // Mock fallback for server-side/Vercel
  return {
    setWidth: () => {},
    setHeight: () => {},
    add: () => {},
    remove: () => {},
    renderAll: () => {},
    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    dispose: () => {}
  }
}

export const createFabricText = (text: string, options?: any) => {
  if (fabricModule?.fabric?.Text) {
    return new fabricModule.fabric.Text(text, options)
  }
  
  // Mock fallback
  return {
    text,
    ...options,
    set: () => {},
    animate: () => {},
    clone: () => createFabricText(text, options)
  }
}

export const createFabricRect = (options?: any) => {
  if (fabricModule?.fabric?.Rect) {
    return new fabricModule.fabric.Rect(options)
  }
  
  // Mock fallback
  return {
    ...options,
    set: () => {},
    animate: () => {},
    clone: () => createFabricRect(options)
  }
}

// Environment detection utilities
export const isCanvasAvailable = (): boolean => {
  return !!canvasModule?.createCanvas
}

export const isFabricAvailable = (): boolean => {
  return !!fabricModule?.fabric
}

export const isServerSide = (): boolean => {
  return typeof window === 'undefined'
}

export const isVercelEnvironment = (): boolean => {
  return !!(process.env.VERCEL || process.env.NEXT_PUBLIC_IS_VERCEL)
}

// Export fabric module for direct access when available
export const fabric = fabricModule?.fabric || null

// Export canvas module for direct access when available  
export const canvas = canvasModule || null