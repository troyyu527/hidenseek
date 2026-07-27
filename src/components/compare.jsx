import React, { useState } from "react";

// Short labels so dots don't overlap in the narrow scatter plot.
const SHORT = {
  Dijkstra: "Dijkstra",
  BFS: "BFS",
  "A*": "A*",
  Greedy: "Greedy",
  Bidirectional: "Bi-BFS",
  DFS: "DFS"
};

// "Best for this layout" = the optimal-cost route found with the least work.
// (Textbook lexicographic rule: first optimal, then fewest cells explored.)
function recommend(solvable) {
  if (!solvable.length) return null;
  const minCost = Math.min(...solvable.map((r) => r.cost));
  const optimal = solvable.filter((r) => r.cost === minCost);
  return optimal.reduce((best, r) => (r.cells < best.cells ? r : best), optimal[0]);
}

function CompareChart({ rows }) {
  const [hover, setHover] = useState(null);
  const solvable = rows.filter((r) => r.found);
  const noPath = rows.filter((r) => !r.found);
  const best = recommend(solvable);

  // Ranked list: cheapest route first, ties broken by less exploration.
  const ranked = [...solvable].sort((a, b) => a.cost - b.cost || a.cells - b.cells);

  // Scatter geometry (viewBox units). Both axes: lower = better -> bottom-left ideal.
  const W = 320, H = 240, ml = 46, mr = 30, mt = 18, mb = 46;
  const pw = W - ml - mr, ph = H - mt - mb;
  const pl = ml, pt = mt, pr = ml + pw, pb = mt + ph;

  const cells = solvable.map((r) => r.cells);
  const costs = solvable.map((r) => r.cost);
  const minC = Math.min(...cells), maxC = Math.max(...cells);
  const minK = Math.min(...costs), maxK = Math.max(...costs);
  const sameCost = maxK === minK;
  const lg = (v) => Math.log(v + 1);
  // X = effort on a log scale, so one heavy explorer (e.g. DFS) doesn't squash
  // everyone else into the corner.
  const xOf = (c) => (maxC === minC ? pl + pw / 2 : pl + ((lg(c) - lg(minC)) / (lg(maxC) - lg(minC))) * pw);
  // Y = route cost. If every route costs the same, cost can't rank them, so drop
  // them onto the bottom axis and let effort decide.
  const yOf = (k) => (sameCost ? pb - 5 : pt + ((maxK - k) / (maxK - minK)) * ph);
  // Deterministic golden-angle nudge so dots landing on the same spot stay
  // individually visible and hoverable.
  const jitter = (i) => ({ dx: Math.cos(i * 2.399) * 3.4, dy: Math.sin(i * 2.399) * 3.4 });
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const pts = solvable.map((r, i) => {
    const j = jitter(i);
    return {
      r,
      cx: clamp(xOf(r.cells) + j.dx, pl + 2, pr - 2),
      cy: clamp(yOf(r.cost) + j.dy, pt + 2, pb - 2)
    };
  });

  return (
    <section className="compare-card">
      <h3>Best algorithm for this layout</h3>

      {best ? (
        <div className="verdict">
          <span className="verdict-trophy">🏆</span>
          <div>
            <div className="verdict-name">{best.name}</div>
            <div className="verdict-reason">
              Optimal route (cost <strong>{best.cost}</strong>, {best.steps} steps) found while exploring the
              fewest cells (<strong>{best.cells}</strong>) among the optimal choices.
            </div>
          </div>
        </div>
      ) : (
        <p className="compare-sub">No algorithm could reach the goal on this layout.</p>
      )}

      {solvable.length > 0 && (
        <>
          <p className="compare-sub">
            Cost vs. effort — the closer to the <span className="star">★</span> corner, the better.
          </p>
          <svg className="scatter" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cost versus effort scatter plot">
            {/* sweet-spot shading (bottom-left quadrant) */}
            <rect x={pl} y={pt + ph / 2} width={pw / 2} height={ph / 2} className="scatter-zone" />
            <text x={pl + 5} y={pt + ph / 2 + 12} className="scatter-zone-label">best zone</text>

            {/* axes */}
            <line x1={pl} y1={pt} x2={pl} y2={pb} className="scatter-axis" />
            <line x1={pl} y1={pb} x2={pr} y2={pb} className="scatter-axis" />

            {/* ideal corner star */}
            <text x={pl - 2} y={pb + 2} className="scatter-star">★</text>

            {/* axis labels */}
            <text x={pl + pw / 2} y={H - 8} className="scatter-axis-label" textAnchor="middle">
              Cells explored — fewer is better ◄
            </text>
            <text x={14} y={pt + ph / 2} className="scatter-axis-label" textAnchor="middle" transform={`rotate(-90 14 ${pt + ph / 2})`}>
              Route cost — lower is better
            </text>

            {/* points — only the winner is labelled inline; hover the rest */}
            {pts.map(({ r, cx, cy }) => {
              const isBest = r === best;
              const isHover = hover === r;
              return (
                <g key={r.name}>
                  {isBest && <circle cx={cx} cy={cy} r={9} className="scatter-halo" />}
                  <circle cx={cx} cy={cy} r={isBest ? 6 : 4.5} className={`scatter-dot${isBest ? " best" : ""}${isHover ? " hover" : ""}`} />
                  {isBest && (
                    <text x={clamp(cx + 8, pl, W - 44)} y={cy - 8} className="scatter-label best">
                      {SHORT[r.name] || r.name}
                    </text>
                  )}
                  {/* enlarged transparent hit area for easy hovering */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={12}
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHover(r)}
                    onMouseLeave={() => setHover((h) => (h === r ? null : h))}
                  />
                </g>
              );
            })}

            {/* hover tooltip (drawn last so it sits on top) */}
            {hover && (() => {
              const p = pts.find((q) => q.r === hover);
              if (!p) return null;
              const { cx, cy } = p;
              const tw = 132, th = 34;
              let tx = cx + 10;
              let ty = cy - th - 6;
              if (tx + tw > W) tx = cx - tw - 10;
              if (tx < 2) tx = 2;
              if (ty < 2) ty = cy + 10;
              return (
                <g className="scatter-tip" pointerEvents="none">
                  <rect x={tx} y={ty} width={tw} height={th} rx={6} className="scatter-tip-box" />
                  <text x={tx + 9} y={ty + 14} className="scatter-tip-title">{hover.name}</text>
                  <text x={tx + 9} y={ty + 26} className="scatter-tip-sub">
                    cost {hover.cost} · {hover.steps} steps · {hover.cells} cells
                  </text>
                </g>
              );
            })()}
          </svg>
          {sameCost && (
            <p className="scatter-note">
              Every route here costs the same, so the best pick is simply whoever explores the fewest cells.
            </p>
          )}
        </>
      )}

      {/* ranked list with exact numbers */}
      <ol className="rank-list">
        {ranked.map((r, i) => (
          <li key={r.name} className={r === best ? "rank best" : "rank"}>
            <span className="rank-medal">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
            <span className="rank-name">{r.name}</span>
            <span className="rank-nums">cost {r.cost} · {r.steps} steps · {r.cells} cells</span>
          </li>
        ))}
        {noPath.map((r) => (
          <li key={r.name} className="rank dead">
            <span className="rank-medal">—</span>
            <span className="rank-name">{r.name}</span>
            <span className="rank-nums">no path found</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default CompareChart;
