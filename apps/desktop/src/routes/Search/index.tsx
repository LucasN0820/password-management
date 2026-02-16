import { motion } from 'framer-motion'
import SpotlightSearch from "@/components/SpotlightSearch";

const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
}

const overlayVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15
    }
  }
}

export function SearchPage() {
  return (
    <motion.div
      className="spotlight-overlay"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <motion.div
        variants={overlayVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <SpotlightSearch />
      </motion.div>
    </motion.div>
  )
}