import L from "leaflet";

export const createCustomMarkerIcon = () => {
  return new L.divIcon({
    className: "custom-touch-marker",
    html: `
      <div class="marker-hitbox" style="width: 48px; height: 48px; position: relative; display: flex; justify-content: center; align-items: flex-end; cursor: pointer;">
        <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png" style="position: absolute; bottom: 0; left: 11.5px; width: 41px; height: 41px; z-index: 1; pointer-events: none;" alt="" />
        <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" style="position: absolute; bottom: 0; left: 11.5px; width: 25px; height: 41px; z-index: 2; pointer-events: none;" alt="Map Marker" />
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -41],
  });
};
