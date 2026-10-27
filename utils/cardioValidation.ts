/** Shared contract: canonical-km upper bound for a single cardio distance entry. */
export const MAX_CARDIO_DISTANCE_KM = 1000;

export const isValidCardioEntry = (
    durationMinutes: number,
    distanceKm?: number,
    averageHeartRate?: number,
): boolean =>
    Number.isFinite(durationMinutes) && durationMinutes > 0 && durationMinutes <= 1440
    && (distanceKm === undefined || (Number.isFinite(distanceKm) && distanceKm >= 0 && distanceKm <= MAX_CARDIO_DISTANCE_KM))
    && (averageHeartRate === undefined || (Number.isFinite(averageHeartRate) && averageHeartRate >= 30 && averageHeartRate <= 250));
