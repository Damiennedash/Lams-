import { CheckCircle, Clock, Package, Truck, MapPin } from 'lucide-react'
import { getStatusStep, getStatusLabel } from '@/lib/utils'

interface Props {
  status: string
}

const steps = [
  { label: 'En attente', icon: Clock },
  { label: 'Confirmée', icon: CheckCircle },
  { label: 'Expédiée', icon: Truck },
  { label: 'Livrée', icon: MapPin },
]

export default function OrderTracker({ status }: Props) {
  const currentStep = getStatusStep(status)

  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100">
        <span className="text-red-500 text-sm font-medium">Commande annulée</span>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="flex items-center">
        {steps.map((step, i) => {
          const Icon = step.icon
          const done = i < currentStep
          const current = i === currentStep

          return (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`progress-step ${
                    done ? 'done' : current ? 'current' : 'pending'
                  }`}
                >
                  <Icon size={14} />
                </div>
                <span
                  className={`text-[10px] tracking-wider whitespace-nowrap hidden sm:block ${
                    done || current ? 'text-lams-dark font-medium' : 'text-lams-lightgray'
                  }`}
                >
                  {step.label.toUpperCase()}
                </span>
              </div>

              {/* Line */}
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-colors duration-500 ${
                    i < currentStep ? 'bg-lams-dark' : 'bg-lams-border'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile step label */}
      <p className="sm:hidden text-center text-xs text-lams-dark mt-3 font-medium tracking-wider">
        {getStatusLabel(status).toUpperCase()}
      </p>
    </div>
  )
}
