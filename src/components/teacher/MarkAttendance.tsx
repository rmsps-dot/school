"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { haversine } from "@/utils/helpers";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Upload,
  Navigation,
  Shield,
  Clock,
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { markTeacherAttendance } from "@/actions/teacher-actions";

/* ─── Constants ─── */
const SCHOOL = { lat: 26.1121, lng: 86.6069 } as const;
const MAX_DISTANCE_M = 50; // must match MAX_DIST in teacher-actions.ts
const BUCKET = "attendance-photos";

/* ─── Types ─── */
type Phase =
  | "idle"
  | "verifying-location"
  | "outside-range"
  | "camera-denied"
  | "location-denied"
  | "ready"      // camera live, inside range
  | "captured"   // photo taken, awaiting submit
  | "uploading"
  | "success"
  | "already-marked"
  | "error";

interface AlreadyMarkedRecord {
  status: string;
  check_in_at: string | null;
  photo_url: string | null;
}

interface Props {
  alreadyMarked: boolean;
  record?: AlreadyMarkedRecord;
  teacherProfileId: string;
}

/* ─── Base64 → Blob ─── */
function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(",");
  const mime = header.match(/:(.*?);/)![1];
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

/* ─── Phase: Already Marked Card ─── */
function AlreadyMarkedCard({ record }: { record?: AlreadyMarkedRecord }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="surface-card border-hairline rounded-[2rem] p-10 flex flex-col items-center gap-6 text-center shadow-2xl"
    >
      <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner">
        <CheckCircle className="w-12 h-12 text-emerald-400" />
      </div>
      <div>
        <h2 className="font-display text-3xl font-bold text-parchment">Attendance Marked!</h2>
        <p className="text-mist text-sm mt-2 font-mono uppercase tracking-widest max-w-sm">
          Aaj ki attendance successfully register ho gayi hai.
        </p>
      </div>

      <div className="bg-ink border border-hairline rounded-2xl p-6 w-full text-left space-y-4">
        <Row icon={CheckCircle} label="Status" value="Present ✓" color="text-emerald-400" />
        {record?.check_in_at && (
          <Row
            icon={Clock}
            label="Check-in Time"
            value={new Date(record.check_in_at).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            color="text-parchment"
          />
        )}
        <Row
          icon={MapPin}
          label="Date"
          value={new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          color="text-parchment"
        />
      </div>

      {record?.photo_url && (
        <div className="w-full mt-4">
          <p className="text-[10px] font-mono text-mist uppercase tracking-widest mb-3">Captured Photo</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={record.photo_url}
            alt="Attendance photo"
            className="w-40 h-40 rounded-2xl object-cover mx-auto border border-hairline shadow-lg"
          />
        </div>
      )}
    </motion.div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
      <span className="text-[10px] font-mono uppercase tracking-widest text-mist w-28">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function MarkAttendance({ alreadyMarked, record, teacherProfileId }: Props) {
  const webcamRef = useRef<Webcam>(null);

  const [phase, setPhase] = useState<Phase>(alreadyMarked ? "already-marked" : "idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number; distance: number } | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* Auto-start on mount if already marked (skip idle) */
  useEffect(() => {
    if (alreadyMarked) setPhase("already-marked");
  }, [alreadyMarked]);

  /* ── STEP 1: Verify location ── */
  const verifyLocation = useCallback(() => {
    setPhase("verifying-location");
    setErrorMsg("");

    if (!navigator.geolocation) {
      setPhase("error");
      setErrorMsg("Aapka browser Geolocation support nahi karta.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const distance = haversine(lat, lng, SCHOOL.lat, SCHOOL.lng);
        setLocation({ lat, lng, distance });

        if (distance > MAX_DISTANCE_M) {
          setPhase("outside-range");
          setErrorMsg(
            `Aap school premises ke bahar hain (${Math.round(distance)} meter door). Attendance mark nahi ho sakti.`
          );
        } else {
          setPhase("ready");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPhase("location-denied");
          setErrorMsg(
            "Location permission denied. Browser settings mein location allow karein."
          );
        } else {
          setPhase("error");
          setErrorMsg(`Location error: ${err.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  /* ── STEP 2: Capture photo ── */
  const capturePhoto = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) {
      setErrorMsg("Photo capture failed. Camera se dobara koshish karein.");
      return;
    }
    setCapturedImage(screenshot);
    setPhase("captured");
  }, []);

  /* ── STEP 3: Upload + Save ── */
  const submitAttendance = useCallback(async () => {
    if (!capturedImage || !location) return;
    setPhase("uploading");
    setUploadProgress(0);
    setErrorMsg("");

    try {
      /* 3a. Convert and upload photo */
      const blob = dataURLtoBlob(capturedImage);
      const today = new Date().toISOString().split("T")[0];
      const path = `teachers/${teacherProfileId}/${today}.jpg`;

      setUploadProgress(30);

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });

      if (uploadErr) {
        setPhase("error");
        setErrorMsg(`Photo upload failed: ${uploadErr.message}`);
        return;
      }

      setUploadProgress(70);

      /* 3b. Get public URL */
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);

      /* 3c. Call server action to save DB record */
      const result = await markTeacherAttendance({
        lat: location.lat,
        lng: location.lng,
        photoUrl: publicUrl,
        distanceMeters: location.distance,
      });

      setUploadProgress(100);

      if (result.success) {
        setPhase("success");
      } else if (result.alreadyMarked) {
        setPhase("already-marked");
      } else {
        setPhase("error");
        setErrorMsg(result.error ?? "Submission failed.");
      }
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : "Unexpected error.");
    }
  }, [capturedImage, location, teacherProfileId]);

  /* ── RESET ── */
  function reset() {
    setCapturedImage(null);
    setErrorMsg("");
    setLocation(null);
    setPhase("idle");
  }

  /* ──────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-lg mx-auto pb-12">
      <AnimatePresence mode="wait">

        {/* ── ALREADY MARKED ── */}
        {phase === "already-marked" && (
          <motion.div key="already-marked"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AlreadyMarkedCard record={record} />
          </motion.div>
        )}

        {/* ── SUCCESS ── */}
        {phase === "success" && (
          <motion.div key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="surface-card border-hairline rounded-[2rem] p-10 flex flex-col items-center gap-6 text-center shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner"
            >
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </motion.div>
            <div>
              <h2 className="font-display text-3xl font-bold text-parchment">Attendance Marked!</h2>
              <p className="text-mist text-sm mt-2 font-mono uppercase tracking-widest">
                Aapki attendance aaj ke liye register ho gayi hai.
              </p>
            </div>
            {capturedImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={capturedImage} alt="Captured"
                className="w-32 h-32 rounded-2xl object-cover border border-emerald-500/30 shadow-lg" />
            )}
            {location && (
              <div className="input-glass rounded-xl p-4 flex items-center justify-center gap-3 text-xs font-mono tracking-widest uppercase text-emerald-400 w-full">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {Math.round(location.distance)} m from school · Verified ✓
              </div>
            )}
          </motion.div>
        )}

        {/* ── IDLE ── */}
        {phase === "idle" && (
          <motion.div key="idle"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="surface-card border-hairline rounded-[2rem] p-10 flex flex-col gap-8 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center mx-auto mb-6 shadow-inner pulse-glow">
                <Camera className="w-10 h-10 text-veena-blue" />
              </div>
              <h2 className="font-display text-3xl font-bold text-parchment">Mark Attendance</h2>
              <p className="text-mist font-mono uppercase tracking-widest text-xs mt-2">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>

            <div className="bg-ink border border-hairline rounded-2xl p-6 space-y-5">
              <Step n={1} icon={Navigation} label="Location Verify" desc="GPS check (200m radius)" />
              <Step n={2} icon={Camera}    label="Live Photo" desc="Take a clear selfie" />
              <Step n={3} icon={Shield}    label="Secure Save" desc="Encrypted storage" />
            </div>

            <button
              id="start-attendance-btn"
              onClick={verifyLocation}
              className="w-full py-4 rounded-xl bg-veena-blue text-ink font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-[#5C94FF] transition-all shadow-lg"
            >
              <Navigation className="w-5 h-5" />
              Verify Location & Start
            </button>
          </motion.div>
        )}

        {/* ── VERIFYING LOCATION ── */}
        {phase === "verifying-location" && (
          <motion.div key="verifying"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="surface-card border-hairline rounded-[2rem] p-12 flex flex-col items-center gap-8 text-center shadow-2xl"
          >
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-veena-blue/20 animate-ping" />
              <div className="relative w-24 h-24 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center shadow-inner">
                <Navigation className="w-10 h-10 text-veena-blue" />
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-parchment">Verifying Location</h2>
              <p className="text-mist font-mono uppercase tracking-widest text-xs mt-2">Checking GPS signal...</p>
            </div>
            <Loader2 className="w-6 h-6 text-veena-blue animate-spin" />
          </motion.div>
        )}

        {/* ── OUTSIDE RANGE ── */}
        {phase === "outside-range" && (
          <motion.div key="outside"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="surface-card border-hairline rounded-[2rem] p-10 flex flex-col items-center gap-6 text-center shadow-2xl"
          >
            <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-parchment">Geofence Violation</h2>
              <p className="text-red-400 text-sm mt-3 font-mono leading-relaxed max-w-sm mx-auto">
                {errorMsg}
              </p>
            </div>
            {location && (
              <div className="input-glass rounded-xl p-5 text-xs text-mist font-mono tracking-widest uppercase w-full space-y-2">
                <p>Coordinates: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                <p>Distance: <span className="text-red-400 font-bold">{Math.round(location.distance)} m</span> (limit: {MAX_DISTANCE_M} m)</p>
              </div>
            )}
            <button onClick={verifyLocation}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-surface border border-hairline rounded-xl text-sm font-bold uppercase tracking-wider text-parchment hover:border-mist transition-colors">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </motion.div>
        )}

        {/* ── LOCATION / CAMERA DENIED ── */}
        {(phase === "location-denied" || phase === "camera-denied") && (
          <motion.div key="denied"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="surface-card border-hairline rounded-[2rem] p-10 flex flex-col items-center gap-6 text-center shadow-2xl"
          >
            <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <XCircle className="w-12 h-12 text-amber-400" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-parchment">Permission Required</h2>
              <p className="text-amber-400 text-sm font-mono mt-3 leading-relaxed max-w-sm mx-auto">{errorMsg}</p>
            </div>
            <div className="input-glass rounded-xl p-6 text-xs text-mist font-mono uppercase tracking-widest text-left w-full space-y-3">
              <p className="font-bold text-parchment border-b border-hairline pb-2 mb-3">Steps to allow:</p>
              <p>1. Click lock icon in browser address bar</p>
              <p>2. Allow {phase === "location-denied" ? "Location" : "Camera"}</p>
              <p>3. Reload page and try again</p>
            </div>
            <button onClick={verifyLocation}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-surface border border-hairline rounded-xl text-sm font-bold uppercase tracking-wider text-parchment hover:border-mist transition-colors">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </motion.div>
        )}

        {/* ── CAMERA READY ── */}
        {phase === "ready" && (
          <motion.div key="camera"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="surface-card border-hairline rounded-[2rem] overflow-hidden shadow-2xl"
          >
            {/* Location badge */}
            <div className="flex items-center gap-3 px-6 py-4 bg-surface border-b border-hairline">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
                Verified — {location ? `${Math.round(location.distance)} m from school` : ""}
              </span>
            </div>

            {/* Live webcam */}
            <div className="relative bg-black aspect-video">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.92}
                videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                className="w-full h-full object-cover"
                onUserMediaError={() => {
                  setPhase("camera-denied");
                  setErrorMsg(
                    "Camera access denied. Browser settings mein camera allow karein."
                  );
                }}
              />
              {/* Corner brackets overlay */}
              <div className="absolute inset-6 pointer-events-none">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-veena-blue/70 rounded-tl" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-veena-blue/70 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-veena-blue/70 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-veena-blue/70 rounded-br" />
              </div>
              {/* Record dot */}
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-hairline">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] text-white font-bold tracking-widest">LIVE</span>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <p className="text-[10px] font-mono text-mist uppercase tracking-widest text-center">
                Ensure your face is clearly visible.
              </p>
              <button
                id="capture-photo-btn"
                onClick={capturePhoto}
                className="w-full py-4 rounded-xl bg-veena-blue text-ink font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-[#5C94FF] transition-all shadow-lg"
              >
                <Camera className="w-5 h-5" />
                Capture Photo
              </button>
            </div>
          </motion.div>
        )}

        {/* ── PHOTO CAPTURED — PREVIEW ── */}
        {phase === "captured" && capturedImage && (
          <motion.div key="captured"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="surface-card border-hairline rounded-[2rem] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-3 px-6 py-4 bg-surface border-b border-hairline">
              <div className="w-2.5 h-2.5 rounded-full bg-veena-blue" />
              <span className="text-[10px] font-mono text-mist uppercase tracking-widest font-bold">Photo Preview</span>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedImage} alt="Captured"
              className="w-full aspect-video object-cover" />

            <div className="p-8 space-y-6">
              {location && (
                <div className="input-glass rounded-xl p-4 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-mist">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)} ·{" "}
                  <span className="text-emerald-400 font-bold">{Math.round(location.distance)} m</span> from school
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={reset}
                  className="flex-1 py-4 rounded-xl bg-surface border border-hairline text-xs font-bold uppercase tracking-wider text-mist hover:border-mist hover:text-parchment flex items-center justify-center gap-2 transition-all">
                  <RefreshCw className="w-4 h-4" /> Retake
                </button>
                <button
                  id="submit-attendance-btn"
                  onClick={submitAttendance}
                  className="flex-1 py-4 rounded-xl bg-veena-blue text-ink font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#5C94FF] transition-all shadow-lg"
                >
                  <Upload className="w-4 h-4" />
                  Submit Attendance
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── UPLOADING ── */}
        {phase === "uploading" && (
          <motion.div key="uploading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="surface-card border-hairline rounded-[2rem] p-12 flex flex-col items-center gap-8 text-center shadow-2xl"
          >
            <div className="w-24 h-24 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center shadow-inner">
              <Loader2 className="w-10 h-10 text-veena-blue animate-spin" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-parchment">Uploading Data</h2>
              <p className="text-mist font-mono text-[10px] uppercase tracking-widest mt-2">Saving photo & location securely...</p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-ink border border-hairline rounded-full h-3 overflow-hidden p-0.5">
              <motion.div
                className="h-full rounded-full bg-veena-blue"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[10px] font-mono text-mist uppercase tracking-widest">{uploadProgress}% complete</p>
          </motion.div>
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <motion.div key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="surface-card border-hairline rounded-[2rem] p-10 flex flex-col items-center gap-6 text-center shadow-2xl"
          >
            <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-inner">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-parchment">Error Occurred</h2>
              <p className="text-red-400 text-sm font-mono mt-3 max-w-sm mx-auto">{errorMsg}</p>
            </div>
            <button onClick={reset}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-surface border border-hairline rounded-xl text-sm font-bold uppercase tracking-wider text-parchment hover:border-mist transition-colors">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

/* ─── Step helper ─── */
function Step({ n, icon: Icon, label, desc }: {
  n: number; icon: React.ElementType; label: string; desc: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center flex-shrink-0 shadow-inner">
        <Icon className="w-5 h-5 text-veena-blue" />
      </div>
      <div>
        <p className="text-xs font-bold text-parchment uppercase tracking-widest">{n}. {label}</p>
        <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
