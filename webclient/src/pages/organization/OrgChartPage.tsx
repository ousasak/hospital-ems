import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationService } from "@/services/organizationService";
import { useLocaleStore } from "../../stores/localeStore";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingState } from "../../components/common/LoadingState";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Building2,
  Users,
  UserCheck,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hospital,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  GitBranch,
  Expand,
} from 'lucide-react';
import { DepartmentNode } from "./components/org-chart/OrgNodeCard";
import { OrgTreeNode } from "./components/org-chart/OrgTreeNode";
import { DeptDetailDialog } from "./components/org-chart/DeptDetailDialog";

export const OrgChartPage: React.FC = () => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State management
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(0.8);
  const [selectedDept, setSelectedDept] = useState<DepartmentNode | null>(null);
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. Query org chart tree from backend
  const {
    data: tree,
    isLoading,
    isFetching,
  } = useQuery<DepartmentNode[]>({
    queryKey: ["org-chart-tree"],
    queryFn: async () => {
      return await organizationService.getOrgChart();
    },
    staleTime: 60_000,
  });

  // 1b. Query organization profile for dynamic hospital name
  const { data: orgProfile } = useQuery({
    queryKey: ["organization-profile"],
    queryFn: async () => {
      return await organizationService.getProfile();
    },
    staleTime: 5 * 60_000,
  });

  // 2. Toggle expand / collapse for single node
  const handleToggleExpand = (id: number) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  // 3. Expand All / Collapse All
  const handleExpandAll = () => {
    if (!tree) return;
    const newMap: Record<number, boolean> = {};
    const traverse = (nodes: DepartmentNode[]) => {
      nodes.forEach((n) => {
        newMap[n.id] = true;
        if (n.children) traverse(n.children);
      });
    };
    traverse(tree);
    setExpandedMap(newMap);
  };

  const handleCollapseAll = () => {
    if (!tree) return;
    const newMap: Record<number, boolean> = {};
    const traverse = (nodes: DepartmentNode[]) => {
      nodes.forEach((n) => {
        newMap[n.id] = false;
        if (n.children) traverse(n.children);
      });
    };
    traverse(tree);
    setExpandedMap(newMap);
  };

  // 4. Calculate accurate statistics across entire organization
  const stats = useMemo(() => {
    if (!tree || tree.length === 0) {
      return {
        totalDepts: 0,
        totalEmployees: 0,
        totalAssignedLeads: 0,
        maxDepth: 1,
      };
    }

    let totalDepts = 0;
    let totalEmployees = 0;
    let totalAssignedLeads = 0;
    let maxDepth = 1;

    const traverse = (nodes: DepartmentNode[], currentDepth: number) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      nodes.forEach((d) => {
        totalDepts += 1;
        totalEmployees += d.employee_count || 0;
        if (d.manager_id || d.manager) {
          totalAssignedLeads += 1;
        }
        if (d.children && d.children.length > 0) {
          traverse(d.children, currentDepth + 1);
        }
      });
    };

    traverse(tree, 1);

    return {
      totalDepts,
      totalEmployees,
      totalAssignedLeads,
      maxDepth,
    };
  }, [tree]);

  // 5. Flattened departments for Search count
  const allDepartmentsFlat = useMemo(() => {
    if (!tree) return [];
    const list: DepartmentNode[] = [];
    const traverse = (nodes: DepartmentNode[], depth = 1) => {
      nodes.forEach((d) => {
        list.push({ ...d, level: d.level || depth });
        if (d.children) traverse(d.children, depth + 1);
      });
    };
    traverse(tree);
    return list;
  }, [tree]);

  // 6. Filtered departments list for search count badge
  const filteredDepts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allDepartmentsFlat;
    return allDepartmentsFlat.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.code && d.code.toLowerCase().includes(q)) ||
        (d.manager?.full_name &&
          d.manager.full_name.toLowerCase().includes(q)) ||
        (d.manager?.employee_code &&
          d.manager.employee_code.toLowerCase().includes(q)),
    );
  }, [allDepartmentsFlat, search]);

  // 7. Auto-expand ancestor paths of matching search query
  useEffect(() => {
    if (!search.trim() || !tree) return;
    const q = search.trim().toLowerCase();
    const matchingAncestorIds: Record<number, boolean> = {};

    const findMatches = (nodes: DepartmentNode[], ancestors: number[] = []) => {
      for (const node of nodes) {
        const isMatch =
          node.name.toLowerCase().includes(q) ||
          (node.code && node.code.toLowerCase().includes(q)) ||
          (node.manager?.full_name &&
            node.manager.full_name.toLowerCase().includes(q)) ||
          (node.manager?.employee_code &&
            node.manager.employee_code.toLowerCase().includes(q));

        if (isMatch) {
          ancestors.forEach((ancId) => {
            matchingAncestorIds[ancId] = true;
          });
        }

        if (node.children && node.children.length > 0) {
          findMatches(node.children, [...ancestors, node.id]);
        }
      }
    };

    findMatches(tree);

    if (Object.keys(matchingAncestorIds).length > 0) {
      setExpandedMap((prev) => ({
        ...prev,
        ...matchingAncestorIds,
      }));
    }
  }, [search, tree]);

  // 8. Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // 9. Fit to Screen calculation
  const handleFitToScreen = () => {
    if (!canvasRef.current || !containerRef.current) {
      setZoom(0.8);
      return;
    }
    const containerW = containerRef.current.clientWidth;
    const contentW = canvasRef.current.scrollWidth || 1300;
    const optimalZoom = Math.min(
      1.0,
      Math.max(0.45, +(containerW / (contentW + 80)).toFixed(2)),
    );
    setZoom(optimalZoom);
  };

  return (
    <div
      ref={containerRef}
      className="space-y-6 animate-in fade-in duration-300"
    >
      {/* ======================================================== */}
      {/* 1. HEADER SECTION                                        */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={t("organization.orgChart", "គំនូសបំព្រួញស្ថាប័ន")}
          subtitle={t(
            "organization.orgChartSubtitle",
            "ខ្សែបណ្តាញទំនាក់ទំនងការងារ រចនាសម្ព័ន្ធនាយកដ្ឋាន និងអ្នកគ្រប់គ្រង",
          )}
          breadcrumbs={[
            {
              label: t("nav.orgStructure", "រចនាសម្ព័ន្ធស្ថាប័ន"),
              href: "/organization/departments",
            },
            { label: t("nav.orgChart", "គំនូសតាងស្ថាប័ន") },
          ]}
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["org-chart-tree"] })
            }
            disabled={isFetching}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw
              className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            <span>{t("common.refresh", "ផ្ទុកឡើងវិញ")}</span>
          </Button>
        </div>
      </div>


      {/* ======================================================== */}
      {/* 4. ENTERPRISE HIERARCHICAL TREE CANVAS (DIAGRAM ONLY)    */}
      {/* ======================================================== */}
      {isLoading ? (
        <LoadingState message={t("common.loading", "កំពុងផ្ទុក...")} />
      ) : (
        <div className="relative overflow-auto rounded-2xl border border-border/80 bg-slate-50/50 dark:bg-slate-950/40 min-h-[620px] p-8 sm:p-12 shadow-inner">
          {/* Subtle Dotted Background Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 1.2px, transparent 1.2px)",
              backgroundSize: "24px 24px",
              color: "hsl(var(--muted-foreground) / 0.3)",
            }}
          />

          {/* Floating Zoom & Canvas Controls */}
          <div className="sticky top-0 right-0 z-30 flex items-center justify-end pointer-events-none mb-4 -mt-4 sm:-mt-6">
            <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-card/90 backdrop-blur-md border border-border/80 shadow-md">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))}
                title={t("organization.zoomIn", "ពង្រីក (Zoom In)")}
              >
                <ZoomIn className="size-3.5" />
              </Button>
              <span className="font-mono text-xs font-bold px-1.5 min-w-[38px] text-center select-none text-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))}
                title={t("organization.zoomOut", "បង្រួម (Zoom Out)")}
              >
                <ZoomOut className="size-3.5" />
              </Button>
              <div className="h-4 w-px bg-border/80 mx-0.5" />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={handleFitToScreen}
                title={t("organization.fitToScreen", "សមអេក្រង់")}
              >
                <Expand className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setZoom(0.8)}
                title={t("organization.resetZoom", "កំណត់ទំហំដើម")}
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={toggleFullscreen}
                title={isFullscreen ? t("organization.exitFullscreen", "ចាកចេញពីពេញអេក្រង់") : t("organization.fullscreen", "ពេញអេក្រង់")}
              >
                {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </Button>
            </div>
          </div>

          <div
            ref={canvasRef}
            className="relative transition-transform duration-200 origin-top flex flex-col items-center gap-10"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Hospital Root Badge with Dynamic Hospital Name */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-slate-100 dark:bg-slate-800 border border-slate-700 shadow-sm">
              <Hospital className="size-4 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {orgProfile?.name || t('organization.enterpriseHierarchy', 'ឋានានុក្រមរចនាសម្ព័ន្ធមន្ទីរពេទ្យ')}
              </span>
            </div>

            {/* Hierarchical Tree Roots (Fixed Columns Layout) */}
            <div className="flex flex-wrap justify-center items-start gap-12 sm:gap-16">
              {tree?.map((rootDept) => (
                <OrgTreeNode
                  key={rootDept.id}
                  dept={rootDept}
                  level={1}
                  layout="columns"
                  expandedMap={expandedMap}
                  searchQuery={search}
                  selectedDeptId={selectedDept?.id}
                  onToggleExpand={handleToggleExpand}
                  onSelect={(dept) => setSelectedDept(dept)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DEPARTMENT DETAIL DIALOG                              */}
      {/* ======================================================== */}
      <DeptDetailDialog
        dept={selectedDept}
        open={Boolean(selectedDept)}
        onOpenChange={(open) => !open && setSelectedDept(null)}
      />
    </div>
  );
};

export default OrgChartPage;
