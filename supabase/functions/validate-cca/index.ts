// ЗАДАЧА 3: Edge Function validate-cca
// Валидация CCA правил по каждому контейнеру

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CCARequest {
  executed_step_id: number
  container_results: {
    container_id: number
    viability_percent?: number
    cell_concentration?: number
    volume_ml?: number
    [key: string]: any
  }[]
}

interface CCARule {
  min_viability?: number
  max_viability?: number
  min_concentration?: number
  max_concentration?: number
  min_volume?: number
  [key: string]: any
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body: CCARequest = await req.json()
    const { executed_step_id, container_results } = body

    if (!executed_step_id || !container_results?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Получить шаг и его CCA правила
    const { data: step, error: stepError } = await supabase
      .from('executed_steps')
      .select(`
        *,
        process_template_steps(cca_rules, is_critical, step_name),
        executed_processes(culture_id, process_code)
      `)
      .eq('id', executed_step_id)
      .single()

    if (stepError || !step) {
      return new Response(
        JSON.stringify({ error: 'Step not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ccaRules: CCARule = step.process_template_steps?.cca_rules || {}
    const isCritical = step.process_template_steps?.is_critical || false
    const stepName = step.process_template_steps?.step_name || 'Unknown Step'
    const cultureId = step.executed_processes?.culture_id
    const processCode = step.executed_processes?.process_code

    // 2. Валидация каждого контейнера
    const results: any[] = []
    const failedContainers: number[] = []

    for (const cr of container_results) {
      const checks: any[] = []
      let passed = true

      // Проверка viability
      if (cr.viability_percent !== undefined && ccaRules.min_viability !== undefined) {
        const viabilityPassed = cr.viability_percent >= ccaRules.min_viability
        checks.push({
          param: 'viability_percent',
          value: cr.viability_percent,
          min: ccaRules.min_viability,
          passed: viabilityPassed
        })
        if (!viabilityPassed) passed = false
      }

      // Проверка концентрации
      if (cr.cell_concentration !== undefined && ccaRules.min_concentration !== undefined) {
        const concPassed = cr.cell_concentration >= ccaRules.min_concentration
        checks.push({
          param: 'cell_concentration',
          value: cr.cell_concentration,
          min: ccaRules.min_concentration,
          passed: concPassed
        })
        if (!concPassed) passed = false
      }

      // Проверка объёма
      if (cr.volume_ml !== undefined && ccaRules.min_volume !== undefined) {
        const volPassed = cr.volume_ml >= ccaRules.min_volume
        checks.push({
          param: 'volume_ml',
          value: cr.volume_ml,
          min: ccaRules.min_volume,
          passed: volPassed
        })
        if (!volPassed) passed = false
      }

      // 3. Сохранить результат в executed_step_container_results
      const { error: insertError } = await supabase
        .from('executed_step_container_results')
        .upsert({
          executed_step_id,
          container_id: cr.container_id,
          recorded_parameters: cr,
          cca_passed: passed,
          cca_results: { checks, rules_applied: ccaRules },
          status: passed ? 'passed' : 'failed',
          blocked_at: passed ? null : new Date().toISOString(),
          blocked_reason: passed ? null : `CCA fail: ${checks.filter(c => !c.passed).map(c => c.param).join(', ')}`
        }, {
          onConflict: 'executed_step_id,container_id'
        })

      if (insertError) {
        console.error('Error saving container result:', insertError)
      }

      results.push({
        container_id: cr.container_id,
        passed,
        checks
      })

      if (!passed) {
        failedContainers.push(cr.container_id)

        // 4. Блокировка контейнера (quality_hold = 'system')
        await supabase
          .from('containers')
          .update({ 
            quality_hold: 'system',
            quality_hold_reason: `CCA fail at step "${stepName}"`,
            quality_hold_at: new Date().toISOString()
          })
          .eq('id', cr.container_id)
      }
    }

    // 5. Создать Deviation если есть failed контейнеры
    if (failedContainers.length > 0) {
      const year = new Date().getFullYear()
      const { count } = await supabase
        .from('deviations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`)
      
      const devCode = `DEV-${year}-${String((count || 0) + 1).padStart(4, '0')}`

      await supabase.from('deviations').insert({
        deviation_code: devCode,
        deviation_type: 'cca_fail',
        severity: isCritical ? 'critical' : 'major',
        description: `CCA fail при выполнении шага "${stepName}" (${processCode}). Контейнеры: ${failedContainers.length}`,
        culture_id: cultureId,
        executed_step_id,
        status: 'open',
        qp_review_required: true,
        detected_at: new Date().toISOString()
      })

      // 6. Создать задачу для QP
      const taskCode = `TASK-${year}-${String(Date.now()).slice(-6)}`
      await supabase.from('tasks').insert({
        task_code: taskCode,
        task_type: 'investigation',
        priority: isCritical ? 'critical' : 'high',
        title: `CCA fail: ${stepName}`,
        description: `Требуется решение QP по отклонению ${devCode}. ${failedContainers.length} контейнер(ов) заблокировано.`,
        assigned_to_role: 'qp',
        culture_id: cultureId,
        status: 'pending'
      })
    }

    // 7. Обновить общий статус шага
    const allPassed = results.every(r => r.passed)
    await supabase
      .from('executed_steps')
      .update({
        cca_passed: allPassed,
        cca_results: { 
          validated_at: new Date().toISOString(),
          total_containers: results.length,
          passed_containers: results.filter(r => r.passed).length,
          failed_containers: failedContainers.length
        }
      })
      .eq('id', executed_step_id)

    return new Response(
      JSON.stringify({
        success: true,
        all_passed: allPassed,
        results,
        failed_containers: failedContainers,
        deviation_created: failedContainers.length > 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('CCA validation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
