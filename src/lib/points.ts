export const AB_STATIONS = ["wkc1", "wkc2", "gcs_a", "wkc3", "ms"] as const;
export const C_STATIONS = ["ucs1", "gcs_b", "ucs3", "ukms"] as const;
export const AGGREGATE_POINTS = ["line_ab", "line_c", "line_abc"] as const;
export const ALL_DISPATCHER_POINTS = [...AB_STATIONS, ...C_STATIONS] as const;

export type DispatcherPointCode = (typeof ALL_DISPATCHER_POINTS)[number];
