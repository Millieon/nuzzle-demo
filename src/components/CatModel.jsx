import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  useGLTF, useAnimations,
  ContactShadows, OrbitControls,
} from '@react-three/drei'

function FallbackCat() {
  const ref = useRef()
  useFrame(s => {
    if (ref.current) ref.current.position.y = Math.sin(s.clock.elapsedTime * 0.9) * 0.05
  })
  return (
    <group ref={ref} position={[0, -0.3, 0]}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color="#D4C4B0" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial color="#D4C4B0" roughness={0.55} />
      </mesh>
      <mesh position={[-0.22, 1.02, 0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.10, 0.22, 3]} />
        <meshStandardMaterial color="#C8B4A0" roughness={0.6} />
      </mesh>
      <mesh position={[0.22, 1.02, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.10, 0.22, 3]} />
        <meshStandardMaterial color="#C8B4A0" roughness={0.6} />
      </mesh>
    </group>
  )
}

function CatMesh({ scale, position, mood }) {
  const groupRef = useRef()
  const { scene, animations } = useGLTF('/cat.glb')
  const { actions, names } = useAnimations(animations, groupRef)

  useEffect(() => {
    if (!names.length) return
    const name = names.find(n => /idle|rest|breathe|stand/i.test(n)) ?? names[0]
    const a = actions[name]
    if (a) { a.reset().play(); return () => a.stop() }
  }, [actions, names])

  useFrame(s => {
    if (!groupRef.current) return
    const t = s.clock.elapsedTime
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.04
    const targetZ = mood === 'happy'    ? Math.sin(t * 1.5) * 0.05
                  : mood === 'thinking' ? -0.10 : 0
    groupRef.current.rotation.z += (targetZ - groupRef.current.rotation.z) * 0.05
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}

function DragHint() {
  return (
    <div style={{
      position: 'absolute', bottom: 14, left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 20,
      padding: '6px 14px', pointerEvents: 'none',
      animation: 'fadeHintIn 0.4s ease 0.6s both',
    }}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="#888" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="7" cy="7" r="2.5" stroke="#888" strokeWidth="1.2"/>
      </svg>
      <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#888', whiteSpace:'nowrap' }}>
        Drag to rotate
      </span>
    </div>
  )
}

export default function CatModel({
  height = 300,
  scale = 1.8,
  position = [0, -1.2, 0],
  mood = 'idle',
  enableOrbit = true,
  background = 'transparent',
  showShadow = true,
  cameraPosition = [0, 0.5, 4],
  showDragHint = true,
}) {
  return (
    <div style={{ width:'100%', height, background, overflow:'hidden', position:'relative' }}>
      <style>{`
        @keyframes fadeHintIn {
          from { opacity:0; transform:translateX(-50%) translateY(4px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>

      <Canvas
        camera={{ position: cameraPosition, fov: 32 }}
        style={{ width:'100%', height:'100%' }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'low-power',   // reduces context pressure
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          // Restore context automatically if lost
          gl.domElement.addEventListener('webglcontextlost', e => {
            e.preventDefault()
            console.warn('WebGL context lost — will restore')
          })
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored')
          })
        }}
        shadows={false}     // shadows off on modal views — saves a context slot
        frameloop="always"
      >
        <ambientLight intensity={2.5} />
        <directionalLight position={[5, 8, 5]}  intensity={2.0} color="#fffaf5" />
        <directionalLight position={[-4, 4, -3]} intensity={1.2} color="#e8f0ff" />
        <directionalLight position={[0, -2, 4]}  intensity={0.6} color="#fff8f0" />

        <Suspense fallback={<FallbackCat />}>
          <CatMesh scale={scale} position={position} mood={mood} />
        </Suspense>

        {showShadow && (
          <ContactShadows
            position={[0, position[1] - 0.42, 0]}
            opacity={0.12} scale={3} blur={2.5} far={2}
          />
        )}

        {enableOrbit && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.2}
            rotateSpeed={0.6}
            target={[0, -0.5, 0]}
          />
        )}
      </Canvas>

      {enableOrbit && showDragHint && <DragHint />}
    </div>
  )
}

fetch('/cat.glb', { method:'HEAD' })
  .then(r => { if (r.ok) useGLTF.preload('/cat.glb') })
  .catch(() => {})