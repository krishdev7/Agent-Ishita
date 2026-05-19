

import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-2.5 px-4"
    >
      <div className="flex-shrink-0 mt-1">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,170,0.2) 0%, rgba(59,139,235,0.2) 100%)',
            border: '1px solid rgba(0,212,170,0.3)',
            color: '#00d4aa',
          }}
        >
          K
        </div>
      </div>

      <div
        className="rounded-2xl rounded-tl-md px-4 py-3.5 flex items-center gap-1.5 kiku-bubble"
        style={{ minHeight: '44px' }}
      >
        <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: '#00d4aa' }} />
        <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: '#00d4aa' }} />
        <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: '#00d4aa' }} />
      </div>
    </motion.div>
  );
}
