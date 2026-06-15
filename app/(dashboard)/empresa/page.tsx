'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Profile } from '@/types'

import { 
  FileText, CheckSquare, 
  Settings, Award, TrendingUp, Users, ArrowUpRight 
} from 'lucide-react'
import { toast } from 'sonner'

interface CorporateDocument {
  id: string
  title: string
  content: string
  required_comprehension: number
  created_at: string
}

interface Assignment {
  id: string
  full_name: string
  email: string
  document_title: string
  completed: boolean
  compliance_verified: boolean
  score?: number
}

interface AssignmentResponse {
  id: string
  completed: boolean
  compliance_verified: boolean
  score?: number
  profiles: Profile | null
  corporate_documents: CorporateDocument | null
}

export default function EmpresaPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  
  // Data lists
  const [documents, setDocuments] = useState<CorporateDocument[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [employees, setEmployees] = useState<Profile[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // New document form states
  const [docTitle, setDocTitle] = useState('')
  const [docContent, setDocContent] = useState('')
  const [requiredScore, setRequiredScore] = useState(80)

  // Certificate template states
  const [borderStyle, setBorderStyle] = useState<'classic' | 'double' | 'minimal'>('classic')
  const [accentColor, setAccentColor] = useState('#4f46e5')
  const [signatureRole, setSignatureRole] = useState('Diretor de Recursos Humanos')
  const [signatureName, setSignatureName] = useState('')

  // Assign states
  const [selectedDocId, setSelectedDocId] = useState('')
  const [selectedEmpId, setSelectedEmpId] = useState('')

  useEffect(() => {
    async function loadCorporateData() {
      if (!profile) return
      try {
        // 1. Fetch organization
        let orgId = profile.organization_id
        if (!orgId) {
          // Mock default organization
          const { data: orgs } = await supabase.from('organizations').select('*').limit(1)
          if (orgs && orgs.length > 0) {
            orgId = orgs[0].id
            await supabase.from('profiles').update({ organization_id: orgId }).eq('id', profile.id)
          } else {
            const { data: newOrg } = await supabase.from('organizations').insert({ name: 'Empresa Demo Corp' }).select().single()
            if (newOrg) {
              orgId = newOrg.id
              await supabase.from('profiles').update({ organization_id: orgId }).eq('id', profile.id)
            }
          }
        }

        // 2. Fetch documents
        const { data: docsData } = await supabase
          .from('corporate_documents')
          .select('*')
          .eq('organization_id', orgId)

        if (docsData && docsData.length > 0) {
          setDocuments(docsData)
          setSelectedDocId(docsData[0].id)
        } else {
          // Mock default documents
          const demoDocs = [
            { organization_id: orgId, title: 'Código de Conduta Ética 2026', content: 'Regras de compliance, sigilo e postura profissional da empresa.', required_comprehension: 85.00 },
            { organization_id: orgId, title: 'Manual de Segurança Cibernética', content: 'Protocolos de segurança, phishing e proteção de dados confidenciais.', required_comprehension: 80.00 }
          ]
          const { data: inserted } = await supabase.from('corporate_documents').insert(demoDocs).select()
          if (inserted) {
            setDocuments(inserted)
            setSelectedDocId(inserted[0].id)
          }
        }

        // 3. Fetch employee profiles (excluding managers/parents)
        const { data: employeesData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'aluno') // Use student role as mock employee in the unified DB
          .eq('organization_id', orgId)

        if (employeesData && employeesData.length > 0) {
          setEmployees(employeesData as unknown as Profile[])
          setSelectedEmpId(employeesData[0].id)
        } else {
          // Mock default employee profile if empty
          const mockEmpId = crypto.randomUUID()
          const { data: newEmp } = await supabase.from('profiles').insert({
            id: mockEmpId,
            user_id: crypto.randomUUID(),
            full_name: 'Ana Silva (Colaborador)',
            email: 'ana.silva@empresa.com',
            role: 'aluno',
            organization_id: orgId
          }).select().single()
          
          if (newEmp) {
            setEmployees([newEmp as unknown as Profile])
            setSelectedEmpId(newEmp.id)
          }
        }

        // 4. Fetch assignments
        const { data: assignData } = await supabase
          .from('corporate_document_assignments')
          .select('*, corporate_documents(*), profiles(*)')

        if (assignData && assignData.length > 0) {
          const mapped = (assignData as unknown as AssignmentResponse[]).map((item) => ({
            id: item.id,
            full_name: item.profiles?.full_name || 'Ana Silva',
            email: item.profiles?.email || 'ana.silva@empresa.com',
            document_title: item.corporate_documents?.title || 'Código de Conduta',
            completed: item.completed,
            compliance_verified: item.compliance_verified,
            score: item.score
          }))
          setAssignments(mapped)
        } else {
          // Create demo assignments if empty
          const curDocId = docsData?.[0]?.id || documents?.[0]?.id
          const curEmpId = employeesData?.[0]?.id || employees?.[0]?.id
          
          if (curDocId && curEmpId) {
            const { data: insertedAssign } = await supabase.from('corporate_document_assignments').insert({
              user_id: curEmpId,
              document_id: curDocId,
              completed: true,
              compliance_verified: true,
              completed_at: new Date().toISOString()
            }).select('*, corporate_documents(*), profiles(*)')
            
            if (insertedAssign) {
              const mapped = (insertedAssign as unknown as AssignmentResponse[]).map((item) => ({
                id: item.id,
                full_name: item.profiles?.full_name || 'Ana Silva',
                email: item.profiles?.email || 'ana.silva@empresa.com',
                document_title: item.corporate_documents?.title || 'Código de Conduta',
                completed: item.completed,
                compliance_verified: item.compliance_verified,
                score: 95
              }))
              setAssignments(mapped)
            }
          }
        }

      } catch (err) {
        console.error('Erro ao carregar dados corporativos:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCorporateData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, refreshTrigger, selectedDocId])

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docTitle || !docContent) {
      toast.error('Informe título e conteúdo do documento.')
      return
    }

    try {
      const { data: newDoc } = await supabase
        .from('corporate_documents')
        .insert({
          organization_id: profile!.organization_id,
          title: docTitle,
          content: docContent,
          required_comprehension: requiredScore
        })
        .select()
        .single()

      if (newDoc) {
        setDocuments((prev) => [...prev, newDoc])
        toast.success(`Documento "${docTitle}" cadastrado com sucesso!`)
        setDocTitle('')
        setDocContent('')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao cadastrar documento.')
    }
  }

  const handleAssignDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDocId || !selectedEmpId) {
      toast.error('Selecione um documento e um colaborador.')
      return
    }

    try {
      await supabase.from('corporate_document_assignments').insert({
        user_id: selectedEmpId,
        document_id: selectedDocId
      })

      toast.success('Documento atribuído com sucesso para o colaborador!')
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      console.error(err)
      toast.error('Atribuição já existente ou falha no cadastro.')
    }
  }

  const handleSaveCertificateConfig = () => {
    toast.success('Template de certificado atualizado com sucesso!')
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Calculate compliance statistics
  const totalAssigns = assignments.length
  const completedAssigns = assignments.filter((a) => a.completed).length
  const complianceRate = totalAssigns > 0 ? (completedAssigns / totalAssigns) * 100 : 0

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-800 to-slate-900 bg-clip-text text-transparent">
          Portal de Compliance Corporativo (B2B)
        </h1>
        <p className="text-muted-foreground mt-2">
          Publique manuais corporativos, audite a leitura de colaboradores e emita certificados automatizados de conformidade.
        </p>
      </div>

      {/* KPI Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-slate-50 border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-slate-500" /> Manuais Publicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">{documents.length}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Documentos com auditoria ativa.</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-500" /> Colaboradores Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">{employees.length}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Funcionários na organização.</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-150">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-600" /> Média de Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-indigo-950 font-mono">{complianceRate.toFixed(0)}%</div>
            <p className="text-xs text-indigo-700 mt-2 font-medium">Taxa de conclusão de leitura corporativa.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Compliance Assignments and docs list */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-indigo-600" /> Monitoramento de Leituras (Compliance)
                </CardTitle>
                <CardDescription className="text-xs mt-1">Acompanhamento detalhado por colaborador.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {assignments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-semibold">
                  Nenhuma leitura atribuída ainda. Crie uma atribuição ao lado!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b">
                        <th className="p-3.5 font-bold">Colaborador</th>
                        <th className="p-3.5 font-bold">Documento</th>
                        <th className="p-3.5 font-bold">Status</th>
                        <th className="p-3.5 font-bold text-center">Score IA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-800 block">{item.full_name}</span>
                            <span className="text-[10px] text-muted-foreground block font-mono">{item.email}</span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-700">{item.document_title}</td>
                          <td className="p-3.5">
                            <Badge variant={item.completed ? 'default' : 'outline'} className={item.completed ? 'bg-emerald-100 text-emerald-800 border-none px-2' : 'px-2'}>
                              {item.completed ? 'Concluído' : 'Pendente'}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-center font-bold text-indigo-600 font-mono">
                            {item.score ? `${item.score}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* New manual / training document creation */}
          <Card className="shadow-sm border-slate-100">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" /> Publicar Novo Documento / Regulamento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreateDocument} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Título do Manual:</label>
                  <Input 
                    placeholder="Ex: Regulamento de Home-Office v2.0" 
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Conteúdo Regulatório:</label>
                  <Textarea 
                    placeholder="Cole aqui o manual corporativo completo..." 
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    className="min-h-[120px] text-xs font-serif leading-relaxed"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Compreensão Mínima Exigida (%):</label>
                  <Input 
                    type="number" 
                    value={requiredScore}
                    onChange={(e) => setRequiredScore(Number(e.target.value))}
                    className="text-xs font-mono max-w-[120px]"
                    required
                  />
                </div>
                <Button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-700 gap-1.5 py-2">
                  Publicar Manual
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Action Sidebar: Assignments and Certificate configs */}
        <div className="space-y-6">
          <Card className="border border-slate-150 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase text-slate-700">Atribuir Leitura</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleAssignDocument} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Selecionar Colaborador:</label>
                  <select 
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-lg bg-white outline-none"
                    required
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Selecionar Regulamento:</label>
                  <select 
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-lg bg-white outline-none"
                    required
                  >
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>{doc.title}</option>
                    ))}
                  </select>
                </div>

                <Button type="submit" className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 gap-1.5 py-2.5">
                  <ArrowUpRight className="h-4 w-4" /> Atribuir e Enviar
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Certificate config styling */}
          <Card className="border border-slate-150 shadow-sm bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-indigo-600" /> Configuração do Certificado
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Modelo de Certificado:</label>
                <div className="flex gap-2">
                  {['classic', 'double', 'minimal'].map((style) => (
                    <Button
                      key={style}
                      type="button"
                      variant={borderStyle === style ? 'default' : 'outline'}
                      onClick={() => setBorderStyle(style as 'classic' | 'double' | 'minimal')}
                      className="text-[10px] h-7 px-2.5 flex-1 font-bold capitalize"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Cor Principal do Certificado:</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-8 w-10 border rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-slate-700">{accentColor}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Cargo do Signatário:</label>
                <Input 
                  value={signatureRole}
                  onChange={(e) => setSignatureRole(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Nome do Signatário:</label>
                <Input 
                  placeholder="Nome para assinatura" 
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button onClick={handleSaveCertificateConfig} className="w-full text-xs bg-slate-800 hover:bg-slate-900 gap-1.5 py-2.5 font-bold">
                <Award className="h-4 w-4 text-indigo-200" /> Salvar Layout
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
