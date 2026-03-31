import styles from './UI.module.css'

export function Btn({ children, onClick, ghost = false, style }) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={ghost ? styles.btnGhost : styles.btn}
    >
      {children}
    </button>
  )
}

export function TopBar({ onBack, onSkip, step, total }) {
  return (
    <div className={styles.topbar}>
      {onBack
        ? <button className={styles.back} onClick={onBack}>← Back</button>
        : <span />
      }
      {step && total && (
        <div className={styles.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i === step - 1 ? styles.dotActive : i < step - 1 ? styles.dotDone : ''}`}
            />
          ))}
        </div>
      )}
      {onSkip
        ? <button className={styles.skip} onClick={onSkip}>Skip</button>
        : <span />
      }
    </div>
  )
}

export function StepLabel({ children }) {
  return <span className={styles.stepLabel}>{children}</span>
}

export function Question({ children }) {
  return <h2 className={styles.question}>{children}</h2>
}

export function Sub({ children }) {
  return <p className={styles.sub}>{children}</p>
}

export function ChoiceList({ choices, selected, onSelect }) {
  return (
    <div className={styles.choiceList}>
      {choices.map(c => (
        <div
          key={c.value}
          className={`${styles.choice} ${selected === c.value ? styles.choiceSelected : ''}`}
          onClick={() => onSelect(c.value)}
        >
          <div className={styles.choiceCheck} />
          <div>
            <div className={styles.choiceTitle}>{c.label}</div>
            {c.desc && <div className={styles.choiceDesc}>{c.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChipGroup({ options, selected, onSelect, multi = false }) {
  const toggle = (v) => {
    if (multi) {
      const arr = selected || []
      onSelect(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
    } else {
      onSelect(v)
    }
  }
  const isSelected = (v) => multi ? (selected || []).includes(v) : selected === v

  return (
    <div className={styles.chipGroup}>
      {options.map(o => (
        <div
          key={o}
          className={`${styles.chip} ${isSelected(o) ? styles.chipSelected : ''}`}
          onClick={() => toggle(o)}
        >
          {o}
        </div>
      ))}
    </div>
  )
}
