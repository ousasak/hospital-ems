import React from "react";
import { OrgNodeCard, DepartmentNode } from "./OrgNodeCard";
import { Plus, Minus } from "lucide-react";
import { useLocaleStore } from "@/stores/localeStore";

interface OrgTreeNodeProps {
  dept: DepartmentNode;
  level?: number;
  layout?: "columns" | "horizontal";
  expandedMap: Record<number, boolean>;
  searchQuery?: string;
  selectedDeptId?: number | null;
  onToggleExpand: (id: number) => void;
  onSelect: (dept: DepartmentNode) => void;
}

export const OrgTreeNode: React.FC<OrgTreeNodeProps> = ({
  dept,
  level = 1,
  layout = "columns",
  expandedMap,
  searchQuery = "",
  selectedDeptId,
  onToggleExpand,
  onSelect,
}) => {
  const { t } = useLocaleStore();
  const isExpanded = expandedMap[dept.id] ?? true;
  const hasChildren = Boolean(dept.children && dept.children.length > 0);
  const children = dept.children || [];
  const childrenCount = children.length;

  // Search highlighting logic
  const query = searchQuery.trim().toLowerCase();
  const isHighlighted = Boolean(
    query &&
    (dept.name.toLowerCase().includes(query) ||
      (dept.code && dept.code.toLowerCase().includes(query)) ||
      (dept.manager?.full_name &&
        dept.manager.full_name.toLowerCase().includes(query)) ||
      (dept.manager?.employee_code &&
        dept.manager.employee_code.toLowerCase().includes(query))),
  );

  const isSelected = selectedDeptId === dept.id;

  // Determine whether this level should use vertical spine stacking
  // In 'columns' layout mode:
  // - Level 1 (Hospital Directorate) branches horizontally into Level 2 (Divisions)
  // - Level 2 (Divisions) stack Level 3 (Departments) vertically via left-spine connectors
  // - Level 3 (Departments) stack Level 4 (Units) vertically via sub-spine connectors
  const isVerticalSpineMode = layout === "columns" && level >= 2;

  return (
    <div className="flex flex-col items-center select-none">
      {/* 1. THE DEPARTMENT NODE CARD */}
      <OrgNodeCard
        dept={dept}
        level={dept.level || level}
        isHighlighted={isHighlighted}
        isSelected={isSelected}
        onSelect={onSelect}
      />

      {/* 2. CIRCULAR EXPAND / COLLAPSE TOGGLE ON CONNECTOR */}
      {hasChildren && (
        <div className="relative flex flex-col items-center z-20">
          {/* Top vertical stem dropping from parent card */}
          <div className="w-0.5 h-3.5 bg-slate-300 dark:bg-slate-700 transition-colors" />

          {/* Circular Button (-) when expanded, (+) when collapsed */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(dept.id);
            }}
            title={
              isExpanded
                ? t("organization.collapseBranch", "បង្រួមមែកធាង")
                : t("organization.expandBranch", {
                    count: childrenCount,
                    defaultValue: `ពង្រីក (${childrenCount} ផ្នែករង)`,
                  })
            }
            className={`group relative size-5.5 rounded-full bg-white dark:bg-slate-900 border shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer focus:outline-hidden ${
              isExpanded
                ? "border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary"
                : "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 hover:bg-primary hover:text-white"
            }`}
          >
            {isExpanded ? (
              <Minus className="size-2.5 stroke-[2.5]" />
            ) : (
              <Plus className="size-2.5 stroke-[2.5]" />
            )}

            {/* Sub-unit count pill when collapsed */}
            {!isExpanded && childrenCount > 0 && (
              <span className="absolute -top-2 -right-3 text-[9px] font-mono font-bold bg-primary text-white rounded-full size-4.5 flex items-center justify-center shadow-xs">
                {childrenCount}
              </span>
            )}
          </button>

          {/* Lower vertical stem connecting to crossbar or spine */}
          {isExpanded && (
            <div className="w-0.5 h-3.5 bg-slate-300 dark:bg-slate-700 transition-colors" />
          )}
        </div>
      )}

      {/* 3. CHILDREN BRANCHES */}
      {hasChildren && isExpanded && (
        <>
          {/* ========================================================== */}
          {/* MODE A: VERTICAL SPINE STACK (REFERENCE ENTERPRISE DESIGN) */}
          {/* ========================================================== */}
          {isVerticalSpineMode ? (
            <div className="relative flex flex-col items-start w-full pt-1 pl-4 sm:pl-6">
              {/* Horizontal bridge from center drop line to left spine */}
              <div
                className="absolute top-0 h-0.5 bg-slate-300 dark:bg-slate-700 transition-colors"
                style={{
                  left: "14px",
                  right: "50%",
                }}
              />

              {/* Vertical Spine Line running from bridge down to last child card */}
              <div
                className="absolute top-0 w-0.5 bg-slate-300 dark:bg-slate-700 transition-colors"
                style={{
                  left: "14px",
                  bottom: "50px", // Ends at vertical center of the last child card
                }}
              />

              {/* Stacked Child Items */}
              <div className="flex flex-col gap-4 w-full pl-5">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="relative flex flex-col items-start"
                  >
                    {/* Horizontal branch entering the left edge of child card */}
                    <div className="absolute top-[50px] -left-5 w-5 h-0.5 bg-slate-300 dark:bg-slate-700 transition-colors" />

                    {/* Recursive Child Node */}
                    <OrgTreeNode
                      dept={child}
                      level={level + 1}
                      layout={layout}
                      expandedMap={expandedMap}
                      searchQuery={searchQuery}
                      selectedDeptId={selectedDeptId}
                      onToggleExpand={onToggleExpand}
                      onSelect={onSelect}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* MODE B: HORIZONTAL SPREAD TREE                             */
            /* ========================================================== */
            <div className="relative flex justify-center pt-0">
              {/* Children Row with individual arm segments */}
              <div className="flex gap-8 sm:gap-10 lg:gap-12 justify-center items-start">
                {children.map((child, idx) => (
                  <div
                    key={child.id}
                    className="relative flex flex-col items-center"
                  >
                    {/* Horizontal crossbar segment for this column */}
                    {childrenCount > 1 && (
                      <div
                        className={`absolute top-0 h-0.5 bg-slate-300 dark:bg-slate-700 transition-colors ${
                          idx === 0
                            ? "left-1/2 right-0"
                            : idx === childrenCount - 1
                              ? "left-0 right-1/2"
                              : "left-0 right-0"
                        }`}
                      />
                    )}

                    {/* Vertical drop line leading from crossbar down to this child */}
                    <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-700 transition-colors" />

                    {/* Recursive Child Node */}
                    <OrgTreeNode
                      dept={child}
                      level={level + 1}
                      layout={layout}
                      expandedMap={expandedMap}
                      searchQuery={searchQuery}
                      selectedDeptId={selectedDeptId}
                      onToggleExpand={onToggleExpand}
                      onSelect={onSelect}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrgTreeNode;
