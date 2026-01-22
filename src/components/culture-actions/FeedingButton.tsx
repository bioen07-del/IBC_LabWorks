import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Utensils } from 'lucide-react'
import { toast } from 'sonner'

interface FeedingButtonProps {
  cultureId: number
  onFeedingComplete?: () => void
}

interface Media {
  id: number
  media_code: string
  media_name: string
  serum_concentration: number | null
}

export function FeedingButton({ cultureId, onFeedingComplete }: FeedingButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mediaList, setMediaList] = useState<Media[]>([])
  const [selectedMediaId, setSelectedMediaId] = useState<string>('')
  const [volumeMl, setVolumeMl] = useState<string>('')

  useEffect(() => {
    if (open) {
      loadMedia()
    }
  }, [open])

  async function loadMedia() {
    const { data, error } = await supabase
      .from('media_recipes')
      .select('id, recipe_code, recipe_name')
      .eq('is_active', true)
      .order('recipe_name')

    if (error) {
      console.error('Error loading media:', error)
      toast.error('Ошибка загрузки списка сред')
      return
    }

    // Map to expected format
    const mapped = data?.map(r => ({
      id: r.id,
      media_code: r.recipe_code,
      media_name: r.recipe_name,
      serum_concentration: null
    })) || []
    setMediaList(mapped)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedMediaId) {
      toast.error('Выберите среду для кормления')
      return
    }

    if (!volumeMl || parseFloat(volumeMl) <= 0) {
      toast.error('Укажите корректный объем среды')
      return
    }

    setLoading(true)

    try {
      const now = new Date().toISOString()
      const volume = parseFloat(volumeMl)

      // Получаем информацию о выбранной среде
      const selectedMedia = mediaList.find(m => m.id === parseInt(selectedMediaId))

      // Note: feeding tracking removed as fields don't exist in current schema

      // Создаем запись в истории
      const { error: historyError } = await supabase
        .from('culture_history')
        .insert({
          culture_id: cultureId,
          action: 'feeding',
          description: `Кормление: ${selectedMedia?.media_name || 'среда'} (${selectedMedia?.media_code || ''}), ${volume} мл${selectedMedia?.serum_concentration ? `, сыворотка ${selectedMedia.serum_concentration}%` : ''}`,
          new_values: {
            media_id: parseInt(selectedMediaId),
            media_code: selectedMedia?.media_code,
            media_name: selectedMedia?.media_name,
            volume_ml: volume,
            serum_concentration: selectedMedia?.serum_concentration
          }
        })

      if (historyError) throw historyError

      toast.success('Кормление зарегистрировано')
      setOpen(false)

      // Сброс формы
      setSelectedMediaId('')
      setVolumeMl('')

      onFeedingComplete?.()
    } catch (error: any) {
      console.error('Error recording feeding:', error)
      toast.error(error.message || 'Ошибка при регистрации кормления')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Utensils className="h-4 w-4 mr-2" />
          Кормление
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Кормление культуры</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="media">Среда для кормления</Label>
            <Select value={selectedMediaId} onValueChange={setSelectedMediaId}>
              <SelectTrigger id="media">
                <SelectValue placeholder="Выберите среду" />
              </SelectTrigger>
              <SelectContent>
                {mediaList.map((media) => (
                  <SelectItem key={media.id} value={media.id.toString()}>
                    {media.media_name} ({media.media_code})
                    {media.serum_concentration && ` - ${media.serum_concentration}% сыворотки`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mediaList.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Загрузка списка сред...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="volume">Объем среды (мл)</Label>
            <Input
              id="volume"
              type="number"
              step="0.1"
              min="0"
              value={volumeMl}
              onChange={(e) => setVolumeMl(e.target.value)}
              placeholder="Например: 5.0"
              required
            />
            <p className="text-sm text-muted-foreground">
              Объем питательной среды, добавленный к культуре
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить кормление'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
