import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performanceService } from '@/services/performanceService';
import { employeeService } from '@/services/employeeService';
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
  Award,
  GraduationCap,
  Plus,
  Star,
  Calendar,
  Users,
  CheckCircle2,
  MapPin,
  Clock,
} from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const { t, locale } = useLocaleStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('performance');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Review form
  const [reviewForm, setReviewForm] = useState({
    employee_id: '',
    reviewer_id: '',
    review_period: 'Q1 2026',
    start_date: '2026-01-01',
    end_date: '2026-03-31',
    self_rating: '4.5',
    reviewer_rating: '4.8',
    strengths: 'Exceptional architectural delivery and proactive mentorship.',
    improvements: 'Increase automation test coverage.',
    goals: 'Lead the next generation design system roll-out.',
    status: 'completed',
  });

  // Training form
  const [programForm, setProgramForm] = useState({
    title: '',
    description: '',
    instructor_name: '',
    duration_hours: 8,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    max_participants: 20,
    location: 'Headquarters Main Hall',
    status: 'upcoming',
  });

  // Queries
  const { data: reviews, isLoading: isRevLoading } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: async () => await performanceService.getReviews(),
  });

  const { data: programs, isLoading: isProgLoading } = useQuery({
    queryKey: ['training-programs'],
    queryFn: async () => await performanceService.getPrograms(),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-for-perf'],
    queryFn: async () => (await employeeService.getEmployees({ per_page: 100 })).data,
  });

  // Mutations
  const createReviewMutation = useMutation({
    mutationFn: async () => await performanceService.createReview({
      ...reviewForm,
      employee_id: Number(reviewForm.employee_id),
      reviewer_id: Number(reviewForm.reviewer_id),
      self_rating: Number(reviewForm.self_rating),
      reviewer_rating: Number(reviewForm.reviewer_rating),
    }),
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Review submitted');
      setReviewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to submit review'),
  });

  const createProgramMutation = useMutation({
    mutationFn: async () => await performanceService.createProgram(programForm),
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Training created');
      setProgramModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create training'),
  });

  const totalReviews = reviews?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalReviews / perPage));
  const activePage = Math.min(page, totalPages);
  const paginatedReviews = (reviews || []).slice((activePage - 1) * perPage, activePage * perPage);

  const avgRating = reviews?.length
    ? (reviews.reduce((acc: number, r: any) => acc + Number(r.reviewer_rating || 0), 0) / reviews.length).toFixed(1)
    : '4.5';

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.nav.performance}
        subtitle="Manage quarterly evaluations, KPI indicators, professional skills training and certifications"
        breadcrumbs={[{ label: t.nav.performance }]}
        action={
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {activeTab === 'performance' ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setReviewModalOpen(true)}
                className="h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>{t('performance.conductReview')}</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setProgramModalOpen(true)}
                className="h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>{t('performance.scheduleTraining')}</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Global Performance Enterprise Stats */}
      <EnterpriseStatsGrid columns={4}>
        <EnterpriseStatsCard
          title={t('performance.totalReviews')}
          value={totalReviews}
          subtitle={t('performance.currentCycle')}
          variant="purple"
          icon={Award}
        />
        <EnterpriseStatsCard
          title={t('performance.averageRating')}
          value={avgRating}
          subtitle={t('performance.overallBaseline')}
          variant="emerald"
          icon={Star}
        />
        <EnterpriseStatsCard
          title={t('performance.trainingWorkshops')}
          value={programs?.length || 0}
          subtitle={t('performance.upskillingCert')}
          variant="blue"
          icon={GraduationCap}
        />
        <EnterpriseStatsCard
          title={t('performance.enrolledStaff')}
          value={85}
          subtitle={t('performance.corporateTalentProgram')}
          variant="amber"
          icon={Users}
        />
      </EnterpriseStatsGrid>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance" className="gap-1.5">
            <Award className="h-4 w-4" /> {t('performance.performanceReviews')}
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-1.5">
            <GraduationCap className="h-4 w-4" /> {t('performance.trainingCertifications')}
          </TabsTrigger>
        </TabsList>

        {/* Reviews Content */}
        <TabsContent value="performance">
          <TableWrapper isFetching={isRevLoading} className="p-0">
            {isRevLoading ? (
              <LoadingState message="Loading performance reviews..." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase">
                      <tr>
                        <th className="px-5 py-3.5">{t('common.employee', 'បុគ្គលិក')}</th>
                        <th className="px-4 py-3.5">{t('performance.reviewCycle', 'វដ្តនៃការវាយតម្លៃ')}</th>
                        <th className="px-4 py-3.5">{t('performance.selfRating', 'ពិន្ទុវាយតម្លៃខ្លួនឯង')}</th>
                        <th className="px-4 py-3.5">{t('performance.reviewerRating', 'ពិន្ទុពីអ្នកវាយតម្លៃ')}</th>
                        <th className="px-4 py-3.5">{t('performance.reviewer', 'អ្នកវាយតម្លៃ')}</th>
                        <th className="px-4 py-3.5">{t('common.status', 'ស្ថានភាព')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedReviews.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">{t('performance.noReviews', 'មិនទាន់មានទិន្នន័យវាយតម្លៃការងារនៅឡើយទេ។')}</td></tr>
                      ) : (
                        paginatedReviews.map((rev: any) => (
                          <tr key={rev.id} className="hover:bg-muted/30">
                            <td className="px-5 py-3">
                              <span className="font-semibold text-foreground text-sm">{rev.employee?.full_name}</span>
                              <span className="block font-mono text-[11px] text-primary">{rev.employee?.employee_code}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-foreground">{rev.review_period}</td>
                            <td className="px-4 py-3 text-foreground font-bold">
                              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> {rev.self_rating || '-'}</span>
                            </td>
                            <td className="px-4 py-3 text-foreground font-bold">
                              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> {rev.reviewer_rating || '-'}</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{rev.reviewer?.full_name || 'Department Manager'}</td>
                            <td className="px-4 py-3"><StatusBadge status={rev.status} /></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={activePage}
                  totalPages={totalPages}
                  totalItems={totalReviews}
                  perPage={perPage}
                  onPageChange={setPage}
                  onPerPageChange={(pp) => {
                    setPerPage(pp);
                    setPage(1);
                  }}
                />
              </>
            )}
          </TableWrapper>
        </TabsContent>

        {/* Training Programs Content */}
        <TabsContent value="training">
          {isProgLoading ? (
            <LoadingState message="Loading training programs..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs?.map((prog: any) => (
                <Card key={prog.id} className="hover:border-primary/50 transition-all hover:shadow-md">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="font-semibold uppercase text-[10px]">
                        {prog.duration_hours} Hours Workshop
                      </Badge>
                      <StatusBadge status={prog.status} />
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-foreground">{prog.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Instructor: <strong>{prog.instructor_name || 'Corporate Trainer'}</strong>
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2 text-xs space-y-1 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Schedule:</span> <strong className="text-foreground">{formatDate(prog.start_date, locale)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span> <strong className="text-foreground">{prog.location || 'Headquarters'}</strong>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">{prog.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Conduct Performance Evaluation</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createReviewMutation.mutate(); }} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium">Employee *</label>
                <select value={reviewForm.employee_id} onChange={(e) => setReviewForm({ ...reviewForm, employee_id: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3" required>
                  <option value="">Select Employee...</option>
                  {employees?.map((emp: any) => (<option key={emp.id} value={emp.id}>{emp.full_name}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-medium">Reviewer *</label>
                <select value={reviewForm.reviewer_id} onChange={(e) => setReviewForm({ ...reviewForm, reviewer_id: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3" required>
                  <option value="">Select Reviewer...</option>
                  {employees?.map((emp: any) => (<option key={emp.id} value={emp.id}>{emp.full_name}</option>))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium">Review Period</label>
                <Input value={reviewForm.review_period} onChange={(e) => setReviewForm({ ...reviewForm, review_period: e.target.value })} placeholder="Q1 2026" required />
              </div>
              <div className="space-y-1">
                <label className="font-medium">Score (1.0 - 5.0)</label>
                <Input type="number" step="0.1" value={reviewForm.reviewer_rating} onChange={(e) => setReviewForm({ ...reviewForm, reviewer_rating: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium">Key Strengths & Accomplishments</label>
              <Input value={reviewForm.strengths} onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })} />
            </div>

            <div className="space-y-1">
              <label className="font-medium">Growth Areas & Goals</label>
              <Input value={reviewForm.goals} onChange={(e) => setReviewForm({ ...reviewForm, goals: e.target.value })} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createReviewMutation.isPending}>Save Review</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

