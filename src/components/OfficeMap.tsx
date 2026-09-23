"use client";

import { useEffect, useRef, useState } from "react";
import { geoMercator } from "d3-geo";
import { AnimatePresence, motion } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

import { cn } from "@/lib/utils";

/**
 * OfficeMap — static (non-zoomable) map framed on the regions Flink Freight
 * operates in, with the four office countries highlighted.
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
// Tighter than a whole-world fit (~145) — frames North America through South
// Asia/Middle East, where every office sits, instead of the full globe.
const SCALE = 230;
const CENTER: [number, number] = [-3, 36];

const MAP_PROJECTION = geoMercator()
  .scale(SCALE)
  .center(CENTER)
  .translate([WIDTH / 2, HEIGHT / 2]);

type Office = {
  id: string;
  /** Region this office covers — shown above the city on the hover card. */
  region: string;
  city: string;
  country: string;
  /** Street address, one line per array entry. */
  address: string[];
  coordinates: [number, number]; // [lng, lat]
};

const OFFICES: Office[] = [
  {
    id: "ca",
    region: "North America",
    city: "Brampton",
    country: "Canada",
    address: ["1 Gateway Blvd Ste 200", "Brampton, ON L6T 0G3, Canada"],
    coordinates: [-79.7663, 43.6834],
  },
  {
    id: "de",
    region: "Europe",
    city: "Schönefeld",
    country: "Germany",
    address: ["Willy-Brand-Platz 2", "12529 Schönefeld, Germany"],
    coordinates: [13.5225, 52.3889],
  },
  {
    id: "pk",
    region: "Asia",
    city: "Rawalpindi",
    country: "Pakistan",
    address: ["Office No 703, Kohistan Tower", "Saddar, Rawalpindi, Pakistan"],
    coordinates: [73.0551, 33.5951],
  },
  {
    id: "ae",
    region: "Gulf",
    city: "Dubai",
    country: "UAE",
    address: [
      "Dubai Digital Park, Bldg A1",
      "IFZA, Silicon Oasis, Dubai, UAE",
    ],
    coordinates: [55.3806, 25.1195],
  },
];

// Countries highlighted on the map, grouped by the broader region each office
// serves (EU, North America, Asia, the Gulf) rather than just the single
// country its city sits in. Names match world-110m.json's geo.properties.name
// exactly — some very small states (Malta, Bahrain, Singapore) aren't present
// in this 110m-resolution dataset at all, so they're omitted here too.
const EU_COUNTRIES = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark",
  "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland",
  "Italy", "Latvia", "Lithuania", "Luxembourg", "Netherlands", "Poland",
  "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "Turkey",
];
const NORTH_AMERICA_COUNTRIES = ["United States of America", "Canada"];
const ASIA_COUNTRIES = [
  "Azerbaijan", "Bangladesh", "Bhutan", "Brunei", "China", "India",
  "Indonesia", "Iran", "Iraq", "Japan", "Malaysia", "Nepal", "Pakistan",
  "South Korea", "Taiwan",
];
const GULF_COUNTRIES = ["Kuwait", "Oman", "Qatar", "Saudi Arabia", "United Arab Emirates"];

const OPERATING_COUNTRIES = new Set([
  ...EU_COUNTRIES,
  ...NORTH_AMERICA_COUNTRIES,
  ...ASIA_COUNTRIES,
  ...GULF_COUNTRIES,
]);

/**
 * Which office covers each highlighted country, so hovering anywhere in a
 * region reveals that region's office rather than only the pin itself.
 *
 * Order matters: the Gulf states also appear in ASIA_COUNTRIES, and being
 * applied last they win — hovering the UAE shows Dubai, not Rawalpindi.
 */
const COUNTRY_TO_OFFICE = new Map<string, string>();
for (const [countries, officeId] of [
  [EU_COUNTRIES, "de"],
  [NORTH_AMERICA_COUNTRIES, "ca"],
  [ASIA_COUNTRIES, "pk"],
  [GULF_COUNTRIES, "ae"],
] as const) {
  for (const country of countries) COUNTRY_TO_OFFICE.set(country, officeId);
}

// Routes drawn between offices, as pairs of indices into OFFICES.
const ROUTES: [number, number][] = [
  [0, 1], // Brampton → Schönefeld
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

  // Counter-scale undoes the responsive downscale so glyphs stay a fixed,
  // readable size at any container width. Clamped so they never balloon.
  const glyph = Math.min(1 / Math.max(renderScale, 0.2), 2.4);
  // Below this width the labels collide, so they become tap-to-reveal only.
  const showLabels = renderScale > 0.72;

  const activeOffice = OFFICES.find((o) => o.id === active) ?? null;

  // Place the address card over the map by converting the office's projected
  // position into a percentage of the viewBox — the SVG scales as a unit, so
  // percentages track it exactly. Cards near an edge are nudged inward rather
  // than centred, so they never spill outside the map.
  const cardPosition = (() => {
    if (!activeOffice) return null;
    const [x, y] = project(activeOffice.coordinates);
    const leftPct = (x / WIDTH) * 100;
    const shiftX = leftPct < 22 ? "-10%" : leftPct > 78 ? "-90%" : "-50%";
    return { leftPct, topPct: (y / HEIGHT) * 100, shiftX };
  })();

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
        <Geographies geography="/world-110m.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              const isOperating = OPERATING_COUNTRIES.has(geo.properties.name);
              const officeId = COUNTRY_TO_OFFICE.get(geo.properties.name);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  // Makes each country addressable — handy when checking the
                  // region-to-office mapping in the browser or in tests.
                  data-country={geo.properties.name}
                  onMouseEnter={() => officeId && setActive(officeId)}
                  onMouseLeave={() => setActive(null)}
                  // Tap on touch devices, where there is no hover.
                  onClick={() => officeId && setActive(active === officeId ? null : officeId)}
                  // The whole region lights up together, so it reads as one
                  // territory served by one office rather than a single country.
                  fill={
                    !isOperating
                      ? "#16324f"
                      : active && officeId === active
                        ? "rgba(255,220,57,0.42)"
                        : "rgba(255,220,57,0.22)"
                  }
                  stroke={isOperating ? "#FFDC39" : "#24476b"}
                  strokeWidth={isOperating ? (officeId === active ? 1.4 : 1) : 0.4}
                  style={{
                    default: { outline: "none", transition: "fill 180ms ease" },
                    hover: {
                      fill: isOperating ? "rgba(255,220,57,0.42)" : "#1d4066",
                      outline: "none",
                      cursor: isOperating ? "pointer" : "default",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Animated route curves, drawn under the pins. pointerEvents off so a
            line crossing a country never steals the hover from it — the routes
            are decoration and have nothing to reveal. */}
        <g fill="none" stroke="#FFDC39" strokeLinecap="round" style={{ pointerEvents: "none" }}>
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
          // Counter-scale keeps pins a fixed on-screen size at any width.
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
                {/* Radiating halo. Scales rather than animating the SVG `r`
                    attribute directly — framer-motion writes an undefined `r`
                    on the first frame of an attribute animation, which the
                    browser rejects. 2.75x reproduces the original 4 → 11 span. */}
                <motion.circle
                  r={4 * s}
                  fill="#FFDC39"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2.75, opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.35,
                    ease: "easeOut",
                  }}
                  // Decoration only — it expands well past the pin, so letting
                  // it capture the pointer would blank out the country beneath.
                  style={{
                    transformOrigin: "center",
                    transformBox: "fill-box",
                    pointerEvents: "none",
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
              </motion.g>
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Address card. Positioned as a percentage of the SVG viewBox, so it
          stays pinned to its office at any container width. pointer-events are
          off so moving onto the card never counts as leaving the region. */}
      <AnimatePresence>
        {activeOffice && cardPosition && (
          <motion.div
            key={activeOffice.id}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="pointer-events-none absolute z-10 w-56 rounded-lg border border-[#FFDC39]/40 bg-[#0b1a2e]/95 p-3 shadow-xl backdrop-blur-sm"
            style={{
              left: `${cardPosition.leftPct}%`,
              top: `${cardPosition.topPct}%`,
              transform: `translate(${cardPosition.shiftX}, calc(-100% - 14px))`,
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FFDC39]">
              {activeOffice.region}
            </p>
            <p className="mt-0.5 text-sm font-bold text-white">
              {activeOffice.city}, {activeOffice.country}
            </p>
            <address className="mt-1.5 space-y-0.5 text-xs not-italic leading-relaxed text-slate-300">
              {activeOffice.address.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
          </motion.div>
        )}
      </AnimatePresence>

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
