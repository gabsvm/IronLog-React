export const isValidCardioEntry = (
    durationMinutes: number,
    distanceKm?: number,
    averageHeartRate?: number,
): boolean =>
    Number.isFinite(durationMinutes) && durationMinutes > 0 && durationMinutes <= 1440
    && (distanceKm === undefined || (Number.isFinite(distanceKm) && distanceKm >= 0 && distanceKm <= 1000))
    && (averageHeartRate === undefined || (Number.isFinite(averageHeartRate) && averageHeartRate >= 30 && averageHeartRate <= 250));
