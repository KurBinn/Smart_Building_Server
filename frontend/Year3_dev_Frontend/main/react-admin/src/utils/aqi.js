export const AQI_BREAKPOINTS = [
  { min: 0, max: 50, level: "good", color: "green" },
  { min: 51, max: 100, level: "moderate", color: "yellow" },
  { min: 101, max: 150, level: "poor", color: "orange" },
  { min: 151, max: 200, level: "unhealthy", color: "red" },
  { min: 201, max: 300, level: "veryUnhealthy", color: "purple" },
  { min: 301, max: Infinity, level: "hazardous", color: "maroon" },
];

export const NO_AQI_RATING = {
  level: "No data",
  color: "gray",
};

export function normalizeAqiValue(value) {
  const aqi = Number(value);

  if (!Number.isFinite(aqi) || aqi < 0) {
    return null;
  }

  return Math.round(aqi);
}

export function getAqiRating(value) {
  const aqi = normalizeAqiValue(value);

  if (aqi === null) {
    return NO_AQI_RATING;
  }

  return (
    AQI_BREAKPOINTS.find((rating) => aqi >= rating.min && aqi <= rating.max) ||
    NO_AQI_RATING
  );
}
