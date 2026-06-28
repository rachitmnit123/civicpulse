import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { useState } from "react";

const urgencyColor = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

export default function MapView({ reports, center }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const mapCenter = center || { lat: 28.6139, lng: 77.209 };

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <Map
        style={{ width: "100%", height: "400px", borderRadius: "14px", overflow: "hidden" }}
        defaultCenter={mapCenter}
        defaultZoom={13}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
      >
        {reports.filter(r => r.location?.lat && r.location?.lng).map((report) => (
          <AdvancedMarker
            key={report.id}
            position={{ lat: report.location.lat, lng: report.location.lng }}
            onClick={() => setSelectedReport(report)}
          >
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: urgencyColor[report.aiAnalysis?.urgency] || "#666",
              border: "3px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", cursor: "pointer"
            }}>
              {report.aiAnalysis?.category === "ROAD_DAMAGE" ? "🕳️" :
               report.aiAnalysis?.category === "WATER_INFRASTRUCTURE" ? "💧" :
               report.aiAnalysis?.category === "ELECTRICAL" ? "⚡" :
               report.aiAnalysis?.category === "SANITATION" ? "🗑️" :
               report.aiAnalysis?.category === "DRAINAGE" ? "🌊" : "⚠️"}
            </div>
          </AdvancedMarker>
        ))}

        {selectedReport && (
          <InfoWindow
            position={{ lat: selectedReport.location.lat, lng: selectedReport.location.lng }}
            onCloseClick={() => setSelectedReport(null)}
          >
            <div style={{ maxWidth: "200px", fontFamily: "sans-serif" }}>
              <p style={{ fontWeight: "700", fontSize: "13px", marginBottom: "4px" }}>
                {selectedReport.aiAnalysis?.citizenTitle}
              </p>
              <p style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>
                {selectedReport.aiAnalysis?.citizenDescription?.slice(0, 80)}...
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{
                  fontSize: "11px", padding: "2px 6px", borderRadius: "10px",
                  background: (urgencyColor[selectedReport.aiAnalysis?.urgency] || "#666") + "20",
                  color: urgencyColor[selectedReport.aiAnalysis?.urgency] || "#666",
                  fontWeight: "600"
                }}>
                  {selectedReport.aiAnalysis?.urgency}
                </span>
                <span style={{ fontSize: "11px", color: "#888" }}>
                  {selectedReport.status}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
