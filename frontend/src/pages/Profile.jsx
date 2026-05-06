import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Video, Square, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const CALIBRATION_STEPS = [
  { time: 0,  text: "Get ready — look directly at the camera" },
  { time: 3,  text: "Keep looking straight ahead, stay still" },
  { time: 7,  text: "Almost there — hold your gaze steady" },
  { time: 12, text: "Last few seconds..." },
];

export const Profile = () => {
  const { user } = useAuth();

  // Calibration state
  const [calibStatus, setCalibStatus]   = useState(null); // null | {calibrated, calibration}
  const [calibRecording, setCalibRecording] = useState(false);
  const [calibBlob, setCalibBlob]       = useState(null);
  const [calibUploading, setCalibUploading] = useState(false);
  const [countdown, setCountdown]       = useState(null);
  const [instruction, setInstruction]   = useState('');
  const [calibProgress, setCalibProgress] = useState(0); // 0-100

  const videoRef         = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);
  const timerRef         = useRef(null);

  useEffect(() => {
    fetchCalibStatus();
    return () => {
      clearAllTimers();
      stopStream();
    };
  }, []);

  const fetchCalibStatus = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/calibration/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCalibStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const TOTAL_DURATION = 17; // 2s discard + 15s calib

  const startCalibration = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      let options = {};
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8'))
        options = { mimeType: 'video/webm;codecs=vp8' };
      else if (MediaRecorder.isTypeSupported('video/webm'))
        options = { mimeType: 'video/webm' };

      const mr = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setCalibBlob(blob);
        stopStream();
        if (videoRef.current) videoRef.current.srcObject = null;
      };

      mr.start();
      setCalibRecording(true);
      setCalibBlob(null);

      // ── Instruction + progress timer ─────────────────────────────────────
      let elapsed = 0;
      setInstruction(CALIBRATION_STEPS[0].text);
      setCalibProgress(0);
      setCountdown(TOTAL_DURATION);

      timerRef.current = setInterval(() => {
        elapsed += 1;
        setCountdown(TOTAL_DURATION - elapsed);
        setCalibProgress(Math.round((elapsed / TOTAL_DURATION) * 100));

        // Update instruction text
        const step = [...CALIBRATION_STEPS].reverse().find(s => elapsed >= s.time);
        if (step) setInstruction(step.text);

        if (elapsed >= TOTAL_DURATION) {
          clearInterval(timerRef.current);
          stopCalibrationRecording();
        }
      }, 1000);

    } catch (err) {
      toast.error('Cannot access camera');
      console.error(err);
    }
  };

  const stopCalibrationRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setCalibRecording(false);
    clearAllTimers();
    setCountdown(null);
    setInstruction('');
  };

  const uploadCalibration = async () => {
    if (!calibBlob) return;
    setCalibUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', new File([calibBlob], 'calibration.webm', { type: 'video/webm' }));
      const { data } = await axios.post(`${API_URL}/calibration/run`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (data.success) {
        toast.success(data.message);
        setCalibBlob(null);
        setCalibProgress(0);
        fetchCalibStatus();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Calibration upload failed');
    } finally {
      setCalibUploading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account and eye tracking calibration</p>
        </div>

        {/* User info */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-serif font-medium mb-4">Account</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Eye Tracking Calibration */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-serif font-medium">Eye Tracking Calibration</h2>
          </div>

          {/* Status badge */}
          <div className="mb-4">
            {calibStatus?.calibrated ? (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Calibrated — your personal gaze baseline is saved
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Not calibrated — using generic baseline for gaze analysis
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Calibration records your natural neutral gaze position. This makes eye contact
            detection significantly more accurate for your evaluations.
            The process takes about 17 seconds — just look straight at the camera.
          </p>

          {/* Video preview */}
          <div className="bg-black rounded-lg overflow-hidden aspect-video mb-4 relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {!calibRecording && !calibBlob && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Eye className="w-12 h-12 text-white/30" />
              </div>
            )}

            {/* Recording overlay */}
            {calibRecording && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-4 px-8">
                {/* Countdown ring */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke="#4ade80" strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - calibProgress / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                    />
                  </svg>
                  <span className="text-white text-2xl font-bold">{countdown}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div
                    className="bg-green-400 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${calibProgress}%` }}
                  />
                </div>

                <p className="text-white text-center text-sm font-medium">{instruction}</p>

                {/* Phase indicator */}
                <p className="text-white/50 text-xs">
                  {countdown > TOTAL_DURATION - 2
                    ? 'Settling...'
                    : 'Recording calibration data'}
                </p>
              </div>
            )}

            {/* Done state */}
            {calibBlob && !calibRecording && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-white text-sm">Recording complete</p>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {!calibRecording && !calibBlob && (
              <Button
                onClick={startCalibration}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Video className="w-4 h-4 mr-2" />
                {calibStatus?.calibrated ? 'Recalibrate' : 'Start Calibration'}
              </Button>
            )}

            {calibRecording && (
              <Button onClick={stopCalibrationRecording} variant="destructive" className="flex-1">
                <Square className="w-4 h-4 mr-2" /> Stop Early
              </Button>
            )}

            {calibBlob && !calibRecording && (
              <>
                <Button
                  onClick={uploadCalibration}
                  disabled={calibUploading}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {calibUploading ? 'Saving...' : 'Save Calibration'}
                </Button>
                <Button
                  onClick={() => { setCalibBlob(null); setCalibProgress(0); }}
                  variant="outline"
                  disabled={calibUploading}
                >
                  Redo
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};