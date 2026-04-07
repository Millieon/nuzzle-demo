import { motion } from 'framer-motion'
import styles from './PetEnergyBar.module.css'

export default function PetEnergyBar({ totalEnergy, petName }) {
  return (
    <div className={styles.energyBar}>
      <div className={styles.petIcon}>
        <span>&#128062;</span>
      </div>

      <div className={styles.energyInfo}>
        <div className={styles.barTrack}>
          <motion.div
            className={styles.barFill}
            animate={{ width: `${Math.min((totalEnergy / 500) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className={styles.energyLabel}>
          {petName} has {totalEnergy} energy saved
        </span>
      </div>
    </div>
  )
}
