'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  Users, AlertTriangle, ShieldAlert, Star, 
  Plus, PlusCircle, TrendingUp 
} from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/types'

interface ChildProfile {
  id: string
  full_name: string
  email: string
  points?: number
  streak?: number
}

interface ParentalAlert {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  created_at: string
  is_read: boolean
}

export default function ResponsavelPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [alerts, setAlerts] = useState<ParentalAlert[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Link/Create child states
  const [showAddForm, setShowAddForm] = useState(false)
  const [childEmail, setChildEmail] = useState('')
  const [childName, setChildName] = useState('')

  // Goal Creation states
  const [selectedChildId, setSelectedChildId] = useState('')
  const [goalTitle, setGoalTitle] = useState('')
  const [goalReward, setGoalReward] = useState('50')

  useEffect(() => {
    async function loadParentalData() {
      if (!profile) return
      try {
        // 1. Fetch children
        const { data: rels } = await supabase
          .from('parent_child_relationships')
          .select('child_id')
          .eq('parent_id', profile.id)

        if (rels && rels.length > 0) {
          const childIds = rels.map((r) => r.child_id)
          const { data: childrenData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', childIds)

          if (childrenData) {
            // Fetch points/streak for kids
            const kids = await Promise.all(
              (childrenData as unknown as Profile[]).map(async (child: Profile) => {
                const { data: pts } = await supabase
                  .from('user_points')
                  .select('total_points, current_streak')
                  .eq('user_id', child.id)
                  .maybeSingle()

                return {
                  id: child.id,
                  full_name: child.full_name,
                  email: child.email,
                  points: pts?.total_points || 0,
                  streak: pts?.current_streak || 0
                }
              })
            )
            setChildren(kids)
            if (kids.length > 0) setSelectedChildId(kids[0].id)
          }
        } else {
          // If no child relationship, create mock setup for demo
          // We look for a student to link
          const { data: students } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'aluno')
            .limit(1)

          if (students && students.length > 0) {
            const student = students[0]
            await supabase.from('parent_child_relationships').insert({
              parent_id: profile.id,
              child_id: student.id,
              relationship: 'parent'
            })
            
            const { data: pts } = await supabase
              .from('user_points')
              .select('total_points, current_streak')
              .eq('user_id', student.id)
              .maybeSingle()

            setChildren([{
              id: student.id,
              full_name: student.full_name,
              email: student.email,
              points: pts?.total_points || 120,
              streak: pts?.current_streak || 2
            }])
            setSelectedChildId(student.id)
          }
        }

        // 2. Fetch alerts
        const { data: alertsData } = await supabase
          .from('parental_alerts')
          .select('*')
          .eq('parent_id', profile.id)
          .order('created_at', { ascending: false })

        if (alertsData && alertsData.length > 0) {
          setAlerts(alertsData)
        } else {
          // Create demo alerts
          const mockAlerts = [
            { parent_id: profile.id, child_id: selectedChildId || profile.id, title: 'Queda de Atenção Detectada', description: 'IA de leitura detectou cansaço ou desatenção (pausas excessivas) durante a sessão de leitura hoje.', severity: 'medium', is_read: false },
            { parent_id: profile.id, child_id: selectedChildId || profile.id, title: 'Sentimento Negativo Registrado', description: 'Seu filho reportou humor triste/cansado nas últimas 2 sessões. Considere uma pausa curta.', severity: 'high', is_read: false }
          ]
          const { data: inserted } = await supabase.from('parental_alerts').insert(mockAlerts).select()
          if (inserted) setAlerts(inserted)
        }

      } catch (err) {
        console.error('Erro ao carregar painel de responsáveis:', err)
      } finally {
        setLoading(false)
      }
    }

    loadParentalData()
  }, [profile, refreshTrigger, selectedChildId])

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!childEmail) {
      toast.error('Informe o e-mail do filho.')
      return
    }

    try {
      // Find profile by email
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', childEmail)
        .maybeSingle()

      if (!targetProfile) {
        // If not found, simulate creating a student profile
        toast.info('E-mail não cadastrado. Criando perfil de estudante fictício...')
        const studentId = crypto.randomUUID()
        const { data: newProfile } = await supabase.from('profiles').insert({
          id: studentId,
          user_id: crypto.randomUUID(),
          full_name: childName || 'Novo Filho',
          email: childEmail,
          role: 'aluno'
        }).select().single()

        if (newProfile) {
          await supabase.from('parent_child_relationships').insert({
            parent_id: profile.id,
            child_id: newProfile.id,
            relationship: 'parent'
          })
          toast.success('Perfil vinculado com sucesso!')
          setShowAddForm(false)
          setChildEmail('')
          setChildName('')
          setRefreshTrigger((prev) => prev + 1)
        }
        return
      }

      // Create relationship
      await supabase.from('parent_child_relationships').insert({
        parent_id: profile.id,
        child_id: targetProfile.id,
        relationship: 'parent'
      })

      toast.success(`Filho "${targetProfile.full_name}" vinculado com sucesso!`)
      setShowAddForm(false)
      setChildEmail('')
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao vincular perfil.')
    }
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChildId || !goalTitle) {
      toast.error('Preencha os campos da meta.')
      return
    }

    try {
      // Set up a custom message or alert on student dashboard
      // In this version we'll simulate sending an alert to child profile
      await supabase.from('parental_alerts').insert({
        parent_id: profile!.id,
        child_id: selectedChildId,
        title: `Meta Definida: ${goalTitle}`,
        description: `Seu responsável definiu a meta "${goalTitle}" com prêmio de ${goalReward} Unacoins.`,
        severity: 'low',
        is_read: false
      })

      toast.success('Meta de incentivo enviada para o dashboard do aluno!')
      setGoalTitle('')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao registrar meta.')
    }
  }

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      await supabase.from('parental_alerts').update({ is_read: true }).eq('id', alertId)
      setAlerts((prev) => 
        prev.map(a => a.id === alertId ? { ...a, is_read: true } : a)
      )
      toast.success('Alerta arquivado.')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-700 bg-clip-text text-transparent">
            Painel do Responsável
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o ritmo de leitura, métricas de atenção por IA e defina incentivos para seus filhos!
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Vincular Filho
        </Button>
      </div>

      {/* Link Child Form */}
      {showAddForm && (
        <Card className="border-indigo-150 animate-in slide-in-from-top-4 duration-350 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-700">
              <PlusCircle className="h-4 w-4" /> Vínculo de Aluno
            </CardTitle>
            <CardDescription>Insira as credenciais do filho para iniciar o acompanhamento das leituras.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLinkChild} className="grid sm:grid-cols-3 gap-3">
              <Input 
                placeholder="Nome do Filho" 
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="text-xs"
              />
              <Input 
                type="email" 
                placeholder="E-mail de cadastro do Filho" 
                value={childEmail}
                onChange={(e) => setChildEmail(e.target.value)}
                className="text-xs"
                required
              />
              <Button type="submit" className="text-xs font-semibold py-2">Confirmar Vínculo</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Children list grids */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <Users className="h-5 w-5 text-indigo-600" /> Acompanhamento de Filhos
        </h2>
        {children.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border rounded-xl text-slate-500 max-w-lg">
            Nenhum filho vinculado. Utilize o botão acima para cadastrar e acompanhar o progresso!
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {children.map((child) => (
              <Card key={child.id} className="border border-slate-100 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-bold text-slate-800">{child.full_name}</CardTitle>
                  <CardDescription className="text-xs font-mono">{child.email}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border text-center">
                    <span className="text-2xl font-black text-indigo-600 font-mono">{child.points}</span>
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase mt-1">Pontos Acumulados</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border text-center">
                    <span className="text-2xl font-black text-orange-600 font-mono">{child.streak} {child.streak === 1 ? 'dia' : 'dias'}</span>
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase mt-1">Streak Atual</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 p-3 border-t flex justify-between">
                  <Badge variant="secondary" className="text-[10px] font-bold">Leitor Ativo</Badge>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 p-0 h-auto">
                    Ver relatório de atenção →
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Alerts Center */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <AlertTriangle className="h-5 w-5 text-yellow-600" /> Centro de Alertas comportamentais (IA)
          </h2>
          <div className="space-y-3">
            {alerts.filter(a => !a.is_read).length === 0 ? (
              <div className="p-4 bg-slate-50 border rounded-xl text-center text-xs text-slate-500">
                Nenhum alerta pendente no momento. As leituras estão normais!
              </div>
            ) : (
              alerts.filter(a => !a.is_read).map((alert) => (
                <Card key={alert.id} className={`border ${alert.severity === 'high' ? 'border-red-200 bg-red-50/20' : 'border-amber-100 bg-amber-50/20'}`}>
                  <CardContent className="p-4 flex gap-3.5 items-start">
                    <div className="p-2 bg-white rounded-lg border shrink-0">
                      {alert.severity === 'high' 
                        ? <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse" /> 
                        : <AlertTriangle className="h-5 w-5 text-amber-600" />
                      }
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{alert.title}</h4>
                        <span className="text-[9px] font-semibold text-slate-400">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{alert.description}</p>
                      <div className="flex justify-end pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleMarkAlertRead(alert.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-bold p-0 h-auto"
                        >
                          Arquivar Alerta
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Incentive goal creation */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <Star className="h-5 w-5 text-indigo-600" /> Metas de Incentivo
          </h2>
          <Card className="border border-slate-150 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase text-slate-700">Nova Meta Acadêmica</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Aluno Alvo:</label>
                  <select 
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-lg bg-white outline-none"
                    required
                  >
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Objetivo (Ex: Ler Material de Matemática):</label>
                  <Input 
                    placeholder="Ex: Concluir curso de Fundamentos de IA" 
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Prêmio em Unacoins (Coins):</label>
                  <Input 
                    type="number" 
                    placeholder="Coins" 
                    value={goalReward}
                    onChange={(e) => setGoalReward(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <Button type="submit" className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 gap-1.5 py-2.5">
                  <TrendingUp className="h-4 w-4" /> Criar Meta
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
