/**
 * FEFO (First Expired, First Out) - логика выбора материалов
 * Материалы с ближайшим сроком годности используются первыми
 */

import { supabase } from './supabase'

interface FEFOItem {
  id: number
  expiry_date: string
  quantity_remaining: number
  [key: string]: any
}

/**
 * Сортировка по FEFO - сначала с ближайшим сроком годности
 */
export function sortByFEFO<T extends FEFOItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.expiry_date).getTime()
    const dateB = new Date(b.expiry_date).getTime()
    return dateA - dateB
  })
}

/**
 * Фильтрация просроченных (исключить)
 */
export function filterExpired<T extends FEFOItem>(items: T[]): T[] {
  const now = new Date()
  return items.filter(item => new Date(item.expiry_date) > now)
}

/**
 * Получить доступные медиа-партии с сортировкой FEFO
 */
export async function getAvailableMediaBatchesFEFO(recipeId?: number) {
  let query = supabase
    .from('combined_media_batches')
    .select('*, media_recipes(recipe_name)')
    .eq('status', 'active')
    .gt('volume_remaining_ml', 0)
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .order('expiry_date', { ascending: true })
  
  if (recipeId) {
    query = query.eq('media_recipe_id', recipeId)
  }

  const { data, error } = await query
  
  if (error) {
    console.error('FEFO media fetch error:', error)
    return []
  }

  return data || []
}

/**
 * Получить доступные инвентарные позиции с сортировкой FEFO
 */
export async function getAvailableInventoryFEFO(category?: 'media' | 'serum' | 'reagent' | 'consumable' | 'additive') {
  let query = supabase
    .from('inventory_items')
    .select('*')
    .eq('status', 'active')
    .gt('quantity_remaining', 0)
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .order('expiry_date', { ascending: true })
  
  if (category) {
    query = query.eq('item_category', category as any)
  }

  const { data, error } = await query

  if (error) {
    console.error('FEFO inventory fetch error:', error)
    return []
  }

  return data || []
}

/**
 * Проверка на близкий срок годности (менее N дней)
 */
export function checkExpiryWarning(expiryDate: string, warningDays: number = 7): boolean {
  const expiry = new Date(expiryDate)
  const warningDate = new Date()
  warningDate.setDate(warningDate.getDate() + warningDays)
  return expiry <= warningDate
}

/**
 * Подсчёт дней до истечения срока
 */
export function daysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  const now = new Date()
  const diffTime = expiry.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
