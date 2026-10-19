import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
  Cpu, 
  Database, 
  HardDrive, 
  Sparkles, 
  PiggyBank, 
  ShieldCheck, 
  Plus, 
  Check, 
  Sliders, 
  TrendingUp, 
  Zap, 
  ChevronRight,
  Server,
  Layers,
  ArrowRight
} from "lucide-react";

// Categories definition
const CATEGORIES = [
  { id: "ec2", label: "EC2 Compute", icon: Cpu, count: 4, color: "#B28DFF" },
  { id: "s3", label: "S3 Storage", icon: HardDrive, count: 3, color: "#06B6D4" },
  { id: "rds", label: "RDS Databases", icon: Database, count: 3, color: "#10B981" },
  { id: "growth", label: "Traffic & Scale", icon: TrendingUp, count: 3, color: "#F59E0B" }
];

// Configuration data by category
const CATEGORY_DATA = {
  ec2: {
    rootTitle: "Current Compute State",
    rootSpec: "2 × t3.large (web-server)",
    baseCost: 4200,
    baseDesc: "Running 24/7 on On-Demand",
    sliderLabel: "EC2 Instance Count",
    sliderMin: 1,
    sliderMax: 8,
    sliderDefault: 2,
    sliderUnit: "instances",
    pathways: [
      {
        key: "downsize",
        label: "Downsize instance",
        change: "t3.large → t3.medium",
        calcNewCost: (qty) => Math.round(qty * 1300),
        risk: "Low",
        isAiRecommended: true,
        reason: "Avg CPU utilization is 32% (well within medium threshold)"
      },
      {
        key: "reduce-count",
        label: "Optimize instances",
        change: "Auto-Scale 1 to 3 based on load",
        calcNewCost: (qty) => Math.round(qty * 1050),
        risk: "Medium",
        isAiRecommended: false,
        reason: "Consolidate off-peak workload to single machine"
      },
      {
        key: "pricing-model",
        label: "Switch to 1-Yr Reserved",
        change: "On-Demand → 1-Yr Commit",
        calcNewCost: (qty) => Math.round(qty * 1550),
        risk: "Low",
        isAiRecommended: false,
        reason: "Stable baseline workload qualifies for 37% reservation discount"
      },
      {
        key: "graviton-switch",
        label: "Switch to Graviton (t4g)",
        change: "t3.large → t4g.large",
        calcNewCost: (qty) => Math.round(qty * 1680),
        risk: "Low",
        isAiRecommended: false,
        reason: "ARM-based architecture provides 20% better price-performance"
      }
    ]
  },
  s3: {
    rootTitle: "Current S3 Storage State",
    rootSpec: "4,200 GB (customer-data-backup)",
    baseCost: 8200,
    baseDesc: "Standard S3 Storage Tier",
    sliderLabel: "Data Volume",
    sliderMin: 1000,
    sliderMax: 10000,
    sliderDefault: 4200,
    sliderUnit: "GB",
    pathways: [
      {
        key: "s3-ia",
        label: "Infrequent Access Tier",
        change: "Standard → S3 Standard-IA",
        calcNewCost: (gb) => Math.round(gb * 1.15),
        risk: "Low",
        isAiRecommended: true,
        reason: "Over 78% of objects haven't been accessed in 45 days"
      },
      {
        key: "s3-glacier",
        label: "Glacier Deep Archive",
        change: "Standard → Glacier Deep Archive",
        calcNewCost: (gb) => Math.round(gb * 0.25),
        risk: "Medium",
        isAiRecommended: false,
        reason: "Compliance backups only needed for legal audits (12hr retrieval)"
      },
      {
        key: "s3-lifecycle",
        label: "Lifecycle Transition Rule",
        change: "30-day IA → 90-day Glacier",
        calcNewCost: (gb) => Math.round(gb * 0.72),
        risk: "Low",
        isAiRecommended: false,
        reason: "Automated tiered archiving with zero manual intervention"
      }
    ]
  },
  rds: {
    rootTitle: "Current RDS Database State",
    rootSpec: "1 × db.t3.large (analytics-db)",
    baseCost: 9400,
    baseDesc: "Multi-AZ Postgres DB + 150GB",
    sliderLabel: "Storage Size",
    sliderMin: 100,
    sliderMax: 1000,
    sliderDefault: 250,
    sliderUnit: "GB Storage",
    pathways: [
      {
        key: "rds-downsize",
        label: "Downsize RDS instance",
        change: "db.t3.large → db.t3.medium",
        calcNewCost: (gb) => Math.round(4800 + gb * 9),
        risk: "Low",
        isAiRecommended: true,
        reason: "Analytics queries run in batches; memory headroom > 55%"
      },
      {
        key: "rds-aurora-serverless",
        label: "Aurora Serverless v2",
        change: "Provisioned → Auto-Pause Serverless",
        calcNewCost: (gb) => Math.round(3600 + gb * 9),
        risk: "Medium",
        isAiRecommended: false,
        reason: "Auto-scales compute down to 0.5 ACU during nighttime silence"
      },
      {
        key: "rds-reserved",
        label: "1-Yr Reserved RDS",
        change: "On-Demand → 1-Yr All-Upfront",
        calcNewCost: (gb) => Math.round(6200 + gb * 8),
        risk: "Low",
        isAiRecommended: false,
        reason: "Primary production database running permanently"
      }
    ]
  },
  growth: {
    rootTitle: "Workload Growth Simulator",
    rootSpec: "Current Infrastructure Baseline",
    baseCost: 21800,
    baseDesc: "Total Core Stack Baseline",
    sliderLabel: "Projected Workload Growth",
    sliderMin: 0,
    sliderMax: 300,
    sliderDefault: 50,
    sliderUnit: "% Growth",
    pathways: [
      {
        key: "growth-linear",
        label: "Linear Scale-out",
        change: "Add instances proportionally",
        calcNewCost: (pct) => Math.round(21800 * (1 + pct / 100)),
        risk: "Medium",
        isAiRecommended: false,
        reason: "Spreads load linearly without architectural refactoring"
      },
      {
        key: "growth-optimized",
        label: "Optimized Cloud Scale",
        change: "Autoscaling + Serverless Caching",
        calcNewCost: (pct) => Math.round(21800 * (1 + (pct * 0.42) / 100)),
        risk: "Low",
        isAiRecommended: true,
        reason: "ElastiCache absorbs 60% of database read queries under surge"
      },
      {
        key: "growth-containerized",
        label: "EKS Microservices Migration",
        change: "EC2 VMs → Container Pods",
        calcNewCost: (pct) => Math.round(21800 * (1 + (pct * 0.55) / 100)),
        risk: "High",
        isAiRecommended: false,
        reason: "Denser packing of compute reduces overhead by ~45%"
      }
    ]
  }
};

const PathwayVisualizer = ({ onSelectPathway, activePathwayKey, onAddToRoadmap, isRoadmapAdded }) => {
  const [activeCategory, setActiveCategory] = useState("ec2");
  const currentCategoryData = CATEGORY_DATA[activeCategory];

  // Sliders state for interactive simulation per category
  const [sliderValues, setSliderValues] = useState({
    ec2: CATEGORY_DATA.ec2.sliderDefault,
    s3: CATEGORY_DATA.s3.sliderDefault,
    rds: CATEGORY_DATA.rds.sliderDefault,
    growth: CATEGORY_DATA.growth.sliderDefault
  });

  const activeSliderVal = sliderValues[activeCategory];

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSliderValues(prev => ({ ...prev, [activeCategory]: val }));
  };

  // Selected pathway inside the current category
  const pathways = currentCategoryData.pathways;
  const [selectedPathwayKey, setSelectedPathwayKey] = useState(pathways[0].key);

  // If activePathwayKey matches one in this category, select it
  useEffect(() => {
    const exists = pathways.some(p => p.key === activePathwayKey);
    if (exists) {
      setSelectedPathwayKey(activePathwayKey);
    } else {
      setSelectedPathwayKey(pathways[0].key);
    }
  }, [activeCategory, activePathwayKey, pathways]);

  const activePathway = pathways.find(p => p.key === selectedPathwayKey) || pathways[0];

  // Dynamic calculated costs based on current slider value
  const baselineCost = currentCategoryData.baseCost;
  const simulatedCost = activePathway.calcNewCost(activeSliderVal);
  const diffCost = simulatedCost - baselineCost;
  const isSavings = diffCost <= 0;
  const absDiff = Math.abs(diffCost);

  // Coordinate tracking for SVG Bezier lines
  const graphRef = useRef(null);
  const rootCardRef = useRef(null);
  const pillRefs = useRef([]);
  const outcomeRefs = useRef([]);
  const [coords, setCoords] = useState(null);

  const updateCoordinates = useCallback(() => {
    if (!graphRef.current || !rootCardRef.current) return;
    const gRect = graphRef.current.getBoundingClientRect();
    const rRect = rootCardRef.current.getBoundingClientRect();

    const rootPoint = {
      x: rRect.right - gRect.left,
      y: rRect.top + rRect.height / 2 - gRect.top
    };

    const lines = pathways.map((p, idx) => {
      const pillEl = pillRefs.current[idx];
      const outEl = outcomeRefs.current[idx];
      if (!pillEl || !outEl) return null;

      const pRect = pillEl.getBoundingClientRect();
      const oRect = outEl.getBoundingClientRect();

      return {
        key: p.key,
        pLeft: { x: pRect.left - gRect.left, y: pRect.top + pRect.height / 2 - gRect.top },
        pRight: { x: pRect.right - gRect.left, y: pRect.top + pRect.height / 2 - gRect.top },
        oLeft: { x: oRect.left - gRect.left, y: oRect.top + oRect.height / 2 - gRect.top }
      };
    });

    setCoords({
      width: gRect.width,
      height: gRect.height,
      root: rootPoint,
      lines: lines.filter(Boolean)
    });
  }, [pathways]);

  useEffect(() => {
    updateCoordinates();
    window.addEventListener("resize", updateCoordinates);
    const timer = setTimeout(updateCoordinates, 150);
    return () => {
      window.removeEventListener("resize", updateCoordinates);
      clearTimeout(timer);
    };
  }, [updateCoordinates, activeCategory, activeSliderVal]);

  const handleSelectPath = (key) => {
    setSelectedPathwayKey(key);
    if (onSelectPathway) {
      onSelectPathway(key);
    }
  };

  return (
    <div className="wit-canvas">
      {/* ── Top Header with Title & Category Badges ─────────────────── */}
      <div className="wit-top-bar">
        <div>
          <div className="wit-eyebrow">
            <Zap size={14} style={{ display: "inline", marginRight: 6 }} />
            Interactive Cloud Architecture Sandbox
          </div>
          <h2 className="wit-title">What if I…</h2>
          <p className="wit-sub">Explore architectural decisions, adjust parameters, and simulate cost impacts before making any AWS changes.</p>
        </div>

        {/* ── Category Tabs ── */}
        <div className="wit-category-tabs">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isCatActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                className={"wit-cat-tab" + (isCatActive ? " active" : "")}
                onClick={() => setActiveCategory(cat.id)}
                style={isCatActive ? { borderColor: cat.color, color: "#FFFFFF" } : {}}
              >
                <Icon size={16} color={isCatActive ? cat.color : "#94A3B8"} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Parameter Slider Ribbon ─────────────────────── */}
      <div className="wit-slider-ribbon">
        <div className="wit-slider-left">
          <Sliders size={18} color="#B28DFF" style={{ marginRight: 8 }} />
          <span className="wit-slider-title">{currentCategoryData.sliderLabel}:</span>
          <span className="wit-slider-value">
            {activeSliderVal.toLocaleString("en-IN")} {currentCategoryData.sliderUnit}
          </span>
        </div>
        <div className="wit-slider-center">
          <span className="wit-slider-bound">{currentCategoryData.sliderMin}</span>
          <input
            type="range"
            min={currentCategoryData.sliderMin}
            max={currentCategoryData.sliderMax}
            value={activeSliderVal}
            onChange={handleSliderChange}
            className="wit-range-input"
          />
          <span className="wit-slider-bound">{currentCategoryData.sliderMax}</span>
        </div>
        <div className="wit-slider-right">
          <span className="wit-slider-hint">Drag slider to test different capacities</span>
        </div>
      </div>

      {/* ── Graph Area: Left Card → Middle Action Pills → Right Outcome Cards ─── */}
      <div className="wit-graph" ref={graphRef}>

        {/* Responsive Bezier SVG Lines Overlay */}
        {coords && (
          <svg 
            className="wit-svg" 
            style={{ width: coords.width, height: coords.height }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="wg-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C49BFF" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="1" />
              </linearGradient>
              <filter id="wit-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {coords.lines.map((l) => {
              const isAct = selectedPathwayKey === l.key;
              
              // Bezier 1: Root card -> Middle pill
              const cx1 = (coords.root.x + l.pLeft.x) / 2;
              const d1 = `M ${coords.root.x} ${coords.root.y} C ${cx1} ${coords.root.y}, ${cx1} ${l.pLeft.y}, ${l.pLeft.x} ${l.pLeft.y}`;

              // Bezier 2: Middle pill -> Outcome card
              const cx2 = (l.pRight.x + l.oLeft.x) / 2;
              const d2 = `M ${l.pRight.x} ${l.pRight.y} C ${cx2} ${l.pRight.y}, ${cx2} ${l.oLeft.y}, ${l.oLeft.x} ${l.oLeft.y}`;

              return (
                <g key={l.key}>
                  {/* Outer glow stroke for active path */}
                  {isAct && (
                    <>
                      <path d={d1} stroke="#B28DFF" strokeWidth="9" strokeOpacity="0.25" fill="none" />
                      <path d={d2} stroke="#B28DFF" strokeWidth="9" strokeOpacity="0.25" fill="none" />
                    </>
                  )}

                  {/* Core connector lines */}
                  <path
                    d={d1}
                    stroke={isAct ? "url(#wg-active)" : "#232D42"}
                    strokeWidth={isAct ? "4" : "2.5"}
                    strokeDasharray={isAct ? "none" : "6 6"}
                    fill="none"
                    style={{ filter: isAct ? "url(#wit-glow)" : "none", transition: "stroke 0.3s, stroke-width 0.3s" }}
                  />
                  <path
                    d={d2}
                    stroke={isAct ? "url(#wg-active)" : "#232D42"}
                    strokeWidth={isAct ? "4" : "2.5"}
                    strokeDasharray={isAct ? "none" : "6 6"}
                    fill="none"
                    style={{ filter: isAct ? "url(#wit-glow)" : "none", transition: "stroke 0.3s, stroke-width 0.3s" }}
                  />

                  {/* Node junction dots */}
                  <circle cx={l.pLeft.x} cy={l.pLeft.y} r={isAct ? "7" : "4.5"} fill={isAct ? "#B28DFF" : "#2A3143"} style={{ filter: isAct ? "drop-shadow(0 0 10px #B28DFF)" : "none", transition: "all 0.3s" }} />
                  <circle cx={l.pRight.x} cy={l.pRight.y} r={isAct ? "7" : "4.5"} fill={isAct ? "#B28DFF" : "#2A3143"} style={{ filter: isAct ? "drop-shadow(0 0 10px #B28DFF)" : "none", transition: "all 0.3s" }} />
                  <circle cx={l.oLeft.x} cy={l.oLeft.y} r={isAct ? "7" : "4.5"} fill={isAct ? "#B28DFF" : "#2A3143"} style={{ filter: isAct ? "drop-shadow(0 0 10px #B28DFF)" : "none", transition: "all 0.3s" }} />
                </g>
              );
            })}

            {/* Root Pulse Animation */}
            <circle cx={coords.root.x} cy={coords.root.y} r="12" fill="#B28DFF" opacity="0.9" filter="url(#wit-glow)">
              <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={coords.root.x} cy={coords.root.y} r="5.5" fill="#FFFFFF" />
          </svg>
        )}

        {/* ── Left Column: Current Baseline Configuration Node ── */}
        <div className="wit-root-card" ref={rootCardRef}>
          <div className="wit-root-badge">LIVE BASELINE</div>
          <div className="wit-root-header">
            <Cpu size={22} color="#B28DFF" />
            <span>{currentCategoryData.rootTitle}</span>
          </div>
          <div className="wit-root-spec">
            {currentCategoryData.rootSpec}
          </div>
          <div className="wit-root-detail">
            {currentCategoryData.baseDesc}
          </div>
          <div className="wit-root-divider" />
          <div className="wit-root-cost">
            Monthly Cost: <strong className="wit-purple">₹{baselineCost.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        {/* ── Middle Column: Action Pathway Pills ── */}
        <div className="wit-mid-col">
          {pathways.map((p, idx) => {
            const isAct = selectedPathwayKey === p.key;
            return (
              <button
                key={p.key}
                ref={el => pillRefs.current[idx] = el}
                className={"wit-pill" + (isAct ? " wit-pill-act" : "")}
                onClick={() => handleSelectPath(p.key)}
              >
                <span>{p.label}</span>
                {p.isAiRecommended && (
                  <span className="wit-pill-ai-sparkle"><Sparkles size={13} /></span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Right Column: Simulated Outcome Cards ── */}
        <div className="wit-out-col">
          {pathways.map((p, idx) => {
            const isAct = selectedPathwayKey === p.key;
            const pathCost = p.calcNewCost(activeSliderVal);
            const pathDiff = pathCost - baselineCost;
            const isPathSaving = pathDiff <= 0;
            const pathDiffAbs = Math.abs(pathDiff);

            return (
              <div
                key={p.key}
                ref={el => outcomeRefs.current[idx] = el}
                className={"wit-out-card" + (isAct ? " wit-out-act" : "")}
                onClick={() => handleSelectPath(p.key)}
              >
                <div className="wit-out-card-top">
                  {p.isAiRecommended ? (
                    <div className="wit-ai-badge">
                      <Sparkles size={12} style={{ display: "inline", marginRight: 5 }} />
                      AI Recommended
                    </div>
                  ) : (
                    <div className="wit-risk-badge" style={{ color: p.risk === "Low" ? "#10B981" : "#F59E0B" }}>
                      <ShieldCheck size={12} style={{ display: "inline", marginRight: 4 }} />
                      {p.risk} Risk
                    </div>
                  )}
                  <span className="wit-reason-text">{p.reason}</span>
                </div>

                <div className="wit-out-change">{p.change}</div>

                <div className="wit-out-row">
                  <div className="wit-out-cost">
                    Simulated:<br />
                    <strong style={{ color: isAct ? "#C49BFF" : "#FFFFFF" }}>
                      ₹{pathCost.toLocaleString("en-IN")}/mo
                    </strong>
                  </div>
                  <div className={"wit-save-chip" + (!isPathSaving ? " wit-increase-chip" : "")}>
                    {isPathSaving ? `Save ₹${pathDiffAbs.toLocaleString("en-IN")}/mo` : `+₹${pathDiffAbs.toLocaleString("en-IN")}/mo`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Summary & Roadmap Ribbon ───────────────────────── */}
      <div className="wit-bar">
        <div className="wit-bar-group">
          <span className="wit-bar-label">Simulated Decision</span>
          <span className="wit-bar-val wit-purple">{activePathway.label}</span>
          <span className="wit-bar-sub"> ({activePathway.change})</span>
        </div>

        <div className="wit-bar-sep" />

        <div className="wit-bar-group">
          <PiggyBank size={24} color={isSavings ? "#10B981" : "#F59E0B"} style={{ marginRight: 10 }} />
          <div>
            <span className="wit-bar-label">{isSavings ? "Simulated Monthly Savings" : "Simulated Cost Delta"}</span>
            <span className={"wit-bar-val " + (isSavings ? "wit-green" : "wit-amber")}>
              {isSavings ? `₹${absDiff.toLocaleString("en-IN")}` : `+₹${absDiff.toLocaleString("en-IN")}`}
            </span>
            <span className="wit-bar-sub"> /month</span>
          </div>
        </div>

        <div className="wit-bar-sep" />

        <div className="wit-bar-group">
          <div>
            <span className="wit-bar-label">Annualized Financial Impact</span>
            <span className={"wit-bar-val " + (isSavings ? "wit-green" : "wit-amber")}>
              {isSavings ? `Save ₹${(absDiff * 12).toLocaleString("en-IN")}/yr` : `+₹${(absDiff * 12).toLocaleString("en-IN")}/yr`}
            </span>
          </div>
        </div>

        <div className="wit-bar-sep" />

        <div className="wit-bar-group">
          <ShieldCheck size={22} color={activePathway.risk === "Low" ? "#10B981" : "#F59E0B"} style={{ marginRight: 10 }} />
          <div>
            <span className="wit-bar-label">Governance Risk</span>
            <span className="wit-bar-val">{activePathway.risk}</span>
          </div>
        </div>

        <button
          className={"wit-roadmap-btn" + (isRoadmapAdded ? " added" : "")}
          onClick={onAddToRoadmap}
        >
          {isRoadmapAdded
            ? (<><Check size={18} style={{ display: "inline", marginRight: 8 }} />Saved to Optimization Roadmap</>)
            : (<><Plus size={18} style={{ display: "inline", marginRight: 8 }} />Add to Optimization Roadmap</>)
          }
        </button>
      </div>
    </div>
  );
};

export default PathwayVisualizer;
