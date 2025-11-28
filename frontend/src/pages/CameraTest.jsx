import React, { useRef, useState, useEffect } from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';

const CameraTest = () => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('Click "Start Camera" to test');
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    // List available devices
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(deviceList => {
          const cameras = deviceList.filter(d => d.kind === 'videoinput');
          const mics = deviceList.filter(d => d.kind === 'audioinput');
          setDevices({ cameras, mics });
          console.log('Available cameras:', cameras);
          console.log('Available microphones:', mics);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setStatus('Requesting camera access...');
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      console.log('Stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      console.log('Audio tracks:', mediaStream.getAudioTracks());

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setStatus('✅ Camera is working!');
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(err.message);
      setStatus('❌ Failed to start camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStatus('Camera stopped');
    }
  };

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Header>
          <h4>🎥 Camera & Microphone Test</h4>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <strong>Status:</strong> {status}
          </Alert>

          {error && (
            <Alert variant="danger">
              <strong>Error:</strong> {error}
            </Alert>
          )}

          {devices.cameras && (
            <Alert variant="secondary">
              <strong>Cameras found:</strong> {devices.cameras?.length || 0}<br/>
              <strong>Microphones found:</strong> {devices.mics?.length || 0}
            </Alert>
          )}

          <div className="bg-dark p-3 mb-3" style={{ minHeight: '400px' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
              onLoadedMetadata={(e) => {
                console.log('Video loaded:', e.target.videoWidth, 'x', e.target.videoHeight);
              }}
              onPlaying={() => {
                console.log('Video is playing');
              }}
              onError={(e) => {
                console.error('Video error:', e);
              }}
            />
          </div>

          <div className="d-flex gap-2">
            <Button variant="primary" onClick={startCamera} disabled={!!stream}>
              Start Camera
            </Button>
            <Button variant="danger" onClick={stopCamera} disabled={!stream}>
              Stop Camera
            </Button>
          </div>

          <Alert variant="warning" className="mt-3">
            <strong>Troubleshooting:</strong>
            <ul className="mb-0 mt-2">
              <li>Allow camera/microphone permissions when prompted</li>
              <li>Check browser console (F12) for detailed logs</li>
              <li>Make sure no other app is using your camera</li>
              <li>Try in Chrome, Firefox, or Edge</li>
            </ul>
          </Alert>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CameraTest;
