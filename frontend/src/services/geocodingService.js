export async function getLocationDetails(lat, lng) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    console.log("Geocoding response:", data);

    if (!data.results || data.results.length === 0) {
      return { state: "Unknown", district: "Unknown", city: "Unknown", address: `${lat}, ${lng}`, landmark: null };
    }

    const components = data.results[0].address_components;
    let state = "Unknown";
    let district = "Unknown";
    let city = "Unknown";
    let address = data.results[0].formatted_address;
    let landmark = null;

    for (const component of components) {
      if (component.types.includes("administrative_area_level_1")) state = component.long_name;
      if (component.types.includes("administrative_area_level_2")) district = component.long_name;
      if (component.types.includes("administrative_area_level_3")) district = component.long_name; // overrides level_2
      if (component.types.includes("locality")) city = component.long_name;
    }

    // Always prefer city (locality) over revenue division for display
    if (city !== "Unknown") district = city;

    // Search ALL results — check result.types first (Google puts POI type here)
    for (const result of data.results) {
      if (
        result.types.includes("point_of_interest") ||
        result.types.includes("establishment") ||
        result.types.includes("premise") ||
        result.types.includes("natural_feature") ||
        result.types.includes("tourist_attraction")
      ) {
        landmark = result.address_components[0]?.long_name || null;
        break;
      }
      // Also check address_components of each result
      for (const component of result.address_components) {
        if (
          component.types.includes("point_of_interest") ||
          component.types.includes("establishment")
        ) {
          landmark = component.long_name;
          break;
        }
      }
      if (landmark) break;
    }

    // Fallback 1: use sublocality as landmark
    if (!landmark) {
      for (const component of components) {
        if (
          component.types.includes("sublocality_level_1") ||
          component.types.includes("sublocality")
        ) {
          landmark = component.long_name;
          break;
        }
      }
    }

    // Fallback 2: use neighborhood
    if (!landmark) {
      for (const component of components) {
        if (component.types.includes("neighborhood")) {
          landmark = component.long_name;
          break;
        }
      }
    }

    // Filter out useless landmarks (building numbers, plot/flat/sector/block numbers)
    if (landmark) {
      const useless = /^[A-Z]?\s?\d+$|^plot|^block|^sector|^flat|^house|^[A-Z]-?\d+$/i;
      if (useless.test(landmark.trim())) landmark = null;
    }

    if (state.includes("Delhi")) state = "Delhi";
    if (state.includes("Uttarakhand") || state.includes("Uttaranchal")) state = "Uttarakhand";
    if (state.includes("Odisha") || state.includes("Orissa")) state = "Odisha";
    if (state.includes("Jammu")) state = "Jammu & Kashmir";

    console.log("Location details:", { state, district, city, landmark });

    return {
      state,
      district,
      city,
      address,
      landmark: landmark ? `Near ${landmark}` : null,
    };
  } catch (err) {
    console.error("Geocoding error:", err);
    return { state: "Unknown", district: "Unknown", city: "Unknown", address: `${lat}, ${lng}`, landmark: null };
  }
}