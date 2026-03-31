import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import styles from './GenScreen.module.css'

const LABELS = ['Generating form', 'Adding texture', 'Bringing to life', 'Almost there…']

// ── Canvas ring animation (same logic as HTML prototype) ───────────────────
function RingCanvas({ onDone }) {
  const canvasRef = useRef()
  const animRef   = useRef()
  const stateRef  = useRef({ t: 0, phase: 0, phaseT: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2

    const rings = [
      { h: 320, s: 62, rx: 82, ry: 30, tx: 52, tz: 0,   spd: 0.8, ph: 0,   th: 14 },
      { h: 270, s: 58, rx: 74, ry: 28, tx: -38, tz: 28, spd: 1.0, ph: 0.9, th: 12 },
      { h: 35,  s: 68, rx: 68, ry: 25, tx: 22,  tz: -46, spd: 0.7, ph: 1.8, th: 11 },
    ]

    const arcs = Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2
      return {
        x: cx + Math.cos(a) * 78, y: cy + Math.sin(a) * 66,
        r: 15 + Math.random() * 9,
        start: a + 0.2, sweep: 1.1 + Math.random() * 0.8,
        hue: [320, 270, 35][i % 3],
        alpha: 0,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        rot: 0, rotSpd: (Math.random() - 0.5) * 0.04,
      }
    })

    function drawTorus(ring, prog, alpha) {
      const steps = 52
      const R = ring.rx * prog, r = ring.ry * prog
      const txR = ring.tx * Math.PI / 180
      const tzR = ring.tz * Math.PI / 180
      const rotY = stateRef.current.t * ring.spd + ring.ph
      for (let s = 0; s < steps; s++) {
        const pts = [s, s + 1].map(i => {
          const u  = (i / steps) * Math.PI * 2
          const x0 = (R + r * Math.cos(u)) * Math.cos(rotY)
          const y0 = r * Math.sin(u)
          const z0 = (R + r * Math.cos(u)) * Math.sin(rotY)
          const y1 = y0 * Math.cos(txR) - z0 * Math.sin(txR)
          const z1 = y0 * Math.sin(txR) + z0 * Math.cos(txR)
          const x2 = x0 * Math.cos(tzR) - y1 * Math.sin(tzR)
          const y2 = x0 * Math.sin(tzR) + y1 * Math.cos(tzR)
          return { x: cx + x2, y: cy + y2, d: (z1 + 100) / 200 }
        })
        const dep = (pts[0].d + pts[1].d) / 2
        const lum = 44 + dep * 26
        const sat = ring.s - dep * 8
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        ctx.lineTo(pts[1].x, pts[1].y)
        ctx.strokeStyle = `hsla(${ring.h},${sat}%,${lum}%,${alpha})`
        ctx.lineWidth   = ring.th * prog * (0.65 + dep * 0.6)
        ctx.lineCap     = 'round'
        ctx.stroke()
      }
    }

    function loop() {
      const s = stateRef.current
      ctx.clearRect(0, 0, W, H)
      s.t += 0.018; s.phaseT += 0.016

      if (s.phase === 0) {
        arcs.forEach(a => {
          a.alpha = Math.min(a.alpha + 0.025, 1)
          a.x += a.vx; a.y += a.vy; a.rot += a.rotSpd
          const dx = cx - a.x, dy = cy - a.y
          a.vx += dx * 0.0013; a.vy += dy * 0.0013
          ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot)
          ctx.beginPath(); ctx.arc(0, 0, a.r, a.start, a.start + a.sweep)
          ctx.strokeStyle = `hsla(${a.hue},58%,63%,${a.alpha})`
          ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke()
          ctx.restore()
        })
        if (s.phaseT > 2.2) { s.phase = 1; s.phaseT = 0 }
      } else if (s.phase === 1) {
        const prog = Math.min(s.phaseT / 2.4, 1)
        const e = prog < 0.5 ? 2 * prog * prog : -1 + (4 - 2 * prog) * prog
        arcs.forEach(a => {
          a.alpha = Math.max(a.alpha - 0.04, 0)
          a.x += (cx - a.x) * 0.05; a.y += (cy - a.y) * 0.05
          ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot)
          ctx.beginPath(); ctx.arc(0, 0, a.r, a.start, a.start + a.sweep)
          ctx.strokeStyle = `hsla(${a.hue},58%,63%,${a.alpha})`
          ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore()
        })
        rings.forEach(r => drawTorus(r, e, e * 0.9))
        if (prog >= 1) { s.phase = 2; s.phaseT = 0 }
      } else if (s.phase === 2) {
        rings.forEach(r => drawTorus(r, 1, 0.9))
        if (s.phaseT > 2.6) {
          s.phase = 3
          onDone()
        }
      } else {
        rings.forEach(r => drawTorus(r, 1, Math.max(0.9 - s.phaseT * 0.7, 0)))
      }

      if (s.phase < 3 || s.phaseT < 1.5) {
        animRef.current = requestAnimationFrame(loop)
      }
    }

    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [onDone])

  return <canvas ref={canvasRef} width={310} height={310} className={styles.canvas} />
}

export default function GenScreen({ go }) {
  const [labelIdx, setLabelIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setLabelIdx(i => (i + 1) % LABELS.length), 1600)
    return () => clearInterval(t)
  }, [])

  return (
    <div className={styles.root}>
      <motion.div
        className={styles.heading}
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45 }}
      >
        <h2 className={styles.title}>Creating your<br />companion…</h2>
        <p className={styles.sub}>Reading your description</p>
      </motion.div>

      <div className={styles.stage}>
        <RingCanvas onDone={() => go('confirm')} />
      </div>

      <div className={styles.status}>
        <div className={styles.dots}>
          {[0,1,2].map(i => <div key={i} className={styles.dot} style={{ animationDelay: `${i * 0.2}s` }} />)}
        </div>
        <motion.span
          key={labelIdx}
          className={styles.label}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {LABELS[labelIdx]}
        </motion.span>
      </div>
    </div>
  )
}
