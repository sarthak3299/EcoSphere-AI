"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Incident {
  id: number;
  location_text: string;
  category: string;
  severity: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
}

interface HeatmapMapProps {
  incidents: Incident[];
  onSelectIncident?: (incident: Incident) => void;
  center?: [number, number];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Garbage Dumping": "#e11d48", // red
  "Air Pollution": "#ea580c", // orange
  "Water Pollution": "#0284c7", // blue
  "Plastic Waste": "#b45309", // yellow-brown
  "Other": "#4b5563", // gray
};

export default function HeatmapMap({ incidents, onSelectIncident, center = [12.9716, 77.5946] }: HeatmapMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleMarkersRef = useRef<L.Circle[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default Leaflet icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    // Initialize Map if not already done
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView(center, 12);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.setView(center, 12);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    circleMarkersRef.current.forEach((marker) => marker.remove());
    circleMarkersRef.current = [];

    // Add Hotspot Circles
    incidents.forEach((incident) => {
      // Fallback coordinates if null
      const lat = incident.latitude !== null ? incident.latitude : center[0] + (Math.random() - 0.5) * 0.08;
      const lng = incident.longitude !== null ? incident.longitude : center[1] + (Math.random() - 0.5) * 0.08;

      const color = CATEGORY_COLORS[incident.category] || "#15803d";
      const size = incident.severity === "High" ? 250 : incident.severity === "Medium" ? 180 : 100;

      const circle = L.circle([lat, lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.35,
        radius: size,
        weight: 2
      }).addTo(map);

      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; font-weight: 700; color: #0f172a; font-size: 13px;">${incident.category}</h4>
          <p style="margin: 0 0 6px 0; color: #475569; font-size: 11px;">${incident.location_text}</p>
          <div style="display: flex; gap: 6px; font-size: 9px; font-weight: 600;">
            <span style="background: ${color}22; color: ${color}; padding: 2px 6px; border-radius: 4px;">${incident.severity} Severity</span>
            <span style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px;">Status: ${incident.status}</span>
          </div>
        </div>
      `;

      circle.bindPopup(popupContent);

      if (onSelectIncident) {
        circle.on("click", () => {
          onSelectIncident(incident);
        });
      }

      circleMarkersRef.current.push(circle);
    });

    // Cleanup on unmount
    return () => {
      // Keep instance intact but cleanup is handled or we can destroy on complete unmount
    };
  }, [incidents, center, onSelectIncident]);

  // Clean up completely if component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[400px] z-10 relative" />;
}
