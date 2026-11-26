import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { WorkLocation } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { MapLocationPicker } from '../../components/MapLocationPicker';
import {
  MapPin,
  Plus,
  Edit2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  X,
  Cloud,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const AdminLocations: React.FC = () => {
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WorkLocation | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(28.5355);
  const [longitude, setLongitude] = useState(77.3910);
  const [radius, setRadius] = useState('100');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await api.getLocations();
      setLocations(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteLocation = async (loc: WorkLocation) => {
    if (!window.confirm(`Delete work location "${loc.name}" from the database?`)) {
      return;
    }
    try {
      await api.deleteLocation(loc.locationId);
      setLocations((prev) => prev.filter((l) => l.locationId !== loc.locationId));
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete location');
    }
  };

  const openCreateModal = () => {
    setEditingLocation(null);
    setName('');
    setAddress('');
    setLatitude(28.5355);
    setLongitude(77.3910);
    setRadius('100');
    setPhotoPreview(null);
    setPhotoBase64(null);
    setModalOpen(true);
  };

  const openEditModal = (loc: WorkLocation) => {
    setEditingLocation(loc);
    setName(loc.name);
    setAddress(loc.address);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setRadius(loc.geofenceRadiusMeters.toString());
    setPhotoPreview(loc.photoURL || null);
    setPhotoBase64(null);
    setModalOpen(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const rawDataUrl = uploadEvent.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setPhotoPreview(compressed);
          setPhotoBase64(compressed);
        } else {
          setPhotoPreview(rawDataUrl);
          setPhotoBase64(rawDataUrl);
        }
      };
      img.onerror = () => {
        setPhotoPreview(rawDataUrl);
        setPhotoBase64(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMapChange = (coords: { lat: number; lng: number; address?: string }) => {
    setLatitude(coords.lat);
    setLongitude(coords.lng);
    if (coords.address) {
      setAddress(coords.address);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Site name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingLocation) {
        await api.updateLocation(editingLocation.locationId, {
          name: name.trim(),
          address: address.trim(),
          latitude,
          longitude,
          geofenceRadiusMeters: Number(radius) || 100,
          photo: photoBase64 || undefined,
        });
        alert('Location successfully updated with Google Drive photo sync.');
      } else {
        await api.createLocation({
          name: name.trim(),
          address: address.trim(),
          latitude,
          longitude,
          geofenceRadiusMeters: Number(radius) || 100,
          photo: photoBase64 || undefined,
        });
        alert('New location successfully created and synced to Google Drive.');
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save location');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading work locations..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Work Locations & Geofences</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive map boundaries, geofence radius & Google Drive site landmark photos
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Location
        </button>
      </div>

      {/* Location Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => (
          <div
            key={loc.locationId}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between"
          >
            {/* Optional Site Image Banner */}
            {loc.photoURL && (
              <div className="relative h-36 w-full bg-slate-100 overflow-hidden border-b border-slate-100 group">
                <img
                  src={loc.photoURL}
                  alt={loc.name}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback if image fails to render
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded text-3xs font-medium flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span>Google Drive Synced</span>
                </div>
              </div>
            )}

            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-2xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {loc.locationId}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{loc.name}</h3>
                </div>
                <span className="text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  {loc.geofenceRadiusMeters}m Geofence
                </span>
              </div>

              <p className="text-xs text-slate-600 flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{loc.address || 'Address not configured'}</span>
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-2xs">
                <div>
                  <span className="text-3xs uppercase text-slate-400 font-semibold block">Coordinates</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {loc.latitude.toFixed(4)}°, {loc.longitude.toFixed(4)}°
                  </span>
                </div>
                <div>
                  <span className="text-3xs uppercase text-slate-400 font-semibold block">Active Jobs</span>
                  <span className="font-bold text-blue-600">
                    {loc.activeAssignmentsCount || 0} active assignments
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <a
                  href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Google Maps View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(loc)}
                    className="text-2xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-100 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLocation(loc)}
                    className="text-2xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                    title="Delete location"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CONFIGURE / EDIT LOCATION MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLocation ? `Edit Job Location (${editingLocation.locationId})` : 'Configure Job Location'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Site Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Site Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Northern High-Speed Rail Hub"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-xs"
            />
          </div>

          {/* Map Location Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold text-slate-700">
                Select Location on Map *
              </label>
              <span className="text-3xs text-slate-500 font-mono">
                {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
              </span>
            </div>
            <MapLocationPicker
              lat={latitude}
              lng={longitude}
              radius={Number(radius) || 100}
              onChange={handleMapChange}
            />
          </div>

          {/* Street Address (Auto-filled from Map & Editable) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">Street Address *</label>
              <span className="text-3xs text-emerald-600 font-medium">Auto-populates from map pin</span>
            </div>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Physical street address (select on map above to auto-detect)..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-xs"
            />
          </div>

          {/* Geofence Radius */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Geofence Radius (Meters) *
            </label>
            <div className="flex gap-2 mb-1.5">
              {[50, 100, 200, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRadius(preset.toString())}
                  className={`px-2.5 py-1 rounded-md text-3xs font-semibold border transition ${
                    radius === preset.toString()
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
            <input
              type="number"
              required
              min="10"
              max="5000"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="100"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-xs"
            />
          </div>

          {/* Site Image Upload & Drive Sync */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Site Landmark Photo (Google Drive Synced)
              </label>
              <span className="text-3xs text-slate-400">Optional</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {photoPreview ? (
              <div className="relative rounded-xl border border-slate-200 p-2.5 bg-slate-50 flex items-center gap-3">
                <img
                  src={photoPreview}
                  alt="Location landmark preview"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-300 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-emerald-600 text-2xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Image Selected</span>
                  </div>
                  <p className="text-3xs text-slate-500 mt-0.5 truncate">
                    Will be uploaded directly to Google Drive folder:
                    <span className="font-mono text-slate-700 block text-4xs">1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-200/50"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-2xs font-semibold text-slate-700">
                  Click to upload site photo or landmark image
                </div>
                <div className="text-3xs text-slate-400 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-slate-400" />
                  <span>Direct sync to Google Drive & Turso cloud storage</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {submitting ? 'Saving to Cloud...' : editingLocation ? 'Update Location' : 'Save Location'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
