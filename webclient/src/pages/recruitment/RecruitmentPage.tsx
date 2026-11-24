import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recruitmentService } from '@/services/recruitmentService';
import { organizationService } from '@/services/organizationService';
import { useLocaleStore } from '../../stores/localeStore';
import { PageHeader } from '../../components/common/PageHeader';
import {
  EnterpriseStatsCard,
  EnterpriseStatsGrid,
  Pagination,
  TableWrapper,
} from '@/components/common';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { formatDate } from '@/utils';
import {
  Briefcase,
  Plus,
  Users,
  UserPlus,
  Calendar,
  CheckCircle2,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const RecruitmentPage: React.FC = () => {
  const { t, locale } = useLocaleStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('candidates');
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [vacancyModalOpen, setVacancyModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [candPage, setCandPage] = useState(1);
  const [candPerPage, setCandPerPage] = useState(10);

  // Candidate form
  const [candidateForm, setCandidateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: 'linkedin',
    current_company: '',
    expected_salary: '1800',
    vacancy_id: '',
  });

  // Vacancy form
  const [vacancyForm, setVacancyForm] = useState({
    title: '',
    code: '',
    department_id: '',
    position_id: '',
    openings_count: 1,
    employment_type: 'Full-time',
    experience_level: 'Mid-level',
    salary_range: '$1,500 - $2,500',
    description: '',
    status: 'open',
  });

  // Convert to employee form
  const [convertForm, setConvertForm] = useState({
    department_id: '',
    position_id: '',
    join_date: new Date().toISOString().split('T')[0],
    salary: '2000',
  });

  // Queries
  const { data: candidates, isLoading: isCandLoading } = useQuery({
    queryKey: ['candidates-list'],
    queryFn: async () => {
      const res = await recruitmentService.getCandidates();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const { data: vacancies, isLoading: isVacLoading } = useQuery({
    queryKey: ['vacancies-list'],
    queryFn: async () => await recruitmentService.getVacancies(),
  });

  const { data: departments } = useQuery({
    queryKey: ['rec-departments'],
    queryFn: async () => await organizationService.getDepartments(),
  });

  const { data: positions } = useQuery({
    queryKey: ['rec-positions'],
    queryFn: async () => await organizationService.getPositions(),
  });

  // Mutations
  const createCandidateMutation = useMutation({
    mutationFn: async () => await recruitmentService.createCandidate(candidateForm),
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Candidate added');
      setCandidateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['candidates-list'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add candidate'),
  });

  const createVacancyMutation = useMutation({
    mutationFn: async () => await recruitmentService.createVacancy(vacancyForm),
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Vacancy posted');
      setVacancyModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['vacancies-list'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to post vacancy'),
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await recruitmentService.updateCandidateStatus(id, status);
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Status updated');
      queryClient.invalidateQueries({ queryKey: ['candidates-list'] });
    },
  });

  const convertToEmployeeMutation = useMutation({
    mutationFn: async () => {
      return await recruitmentService.convertToEmployee(selectedCandidate.id, {
        department_id: Number(convertForm.department_id),
        position_id: Number(convertForm.position_id),
        join_date: convertForm.join_date,
        salary: Number(convertForm.salary),
      });
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Converted to employee');
      setConvertModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['candidates-list'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Conversion failed'),
  });

  const openConvertDialog = (cand: any) => {
    setSelectedCandidate(cand);
    const app = cand.applications?.[0]?.vacancy;
    setConvertForm({
      department_id: app?.department_id ? String(app.department_id) : '',
      position_id: app?.position_id ? String(app.position_id) : '',
      join_date: new Date().toISOString().split('T')[0],
      salary: cand.expected_salary || '2000',
    });
    setConvertModalOpen(true);
  };

  const totalCand = candidates?.length || 0;
  const totalCandPages = Math.max(1, Math.ceil(totalCand / candPerPage));
  const activeCandPage = Math.min(candPage, totalCandPages);
  const paginatedCandidates = (candidates || []).slice(
    (activeCandPage - 1) * candPerPage,
    activeCandPage * candPerPage
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.recruitment')}
        subtitle={t('recruitment.subtitle')}
        breadcrumbs={[{ label: t('nav.recruitment') }]}
        action={
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVacancyModalOpen(true)}
              className="h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-card hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-400/60 dark:hover:border-blue-600 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs gap-1.5 transition-all cursor-pointer group"
            >
              <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400 stroke-[2.2]" />
              <span>{t('recruitment.postNewJob')}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setCandidateModalOpen(true)}
              className="h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs gap-1.5 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>{t('recruitment.addCandidate')}</span>
            </Button>
          </div>
        }
      />

      {/* Talent Recruitment Summary Stat Cards */}
      <EnterpriseStatsGrid columns={4}>
        <EnterpriseStatsCard
          title={t('recruitment.activeCandidates')}
          value={candidates?.length || 0}
          subtitle={t('recruitment.pipelineApplicants')}
          variant="emerald"
          icon={Users}
        />
        <EnterpriseStatsCard
          title={t('recruitment.openRequisitions')}
          value={vacancies?.length || 0}
          subtitle={t('recruitment.activePostings')}
          variant="blue"
          icon={Briefcase}
        />
        <EnterpriseStatsCard
          title={t('recruitment.hiredConversions')}
          value={candidates?.filter((c: any) => c.status === 'hired').length || 0}
          subtitle={t('recruitment.onboardedStaff')}
          variant="purple"
          icon={CheckCircle2}
        />
        <EnterpriseStatsCard
          title={t('recruitment.talentPool')}
          value={4}
          subtitle={t('recruitment.talentSources')}
          variant="amber"
          icon={UserPlus}
        />
      </EnterpriseStatsGrid>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="candidates" className="gap-1.5">
            <Users className="h-4 w-4" /> {t('recruitment.candidatePipeline')} ({candidates?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="vacancies" className="gap-1.5">
            <Briefcase className="h-4 w-4" /> {t('recruitment.jobVacancies')} ({vacancies?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Candidates Pipeline Tab */}
        <TabsContent value="candidates">
          <TableWrapper isFetching={isCandLoading} className="p-0">
            {isCandLoading ? (
              <LoadingState message="Loading candidates..." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase">
                      <tr>
                        <th className="px-5 py-3.5">{t('recruitment.candidateName', 'បេក្ខជន')}</th>
                        <th className="px-4 py-3.5">{t('recruitment.appliedRole', 'មុខតំណែងដាក់ពាក្យ')}</th>
                        <th className="px-4 py-3.5">{t('recruitment.sourceCompany', 'ប្រភព & ក្រុមហ៊ុនចាស់')}</th>
                        <th className="px-4 py-3.5">{t('recruitment.expectedPay', 'ប្រាក់ខែរំពឹងទុក')}</th>
                        <th className="px-4 py-3.5">{t('recruitment.pipelineStage', 'ដំណាក់កាលជ្រើសរើស')}</th>
                        <th className="px-5 py-3.5 text-right">{t('common.actions', 'សកម្មភាព')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedCandidates.map((cand: any) => (
                        <tr key={cand.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-semibold text-foreground text-sm">{cand.full_name}</span>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <span>{cand.email}</span>
                              {cand.phone && <span>• {cand.phone}</span>}
                            </div>
                          </td>

                          <td className="px-4 py-3 font-medium text-foreground">
                            {cand.applications?.[0]?.vacancy?.title || 'Open Application'}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">
                            <span className="capitalize">{cand.source}</span>
                            {cand.current_company && <span className="block text-[11px]">Ex: {cand.current_company}</span>}
                          </td>

                          <td className="px-4 py-3 font-semibold text-emerald-600">
                            ${cand.expected_salary}
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={cand.status}
                              onChange={(e) => updateStageMutation.mutate({ id: cand.id, status: e.target.value })}
                              className="h-7 rounded border border-input bg-transparent px-2 text-xs font-semibold capitalize"
                            >
                              <option value="applied">Applied</option>
                              <option value="screening">Screening</option>
                              <option value="interview">Interview</option>
                              <option value="offered">Offered</option>
                              <option value="hired">Hired</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>

                          <td className="px-5 py-3 text-right">
                            {cand.status === 'hired' && !cand.hired_employee_id ? (
                              <Button
                                size="sm"
                                onClick={() => openConvertDialog(cand)}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> {t('recruitment.convertToEmployee', 'បញ្ចូលជាបុគ្គលិកផ្លូវការ')}
                              </Button>
                            ) : cand.hired_employee_id ? (
                              <Badge variant="success">{t('recruitment.employeeCreated', 'បានបង្កើតបុគ្គលិក')}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">{t('status.underReview', 'កំពុងត្រួតពិនិត្យ')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {paginatedCandidates.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-muted-foreground">
                            {t('recruitment.noCandidates', 'មិនមានបេក្ខជនក្នុងបញ្ជីនៅឡើយទេ')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={activeCandPage}
                  totalPages={totalCandPages}
                  totalItems={totalCand}
                  perPage={candPerPage}
                  onPageChange={setCandPage}
                  onPerPageChange={(pp) => {
                    setCandPerPage(pp);
                    setCandPage(1);
                  }}
                />
              </>
            )}
          </TableWrapper>
        </TabsContent>

        {/* Vacancies Tab */}
        <TabsContent value="vacancies">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vacancies?.map((vac: any) => (
              <Card key={vac.id} className="hover:border-primary/50 transition-all hover:shadow-md">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase font-mono">
                      {vac.code}
                    </span>
                    <StatusBadge status={vac.status} />
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-foreground">{vac.title}</h3>
                    <p className="text-xs text-muted-foreground">{vac.department?.name} • {vac.openings_count} Openings</p>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-2 text-xs space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Type / Level:</span> <strong>{vac.employment_type} ({vac.experience_level})</strong>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Salary Range:</span> <strong className="text-emerald-600 font-semibold">{vac.salary_range}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{vac.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Convert to Employee Modal */}
      <Dialog open={convertModalOpen} onOpenChange={setConvertModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Successful Candidate to Official Employee</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              convertToEmployeeMutation.mutate();
            }}
            className="space-y-4 text-xs"
          >
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Candidate: {selectedCandidate?.full_name} ({selectedCandidate?.email})
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                This will automatically generate a new corporate Employee record, create their initial primary assignment, and set up annual leave allocations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium">Assigned Department *</label>
                <select
                  value={convertForm.department_id}
                  onChange={(e) => setConvertForm({ ...convertForm, department_id: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                  required
                >
                  <option value="">Select Department...</option>
                  {departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium">Assigned Position *</label>
                <select
                  value={convertForm.position_id}
                  onChange={(e) => setConvertForm({ ...convertForm, position_id: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                  required
                >
                  <option value="">Select Position...</option>
                  {positions?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.title} ({p.level})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium">First Join Date *</label>
                <Input
                  type="date"
                  value={convertForm.join_date}
                  onChange={(e) => setConvertForm({ ...convertForm, join_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium">Agreed Base Salary (USD) *</label>
                <Input
                  type="number"
                  value={convertForm.salary}
                  onChange={(e) => setConvertForm({ ...convertForm, salary: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConvertModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={convertToEmployeeMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {convertToEmployeeMutation.isPending ? 'Converting...' : 'Finalize & Create Employee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Candidate Modal */}
      <Dialog open={candidateModalOpen} onOpenChange={setCandidateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Job Candidate</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCandidateMutation.mutate();
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium">First Name *</label>
                <Input
                  value={candidateForm.first_name}
                  onChange={(e) => setCandidateForm({ ...candidateForm, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium">Last Name *</label>
                <Input
                  value={candidateForm.last_name}
                  onChange={(e) => setCandidateForm({ ...candidateForm, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium">Email *</label>
                <Input
                  type="email"
                  value={candidateForm.email}
                  onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium">Phone</label>
                <Input
                  value={candidateForm.phone}
                  onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium">Target Vacancy *</label>
                <select
                  value={candidateForm.vacancy_id}
                  onChange={(e) => setCandidateForm({ ...candidateForm, vacancy_id: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                  required
                >
                  <option value="">Select Opening...</option>
                  {vacancies?.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium">Expected Salary (USD)</label>
                <Input
                  type="number"
                  value={candidateForm.expected_salary}
                  onChange={(e) => setCandidateForm({ ...candidateForm, expected_salary: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCandidateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCandidateMutation.isPending}>
                Save Candidate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

