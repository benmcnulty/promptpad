// Minimal ambient declarations to keep typecheck green without installed deps.
declare module '@react-three/fiber' {
  export const Canvas: any
}

declare module '@react-three/drei' {
  export const OrbitControls: any
  export const Line: any
}

declare module 'three' {
  export type Object3D = any
  export type InstancedMesh = any
  export type Color = any
}

declare global {
  namespace JSX {
    interface IntrinsicElements { [elemName: string]: any }
  }
}
