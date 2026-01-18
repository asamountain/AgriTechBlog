import { motion } from 'framer-motion';

interface SproutLoaderProps {
  size?: number;
  className?: string;
}

export const SproutLoader = ({ size = 60, className = '' }: SproutLoaderProps) => {
  const stemHeight = size * 0.8;
  const leafSize = size * 0.25;
  
  // Main stem animation - grows from bottom to top
  const stemVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: stemHeight,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut"
      }
    }
  };

  // Leaf animations - appear and grow after stem
  const leafVariants = {
    hidden: { scale: 0, opacity: 0, rotate: 0 },
    visible: (custom: number) => ({
      scale: 1,
      opacity: 1,
      rotate: custom > 0 ? 25 : -25,
      transition: {
        delay: 0.4 + (custom * 0.2),
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  // Branch animations - small stems for leaves
  const branchVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: (custom: number) => ({
      width: leafSize * 0.8,
      opacity: 1,
      transition: {
        delay: 0.3 + (custom * 0.2),
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className={`flex items-end justify-center ${className}`} style={{ width: size, height: size }}>
      <motion.div
        className="relative"
        initial="hidden"
        animate="visible"
        style={{ width: size }}
        onAnimationComplete={() => {
          // Loop animation by restarting
          setTimeout(() => {
            const element = document.querySelector('.sprout-container');
            if (element) {
              element.classList.add('fade-out');
              setTimeout(() => {
                element.classList.remove('fade-out');
              }, 300);
            }
          }, 800);
        }}
      >
        <div className="sprout-container relative flex flex-col items-center">
          {/* Main Stem */}
          <motion.div
            variants={stemVariants}
            className="w-1 bg-gradient-to-t from-[#2D5016] to-[#3A6B1D] rounded-full relative"
            style={{ transformOrigin: 'bottom' }}
          >
            {/* Leaf 1 - Left side, lower */}
            <motion.div
              custom={0}
              variants={branchVariants}
              className="absolute left-0 h-0.5 bg-[#3A6B1D] rounded-full"
              style={{ 
                top: '40%',
                transformOrigin: 'left'
              }}
            >
              <motion.div
                custom={0}
                variants={leafVariants}
                className="absolute -left-1"
                style={{ transformOrigin: 'right center' }}
              >
                <svg
                  width={leafSize}
                  height={leafSize * 0.6}
                  viewBox="0 0 30 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10 Q 15 2, 28 10 Q 15 18, 2 10 Z"
                    fill="#3A6B1D"
                    opacity="0.9"
                  />
                  <path
                    d="M2 10 Q 15 5, 28 10"
                    stroke="#2D5016"
                    strokeWidth="0.5"
                    fill="none"
                    opacity="0.6"
                  />
                </svg>
              </motion.div>
            </motion.div>

            {/* Leaf 2 - Right side, middle */}
            <motion.div
              custom={1}
              variants={branchVariants}
              className="absolute right-0 h-0.5 bg-[#3A6B1D] rounded-full"
              style={{ 
                top: '25%',
                transformOrigin: 'right'
              }}
            >
              <motion.div
                custom={1}
                variants={leafVariants}
                className="absolute -right-1"
                style={{ transformOrigin: 'left center' }}
              >
                <svg
                  width={leafSize}
                  height={leafSize * 0.6}
                  viewBox="0 0 30 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10 Q 15 2, 28 10 Q 15 18, 2 10 Z"
                    fill="#3A6B1D"
                    opacity="0.9"
                  />
                  <path
                    d="M2 10 Q 15 5, 28 10"
                    stroke="#2D5016"
                    strokeWidth="0.5"
                    fill="none"
                    opacity="0.6"
                  />
                </svg>
              </motion.div>
            </motion.div>

            {/* Leaf 3 - Left side, upper */}
            <motion.div
              custom={2}
              variants={branchVariants}
              className="absolute left-0 h-0.5 bg-[#3A6B1D] rounded-full"
              style={{ 
                top: '10%',
                transformOrigin: 'left'
              }}
            >
              <motion.div
                custom={2}
                variants={leafVariants}
                className="absolute -left-1"
                style={{ transformOrigin: 'right center' }}
              >
                <svg
                  width={leafSize}
                  height={leafSize * 0.6}
                  viewBox="0 0 30 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10 Q 15 2, 28 10 Q 15 18, 2 10 Z"
                    fill="#4A8B24"
                    opacity="0.95"
                  />
                  <path
                    d="M2 10 Q 15 5, 28 10"
                    stroke="#3A6B1D"
                    strokeWidth="0.5"
                    fill="none"
                    opacity="0.6"
                  />
                </svg>
              </motion.div>
            </motion.div>

            {/* Top bud - final flourish */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.2, 1],
                opacity: [0, 1, 1],
              }}
              transition={{
                delay: 1,
                duration: 0.5,
                ease: "easeOut"
              }}
              className="absolute -top-2 left-1/2 -translate-x-1/2"
            >
              <div className="w-2 h-2 bg-[#4A8B24] rounded-full shadow-sm" />
            </motion.div>
          </motion.div>

          {/* Soil base - subtle ground indicator */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: size * 0.4,
              opacity: 0.3,
            }}
            transition={{
              delay: 0.1,
              duration: 0.8,
            }}
            className="h-1 bg-gradient-to-r from-transparent via-[#2D5016] to-transparent rounded-full mt-0.5"
          />
        </div>
      </motion.div>

      <style>{`
        .fade-out {
          animation: fadeOut 0.3s ease-out forwards;
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .sprout-container {
          animation: loopReset 2.5s infinite;
        }

        @keyframes loopReset {
          0%, 100% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          95% {
            opacity: 0;
          }
          96% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
