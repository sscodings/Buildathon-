import { AnimatePresence, motion } from "framer-motion";

const AnimationWrapper = ({ children, keyValue, className = "", initial = { opacity: 0, y: 20 }, animate = { opacity: 1, y: 0 }, transition = { duration: 0.4 } }) => {
  return (
    <AnimatePresence>
      <motion.div key={keyValue} initial={initial} animate={animate} transition={transition} className={className}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimationWrapper;
