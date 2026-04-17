import { motion } from 'framer-motion'
import { useEffect } from 'react'
import SpotlightSearch from '@/components/SpotlightSearch'

export function SearchPage() {
  useEffect(() => {
    document.documentElement.classList.add('spotlight-window')
    document.body.classList.add('spotlight-window')

    return () => {
      document.documentElement.classList.remove('spotlight-window')
      document.body.classList.remove('spotlight-window')
    }
  }, [])

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
