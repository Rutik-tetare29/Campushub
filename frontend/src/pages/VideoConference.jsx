import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import SimplePeer from 'simple-peer';
import { toast } from 'react-toastify';
import { SocketContext } from '../App';

const VideoConference = ({ roomId, roomName }) => {
  const [peers, setPeers] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  const userVideo = useRef();
  const peersRef = useRef([]);
  const socket = React.useContext(SocketContext);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // Get user media (camera and microphone)
    const initializeMedia = async () => {
      try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support camera/microphone access');
        }

        // Request permissions with detailed constraints
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        console.log('✅ Media stream acquired:', stream.getTracks());
        setLocalStream(stream);
        
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
          // Ensure video plays
          try {
            await userVideo.current.play();
          } catch (playError) {
            console.warn('Autoplay prevented, user interaction may be needed:', playError);
          }
        }

        // Join room via socket
        socket.emit('join-room', {
          roomId,
          userId: user._id || user.id,
          userName: user.name
        });

        // Handle existing participants
        socket.on('room-participants', (existingParticipants) => {
          setParticipants(existingParticipants);
          const peers = [];

          existingParticipants.forEach(participant => {
            const peer = createPeer(participant.socketId, socket.id, stream);
            peersRef.current.push({
              peerID: participant.socketId,
              peer,
              userId: participant.userId,
              userName: participant.userName
            });
            peers.push({
              peerID: participant.socketId,
              peer,
              userId: participant.userId,
              userName: participant.userName
            });
          });

          setPeers(peers);
        });

        // Handle new user joining
        socket.on('user-connected', (data) => {
          toast.info(`${data.userName} joined the call`);
          setParticipants(prev => [...prev, data]);
        });

        // Handle receiving call
        socket.on('signal', ({ from, signal, type }) => {
          if (type === 'offer') {
            const peer = addPeer(signal, from, stream);
            peersRef.current.push({
              peerID: from,
              peer
            });
            setPeers(users => [...users, { peerID: from, peer }]);
          } else if (type === 'answer') {
            const item = peersRef.current.find(p => p.peerID === from);
            if (item) {
              item.peer.signal(signal);
            }
          }
        });

        // Handle user disconnect
        socket.on('user-disconnected', (userId) => {
          const participant = participants.find(p => p.userId === userId);
          if (participant) {
            toast.info(`${participant.userName} left the call`);
          }
          
          const peerObj = peersRef.current.find(p => p.userId === userId);
          if (peerObj) {
            peerObj.peer.destroy();
          }

          peersRef.current = peersRef.current.filter(p => p.userId !== userId);
          setPeers(peersRef.current);
          setParticipants(prev => prev.filter(p => p.userId !== userId));
        });

        // Handle participant count
        socket.on('participant-count', (count) => {
          console.log(`Total participants: ${count}`);
        });

        // Handle media toggle
        socket.on('participant-media-toggle', ({ userId, type, enabled }) => {
          setParticipants(prev => prev.map(p => 
            p.userId === userId 
              ? { ...p, [`${type}Enabled`]: enabled }
              : p
          ));
        });

        // Handle chat messages
        socket.on('video-chat-message', (data) => {
          setChatMessages(prev => [...prev, data]);
        });
      } catch (err) {
        console.error('Failed to get user media:', err);
        
        let errorMessage = 'Failed to access camera/microphone';
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera/microphone permission denied. Please allow access in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera or microphone found. Please connect a device and try again.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Camera/microphone is already in use by another application.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera/microphone constraints cannot be satisfied.';
        } else if (err.name === 'TypeError') {
          errorMessage = 'Your browser does not support camera/microphone access. Try Chrome, Firefox, or Edge.';
        }
        
        toast.error(errorMessage, { autoClose: 5000 });
        
        // Try with lower constraints as fallback
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 }, 
            audio: true 
          });
          
          console.log('✅ Fallback media stream acquired');
          setLocalStream(fallbackStream);
          
          if (userVideo.current) {
            userVideo.current.srcObject = fallbackStream;
            await userVideo.current.play();
          }
          
          socket.emit('join-room', {
            roomId,
            userId: user._id || user.id,
            userName: user.name
          });
          
          toast.info('Connected with reduced quality');
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
        }
      }
    };
    
    initializeMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      socket.emit('leave-room', { roomId, userId: user._id || user.id });
      socket.off('room-participants');
      socket.off('user-connected');
      socket.off('signal');
      socket.off('user-disconnected');
      socket.off('participant-count');
      socket.off('participant-media-toggle');
      socket.off('video-chat-message');
    };
  }, []);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('signal', {
        to: userToSignal,
        signal,
        type: 'offer'
      });
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('signal', {
        to: callerID,
        signal,
        type: 'answer'
      });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
      
      socket.emit('toggle-media', {
        roomId,
        userId: user._id || user.id,
        type: 'audio',
        enabled: audioTrack.enabled
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
      
      socket.emit('toggle-media', {
        roomId,
        userId: user._id || user.id,
        type: 'video',
        enabled: videoTrack.enabled
      });
    }
  };

  const shareScreen = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });

        const videoTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track in all peer connections
        peersRef.current.forEach(({ peer }) => {
          const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Update local video
        if (userVideo.current) {
          userVideo.current.srcObject = screenStream;
        }

        videoTrack.onended = () => {
          stopScreenShare();
        };

        setScreenSharing(true);
        socket.emit('start-screen-share', { roomId, userId: user._id || user.id });
      } catch (err) {
        console.error('Error sharing screen:', err);
        toast.error('Failed to share screen');
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      
      // Replace screen track with camera track
      peersRef.current.forEach(({ peer }) => {
        const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Update local video
      if (userVideo.current) {
        userVideo.current.srcObject = localStream;
      }

      setScreenSharing(false);
      socket.emit('stop-screen-share', { roomId, userId: user._id || user.id });
    }
  };

  const sendMessage = () => {
    if (messageInput.trim()) {
      socket.emit('video-chat-message', {
        roomId,
        userId: user._id || user.id,
        userName: user.name,
        message: messageInput.trim()
      });
      setMessageInput('');
    }
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col lg={9}>
          <Card className="shadow-sm mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">🎥 {roomName || 'Video Conference'}</h5>
              <Badge bg="success">{participants.length + 1} Participants</Badge>
            </Card.Header>
            <Card.Body className="bg-dark p-0" style={{ minHeight: '500px' }}>
              <div className="video-grid">
                {/* Local video */}
                <div className="video-container position-relative">
                  <video
                    ref={userVideo}
                    autoPlay
                    muted
                    playsInline
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    onLoadedMetadata={(e) => {
                      console.log('Video metadata loaded');
                      e.target.play().catch(err => console.warn('Play failed:', err));
                    }}
                  />
                  <div className="position-absolute bottom-0 start-0 p-2 bg-dark bg-opacity-75 text-white">
                    <small>{user.name} (You)</small>
                  </div>
                  {!videoEnabled && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                      <i className="bi bi-camera-video-off text-white" style={{ fontSize: '3rem' }}></i>
                    </div>
                  )}
                </div>

                {/* Remote videos */}
                {peers.map((peerData, index) => (
                  <VideoPlayer key={index} peer={peerData.peer} userName={peerData.userName} />
                ))}
              </div>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-center gap-3 py-3">
              <Button
                variant={audioEnabled ? 'primary' : 'danger'}
                onClick={toggleAudio}
              >
                <i className={`bi bi-mic${audioEnabled ? '' : '-mute'}-fill`}></i>
              </Button>
              <Button
                variant={videoEnabled ? 'primary' : 'danger'}
                onClick={toggleVideo}
              >
                <i className={`bi bi-camera-video${videoEnabled ? '' : '-off'}-fill`}></i>
              </Button>
              <Button
                variant={screenSharing ? 'warning' : 'secondary'}
                onClick={shareScreen}
              >
                <i className="bi bi-display"></i>
              </Button>
              <Button variant="danger" onClick={() => window.history.back()}>
                <i className="bi bi-telephone-x-fill"></i> Leave
              </Button>
            </Card.Footer>
          </Card>
        </Col>

        <Col lg={3}>
          <Card className="shadow-sm" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Card.Header>
              <h6 className="mb-0">💬 Chat</h6>
            </Card.Header>
            <Card.Body style={{ flex: 1, overflowY: 'auto' }}>
              {chatMessages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <small className="text-muted">{msg.userName}:</small>
                  <p className="mb-0">{msg.message}</p>
                </div>
              ))}
            </Card.Body>
            <Card.Footer>
              <Form.Group className="d-flex gap-2">
                <Form.Control
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>Send</Button>
              </Form.Group>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

const VideoPlayer = ({ peer, userName }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <div className="video-container position-relative">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-100 h-100"
        style={{ objectFit: 'cover' }}
      />
      <div className="position-absolute bottom-0 start-0 p-2 bg-dark bg-opacity-75 text-white">
        <small>{userName}</small>
      </div>
    </div>
  );
};

export default VideoConference;
