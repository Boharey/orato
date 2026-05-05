import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Video, Square, Play, RotateCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const Evaluation = () => {
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
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
        channelCount: 1
      }
    });
    
    setStream(mediaStream);
    videoRef.current.srcObject = mediaStream;
    videoRef.current.play();

    // Check supported mimeType (important for stability)
    let options = {};
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
      options = {
        mimeType: "video/webm;codecs=vp8,opus",
        audioBitsPerSecond: 128000
      };
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      options = {
        mimeType: "video/webm",
        audioBitsPerSecond: 128000
      };
    }

    const mediaRecorder = new MediaRecorder(mediaStream, options);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      
      // Stop all tracks
      mediaStream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    };

    mediaRecorder.start();
    setRecording(true);
    toast.success('Recording started');
  } catch (error) {
    console.error('Error starting recording:', error);
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
    const file = new File([recordedBlob], "recording.webm", {
      type: "video/webm",
    });

    const formData = new FormData();
    formData.append("video", file);

    const response = await axios.post(
      `${API_URL}/evaluation/analyze`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setResults(response.data);
    toast.success("Analysis complete!");
  } catch (error) {
    console.error("Error analyzing recording:", error);
    toast.error("Analysis failed");
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
    const url = URL.createObjectURL(recordedBlob);
    videoRef.current.src = url;
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
          {/* Video Section */}
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
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Recording
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!recording && !recordedBlob && (
                <Button
                  data-testid="start-recording-btn"
                  onClick={startRecording}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              )}

              {recording && (
                <Button
                  data-testid="stop-recording-btn"
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              )}

              {recordedBlob && !results && (
                <>
                  <Button
                    data-testid="play-recording-btn"
                    onClick={playRecording}
                    variant="outline"
                    className="flex-1"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Play Recording
                  </Button>
                  <Button
                    data-testid="analyze-btn"
                    onClick={analyzeRecording}
                    disabled={analyzing}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze'}
                  </Button>
                  <Button
                    data-testid="reset-btn"
                    onClick={resetRecording}
                    variant="outline"
                  >
                    <RotateCw className="w-5 h-5" />
                  </Button>
                </>
              )}

              {results && (
                <Button
                  data-testid="new-recording-btn"
                  onClick={resetRecording}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <RotateCw className="w-5 h-5 mr-2" />
                  New Recording
                </Button>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {results ? (
              <div data-testid="evaluation-results" className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-serif font-medium mb-4">Analysis Results</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-muted-foreground">Words Per Minute</span>
                    <span className="text-2xl font-bold" data-testid="result-wpm">{results.wpm}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-muted-foreground">Filler Words</span>
                    <span className="text-2xl font-bold" data-testid="result-filler-count">{results.filler_count}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-muted-foreground">Filler Percentage</span>
                    <span className="text-2xl font-bold text-amber-600" data-testid="result-filler-percentage">{results.filler_percentage}%</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-muted-foreground">Eye Contact</span>
                    <span className="text-2xl font-bold text-green-600" data-testid="result-eye-contact">{results.eye_contact_percentage}%</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-muted-foreground">Long Pauses</span>
                    <span className="text-2xl font-bold" data-testid="result-long-pauses">{results.long_pauses}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-muted-foreground">Confidence Score</span>
                    <span className="text-2xl font-bold text-primary" data-testid="result-confidence">{results.confidence_score}%</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Great job! Your speaking skills are improving. Keep practicing to maintain your progress.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-8 space-y-4 text-center">
                <Video className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-serif font-medium mb-2">No Results Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Record yourself speaking for at least 30 seconds, then click "Analyze" to get instant feedback on your performance.
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