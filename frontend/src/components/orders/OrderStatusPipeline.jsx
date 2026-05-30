import { Check } from 'lucide-react'

const STAGES = ['Initiated', 'Due Diligence', 'Contracted', 'In Transit', 'Settled']

export default function OrderStatusPipeline({ currentStatus, onStatusChange, isAdmin }) {
  const currentIndex = STAGES.indexOf(currentStatus)

  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto pb-2">
      {STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isClickable = isAdmin && index > currentIndex && currentStatus !== 'Cancelled'

        return (
          <div key={stage} className="flex items-center flex-1 min-w-0">
            {/* Step */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <button
                onClick={() => isClickable && onStatusChange?.(stage)}
                disabled={!isClickable}
                className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold
                  transition-all duration-200 shrink-0
                  ${isCompleted ? 'bg-gold border-gold text-nyin-bg' : ''}
                  ${isCurrent ? 'bg-gold/20 border-gold text-gold shadow-lg shadow-gold/20' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-nyin-surface border-nyin-border text-gray-600' : ''}
                  ${isClickable ? 'hover:border-gold hover:text-gold cursor-pointer' : 'cursor-default'}
                `}
              >
                {isCompleted ? <Check size={14} /> : index + 1}
              </button>
              <span className={`text-xs mt-1.5 text-center truncate w-full px-1
                ${isCurrent ? 'text-gold font-medium' : ''}
                ${isCompleted ? 'text-gray-400' : ''}
                ${!isCompleted && !isCurrent ? 'text-gray-600' : ''}
              `}>
                {stage}
              </span>
            </div>

            {/* Connector line */}
            {index < STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-5 transition-colors
                ${index < currentIndex ? 'bg-gold' : 'bg-nyin-border'}
              `} />
            )}
          </div>
        )
      })}
    </div>
  )
}