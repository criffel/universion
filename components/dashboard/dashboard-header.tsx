'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GraduationCap, LogOut, User, Settings, Flame, Trophy, Coins } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export function DashboardHeader() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [streak, setStreak] = useState(0)
  const [coins, setCoins] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    async function loadGamification() {
      if (!user || !profile) return
      try {
        // Fetch user points
        const { data: pointsData } = await supabase
          .from('user_points')
          .select('total_points, level, current_streak')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (pointsData) {
          setXp(pointsData.total_points || 0)
          setLevel(pointsData.level || 1)
          setStreak(pointsData.current_streak || 0)
        } else {
          // Initialize mock data / default row
          await supabase.from('user_points').insert({
            user_id: profile.id,
            total_points: 120,
            level: 1,
            current_streak: 2,
          })
          setXp(120)
          setLevel(1)
          setStreak(2)
        }

        // Fetch wallet
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (walletData) {
          setCoins(Number(walletData.balance) || 0)
        } else {
          // Initialize default wallet
          await supabase.from('wallets').insert({
            user_id: profile.id,
            balance: 150.00,
          })
          setCoins(150)
        }
      } catch (err) {
        console.warn('Error loading gamification dashboard widgets, using defaults.', err)
      }
    }
    loadGamification()
  }, [user, profile])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      aluno: 'Aluno',
      professor: 'Professor',
      coordenador: 'Coordenador',
      diretor: 'Diretor',
      responsavel: 'Responsável',
      empresa: 'Empresa B2B',
    }
    return labels[role] || role
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">UniVersion</span>
          </Link>

          {/* Gamification horizontal widget for students */}
          {profile.role === 'aluno' && (
            <div className="hidden md:flex items-center gap-4 bg-gray-50 border border-gray-150 px-4 py-1.5 rounded-full text-sm">
              <Link href="/dashboard/gamification" className="flex items-center gap-1.5 hover:opacity-85 text-orange-600 font-semibold transition-opacity">
                <Flame className="h-4 w-4 fill-orange-500 text-orange-500 animate-pulse" />
                <span>{streak} {streak === 1 ? 'dia' : 'dias'}</span>
              </Link>
              <div className="h-4 w-px bg-gray-200" />
              <Link href="/dashboard/gamification" className="flex items-center gap-1.5 hover:opacity-85 text-indigo-600 font-semibold transition-opacity">
                <Trophy className="h-4 w-4 text-indigo-500" />
                <span>Nível {level} ({xp} XP)</span>
              </Link>
              <div className="h-4 w-px bg-gray-200" />
              <Link href="/dashboard/gamification" className="flex items-center gap-1.5 hover:opacity-85 text-yellow-600 font-semibold transition-opacity">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span>{coins.toFixed(0)} Unacoins</span>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs md:text-sm text-gray-500 font-medium px-2.5 py-1 bg-slate-100 rounded-full">
            {getRoleLabel(profile.role)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profile.role === 'aluno' && (
                <>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/gamification')}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Conquistas e Loja
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/trails')}>
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Minhas Trilhas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 hover:text-red-700">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
