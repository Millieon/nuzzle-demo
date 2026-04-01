import { motion } from 'framer-motion'
import styles from './WelcomeScreen.module.css'

export default function WelcomeScreen({ go }) {
  return (
    <div className={styles.root}>

      <motion.div
        className={styles.top}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5 }}
      >
        <h1 className={styles.wordmark}>Nuzzle.</h1>
        <div className={styles.rule} />
        <p className={styles.tagline}>The presence your habits were missing.</p>
      </motion.div>

      {/* Static image — three companions */}
      <motion.div
        className={styles.petStage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.6 }}
      >
        <img
          src={`${import.meta.env.BASE_URL}pets-welcome.png`}
          alt="Three companions — a fantastical creature, a Siamese cat, and a golden retriever"
          className={styles.petImage}
        />
      </motion.div>

      <motion.div
        className={styles.bottom}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.45 }}
      >
        <button className={styles.btn} onClick={() => go('goal')}>
          Get Started →
        </button>
        <span className={styles.est}>Est. MMXXIV</span>
        <div className={styles.estRule} />
      </motion.div>

    </div>
  )
}
