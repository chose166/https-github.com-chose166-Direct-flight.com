import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';

// Declare d3 and topojson as globals since they are loaded from CDN
declare const d3: any;
declare const topojson: any;

interface GlobeProps {
  worldData: any;
  airportData: any;
  routesData: any;
  airportMap: Map<string, any>;
  departure: any | null;
  setDeparture: (airport: any | null) => void;
  arrival: any | null;
  setArrival: (airport: any | null) => void;
  is3DView: boolean;
}

const Globe: React.FC<GlobeProps> = ({ worldData, airportData, routesData, airportMap, departure, setDeparture, arrival, setArrival, is3DView }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const projectionRef = useRef<any>(null);
  const previousView = useRef<{ rotate: [number, number, number]; scale: number } | null>(null);
  const hoveredAirportRef = useRef<any | null>(null);
  const zoomBehaviorRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Use a ref to hold the latest props to avoid stale closures in D3 event handlers
  const propsRef = useRef({ departure, arrival, setDeparture, setArrival });
  useEffect(() => {
    propsRef.current = { departure, arrival, setDeparture, setArrival };
  });

  const viewStateRef = useRef({
    mercatorInitial: { scale: 1, translate: [0, 0] as [number, number] },
  }).current;
  
  const renderFuncRef = useRef<(() => void) | null>(null);

  const allDestinationIataCodes = useMemo(() => {
    const codes = new Set<string>();
    if (departure) {
        routesData.forEach((route: any) => {
            if (route.source_airport === departure.iata_code) {
                const destAirport = airportMap.get(route.destination_airport);
                if (destAirport) {
                    codes.add(destAirport.iata_code);
                }
            }
        });
    }
    return codes;
  }, [departure, routesData, airportMap]);

  const densify = useCallback((coords: [[number, number], [number, number]]) => {
    const interpolator = d3.geoInterpolate(coords[0], coords[1]);
    const densifiedCoords: [number, number][] = [];
    const numPoints = 50;
    for (let i = 0; i <= numPoints; i++) {
        densifiedCoords.push(interpolator(i / numPoints));
    }
    return densifiedCoords;
  }, []);

  const routesToDraw = useMemo(() => {
    let routes: any[] = [];
    if (departure && arrival) {
        const routeExists = routesData.some((r: any) => 
            r.source_airport === departure.iata_code && r.destination_airport === arrival.iata_code
        );
        if (routeExists) {
             routes.push({
                type: 'LineString',
                coordinates: densify([
                    [departure.longitude_deg, departure.latitude_deg],
                    [arrival.longitude_deg, arrival.latitude_deg]
                ])
            });
        }
    } else if (departure) {
        allDestinationIataCodes.forEach(iata => {
            const destAirport = airportMap.get(iata);
            if (destAirport) {
                routes.push({
                    type: 'LineString',
                     coordinates: densify([
                        [departure.longitude_deg, departure.latitude_deg],
                        [destAirport.longitude_deg, destAirport.latitude_deg]
                    ])
                });
            }
        });
    }
    return routes;
  }, [departure, arrival, allDestinationIataCodes, routesData, airportMap, densify]);

  const render = useCallback(() => {
    if (!projectionRef.current || !svgRef.current) return;
    const projection = projectionRef.current;
    const svg = d3.select(svgRef.current);
    const pathGenerator = d3.geoPath().projection(projection);

    svg.selectAll('.ocean').attr('d', pathGenerator({ type: 'Sphere' }));
    if (!is3DView) {
        svg.selectAll('.ocean').attr('width', dimensions.width).attr('height', dimensions.height);
    }
    svg.selectAll('.country').attr('d', pathGenerator);
    svg.select('.routes').selectAll('path').attr('d', pathGenerator);

    svg.selectAll('.airport-group')
        .attr('transform', (d: any) => {
            const coords = projection([d.longitude_deg, d.latitude_deg]);
            return coords ? `translate(${coords[0]}, ${coords[1]})` : 'translate(-9999,-9999)';
        })
        .style('display', (d: any) => {
            if (!is3DView) return 'inline';
            const [lon, lat] = [d.longitude_deg, d.latitude_deg];
            const [rLon, rLat] = projection.rotate();
            const centerPoint: [number, number] = [-rLon, -rLat];
            const distance = d3.geoDistance([lon, lat], centerPoint);
            return distance > Math.PI / 2 ? 'none' : 'inline';
        });

    if (hoveredAirportRef.current) {
        const d = hoveredAirportRef.current;
        const coords = projection([d.longitude_deg, d.latitude_deg]);
        if (coords) {
            d3.select(tooltipRef.current)
                .style('left', `${coords[0]}px`)
                .style('top', `${coords[1] - 10}px`);
        }
    }
  }, [is3DView, dimensions.width, dimensions.height]);
  
  useEffect(() => {
    renderFuncRef.current = render;
  });

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.airport-group')
      .style('opacity', (d: any) => {
          if (!departure) return 1;
          if (d.iata_code === departure.iata_code) return 1;
          if (allDestinationIataCodes.has(d.iata_code)) return 1;
          return 0;
      })
      .style('pointer-events', (d: any) => {
          if (!departure) return 'all';
          if (d.iata_code === departure.iata_code || allDestinationIataCodes.has(d.iata_code)) return 'all';
          return 'none';
      })
      .selectAll('.airport-dot')
      .each(function(d: any) {
          const dot = d3.select(this);
          const isDeparture = departure && d.iata_code === departure.iata_code;
          const isArrival = arrival && d.iata_code === arrival.iata_code;
          const isPotentialDestination = allDestinationIataCodes.has(d.iata_code);
          
          let fill = '#fbbf24';
          if (isDeparture) fill = '#ec4899';
          else if (isArrival) fill = '#8b5cf6';
          else if (isPotentialDestination) fill = '#fcd34d';
          
          let radius = 2.5;
          if (isDeparture) radius = 7;
          else if (isArrival) radius = 6;
          else if (isPotentialDestination) radius = 4;
          
          dot.attr('fill', fill).attr('r', radius);
      });

    const pathGenerator = d3.geoPath().projection(projectionRef.current);
    svg.select('.routes')
        .selectAll('path')
        .data(routesToDraw, (d: { coordinates: any[][] }) => `${d.coordinates[0].join(',')}-${d.coordinates[d.coordinates.length - 1].join(',')}`)
        .join(
            enter => enter.append('path')
                .attr('d', pathGenerator)
                .attr('fill', 'none')
                .attr('stroke', 'rgba(59, 130, 246, 0.7)')
                .attr('stroke-width', 1.5)
                .style('pointer-events', 'none')
                .each(function(this: SVGPathElement) {
                    const self = d3.select(this);
                    const length = this.getTotalLength();
                    if (length < 1) return;
                    self.attr('stroke-dasharray', `${length} ${length}`)
                        .attr('stroke-dashoffset', length)
                        .transition().duration(1000).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0)
                        .on('end', function() {
                            d3.select(this).attr('stroke-dasharray', null).attr('stroke-dashoffset', null);
                        });
                }),
            update => update,
            exit => exit.transition().duration(300).style('opacity', 0).remove()
        )
        .each(function(this: SVGPathElement, d: any) {
            const self = d3.select(this);
            const routeKey = `${d.coordinates[0].join(',')}-${d.coordinates[d.coordinates.length - 1].join(',')}`;
            const selectedRouteKey = departure && arrival ? `${[departure.longitude_deg, departure.latitude_deg].join(',')}-${[arrival.longitude_deg, arrival.latitude_deg].join(',')}` : null;
            const isSelectedRoute = selectedRouteKey && routeKey.startsWith(selectedRouteKey.split('-')[0]) && routeKey.endsWith(selectedRouteKey.split('-')[1]);

            if (isSelectedRoute) {
                if (self.attr('data-pulsing') !== 'true') {
                    self.attr('data-pulsing', 'true');
                    function pulse(this: SVGPathElement) {
                        d3.select(this).transition('pulse').duration(1200).ease(d3.easeSinInOut).attr('stroke-width', 3).attr('stroke', 'rgba(37, 99, 235, 1)').transition('pulse').duration(1200).ease(d3.easeSinInOut).attr('stroke-width', 1.5).attr('stroke', 'rgba(59, 130, 246, 0.7)').on('end', pulse);
                    }
                    pulse.call(this);
                }
            } else {
                if (self.attr('data-pulsing') === 'true') {
                    self.attr('data-pulsing', 'false');
                    self.interrupt('pulse').transition('depulse').duration(300).attr('stroke-width', 1.5).attr('stroke', 'rgba(59, 130, 246, 0.7)');
                }
            }
        });
  }, [allDestinationIataCodes, arrival, departure, routesToDraw, is3DView]);

  // Master setup effect - re-runs when view changes
  useEffect(() => {
    if (!worldData || !airportData || !svgRef.current || !parentRef.current || !tooltipRef.current || dimensions.width === 0) return;
    const { width, height } = dimensions;
    const parentNode = parentRef.current;
    const svg = d3.select(svgRef.current);

    // Clear previous SVG contents and event listeners
    svg.selectAll('*').remove();
    d3.select(parentNode).on('.drag', null).on('.zoom', null);

    let projection;
    const countries = topojson.feature(worldData, worldData.objects.countries);
    const initialScale = Math.min(width, height) / 2.2;

    if (is3DView) {
      projection = d3.geoOrthographic()
        .scale(initialScale)
        .center([0, 0])
        .rotate([0, -30])
        .translate([width / 2, height / 2]);
    } else {
      projection = d3.geoMercator()
        .translate([width / 2, height / 2]);
      projection.fitSize([width, height], countries);

      const initialZoomFactor = 1.5; 
      projection.scale(projection.scale() * initialZoomFactor);
      
      viewStateRef.mercatorInitial.scale = projection.scale();
      viewStateRef.mercatorInitial.translate = projection.translate();
    }
    projectionRef.current = projection;

    if (is3DView) {
      svg.append('path').datum({ type: 'Sphere' }).attr('class', 'ocean')
        .attr('fill', '#a2d4f5').attr('stroke', '#60a5fa').attr('stroke-width', 0.5)
        .on('click', () => { propsRef.current.setDeparture(null); propsRef.current.setArrival(null); });
    } else {
      svg.append('rect').attr('class', 'ocean')
        .attr('width', width).attr('height', height).attr('fill', '#a2d4f5')
        .on('click', () => { propsRef.current.setDeparture(null); propsRef.current.setArrival(null); });
    }

    svg.append('g').selectAll('.country').data(countries.features).enter().append('path').attr('class', 'country').attr('fill', '#f5f5f4').attr('stroke', '#a8a29e').attr('stroke-width', 0.5);
    svg.append('g').attr('class', 'routes');
    svg.append('g').attr('class', 'airports').selectAll('g').data(airportData).join('g').attr('class', 'airport-group').style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: any) => { event.stopPropagation(); const { departure, arrival, setDeparture, setArrival } = propsRef.current; if (departure && !arrival) setArrival(d); else if (departure && arrival) { if (d.iata_code !== departure.iata_code) setArrival(d); else { setDeparture(null); setArrival(null); } } else { setDeparture(d); setArrival(null); } })
      .on('mouseover', function(event: MouseEvent, d: any) {
          hoveredAirportRef.current = d;
          const proj = projectionRef.current; if (!proj) return; const coords = proj([d.longitude_deg, d.latitude_deg]); if (!coords) return;
          d3.select(this).select('.airport-dot').attr('stroke', 'black').attr('stroke-width', 1.5);
          d3.select(tooltipRef.current).style('display', 'block').html(d.name).style('left', `${coords[0]}px`).style('top', `${coords[1] - 10}px`).style('transform', 'translateX(-50%) translateY(-100%)');
      })
      .on('mouseout', function() {
          hoveredAirportRef.current = null;
          d3.select(this).select('.airport-dot').attr('stroke', 'none');
          d3.select(tooltipRef.current).style('display', 'none');
      })
      .call((g: any) => g.append('circle').attr('r', 10).attr('fill', 'transparent'))
      .call((g: any) => g.append('circle').attr('class', 'airport-dot').style('pointer-events', 'none').attr('r', 2.5).attr('fill', '#fbbf24'));

    if (is3DView) {
      const sensitivity = 75;
      const drag = d3.drag().on('drag', (event: any) => { if (renderFuncRef.current) { const proj = projectionRef.current; if (!proj) return; const rotate = proj.rotate(); const k = sensitivity / proj.scale(); const newRotation: [number, number, number] = [rotate[0] + event.dx * k, rotate[1] - event.dy * k, rotate[2]]; if (newRotation[1] > 90) newRotation[1] = 90; if (newRotation[1] < -90) newRotation[1] = -90; proj.rotate(newRotation); renderFuncRef.current(); } });
      const wheel = (event: WheelEvent) => { event.preventDefault(); if (renderFuncRef.current) { const proj = projectionRef.current; if (!proj) return; const currentScale = proj.scale(); let targetScale = currentScale * Math.pow(2, -event.deltaY * 0.002); const scaleExtent = [0.8 * initialScale, 15 * initialScale]; const clampedScale = Math.max(scaleExtent[0], Math.min(scaleExtent[1], targetScale)); if (currentScale === clampedScale) return; const pointer = d3.pointer(event, svgRef.current) as [number, number]; const geoBefore = proj.invert(pointer); proj.scale(clampedScale); const geoAfter = proj.invert(pointer); if (geoBefore && geoAfter) { const newRotate = [proj.rotate()[0] + geoAfter[0] - geoBefore[0], proj.rotate()[1] + geoAfter[1] - geoBefore[1], proj.rotate()[2]]; proj.rotate(newRotate); } renderFuncRef.current(); } };
      d3.select(parentNode).call(drag).on('wheel.zoom', wheel);
    } else {
      const zoom = d3.zoom().scaleExtent([0.5, 30]).on('zoom', (event: any) => {
        const { transform } = event;
        const { scale: s0, translate: t0 } = viewStateRef.mercatorInitial;
        projection.scale(s0 * transform.k);
        projection.translate([
            t0[0] * transform.k + transform.x,
            t0[1] * transform.k + transform.y,
        ]);
        if (renderFuncRef.current) renderFuncRef.current();
      });
      zoomBehaviorRef.current = zoom;
      d3.select(parentNode).call(zoom);
    }
    
    if (renderFuncRef.current) renderFuncRef.current();

  }, [is3DView, worldData, airportData, dimensions.width, dimensions.height]);

  // Initial resize observer setup
  useEffect(() => {
    if (!parentRef.current) return;
    const parentNode = parentRef.current;
    const resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
          d3.select(svgRef.current).attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);
        }
    });
    resizeObserver.observe(parentNode);
    return () => { resizeObserver.unobserve(parentNode); };
  }, []);

  // "Zoom-to-fit" effect
  useEffect(() => {
    const projection = projectionRef.current;
    const svg = d3.select(svgRef.current);
    if (!projection || !svg.node() || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const initialScale = Math.min(width, height) / 2.2;

    if (departure || arrival) {
        if (!previousView.current && is3DView) {
            previousView.current = { rotate: projection.rotate(), scale: projection.scale() };
        }
        let allCoords: [number, number][] = [];
        if (departure && arrival) allCoords = [[departure.longitude_deg, departure.latitude_deg], [arrival.longitude_deg, arrival.latitude_deg]];
        else if (departure) allCoords = [[departure.longitude_deg, departure.latitude_deg], ...[...allDestinationIataCodes].map(iata => airportMap.get(iata)).filter(Boolean).map(a => [a.longitude_deg, a.latitude_deg])] as [number, number][];
        
        if (allCoords.length === 0) { if (renderFuncRef.current) renderFuncRef.current(); return; }
        const geoJson = { type: "MultiPoint", coordinates: allCoords };

        if (is3DView) {
            const center = d3.geoCentroid(geoJson);
            if (!center) { if (renderFuncRef.current) renderFuncRef.current(); return; }
            const targetRotate: [number, number, number] = [-center[0], -center[1], 0];

            const tempProjection = d3.geoOrthographic().scale(1).rotate(targetRotate);
            const [[x0, y0], [x1, y1]] = d3.geoPath(tempProjection).bounds(geoJson) as [[number, number], [number, number]];
            const targetScale = 0.8 / Math.max((x1 - x0) / width, (y1 - y0) / height);
            
            if (!isFinite(targetScale)) { if (renderFuncRef.current) renderFuncRef.current(); return; }
            const scaleExtent = [0.8 * initialScale, 15 * initialScale];
            const clampedScale = Math.max(scaleExtent[0], Math.min(scaleExtent[1], targetScale));

            svg.transition('view').duration(1250).tween('rotate.zoom', () => {
                const r = d3.interpolate(projection.rotate(), targetRotate);
                const s = d3.interpolate(projection.scale(), clampedScale);
                return (t: number) => { projection.rotate(r(t)).scale(s(t)); if (renderFuncRef.current) renderFuncRef.current(); };
            }).on('interrupt', () => { previousView.current = null; });
        } else { // 2D zoom
            const { scale: s0, translate: t0 } = viewStateRef.mercatorInitial;
            const tempProjection = d3.geoMercator().scale(s0).translate(t0);
            const [[x0, y0], [x1, y1]] = d3.geoPath(tempProjection).bounds(geoJson);
            
            const dx = x1 - x0;
            const dy = y1 - y0;
            const x = (x0 + x1) / 2;
            const y = (y0 + y1) / 2;

            let transform;
            if (dx === 0 && dy === 0) { // Single point case
                const k = 4;
                const [px, py] = tempProjection(allCoords[0]);
                const tx = width / 2 - px * k;
                const ty = height / 2 - py * k;
                transform = d3.zoomIdentity.translate(tx, ty).scale(k);
            } else {
                const k = Math.min(30, 0.9 / Math.max(dx / width, dy / height));
                const tx = width / 2 - x * k;
                const ty = height / 2 - y * k;
                transform = d3.zoomIdentity.translate(tx, ty).scale(k);
            }
            
            if (zoomBehaviorRef.current && isFinite(transform.k)) {
                d3.select(parentRef.current!).transition('view').duration(1250).call(zoomBehaviorRef.current.transform, transform);
            }
        }

    } else if (is3DView && previousView.current) {
        const { rotate, scale } = previousView.current;
        svg.transition('view').duration(1250).tween('rotate.zoom', () => {
            const r = d3.interpolate(projection.rotate(), rotate);
            const s = d3.interpolate(projection.scale(), scale);
            return (t: number) => { projection.rotate(r(t)).scale(s(t)); if (renderFuncRef.current) renderFuncRef.current(); };
        }).on('end', () => { previousView.current = null; }).on('interrupt', () => { previousView.current = null; });
    } else if (!is3DView && zoomBehaviorRef.current) {
        d3.select(parentRef.current!).transition('view').duration(1250).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    } else {
        if (renderFuncRef.current) renderFuncRef.current();
    }
  }, [departure, arrival, airportMap, allDestinationIataCodes, is3DView, dimensions]);

  return (
    <div ref={parentRef} className="w-full h-full cursor-grab relative">
      <svg ref={svgRef} className="w-full h-full"></svg>
      <div ref={tooltipRef} className="absolute hidden bg-white text-gray-800 text-sm px-3 py-1 rounded-md shadow-lg pointer-events-none z-20 border border-gray-200"></div>
    </div>
  );
};

export default Globe;
