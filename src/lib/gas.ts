import { pool } from "@/lib/db";
import { AB_STATIONS, AGGREGATE_POINTS, ALL_DISPATCHER_POINTS, C_STATIONS, type DispatcherPointCode } from "@/lib/points";

export async function getApiPoints() {
  const result = await pool.query<{
    point_code: string;
    gas_supplier: string;
    company_name: string;
  }>(
    `
    SELECT point_code, gas_supplier, company_name
    FROM points
    WHERE point_code = ANY($1::text[])
    ORDER BY CASE point_code
      WHEN 'line_ab' THEN 1
      WHEN 'line_c' THEN 2
      WHEN 'line_abc' THEN 3
      ELSE 10
    END
    `,
    [AGGREGATE_POINTS],
  );

  return result.rows.map((row) => ({
    pointCode: row.point_code,
    gasSupplier: row.gas_supplier,
    companyName: row.company_name,
  }));
}

export async function getDailyVolume(reportDate: string, pointCode: string) {
  const result = await pool.query<{ volume: string }>(
    `
    SELECT volume::text AS volume
    FROM daily_gas_entries
    WHERE report_date = $1::date AND point_code = $2
    `,
    [reportDate, pointCode],
  );

  if (!result.rowCount) {
    return null;
  }

  return Number(result.rows[0].volume);
}

export async function getDispatcherDaily(reportDate: string) {
  const result = await pool.query<{ point_code: string; volume: string }>(
    `
    SELECT point_code, volume::text AS volume
    FROM daily_gas_entries
    WHERE report_date = $1::date
      AND point_code = ANY($2::text[])
    `,
    [reportDate, [...ALL_DISPATCHER_POINTS, ...AGGREGATE_POINTS]],
  );

  const byPoint = new Map(result.rows.map((row) => [row.point_code, Number(row.volume)]));
  const stations = Object.fromEntries(ALL_DISPATCHER_POINTS.map((point) => [point, byPoint.get(point) ?? 0])) as Record<
    DispatcherPointCode,
    number
  >;

  return {
    stations,
    lineAb: byPoint.get("line_ab") ?? 0,
    lineC: byPoint.get("line_c") ?? 0,
    lineAbc: byPoint.get("line_abc") ?? 0,
  };
}

export async function upsertDispatcherDaily(reportDate: string, stations: Record<DispatcherPointCode, number>, enteredBy: string) {
  const lineAb = AB_STATIONS.reduce((acc, point) => acc + (stations[point] ?? 0), 0);
  const lineC = C_STATIONS.reduce((acc, point) => acc + (stations[point] ?? 0), 0);
  const lineAbc = lineAb + lineC;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const pointsToSave = [
      ...ALL_DISPATCHER_POINTS.map((code) => ({ pointCode: code, volume: stations[code] })),
      { pointCode: "line_ab", volume: lineAb },
      { pointCode: "line_c", volume: lineC },
      { pointCode: "line_abc", volume: lineAbc },
    ];

    for (const item of pointsToSave) {
      await client.query(
        `
        INSERT INTO daily_gas_entries (report_date, point_code, volume, entered_by)
        VALUES ($1::date, $2, $3, $4)
        ON CONFLICT (report_date, point_code) DO UPDATE
        SET volume = EXCLUDED.volume,
            entered_by = EXCLUDED.entered_by,
            updated_at = NOW()
        `,
        [reportDate, item.pointCode, item.volume, enteredBy],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return { lineAb, lineC, lineAbc };
}
