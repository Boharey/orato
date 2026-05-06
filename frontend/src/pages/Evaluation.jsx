import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Video, Square, Play, RotateCw, Mic, Eye, Activity, Brain } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// ── Analyzing animation overlay ───────────────────────────────────────────────
const AnalyzingOverlay = () => {
  const steps = [
    { icon: Mic,      label: 'Transcribing speech...' },
    { icon: Activity, label: 'Measuring pace & fillers...' },
    { icon: Eye,      label: 'Analyzing eye contact...' },
    { icon: Brain,    label: 'Computing confidence score...' },
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % steps.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  const Icon = steps[step].icon;

  return (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg z-10 gap-4">
      {/* Pulsing ring */}
      <div className="relative flex items-center justify-center">
        <span className="absolute inline-flex h-16 w-16 rounded-full bg-accent opacity-30 animate-ping" />
        <span className="relative inline-flex rounded-full h-12 w-12 bg-accent/80 items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </span>
      </div>
      <p className="text-white text-sm font-medium tracking-wide animate-pulse">
        {steps[step].label}
      </p>
      {/* Progress dots */}
      <div className="flex gap-2 mt-1">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === step ? 'bg-accent scale-125' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ── Highlighted transcript ─────────────────────────────────────────────────────
const FILLERS = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'so'];

const TranscriptDisplay = ({ transcript, fillerWords }) => {
  if (!transcript) return null;

  // Build per-word highlight
  const words = transcript.split(' ');
  const fillerSet = new Set(
    Object.keys(fillerWords || {}).map(f => f.toLowerCase())
  );
  // Also include default filler list
  FILLERS.forEach(f => fillerSet.add(f));

  return (
    <div className="mt-6 p-4 bg-muted/40 rounded-lg border border-border">
      <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
        Transcript
      </h4>
      <p className="text-sm leading-relaxed">
        {words.map((word, i) => {
          const clean = word.toLowerCase().replace(/[^a-z\s]/g, '');
          const isFiller = fillerSet.has(clean);
          return (
            <span key={i}>
              <span
                className={isFiller
                  ? 'bg-amber-200 text-amber-900 rounded px-0.5 font-medium'
                  : ''}
              >
                {word}
              </span>
              {' '}
            </span>
          );
        })}
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Filler words highlighted in <span className="bg-amber-200 text-amber-900 px-1 rounded">amber</span>
      </p>
    </div>
  );
};

// ── Metric row ────────────────────────────────────────────────────────────────
const MetricRow = ({ label, value, color, testId }) => (
  <div className="flex justify-between items-center pb-3 border-b border-border">
    <span className="text-muted-foreground">{label}</span>
    <span className={`text-2xl font-bold ${color || ''}`} data-testid={testId}>
      {value ?? '—'}
    </span>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const Evaluation = () => {
  const [recording, setRecording]     = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [results, setResults]         = useState(null);
  const [stream, setStream]           = useState(null);

  const videoRef        = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef       = useRef([]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 1,
        },
      });
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play();

      let options = {};
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus'))
        options = { mimeType: 'video/webm;codecs=vp8,opus', audioBitsPerSecond: 128000 };
      else if (MediaRecorder.isTypeSupported('video/webm'))
        options = { mimeType: 'video/webm', audioBitsPerSecond: 128000 };

      const mediaRecorder = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        mediaStream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      };

      mediaRecorder.start();
      setRecording(true);
      toast.success('Recording started');
    } catch (err) {
      console.error(err);
      toast.error('Failed to access camera/microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast.success('Recording stopped');
    }
  };

  const analyzeRecording = async () => {
    if (!recordedBlob) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('video', new File([recordedBlob], 'recording.webm', { type: 'video/webm' }));

      const { data } = await axios.post(`${API_URL}/evaluation/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setResults(data);
      toast.success('Analysis complete!');
    } catch (err) {
      console.error(err);
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setResults(null);
    if (videoRef.current) {
      videoRef.current.src = null;
      videoRef.current.srcObject = null;
    }
  };

  const playRecording = () => {
    if (recordedBlob && videoRef.current) {
      videoRef.current.src = URL.createObjectURL(recordedBlob);
      videoRef.current.play();
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto" data-testid="evaluation-page">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-2">Evaluation</h1>
          <p className="text-muted-foreground">Record yourself speaking and get instant feedback</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Video Section ── */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg overflow-hidden aspect-video relative">
              <video
                ref={videoRef}
                data-testid="evaluation-video"
                className="w-full h-full object-cover bg-black"
                playsInline
              />
              {!recording && !recordedBlob && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Video className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              {recording && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Recording
                </div>
              )}
              {/* Analyzing overlay sits on top of video area */}
              {analyzing && <AnalyzingOverlay />}
            </div>

            <div className="flex gap-3">
              {!recording && !recordedBlob && (
                <Button data-testid="start-recording-btn" onClick={startRecording}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Video className="w-5 h-5 mr-2" /> Start Recording
                </Button>
              )}
              {recording && (
                <Button data-testid="stop-recording-btn" onClick={stopRecording}
                  variant="destructive" className="flex-1">
                  <Square className="w-5 h-5 mr-2" /> Stop Recording
                </Button>
              )}
              {recordedBlob && !results && (
                <>
                  <Button data-testid="play-recording-btn" onClick={playRecording}
                    variant="outline" className="flex-1" disabled={analyzing}>
                    <Play className="w-5 h-5 mr-2" /> Play Recording
                  </Button>
                  <Button data-testid="analyze-btn" onClick={analyzeRecording}
                    disabled={analyzing}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                    {analyzing ? 'Analyzing...' : 'Analyze'}
                  </Button>
                  <Button data-testid="reset-btn" onClick={resetRecording}
                    variant="outline" disabled={analyzing}>
                    <RotateCw className="w-5 h-5" />
                  </Button>
                </>
              )}
              {results && (
                <Button data-testid="new-recording-btn" onClick={resetRecording}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <RotateCw className="w-5 h-5 mr-2" /> New Recording
                </Button>
              )}
            </div>
          </div>

          {/* ── Results Section ── */}
          <div className="space-y-4">
            {results ? (
              <div data-testid="evaluation-results"
                className="bg-card border border-border rounded-lg p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <h3 className="text-xl font-serif font-medium">Analysis Results</h3>

                {/* Speech metrics */}
                <div className="space-y-4">
                  <MetricRow label="Words Per Minute"  value={results.wpm}              testId="result-wpm" />
                  <MetricRow label="Filler Words"      value={results.filler_count}     testId="result-filler-count" />
                  <MetricRow label="Filler Percentage" value={`${results.filler_percentage}%`}
                    color="text-amber-600" testId="result-filler-percentage" />
                  <MetricRow label="Long Pauses"       value={results.long_pauses}      testId="result-long-pauses" />
                  <MetricRow label="Confidence Score"  value={`${results.confidence_score}%`}
                    color="text-primary" testId="result-confidence" />
                </div>

                {/* Video metrics — only shown if backend returned them */}
                {(results.gaze_on_screen_pct != null || results.blink_count != null) && (
                  <div className="pt-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                      Video Analysis
                    </p>
                    <div className="space-y-4">
                      {results.gaze_on_screen_pct != null && (
                        <MetricRow label="Eye Contact"
                          value={`${results.gaze_on_screen_pct}%`}
                          color="text-green-600" testId="result-eye-contact" />
                      )}
                      {results.attention_score != null && (
                        <MetricRow label="Attention Score"
                          value={`${results.attention_score}%`}
                          color="text-blue-600" testId="result-attention" />
                      )}
                      {results.blink_count != null && (
                        <MetricRow label="Blink Count"
                          value={results.blink_count}
                          testId="result-blinks" />
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2 p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Great job! Your speaking skills are improving. Keep practicing to maintain your progress.
                  </p>
                </div>

                {/* Transcript with filler highlights */}
                <TranscriptDisplay
                  transcript={results.transcript}
                  fillerWords={results.filler_words}
                />
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-8 space-y-4 text-center">
                <Video className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-serif font-medium mb-2">No Results Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Record yourself speaking for at least 30 seconds, then click "Analyze" to get instant feedback.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};