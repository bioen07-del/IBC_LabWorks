import { useState } from 'react'
import { Snowflake } from 'lucide-react'
import { BankingFormModal } from './BankingFormModal'

type Props = {
  cultureId: number
  cultureName: string
  passageNumber: number
  totalFreezings: number
}

export function BankingButton({ cultureId, cultureName, passageNumber, totalFreezings }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
      >
        <Snowflake className="h-4 w-4" />
        Замораживание
      </button>

      {showModal && (
        <BankingFormModal
          cultureId={cultureId}
          cultureName={cultureName}
          passageNumber={passageNumber}
          totalFreezings={totalFreezings}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
