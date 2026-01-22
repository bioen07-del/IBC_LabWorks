import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye } from 'lucide-react'
import { toast } from 'sonner'

interface ObservationButtonProps {
  cultureId: number
  onObservationComplete?: () => void
}

export function ObservationButton({ cultureId, onObservationComplete }: ObservationButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confluencePercent, setConfluencePercent] = useState<string>('')
  const [morphologyNotes, setMorphologyNotes] = useState('')
  const [sterilityStatus, setSterilityStatus] = useState<'sterile' | 'contaminated' | 'unknown'>('unknown')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const now = new Date().toISOString()
      const confluenceValue = confluencePercent ? parseInt(confluencePercent) : null

      // Валидация процента монослоя
      if (confluenceValue !== null && (confluenceValue < 0 || confluenceValue > 100)) {
        toast.error('Процент монослоя должен быть от 0 до 100')
        setLoading(false)
        return
      }

      // Получаем текущие данные культуры для интервала осмотра
      const { data: culture, error: fetchError } = await supabase
        .from('cultures')
        .select('observation_interval_days')
        .eq('id', cultureId)
        .single()

      if (fetchError) throw fetchError

      // Note: observation tracking removed as fields don't exist in current schema

      // Создаем запись в истории
      const { error: historyError } = await supabase
        .from('culture_history')
        .insert({
          culture_id: cultureId,
          action: 'observation',
          description: `Осмотр культуры: ${confluenceValue !== null ? `монослой ${confluenceValue}%` : 'процент не указан'}, стерильность: ${sterilityStatus === 'sterile' ? 'стерильна' : sterilityStatus === 'contaminated' ? 'контаминирована' : 'неизвестно'}${morphologyNotes ? `, морфология: ${morphologyNotes}` : ''}`,
          new_values: {
            confluence_percent: confluenceValue,
            morphology_notes: morphologyNotes,
            sterility_status: sterilityStatus
          }
        })

      if (historyError) throw historyError

      toast.success('Осмотр зарегистрирован')
      setOpen(false)

      // Сброс формы
      setConfluencePercent('')
      setMorphologyNotes('')
      setSterilityStatus('unknown')

      onObservationComplete?.()
    } catch (error: any) {
      console.error('Error recording observation:', error)
      toast.error(error.message || 'Ошибка при регистрации осмотра')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Осмотр
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Осмотр культуры</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confluence">Процент монослоя (%)</Label>
            <Input
              id="confluence"
              type="number"
              min="0"
              max="100"
              value={confluencePercent}
              onChange={(e) => setConfluencePercent(e.target.value)}
              placeholder="0-100"
            />
            <p className="text-sm text-muted-foreground">
              Оценка заполнения поверхности клетками (0-100%)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sterility">Стерильность</Label>
            <Select value={sterilityStatus} onValueChange={(v: any) => setSterilityStatus(v)}>
              <SelectTrigger id="sterility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sterile">Стерильна</SelectItem>
                <SelectItem value="contaminated">Контаминирована</SelectItem>
                <SelectItem value="unknown">Неизвестно</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="morphology">Морфология клеток</Label>
            <Textarea
              id="morphology"
              value={morphologyNotes}
              onChange={(e) => setMorphologyNotes(e.target.value)}
              placeholder="Описание морфологии клеток, признаки дифференцировки, аномалии..."
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить осмотр'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
