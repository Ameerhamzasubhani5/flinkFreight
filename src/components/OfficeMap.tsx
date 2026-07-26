"use client";

import { useEffect, useRef, useState } from "react";
import { geoMercator } from "d3-geo";
import { motion } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

import { cn } from "@/lib/utils";

/**
 * OfficeMap — world map with the four Flink Freight offices.
 *
 * Coordinates are stored as [longitude, latitude] because that is the order
 * d3-geo (and therefore react-simple-maps) expects — the reverse of how
 * lat/lng pairs are normally written.
 *
 * Alignment: the map is a single SVG with a fixed viewBox, so every marker is
 * placed in the same coordinate space as the country paths. The browser scales
 * that viewBox as a unit, which keeps pins locked to their cities at any screen
 * size. `MAP_PROJECTION` mirrors ComposableMap's internal projection exactly so
 * the connection curves land on the same points as the markers.
 */

const WIDTH = 900;
const HEIGHT = 520;
const SCALE = 145;
const CENTER: [number, number] = [10, 25];

const MAP_PROJECTION = geoMercator()
  .scale(SCALE)
  .center(CENTER)
  .translate([WIDTH / 2, HEIGHT / 2]);

type Office = {
  id: string;
  city: string;
  country: string;
  coordinates: [number, number]; // [lng, lat]
};

const OFFICES: Office[] = [
  { id: "ca", city: "Toronto", country: "Canada", coordinates: [-79.3832, 43.6532] },
  { id: "de", city: "Berlin", country: "Germany", coordinates: [13.405, 52.52] },
  { id: "pk", city: "Lahore", country: "Pakistan", coordinates: [74.3587, 31.5204] },
  { id: "ae", city: "Dubai", country: "UAE", coordinates: [55.2708, 25.2048] },
];

// Routes drawn between offices, as pairs of indices into OFFICES.
const ROUTES: [number, number][] = [
  [0, 1], // Toronto  → Berlin
  [0, 2],
  [0, 3],
  [1, 0], 
  [1, 2],
  [1, 3],
  [2, 0],
  [2, 1],
  [2, 3],
  [3, 0], 
  [3, 1],
  [3, 2], 
];

/**
 * Quadratic bezier between two projected points, bowed perpendicular to the
 * straight line so overlapping routes stay visually distinct.
 */
function curvePath(
  [x1, y1]: [number, number],
  [x2, y2]: [number, number],
  bend = 0.22
) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Offset the control point along the normal — arcs upward on screen.
  const cx = mx + dy * bend;
  const cy = my - dx * bend;
  return `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`;
}

function project(coordinates: [number, number]): [number, number] {
  const point = MAP_PROJECTION(coordinates);
  return (point ?? [0, 0]) as [number, number];
}

export default function OfficeMap() {
  // Tracked so marker glyphs can be counter-scaled and keep a constant
  // on-screen size while the user zooms.
  const [zoom, setZoom] = useState(1);
  const [active, setActive] = useState<string | null>(null);

  // The SVG viewBox is downscaled to fit the container, which would shrink pins
  // and labels along with it. Measuring the container lets us counter-scale
  // glyphs so they stay a readable, tappable size on small screens.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [renderScale, setRenderScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setRenderScale((entry.contentRect.width || WIDTH) / WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Combined counter-scale: undo both the responsive downscale and the zoom.
  // Clamped so glyphs never balloon past a sensible share of the map.
  const glyph = Math.min(1 / (zoom * Math.max(renderScale, 0.2)), 2.4);
  // Below this width the labels collide, so they become tap-to-reveal only.
  const showLabels = renderScale > 0.72;

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-2xl border border-border bg-[#0b1a2e]">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: SCALE, center: CENTER }}
        width={WIDTH}
        height={HEIGHT}
        // viewBox scaling handles responsiveness; height auto preserves ratio.
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <ZoomableGroup
          center={CENTER}
          zoom={1}
          minZoom={1}
          maxZoom={5}
          onMoveEnd={({ zoom: z }) => setZoom(z)}
        >
          <Geographies geography="/world-110m.json">
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#16324f"
                  stroke="#24476b"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#1d4066", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Animated route curves, drawn under the pins */}
          <g fill="none" stroke="#FFDC39" strokeLinecap="round">
            {ROUTES.map(([from, to], i) => {
              const d = curvePath(
                project(OFFICES[from].coordinates),
                project(OFFICES[to].coordinates)
              );
              return (
                <g key={`${OFFICES[from].id}-${OFFICES[to].id}`}>
                  {/* Faint full path so the route reads even before it draws */}
                  <path d={d} strokeWidth={0.8 * glyph} opacity={0.18} />
                  {/* Draw-on animation */}
                  <motion.path
                    d={d}
                    strokeWidth={1.4 * glyph}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    transition={{
                      duration: 1.6,
                      delay: 0.4 + i * 0.25,
                      ease: "easeInOut",
                    }}
                  />
                  {/* Pulse travelling along the route (SMIL — no JS per frame) */}
                  <circle r={2.4 * glyph} fill="#FFDC39" opacity={0}>
                    <animateMotion
                      dur="3s"
                      begin={`${1.2 + i * 0.4}s`}
                      repeatCount="indefinite"
                      path={d}
                      calcMode="spline"
                      keyTimes="0;1"
                      keySplines="0.4 0 0.6 1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;0"
                      keyTimes="0;0.15;0.85;1"
                      dur="3s"
                      begin={`${1.2 + i * 0.4}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
          </g>

          {/* Office pins — positioned by geographic coordinates */}
          {OFFICES.map((office, i) => {
            const isActive = active === office.id;
            // Counter-scale keeps pins a fixed on-screen size at any zoom/width.
            const s = glyph;
            return (
              <Marker
                key={office.id}
                coordinates={office.coordinates}
                onMouseEnter={() => setActive(office.id)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive(isActive ? null : office.id)}
              >
                <motion.g
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.3 + i * 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {/* Radiating halo */}
                  <motion.circle
                    r={4 * s}
                    fill="#FFDC39"
                    animate={{ r: [4 * s, 11 * s], opacity: [0.5, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.35,
                      ease: "easeOut",
                    }}
                  />
                  <circle
                    r={5 * s}
                    fill="#FFDC39"
                    stroke="#0b1a2e"
                    strokeWidth={1.5 * s}
                  />
                  <circle r={1.8 * s} fill="#0b1a2e" />

                  {/* Label — counter-scaled; hidden when too narrow to fit,
                      where tapping a pin reveals it instead. */}
                  {(showLabels || isActive) && (
                    <text
                      y={-10 * s}
                      textAnchor="middle"
                      fill="#ffffff"
                      style={{
                        fontSize: 11 * s,
                        fontWeight: 700,
                        paintOrder: "stroke",
                        stroke: "#0b1a2e",
                        strokeWidth: 3 * s,
                        strokeLinejoin: "round",
                      }}
                    >
                      {office.city}
                    </text>
                  )}
                  {isActive && (
                    <text
                      y={16 * s}
                      textAnchor="middle"
                      fill="#FFDC39"
                      style={{
                        fontSize: 9 * s,
                        fontWeight: 600,
                        paintOrder: "stroke",
                        stroke: "#0b1a2e",
                        strokeWidth: 3 * s,
                        strokeLinejoin: "round",
                      }}
                    >
                      {office.country}
                    </text>
                  )}
                </motion.g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend — in normal flow so it never overlaps the map on small screens */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-white/10 px-4 py-3">
        {OFFICES.map((o) => (
          <button
            key={o.id}
            type="button"
            onMouseEnter={() => setActive(o.id)}
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(active === o.id ? null : o.id)}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              active === o.id ? "text-[#FFDC39]" : "text-slate-300 hover:text-white"
            )}
          >
            <span className="h-2 w-2 rounded-full bg-[#FFDC39]" />
            {o.city}, {o.country}
          </button>
        ))}
      </div>
    </div>
  );
}
