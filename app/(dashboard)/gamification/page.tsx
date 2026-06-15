'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { 
  Trophy, Award, Coins, Flame, Star, 
  ShoppingBag, Clock, CheckCircle2, Ticket 
} from 'lucide-react'
import { toast } from 'sonner'

interface Achievement {
  id: string
  code: string
  name: string
  description: string
  icon: string
  points_required: number
}

interface Voucher {
  id: string
  title: string
  description: string
  cost_coins: number
  code: string
  is_active: boolean
}

interface VoucherRedemptionWithVoucher {
  id: string
  user_id: string
  voucher_id: string
  redeemed_at: string
  vouchers: Voucher | null
}

export default function GamificationPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [streak, setStreak] = useState(0)
  const [coins, setCoins] = useState(0)
  const [walletId, setWalletId] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [unlockedIds, setUnlockedIds] = useState<string[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [redemptions, setRedemptions] = useState<VoucherRedemptionWithVoucher[]>([])

  useEffect(() => {
    async function loadData() {
      if (!profile) return
      try {
        // 1. Load User Points
        const { data: pointsData } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (pointsData) {
          setXp(pointsData.total_points || 0)
          setLevel(pointsData.level || 1)
          setStreak(pointsData.current_streak || 0)
        }

        // 2. Load Wallet
        const { data: walletData } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (walletData) {
          setCoins(Number(walletData.balance) || 0)
          setWalletId(walletData.id)
        }

        // 3. Load Achievements
        const { data: achieveData } = await supabase
          .from('achievements')
          .select('*')

        let currentAchievements = achieveData || []
        if (achieveData && achieveData.length > 0) {
          setAchievements(achieveData)
        } else {
          // Mock achievements database initialization
          const demoAchievements = [
            { code: 'FIRST_READ', name: 'Primeira Leitura', description: 'Concluiu sua primeira leitura de material no sistema.', icon: '🎯', points_required: 100 },
            { code: 'STREAK_3', name: 'Leitor Consistente', description: 'Leu por 3 dias consecutivos.', icon: '🔥', points_required: 300 },
            { code: 'FOCUS_MASTER', name: 'Foco Absoluto', description: 'Completou um checkpoint de compreensão com pontuação máxima.', icon: '🧠', points_required: 500 },
            { code: 'COIN_COLLECTOR', name: 'Investidor de Conhecimento', description: 'Acumulou mais de 500 Unacoins na carteira.', icon: '💰', points_required: 1000 }
          ]
          const { data: inserted } = await supabase.from('achievements').insert(demoAchievements).select()
          if (inserted) {
            setAchievements(inserted)
            currentAchievements = inserted
          }
        }

        // 4. Load Unlocked Achievements
        const { data: userAchieve } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', profile.id)

        if (userAchieve) {
          setUnlockedIds(userAchieve.map((ua) => ua.achievement_id))
        } else {
          // Unlock first achievement for demo
          const firstAch = currentAchievements?.[0]
          if (firstAch) {
            await supabase.from('user_achievements').insert({
              user_id: profile.id,
              achievement_id: firstAch.id
            })
            setUnlockedIds([firstAch.id])
          }
        }

        // 5. Load Vouchers Shop
        const { data: voucherData } = await supabase
          .from('vouchers')
          .select('*')
          .eq('is_active', true)

        if (voucherData && voucherData.length > 0) {
          setVouchers(voucherData)
        } else {
          // Mock vouchers database initialization
          const demoVouchers = [
            { title: 'Cupom R$ 15 Starbucks', description: 'Vale-compras para cafés e lanches.', cost_coins: 100, code: 'STAR-15-UNIV' },
            { title: 'Livro físico de Ficção na Cultura', description: 'Resgate de 1 livro selecionado.', cost_coins: 300, code: 'CULT-BOOK-UNIV' },
            { title: '1 Mês Grátis Netflix', description: 'Assinatura Padrão de 1 mês.', cost_coins: 500, code: 'NETFLIX-UNIV-FREE' }
          ]
          const { data: inserted } = await supabase.from('vouchers').insert(demoVouchers).select()
          if (inserted) setVouchers(inserted)
        }

        // 6. Load Redemptions
        const { data: redemptData } = await supabase
          .from('voucher_redemptions')
          .select('*, vouchers(*)')
          .eq('user_id', profile.id)

        if (redemptData) {
          setRedemptions(redemptData as unknown as VoucherRedemptionWithVoucher[])
        }
      } catch (err) {
        console.error('Erro ao carregar dados de gamificação:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [profile, refreshTrigger])

  const handleBuyVoucher = async (voucher: Voucher) => {
    if (!profile || !walletId) return
    if (coins < voucher.cost_coins) {
      toast.error('Saldo de Unacoins insuficiente.')
      return
    }

    try {
      const newBalance = coins - voucher.cost_coins

      // 1. Update wallet balance
      const { error: walletErr } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          total_spent: voucher.cost_coins
        })
        .eq('id', walletId)

      if (walletErr) throw walletErr

      // 2. Create Spend Transaction
      await supabase.from('transactions').insert({
        wallet_id: walletId,
        type: 'spend',
        amount: voucher.cost_coins,
        description: `Compra do Voucher: ${voucher.title}`
      })

      // 3. Create Voucher Redemption row
      await supabase.from('voucher_redemptions').insert({
        user_id: profile.id,
        voucher_id: voucher.id
      })

      setCoins(newBalance)
      toast.success(`Voucher "${voucher.title}" adquirido com sucesso! Código: ${voucher.code}`)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      console.error(err)
      toast.error('Falha ao concluir a transação.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Next level progress calculation
  const xpNeeded = level * 500
  const progressPercent = Math.min(100, (xp / xpNeeded) * 100)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
          Conquistas e Loja de Recompensas
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Monitore seu nível acadêmico e gaste suas Unacoins ganhas com leituras!
        </p>
      </div>

      {/* Stats summary panel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="h-4 w-4" /> Nível Acadêmico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-indigo-900 font-mono">Lvl {level}</div>
            <div className="space-y-1.5 mt-3">
              <div className="flex justify-between text-xs font-bold text-indigo-700">
                <span>Progresso {xp} XP</span>
                <span>{xpNeeded} XP</span>
              </div>
              <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="h-4 w-4" /> Streak de Leitura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-orange-950 font-mono">
              {streak} {streak === 1 ? 'Dia' : 'Dias'}
            </div>
            <p className="text-xs text-orange-700 mt-2 font-medium">
              Continue lendo todos os dias para multiplicar seus pontos!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-amber-600" /> Saldo Unacoins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-950 font-mono">
              {coins.toFixed(0)} <span className="text-sm font-semibold">Coins</span>
            </div>
            <p className="text-xs text-amber-700 mt-2 font-medium">
              Moeda interna ganha por ler e passar nos checkpoints de IA.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4" /> Medalhas Desbloqueadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-950 font-mono">
              {unlockedIds.length} / {achievements.length}
            </div>
            <p className="text-xs text-emerald-700 mt-2 font-medium">
              Desbloqueie tarefas de leitura assistida para obter mais medalhas.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Achievements list */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <Star className="h-5 w-5 text-indigo-600" /> Suas Medalhas Acadêmicas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {achievements.map((ach) => {
              const isUnlocked = unlockedIds.includes(ach.id)
              return (
                <Card 
                  key={ach.id} 
                  className={`border transition-all duration-300 hover:shadow-md ${
                    isUnlocked ? 'border-indigo-100 bg-white' : 'border-slate-200 bg-slate-50 opacity-70'
                  }`}
                >
                  <CardHeader className="p-4 flex flex-row gap-3 items-center pb-2">
                    <span className="text-3xl p-2 bg-slate-100 rounded-xl leading-none">
                      {ach.icon || '🏅'}
                    </span>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1">
                        {ach.name}
                        {isUnlocked && <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-50" />}
                      </CardTitle>
                      <CardDescription className="text-xs font-semibold text-indigo-600 mt-0.5">
                        +{ach.points_required} XP
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 text-xs text-slate-600 leading-relaxed">
                    {ach.description}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Voucher Store & redemptions */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <ShoppingBag className="h-5 w-5 text-amber-600" /> Loja de Resgate
            </h2>
            <div className="space-y-3">
              {vouchers.map((vch) => (
                <Card key={vch.id} className="border border-slate-100 shadow-sm hover:shadow">
                  <CardContent className="p-4 flex justify-between items-center gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{vch.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{vch.description}</p>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none text-xs font-bold font-mono mt-2 gap-1 px-2 py-0.5">
                        <Coins className="h-3 w-3 text-amber-600" /> {vch.cost_coins.toFixed(0)} Coins
                      </Badge>
                    </div>
                    <Button 
                      onClick={() => handleBuyVoucher(vch)}
                      disabled={coins < vch.cost_coins}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs px-3.5 py-1.5 h-auto font-bold shrink-0"
                    >
                      Resgatar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-slate-700">
              <Clock className="h-4 w-4" /> Cupons Resgatados
            </h3>
            {redemptions.length === 0 ? (
              <div className="p-4 bg-slate-50 border rounded-xl text-center text-xs text-slate-500">
                Você ainda não resgatou nenhum prêmio. Leia mais para ganhar coins!
              </div>
            ) : (
              <div className="space-y-2.5">
                {redemptions.map((red) => (
                  <div key={red.id} className="flex justify-between items-center p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{red.vouchers?.title}</span>
                      <span className="block text-[10px] text-muted-foreground mt-1">
                        Código: <code className="bg-slate-200 text-slate-800 font-mono px-1 rounded">{red.vouchers?.code}</code>
                      </span>
                    </div>
                    <Ticket className="h-4 w-4 text-indigo-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
