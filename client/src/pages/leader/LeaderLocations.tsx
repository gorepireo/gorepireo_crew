import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WorkLocation } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { MapPin, ExternalLink, Navigation, Plus, Shield } from 'lucide-react';

export const LeaderLocations: React.FC = () => {
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // New location modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('28.5355');
  const [longitude, setLongitude] = useState('77.3910');
  const [radius, setRadius] = useState('120');
  const [submitting, setSubmitting] = useState(false);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await api.getLocations();
      setLocations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createLocation({
        name,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        geofenceRadiusMeters: Number(radius),
      });
      setCreateModalOpen(false);
      setName('');
      setAddress('');
      loadLocations();
    } catch (err: any) {
      alert(err.message || 'Failed to create location');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading work locations..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Work Locations & Sites</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geofenced physical locations and job project hubs
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Work Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => (
          <div
            key={loc.locationId}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {loc.locationId}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{loc.name}</h3>
              </div>
              <span className="text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                Active Geofence
              </span>
            </div>

            <p className="text-xs text-slate-600 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{loc.address}</span>
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-2xs">
              <div>
                <span className="text-3xs uppercase text-slate-400 font-semibold block">GPS Coordinates</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-3xs uppercase text-slate-400 font-semibold block">Verification Radius</span>
                <span className="font-bold text-indigo-600">
                  {loc.geofenceRadiusMeters} meters
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-2xs text-slate-500">
                Active assignments: <strong>{loc.activeAssignmentsCount || 0}</strong>
              </span>

              <a
                href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View on Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE LOCATION MODAL */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Work Location">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Location / Site Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. South Terminal Expansion Site"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Street Address *</label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full physical street address..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Latitude *</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Longitude *</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Geofence Verification Radius (Meters) *
            </label>
            <input
              type="number"
              required
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="100"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
            />
            <p className="text-3xs text-slate-400 mt-1">
              Workers must be within this distance to register a verified GPS check-in.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
            >
              {submitting ? 'Creating...' : 'Save Work Location'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
