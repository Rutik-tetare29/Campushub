import React, { useState, useEffect, useRef, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Modal, Dropdown } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import SimplePeer from 'simple-peer';
import { toast } from 'react-toastify';
import { SocketContext } from '../App';
import API from '../api';

const ChatRoomDetail = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const user = JSON.parse(localStorage.getItem('user'));

  // Chat state
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Live stream state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [streamHost, setStreamHost] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [showStreamSettings, setShowStreamSettings] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [reactions, setReactions] = useState([]);

  // Refs
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const messagesEndRef = useRef();
  const peersRef = useRef({});

  // Fetch room details
  useEffect(() => {
    fetchRoom();
    fetchMessages();
  }, [roomId]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !roomId) return;

    // Join chat room
    socket.emit('join-chat-room', { roomId, userId: user.id || user._id, userName: user.name });

    // Chat events
    socket.on('chat-message', handleNewMessage);
    socket.on('room-users', setOnlineUsers);
    socket.on('user-joined-room', handleUserJoined);
    socket.on('user-left-room', handleUserLeft);

    // Live stream events
    socket.on('stream-started', handleStreamStarted);
    socket.on('stream-ended', handleStreamEnded);
    socket.on('stream-signal', handleStreamSignal);
    socket.on('viewer-joined', handleViewerJoined);
    socket.on('viewer-left', handleViewerLeft);
    socket.on('stream-reaction', handleStreamReaction);

    return () => {
      socket.emit('leave-chat-room', { roomId, userId: user.id || user._id });
      socket.off('chat-message');
      socket.off('room-users');
      socket.off('user-joined-room');
      socket.off('user-left-room');
      socket.off('stream-started');
      socket.off('stream-ended');
      socket.off('stream-signal');
      socket.off('viewer-joined');
      socket.off('viewer-left');
      socket.off('stream-reaction');
      
      stopStream();
      stopWatching();
    };
  }, [socket, roomId]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRoom = async () => {
    try {
      const { data } = await API.get(`/chatrooms/${roomId}`);
      setRoom(data);
    } catch (error) {
      toast.error('Failed to load room');
      navigate('/chatrooms');
    }
  };

  const fetchMessages = async () => {
    try {
      const { data } = await API.get(`/chatrooms/${roomId}/messages`);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleUserJoined = (data) => {
    toast.info(`${data.userName} joined the room`);
  };

  const handleUserLeft = (data) => {
    toast.info(`${data.userName} left the room`);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim()) return;

    try {
      await API.post(`/chatrooms/${roomId}/messages`, {
        message: messageInput.trim()
      });
      setMessageInput('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  // ============ LIVE STREAMING FUNCTIONS ============

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Notify server
      socket.emit('start-stream', {
        roomId,
        userId: user.id || user._id,
        userName: user.name,
        streamTitle: streamTitle || `${user.name}'s Live Stream`
      });

      setIsStreaming(true);
      setStreamHost({ userId: user.id || user._id, userName: user.name });
      toast.success('Live stream started!');
      setShowStreamSettings(false);
    } catch (error) {
      console.error('Failed to start stream:', error);
      toast.error('Failed to access camera/microphone');
    }
  };

  const stopStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Close all peer connections
    Object.values(peersRef.current).forEach(peer => {
      peer.destroy();
    });
    peersRef.current = {};

    socket.emit('end-stream', { roomId, userId: user.id || user._id });

    setIsStreaming(false);
    setStreamHost(null);
    setViewers([]);
    setScreenSharing(false);
    toast.info('Stream ended');
  };

  const handleStreamStarted = (data) => {
    console.log('Stream started:', data);
    setStreamHost(data);
    setIsWatching(false);
    toast.info(`${data.userName} started a live stream!`);
  };

  const handleStreamEnded = () => {
    stopWatching();
    setStreamHost(null);
    toast.info('Stream has ended');
  };

  const watchStream = async () => {
    try {
      // Request to join as viewer
      socket.emit('join-stream', {
        roomId,
        userId: user.id || user._id,
        userName: user.name
      });

      setIsWatching(true);
      
      // Establish peer connection immediately
      connectToStream();
    } catch (error) {
      console.error('Failed to watch stream:', error);
      toast.error('Failed to connect to stream');
    }
  };

  const stopWatching = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    socket.emit('leave-stream', { roomId, userId: user.id || user._id });
    setIsWatching(false);
    setRemoteStream(null);
  };

  const handleStreamSignal = ({ from, signal, type, userName }) => {
    console.log('Received stream signal:', { type, from, isStreaming, isWatching });
    
    if (isStreaming) {
      // Host receives viewer signals
      if (type === 'viewer-offer') {
        console.log('Host creating peer for viewer:', from);
        const peer = new SimplePeer({
          initiator: false,
          trickle: false,
          stream: localStream
        });

        peer.on('signal', answerSignal => {
          console.log('Host sending answer signal to viewer');
          socket.emit('stream-signal', {
            to: from,
            signal: answerSignal,
            type: 'host-answer',
            roomId,
            fromUserId: user.id || user._id,
            userName: user.name
          });
        });

        peer.on('error', err => {
          console.error('Host peer error:', err);
        });

        try {
          peer.signal(signal);
          peersRef.current[from] = peer;
          console.log('Peer connection established for viewer:', from);
        } catch (error) {
          console.error('Error signaling peer:', error);
        }
      }
    } else if (isWatching) {
      // Viewer receives host answer
      if (type === 'host-answer' && peerRef.current) {
        console.log('Viewer receiving host answer');
        try {
          peerRef.current.signal(signal);
        } catch (error) {
          console.error('Error processing host answer:', error);
        }
      }
    }
  };

  const handleViewerJoined = (data) => {
    if (isStreaming) {
      setViewers(prev => [...prev, data]);
      toast.info(`${data.userName} joined the stream`);
    }
  };

  const connectToStream = () => {
    console.log('Connecting to stream from host:', streamHost);
    
    const peer = new SimplePeer({
      initiator: true,
      trickle: false
    });

    peer.on('signal', signal => {
      console.log('Sending viewer offer signal to host socket:', streamHost.hostSocketId);
      socket.emit('stream-signal', {
        to: streamHost.hostSocketId,
        signal,
        type: 'viewer-offer',
        roomId,
        fromUserId: user.id || user._id,
        userName: user.name
      });
    });

    peer.on('stream', stream => {
      console.log('Received stream from host!');
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      toast.success('Connected to stream!');
    });

    peer.on('error', err => {
      console.error('Peer connection error:', err);
      toast.error('Connection error: ' + err.message);
    });

    peerRef.current = peer;
  };

  const handleViewerLeft = (data) => {
    if (isStreaming) {
      setViewers(prev => prev.filter(v => v.userId !== data.userId));
      
      if (peersRef.current[data.userId]) {
        peersRef.current[data.userId].destroy();
        delete peersRef.current[data.userId];
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const shareScreen = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: false
        });

        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track for all viewers
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer._pc?.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setScreenSharing(true);
        toast.success('Screen sharing started');
      } catch (error) {
        console.error('Screen share error:', error);
        toast.error('Failed to share screen');
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];

      Object.values(peersRef.current).forEach(peer => {
        const sender = peer._pc?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      setScreenSharing(false);
      toast.info('Screen sharing stopped');
    }
  };

  const sendReaction = (emoji) => {
    socket.emit('stream-reaction', {
      roomId,
      userId: user.id || user._id,
      userName: user.name,
      emoji
    });
  };

  const handleStreamReaction = (data) => {
    setReactions(prev => [...prev, { ...data, id: Date.now() }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== data.id));
    }, 3000);
  };

  if (!room) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  const canStartStream = user.role === 'teacher' || user.role === 'admin' || room.createdBy === user.id;
  const isHosting = isStreaming && streamHost?.userId === (user.id || user._id);

  return (
    <Container fluid className="py-4">
      <Row>
        {/* Main Content */}
        <Col lg={streamHost ? 8 : 12}>
          <Card className="shadow-sm mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  💬 {room.name}
                  <Badge bg="secondary" className="ms-2">{onlineUsers.length} online</Badge>
                  {streamHost && (
                    <Badge bg="danger" className="ms-2 blink">
                      🔴 LIVE
                    </Badge>
                  )}
                </h5>
                <small className="text-muted">{room.description}</small>
              </div>
              <div className="d-flex gap-2">
                {!streamHost && canStartStream && !isStreaming && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowStreamSettings(true)}
                  >
                    <i className="bi bi-broadcast"></i> Go Live
                  </Button>
                )}
                {isHosting && (
                  <Badge bg="success" className="p-2">
                    {viewers.length} viewers
                  </Badge>
                )}
                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/chatrooms')}>
                  <i className="bi bi-arrow-left"></i> Back
                </Button>
              </div>
            </Card.Header>

            {/* Live Stream Section */}
            {streamHost && (
              <Card.Body className="p-0 bg-dark position-relative" style={{ minHeight: '400px' }}>
                {isHosting ? (
                  <>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-100"
                      style={{ maxHeight: '500px', objectFit: 'contain' }}
                    />
                    <div className="position-absolute bottom-0 start-0 end-0 p-3 bg-gradient">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2">
                          <Button
                            variant={audioEnabled ? 'light' : 'danger'}
                            size="sm"
                            onClick={toggleAudio}
                          >
                            <i className={`bi bi-mic${audioEnabled ? '' : '-mute'}-fill`}></i>
                          </Button>
                          <Button
                            variant={videoEnabled ? 'light' : 'danger'}
                            size="sm"
                            onClick={toggleVideo}
                          >
                            <i className={`bi bi-camera-video${videoEnabled ? '' : '-off'}-fill`}></i>
                          </Button>
                          <Button
                            variant={screenSharing ? 'warning' : 'light'}
                            size="sm"
                            onClick={shareScreen}
                          >
                            <i className="bi bi-display"></i>
                            {screenSharing && ' Stop'}
                          </Button>
                        </div>
                        <Button variant="danger" size="sm" onClick={stopStream}>
                          <i className="bi bi-stop-circle-fill"></i> End Stream
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {isWatching ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-100"
                        style={{ maxHeight: '500px', objectFit: 'contain' }}
                      />
                    ) : (
                      <div className="text-center text-white py-5">
                        <div style={{ fontSize: '4rem' }} className="mb-3">🎥</div>
                        <h4>{streamHost.userName} is live!</h4>
                        <p className="text-muted">{streamTitle}</p>
                        <Button variant="primary" onClick={watchStream}>
                          <i className="bi bi-play-circle-fill me-2"></i>
                          Watch Stream
                        </Button>
                      </div>
                    )}
                    {isWatching && (
                      <div className="position-absolute bottom-0 start-0 end-0 p-3 bg-gradient">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex gap-2">
                            {['👍', '❤️', '😂', '😮', '👏', '🔥'].map(emoji => (
                              <Button
                                key={emoji}
                                variant="light"
                                size="sm"
                                onClick={() => sendReaction(emoji)}
                                style={{ fontSize: '1.2rem' }}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                          <Button variant="danger" size="sm" onClick={stopWatching}>
                            <i className="bi bi-x-circle-fill"></i> Leave Stream
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Floating Reactions */}
                <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 10 }}>
                  {reactions.map(reaction => (
                    <div
                      key={reaction.id}
                      className="reaction-float"
                      style={{ fontSize: '2rem', animation: 'float-up 3s ease-out' }}
                    >
                      {reaction.emoji}
                    </div>
                  ))}
                </div>
              </Card.Body>
            )}

            {/* Chat Messages */}
            <Card.Body style={{ height: streamHost ? '300px' : '500px', overflowY: 'auto' }}>
              <ListGroup variant="flush">
                {messages.map((msg) => (
                  <ListGroup.Item key={msg._id} className="border-0 px-0">
                    <div className="d-flex align-items-start gap-2">
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px', fontSize: '0.8rem', flexShrink: 0 }}
                      >
                        {msg.sender?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong>{msg.sender?.name}</strong>
                          <Badge bg={msg.sender?.role === 'teacher' ? 'success' : msg.sender?.role === 'admin' ? 'danger' : 'secondary'} pill>
                            {msg.sender?.role}
                          </Badge>
                          <small className="text-muted">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </small>
                        </div>
                        <p className="mb-0">{msg.message || msg.content}</p>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
                <div ref={messagesEndRef} />
              </ListGroup>
            </Card.Body>

            {/* Message Input */}
            <Card.Footer>
              <Form onSubmit={sendMessage}>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <Button type="submit" variant="primary">
                    <i className="bi bi-send-fill"></i>
                  </Button>
                </div>
              </Form>
            </Card.Footer>
          </Card>
        </Col>

        {/* Sidebar */}
        {streamHost && (
          <Col lg={4}>
            {/* Stream Info */}
            {isHosting && (
              <Card className="shadow-sm mb-3">
                <Card.Header>
                  <h6 className="mb-0">🎥 Stream Info</h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <small className="text-muted">Viewers</small>
                    <h4 className="mb-0">{viewers.length}</h4>
                  </div>
                  <ListGroup variant="flush" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {viewers.map(viewer => (
                      <ListGroup.Item key={viewer.userId} className="px-0 py-2">
                        <small>{viewer.userName}</small>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            )}

            {/* Online Users */}
            <Card className="shadow-sm">
              <Card.Header>
                <h6 className="mb-0">👥 Online ({onlineUsers.length})</h6>
              </Card.Header>
              <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <ListGroup variant="flush">
                  {onlineUsers.map(usr => (
                    <ListGroup.Item key={usr.userId} className="px-0 py-2 d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle bg-success"
                        style={{ width: '8px', height: '8px' }}
                      ></div>
                      <small>{usr.userName}</small>
                      {usr.userId === streamHost?.userId && (
                        <Badge bg="danger" pill>LIVE</Badge>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Stream Settings Modal */}
      <Modal show={showStreamSettings} onHide={() => setShowStreamSettings(false)}>
        <Modal.Header closeButton>
          <Modal.Title>🎥 Start Live Stream</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Stream Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter stream title..."
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
            />
          </Form.Group>
          <div className="alert alert-info mb-0">
            <small>
              <i className="bi bi-info-circle me-2"></i>
              Make sure your camera and microphone are connected and allowed.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStreamSettings(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={startStream}>
            <i className="bi bi-broadcast me-2"></i>
            Go Live
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .blink {
          animation: blink-animation 1.5s ease-in-out infinite;
        }

        @keyframes blink-animation {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(1.5);
            opacity: 0;
          }
        }

        .bg-gradient {
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        }

        .reaction-float {
          animation: float-up 3s ease-out forwards;
        }
      `}</style>
    </Container>
  );
};

export default ChatRoomDetail;
