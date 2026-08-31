import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Trip, FuelLog, Maintenance } from '../utils/mockData';

export class ExportService {
  /**
   * Export trips list as CSV format
   */
  public static async exportTripsCSV(trips: Trip[]): Promise<void> {
    const headers = [
      'ID',
      'Started At',
      'Ended At',
      'Duration (s)',
      'Distance (km)',
      'Avg Speed (km/h)',
      'Max Speed (km/h)',
      'Trip Type',
      'Notes',
    ];

    const rows = trips.map((t) => [
      t.id,
      `"${t.started_at}"`,
      `"${t.ended_at || ''}"`,
      t.duration_seconds,
      t.distance_km,
      t.average_speed_kmh,
      t.max_speed_kmh,
      `"${t.trip_type}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    await this.saveAndShareFile('ridemeter_trips.csv', csvContent, 'text/csv');
  }

  /**
   * Export single trip as GPX XML format
   */
  public static async exportTripGPX(trip: Trip): Promise<void> {
    const gpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RideMeter Motorcycle Dashboard" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>RideMeter Trip #${trip.id}</name>
    <desc>${trip.notes || 'Motorcycle Ride'}</desc>
    <time>${trip.started_at}</time>
  </metadata>
  <trk>
    <name>Ride #${trip.id} - ${trip.trip_type}</name>
    <trkseg>
      <trkpt lat="${trip.start_latitude || 27.7172}" lon="${trip.start_longitude || 85.3240}">
        <ele>1350</ele>
        <time>${trip.started_at}</time>
      </trkpt>
      <trkpt lat="${trip.end_latitude || 27.6710}" lon="${trip.end_longitude || 85.3120}">
        <ele>1320</ele>
        <time>${trip.ended_at || trip.started_at}</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

    await this.saveAndShareFile(`ridemeter_trip_${trip.id}.gpx`, gpxXml, 'application/gpx+xml');
  }

  /**
   * Export full app database backup as JSON
   */
  public static async exportFullJSONBackup(data: {
    trips: Trip[];
    fuelLogs: FuelLog[];
    maintenance: Maintenance[];
  }): Promise<void> {
    const jsonContent = JSON.stringify(
      {
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        ...data,
      },
      null,
      2
    );

    await this.saveAndShareFile('ridemeter_full_backup.json', jsonContent, 'application/json');
  }

  private static async saveAndShareFile(
    filename: string,
    content: string,
    mimeType: string
  ): Promise<void> {
    const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const fileUri = `${cacheDir}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Export ${filename}` });
    } else {
      console.log('Sharing not available on this platform. Content prepared:', fileUri);
    }
  }
}
