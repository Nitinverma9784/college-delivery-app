"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  isCallIncoming: boolean;
  isCallOutgoing: boolean;
  peerConnection: RTCPeerConnection | null;
  channel: RealtimeChannel | null;
}

export function useWebRTC(roomId: string, userId: string, otherUserId: string) {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isCallActive: false,
    isCallIncoming: false,
    isCallOutgoing: false,
    peerConnection: null,
    channel: null,
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initialize peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setState((prev) => ({ ...prev, remoteStream: event.streams[0] }));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "ice-candidate",
        payload: {
          candidate: event.candidate?.toJSON(),
          from: userId,
          to: otherUserId,
        },
      });
      }
    };

    peerConnectionRef.current = pc;
    setState((prev) => ({ ...prev, peerConnection: pc }));
    return pc;
  }, [userId, otherUserId]);

  // End call helper
  const endCall = useCallback(() => {
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "call-end",
        payload: { from: userId, to: otherUserId },
      });
    }
    setState((prev) => ({
      ...prev,
      localStream: null,
      remoteStream: null,
      isCallActive: false,
      isCallIncoming: false,
      isCallOutgoing: false,
      peerConnection: null,
    }));
  }, [state.localStream, userId, otherUserId]);

  // Setup signaling channel
  useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();
    const channel = supabase.channel(`webrtc:${roomId}`);

    const handleOffer = async (payload: any) => {
      const data = payload.payload || payload;
      if (data.from === otherUserId && data.offer && !peerConnectionRef.current) {
        const stream = await startLocalStream();
        if (!stream) return;

        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        setState((prev) => ({ ...prev, isCallIncoming: true }));
      }
    };

    const handleAnswer = async (payload: any) => {
      const data = payload.payload || payload;
      if (data.from === otherUserId && peerConnectionRef.current && data.answer) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        setState((prev) => ({
          ...prev,
          isCallOutgoing: false,
          isCallActive: true,
        }));
      }
    };

    const handleIceCandidate = async (payload: any) => {
      const data = payload.payload || payload;
      if (
        data.from === otherUserId &&
        peerConnectionRef.current &&
        data.candidate
      ) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    };

    const handleCallEnd = () => {
      endCall();
    };

    channel
      .on("broadcast", { event: "call-offer" }, handleOffer)
      .on("broadcast", { event: "call-answer" }, handleAnswer)
      .on("broadcast", { event: "ice-candidate" }, handleIceCandidate)
      .on("broadcast", { event: "call-end" }, handleCallEnd)
      .subscribe();

    channelRef.current = channel;
    setState((prev) => ({ ...prev, channel }));

    return () => {
      channel.unsubscribe();
      endCall();
    };
  }, [roomId, otherUserId, endCall]);

  // Get user media
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setState((prev) => ({ ...prev, localStream: stream }));
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      return null;
    }
  }, []);

  // Start call (initiator)
  const startCall = useCallback(async () => {
    const stream = await startLocalStream();
    if (!stream || !channelRef.current) return;

    const pc = createPeerConnection();
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      channelRef.current.send({
        type: "broadcast",
        event: "call-offer",
        payload: {
          offer: offer.toJSON(),
          from: userId,
          to: otherUserId,
        },
      });

      setState((prev) => ({
        ...prev,
        isCallOutgoing: true,
        isCallActive: false,
      }));
    } catch (error) {
      console.error("Error starting call:", error);
    }
  }, [startLocalStream, createPeerConnection, userId, otherUserId]);

  // Answer call (receiver)
  const answerCall = useCallback(async () => {
    const stream = await startLocalStream();
    if (!stream || !channelRef.current || !peerConnectionRef.current) return;

    const pc = peerConnectionRef.current;
    stream.getTracks().forEach((track) => {
      if (!pc.getSenders().some((sender) => sender.track === track)) {
        pc.addTrack(track, stream);
      }
    });

    try {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      channelRef.current.send({
        type: "broadcast",
        event: "call-answer",
        payload: {
          answer: answer.toJSON(),
          from: userId,
          to: otherUserId,
        },
      });

      setState((prev) => ({
        ...prev,
        isCallIncoming: false,
        isCallActive: true,
      }));
    } catch (error) {
      console.error("Error answering call:", error);
    }
  }, [startLocalStream, userId, otherUserId]);


  return {
    ...state,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    endCall,
  };
}

