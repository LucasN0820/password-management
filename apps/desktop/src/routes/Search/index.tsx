import { motion } from 'framer-motion'
import SpotlightSearch from '@/components/SpotlightSearch'

export function SearchPage() {
  return (
    <motion.div
      className="spotlight-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.15 } }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
    >
      <SpotlightSearch />
    </motion.div>
  )
}
