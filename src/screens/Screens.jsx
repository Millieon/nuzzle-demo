/**
 * Onboarding screens: Goal → Schedule → Past → Motivation → Tone → Companion → Confirm → Sounds
 * No Three.js on any of these — 3D cat only appears after "gen" screen.
 */

import { useState, Suspense } from 'react'
import { Btn, TopBar, StepLabel, Question, Sub, ChoiceList, ChipGroup } from '../components/UI'

const CONTENT = {
  padding: '24px 28px 0',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
}
const BOTTOM = { padding: '16px 28px 44px', display: 'flex', flexDirection: 'column', gap: 12 }
const ROOT   = { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 844, background: '#F5F5F3' }

/* ── S1: Goal ───────────────────────────────────────────────────────────── */
export function GoalScreen({ go, updateProfile }) {
  const [val, setVal] = useState('')
  const hints = ['Exercise regularly', 'Write every day', 'Meditate in the morning', 'Read before bed', 'Learn a language']
  return (
    <div style={ROOT}>
      <TopBar onSkip={() => go('schedule')} step={1} total={5} />
      <div style={CONTENT}>
        <StepLabel>Step 1 of 5</StepLabel>
        <Question>What do you want to build?</Question>
        <Sub>Describe the habit or goal you're working on.</Sub>
        <textarea
          value={val} onChange={e => setVal(e.target.value)}
          placeholder="e.g. I want to exercise more regularly, stop doom-scrolling…"
          style={{ width:'100%', minHeight:90, background:'#fff', border:'0.5px solid rgba(0,0,0,0.12)', borderRadius:8, padding:14, fontFamily:'DM Sans,sans-serif', fontSize:15, resize:'none', outline:'none', lineHeight:1.6, marginBottom:12 }}
        />
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
          {hints.map(h => (
            <span key={h} onClick={() => setVal(h)}
              style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.1)', borderRadius:20, padding:'5px 13px', fontSize:12, color:'#888', cursor:'pointer' }}>
              {h}
            </span>
          ))}
        </div>
      </div>
      <div style={BOTTOM}>
        <Btn onClick={() => { updateProfile('goal', val); go('schedule') }}>Continue →</Btn>
      </div>
    </div>
  )
}

/* ── S2: Schedule ───────────────────────────────────────────────────────── */
export function ScheduleScreen({ go, profile, updateProfile }) {
  const [wake, setWake]     = useState(profile.wake || '')
  const [energy, setEnergy] = useState(profile.energy || '')
  const [free, setFree]     = useState(profile.free || '')
  return (
    <div style={ROOT}>
      <TopBar onBack={() => go('goal')} onSkip={() => go('past')} step={2} total={5} />
      <div style={CONTENT}>
        <StepLabel>Step 2 of 5</StepLabel>
        <Question>What does your day look like?</Question>
        <Sub>Your companion builds tasks around your actual schedule.</Sub>
        <p style={{ fontSize:10, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'#aaa', marginBottom:8 }}>I usually wake up around</p>
        <ChipGroup options={['Before 7am','7–8am','8–9am','After 9am']} selected={wake} onSelect={setWake} />
        <p style={{ fontSize:10, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'#aaa', marginBottom:8, marginTop:12 }}>My best energy window is</p>
        <ChipGroup options={['Morning','Midday','Afternoon','Evening','Late night']} selected={energy} onSelect={setEnergy} />
        <p style={{ fontSize:10, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'#aaa', marginBottom:8, marginTop:12 }}>I have free pockets of time</p>
        <ChipGroup options={['Before work','Lunch break','Commute','After work','Weekends']} selected={free} onSelect={setFree} />
      </div>
      <div style={BOTTOM}>
        <Btn onClick={() => { updateProfile('wake', wake); updateProfile('energy', energy); updateProfile('free', free); go('past') }}>Continue →</Btn>
      </div>
    </div>
  )
}

/* ── S3: Past attempts ──────────────────────────────────────────────────── */
export function PastScreen({ go, profile, updateProfile }) {
  const [val, setVal] = useState(profile.blocker || '')
  const choices = [
    { value:'restart', label:'I lost momentum after a break',  desc:'Felt too far behind to start again' },
    { value:'life',    label:'Life got in the way',            desc:'Work, illness, travel disrupted the routine' },
    { value:'start',   label:"I didn't know where to start",  desc:'The goal felt too big or vague' },
    { value:'forgot',  label:'I lost interest or forgot',     desc:'Nothing reminded me or kept it interesting' },
    { value:'new',     label:'This is new for me',             desc:"I haven't tried this goal before" },
  ]
  return (
    <div style={ROOT}>
      <TopBar onBack={() => go('schedule')} onSkip={() => go('motivation')} step={3} total={5} />
      <div style={CONTENT}>
        <StepLabel>Step 3 of 5</StepLabel>
        <Question>Have you tried this before?</Question>
        <Sub>No judgement — knowing what stopped you helps us plan around it.</Sub>
        <ChoiceList choices={choices} selected={val} onSelect={setVal} />
      </div>
      <div style={BOTTOM}>
        <Btn onClick={() => { updateProfile('blocker', val); go('motivation') }}>Continue →</Btn>
      </div>
    </div>
  )
}

/* ── S4: Motivation ─────────────────────────────────────────────────────── */
export function MotivationScreen({ go, profile, updateProfile }) {
  const [val, setVal] = useState(profile.motivationStyle || '')
  const choices = [
    { value:'intrinsic', label:'Knowing why it matters to me',       desc:'Intrinsic drive — I do it because I care' },
    { value:'social',    label:'Having someone to show up for',      desc:'Social accountability — better with others' },
    { value:'reward',    label:'Seeing rewards and progress',        desc:'External milestones and recognition motivate me' },
    { value:'structure', label:'Having a clear plan and structure',  desc:"I follow through when the path is laid out" },
  ]
  return (
    <div style={ROOT}>
      <TopBar onBack={() => go('past')} onSkip={() => go('tone')} step={4} total={5} />
      <div style={CONTENT}>
        <StepLabel>Step 4 of 5</StepLabel>
        <Question>What keeps you going?</Question>
        <Sub>Your companion adjusts how it coaches you based on what works for you.</Sub>
        <ChoiceList choices={choices} selected={val} onSelect={setVal} />
      </div>
      <div style={BOTTOM}>
        <Btn onClick={() => { updateProfile('motivationStyle', val); go('tone') }}>Continue →</Btn>
      </div>
    </div>
  )
}

/* ── S5: Tone ───────────────────────────────────────────────────────────── */
export function ToneScreen({ go, updateProfile }) {
  const [val, setVal] = useState('')
  const tones = [
    { value:'gentle',   name:'Gentle presence',  desc:'Always happy. Celebrates wins, never pressures you.' },
    { value:'steady',   name:'Steady companion', desc:'Celebrates wins, calm during off days.' },
    { value:'coach',    name:'Coach mode',       desc:'Reflects setbacks, suggests restart steps.' },
    { value:'ambient',  name:'Ambient',          desc:'Always there. Never demands engagement.' },
  ]
  return (
    <div style={ROOT}>
      <TopBar onBack={() => go('motivation')} onSkip={() => go('companion')} step={5} total={5} />
      <div style={CONTENT}>
        <StepLabel>Step 5 of 5</StepLabel>
        <Question>How should your companion show up?</Question>
        <Sub>You can change this anytime in settings.</Sub>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {tones.map(t => (
            <div key={t.value} onClick={() => setVal(t.value)} style={{
              background: val===t.value ? '#FAFAF8' : '#fff',
              border: `${val===t.value?'1.5':'0.5'}px solid ${val===t.value?'#111':'rgba(0,0,0,0.12)'}`,
              borderRadius:10, padding:'14px 12px', cursor:'pointer', transition:'all .2s'
            }}>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:500, color:'#111', marginBottom:4 }}>{t.name}</div>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#999', lineHeight:1.4 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={BOTTOM}>
        <Btn onClick={() => { updateProfile('tone', val); go('companion') }}>Continue →</Btn>
      </div>
    </div>
  )
}

/* ── S6: Companion creation ─────────────────────────────────────────────── */
export function CompanionScreen({ go, updateProfile }) {
  const [desc, setDesc]   = useState('')
  const [style, setStyle] = useState('')
  const styleOptions = [
    { value:'realistic',   icon:'🐈', label:'Soft & realistic' },
    { value:'stylised',    icon:'✦',  label:'Stylised' },
    { value:'fantastical', icon:'🌿', label:'Fantastical' },
  ]
  return (
    <div style={ROOT}>
      <TopBar onBack={() => go('tone')} />
      <div style={CONTENT}>
        <StepLabel>Your companion</StepLabel>
        <Question>Describe your companion.</Question>
        <Sub>Anything goes — a realistic cat, a snow leopard, a pig in a bow tie, a creature from your imagination.</Sub>
        <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.12)', borderRadius:10, padding:16, marginBottom:16 }}>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="e.g. A tiny glowing fox with silver fur and curious amber eyes…"
            rows={3}
            style={{ width:'100%', border:'none', outline:'none', fontFamily:'DM Sans,sans-serif', fontSize:15, resize:'none', lineHeight:1.6, background:'transparent' }}
          />
        </div>
        <p style={{ fontSize:10, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'#aaa', marginBottom:10 }}>Aesthetic direction</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {styleOptions.map(s => (
            <div key={s.value} onClick={() => setStyle(s.value)} style={{
              background:'#fff',
              border:`${style===s.value?'1.5':'0.5'}px solid ${style===s.value?'#111':'rgba(0,0,0,0.12)'}`,
              borderRadius:8, padding:'14px 8px', textAlign:'center', cursor:'pointer', transition:'all .2s'
            }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#888', lineHeight:1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={BOTTOM}>
        <Btn onClick={() => { updateProfile('companionDesc', desc); updateProfile('companionStyle', style); go('gen') }}>
          Generate my companion →
        </Btn>
      </div>
    </div>
  )
}

/* ── Confirm: first appearance of the 3D GLB cat ───────────────────────── */
import CatModel from '../components/CatModel'

export function ConfirmScreen({ go }) {
  return (
    <div style={{ ...ROOT, background: '#F5F5F3' }}>
      {/* 3D cat — first time user sees their generated companion */}
      <div style={{ flex:1, display:'flex', alignItems:'flex-end', justifyContent:'center', paddingTop:64, overflow:'hidden' }}>
        <Suspense fallback={
          <div style={{ width:'100%', height:320, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#ccc', animation:'pulse 1.4s ease-in-out infinite' }} />
          </div>
        }>
          <CatModel height={320} scale={2.0} position={[0,-1.4,0]} cameraPosition={[0,0.2,4.5]} />
        </Suspense>
      </div>

      {/* Card */}
      <div style={{ background:'#fff', borderRadius:'28px 28px 0 0', padding:'28px 28px 44px', display:'flex', flexDirection:'column', gap:12, flexShrink:0 }}>
        <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:10, fontWeight:500, letterSpacing:'0.18em', textTransform:'uppercase', color:'#888', textAlign:'center' }}>
          Your companion is ready
        </p>
        <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:26, color:'#111', textAlign:'center', lineHeight:1.2 }}>
          Does this feel right?
        </h2>
        <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#999', textAlign:'center', lineHeight:1.6 }}>
          You can update your companion's look later in settings.
        </p>
        <Btn onClick={() => go('naming')}>Yes, I love it →</Btn>
        <button onClick={() => go('gen')} style={{
          background:'transparent', border:'0.5px solid rgba(0,0,0,0.12)', borderRadius:8,
          padding:14, fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:500,
          letterSpacing:'0.14em', textTransform:'uppercase', cursor:'pointer', color:'#aaa'
        }}>Regenerate ↺</button>
      </div>
    </div>
  )
}

/* ── Sounds ─────────────────────────────────────────────────────────────── */
const SOUND_OPTIONS = [
  { value:'gentle',  name:'Soft & gentle',    desc:'Quiet, warm, never intrusive' },
  { value:'playful', name:'Playful & chirpy',  desc:'Upbeat, expressive, curious' },
  { value:'calm',    name:'Calm & quiet',      desc:'Minimal sounds, barely-there' },
  { value:'vocal',   name:'Vocal & emotive',   desc:'Rich, reacts to everything' },
  { value:'silent',  name:'No sounds',         desc:'Silent companion, visuals only' },
  { value:'real',    name:'Real cat sounds',   desc:'Authentic meows & purrs' },
]

export function SoundsScreen({ go, updateProfile }) {
  const [selected, setSelected] = useState('gentle')
  return (
    <div style={ROOT}>
      {/* Small 3D cat preview — already introduced on confirm screen */}
      <div style={{ padding:'52px 32px 0', textAlign:'center', flexShrink:0 }}>
        <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:26, color:'#111', lineHeight:1.25, marginBottom:8 }}>
          How should your companion sound?
        </h2>
        <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#888', lineHeight:1.5 }}>
          Pick a voice style. You can change this anytime.
        </p>
      </div>

      {/* Compact 3D cat */}
      <div style={{ height:140, overflow:'hidden', flexShrink:0 }}>
        <Suspense fallback={null}>
          <CatModel height={140} scale={1.3} position={[0,-1.2,0]} showShadow={false} cameraPosition={[0,0,4]} />
        </Suspense>
      </div>

      {/* Sound grid */}
      <div style={{ flex:1, background:'#fff', borderRadius:'28px 28px 0 0', padding:'20px 20px 0', overflowY:'auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          {SOUND_OPTIONS.map(s => (
            <div key={s.value} onClick={() => setSelected(s.value)} style={{
              background: selected===s.value ? '#FAFAF8' : '#F5F5F3',
              border:`${selected===s.value?'1.5':'0.5'}px solid ${selected===s.value?'#111':'transparent'}`,
              borderRadius:12, padding:'14px 12px', cursor:'pointer', transition:'all .2s'
            }}>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:500, color:'#111', marginBottom:3 }}>{s.name}</div>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#999', lineHeight:1.35 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ paddingBottom:36 }}>
          <Btn onClick={() => { updateProfile('sound', selected); go('chat') }}>Continue →</Btn>
        </div>
      </div>
    </div>
  )
}

/* ── Naming: give your companion a name ─────────────────────────────────── */
export function NamingScreen({ go, updateProfile }) {
  const [name, setName] = useState('')
  const suggestions = ['Luna', 'Mochi', 'Sage', 'Kira', 'Atlas', 'Wren']

  return (
    <div style={ROOT}>
      <div style={{ ...CONTENT, justifyContent: 'center', paddingTop: 64, gap: 0 }}>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#888',
          marginBottom: 16,
          textAlign: 'center',
        }}>
          One last thing
        </p>
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 28,
          color: '#111',
          textAlign: 'center',
          lineHeight: 1.25,
          marginBottom: 10,
        }}>
          What will you call them?
        </h2>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14,
          color: '#999',
          textAlign: 'center',
          lineHeight: 1.55,
          marginBottom: 32,
        }}>
          Your companion's name — you can change it later.
        </p>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { updateProfile('petName', name.trim()); go('sounds') } }}
          placeholder="Enter a name…"
          maxLength={24}
          autoFocus
          style={{
            width: '100%',
            background: '#fff',
            border: name.trim() ? '1.5px solid #111' : '0.5px solid rgba(0,0,0,0.12)',
            borderRadius: 10,
            padding: '16px 18px',
            fontFamily: 'Playfair Display, serif',
            fontSize: 22,
            color: '#111',
            textAlign: 'center',
            outline: 'none',
            transition: 'border 0.2s',
            letterSpacing: '-0.3px',
          }}
        />

        {/* Suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          {suggestions.map(s => (
            <span
              key={s}
              onClick={() => setName(s)}
              style={{
                background: name === s ? '#111' : '#fff',
                color: name === s ? '#fff' : '#888',
                border: name === s ? '1.5px solid #111' : '0.5px solid rgba(0,0,0,0.12)',
                borderRadius: 100,
                padding: '6px 16px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div style={BOTTOM}>
        <Btn
          onClick={() => { updateProfile('petName', name.trim() || 'your companion'); go('sounds') }}
        >
          {name.trim() ? `Meet ${name.trim()} →` : 'Continue →'}
        </Btn>
      </div>
    </div>
  )
}
