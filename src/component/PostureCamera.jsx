import { useEffect, useRef, useState } from "react";
import "./PostureCamera.css";

export default function PostureCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const lastSpokenRef = useRef(0);

  const [status, setStatus] = useState("Initializing...");
  const [score, setScore] = useState(100);
  const [streak, setStreak] = useState(0);
  const [goodFrames, setGoodFrames] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [insight, setInsight] = useState("Warming up sensors…");

  const streakRef = useRef(0);
  const goodRef = useRef(0);
  const totalRef = useRef(0);

  const [badPostureTime, setBadPostureTime] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  const getAngle = (p1, p2) => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
  };

  const getInsight = (score, streak) => {
    if (score >= 90 && streak >= 10) return "Outstanding form — keep it up! 🔥";
    if (score >= 80) return "Great alignment detected.";
    if (score >= 60) return "Minor adjustments needed.";
    if (score >= 40) return "Chin up, shoulders back!";
    return "Significant slouch detected — correct now.";
  };

  useEffect(() => {
    let detector;

    const init = async () => {
      const tf = window.tf;
      const posedetection = window.poseDetection;

      await tf.setBackend("webgl");
      await tf.ready();

      detector = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet,
        {
          modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        },
      );

      const video = videoRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();

      detect(detector);
    };

    const speakAlert = (message) => {
      if (isMutedRef.current) return;

      const now = Date.now();

      // ⛔ cooldown (10 sec)
      if (now - lastSpokenRef.current < 10000) return;

      window.speechSynthesis.cancel(); // Stop previous voice
      const speech = new SpeechSynthesisUtterance(message);
      speech.rate = 1;
      speech.pitch = 1;

      window.speechSynthesis.speak(speech);

      lastSpokenRef.current = now;
    };

    const detect = async (detector) => {
      const video = videoRef.current;

      const loop = async () => {
        if (video.readyState === 4) {
          const poses = await detector.estimatePoses(video);

          if (poses.length > 0) {
            const { posture, angle } = checkPosture(poses[0]);

            setStatus(`${posture} | ${angle.toFixed(1)}°`);
            drawPose(poses[0], posture);

            totalRef.current += 1;
            setTotalFrames(totalRef.current);

            if (posture.includes("Good")) {
              setScore((prev) => Math.min(prev + 0.5, 100));
              streakRef.current += 1;
              goodRef.current += 1;
            } else {
              setScore((prev) => Math.max(prev - 1, 0));
              streakRef.current = 0;
            }

            // Trigger Voice in Detection Loop
            if (posture.includes("Slouching")) {
              speakAlert("Fix your posture");
            }

            // Track Bad Posture Duration
            // ✅ REAL-TIME counter (correct way)
            let newBadTime = badPostureTime;

            if (posture.includes("Slouching")) {
              newBadTime += 1;
            } else {
              newBadTime = 0;
              setShowAlert(false);
            }

            setBadPostureTime(newBadTime);

            // ✅ Trigger alert AFTER updating value
            if (newBadTime > 150) {
              setShowAlert(true);
              speakAlert("Fix your posture");
            }

            setStreak(streakRef.current);
            setGoodFrames(goodRef.current);
            setInsight(getInsight(Math.round(score), streakRef.current));
          }
        }

        requestAnimationFrame(loop);
      };

      loop();
    };

    init();
  }, []);

  const checkPosture = (pose) => {
    const keypoints = pose.keypoints;
    const nose = keypoints.find((k) => k.name === "nose");
    const leftShoulder = keypoints.find((k) => k.name === "left_shoulder");
    const rightShoulder = keypoints.find((k) => k.name === "right_shoulder");

    if (!nose || !leftShoulder || !rightShoulder) {
      return { posture: "Detecting...", angle: 0 };
    }

    const midShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    const angle = getAngle(midShoulder, nose);
    let posture = "Slouching ❌";
    if (angle >= -95 && angle <= -65) {
      posture = "Good Posture ✅";
    }
    return { posture, angle };
  };

  const drawPose = (pose, posture) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, 640, 480);

    pose.keypoints.forEach((kp) => {
      if (kp.score > 0.5) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = posture.includes("Good") ? "#00ff88" : "#ff3b6b";
        ctx.shadowColor = posture.includes("Good") ? "#00ff88" : "#ff3b6b";
        ctx.shadowBlur = 10;
        ctx.fill();
      }
    });
  };

  const isGood = status.includes("Good");
  const scoreRounded = Math.round(score);
  const accuracy =
    totalFrames > 0 ? Math.round((goodFrames / totalFrames) * 100) : 0;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (scoreRounded / 100) * circumference;

  const scoreColor =
    scoreRounded >= 75
      ? "var(--accent-green)"
      : scoreRounded >= 45
        ? "var(--accent-amber)"
        : "var(--accent-red)";

  return (
    <>
      {/* Camera Panel */}
      <div className="camera-panel">
        <div className="camera-label">
          <div className="camera-label-dot" />
          Live Feed — Camera 01
        </div>
        <div className="camera-wrap">
          <video ref={videoRef} />
          <canvas ref={canvasRef} width="640" height="480" />
          <div className="corner corner-tl" />
          <div className="corner corner-tr" />
          <div className="corner corner-bl" />
          <div className="corner corner-br" />
          <div className={`posture-badge ${isGood ? "good" : "bad"}`}>
            {status}
          </div>
        </div>
      </div>
      {showAlert && (
        <div className="absolute top-5 right-5 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-lg animate-pulse">
          ⚠️ Fix your posture!
        </div>
      )}

      {/* Right Panel */}
      <div className="right-panel">
        {/* Score Circle */}
        <div className="metric-card">
          <div className="card-label">Posture Score</div>
          <div className="score-circle-wrap">
            <div className="score-outer">
              <svg
                className="score-svg"
                width="140"
                height="140"
                viewBox="0 0 140 140"
              >
                <circle className="score-track" cx="70" cy="70" r={radius} />
                <circle
                  className="score-fill"
                  cx="70"
                  cy="70"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  stroke={scoreColor}
                />
              </svg>
              <div className="score-center">
                <span className="score-number" style={{ color: scoreColor }}>
                  {scoreRounded}
                </span>
                <span className="score-label">/ 100</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="sound-toggle-btn"
        >
          {isMuted ? "🔇 Muted" : "🔊 Sound On"}
        </button>
        {/* <button
          onClick={() => {
            const nextState = !isMuted;
            setIsMuted(nextState);
            if (nextState) window.speechSynthesis.cancel(); // Shut up immediately
          }}
          className={`px-6 py-2 rounded-lg border transition-all ${
            isMuted
              ? "bg-red-500/10 border-red-500/50 text-red-400"
              : "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
          }`}
        >
          {isMuted ? "🔇 Muted" : "🔊 Sound On"}
        </button> */}

        {/* Status */}
        <div className="metric-card">
          <div className="card-label">Current Status</div>
          <div className="status-row">
            <div className={`status-indicator ${isGood ? "good" : "bad"}`} />
            <span className={`status-text ${isGood ? "good" : "bad"}`}>
              {isGood
                ? "Good Posture"
                : status.includes("Detecting")
                  ? "Detecting…"
                  : "Slouching"}
            </span>
          </div>
          <div className="angle-display">
            {status.includes("|")
              ? `Neck angle: ${status.split("|")[1]?.trim()}`
              : "Calibrating…"}
          </div>
          <div className="accuracy-bar-bg">
            <div
              className="accuracy-bar-fill"
              style={{ width: `${accuracy}%` }}
            />
          </div>
          <div className="accuracy-label">
            <span>Session Accuracy</span>
            <span>{accuracy}%</span>
          </div>
        </div>

        {/* Streak */}
        <div className="metric-card">
          <div className="card-label">Good Posture Streak</div>
          <div className="streak-row">
            <span className="streak-number">{streak}</span>
            <span className="streak-unit">FRAMES</span>
          </div>
          <div className="streak-sub">
            {streak >= 30
              ? "🔥 On fire!"
              : streak >= 10
                ? "⚡ Building momentum"
                : "Hold steady to build streak"}
          </div>
        </div>

        {/* Insight */}
        <div className="metric-card">
          <div className="card-label">AI Insight</div>
          <span className="insight-icon">
            {scoreRounded >= 80 ? "✅" : scoreRounded >= 50 ? "⚠️" : "🚨"}
          </span>
          <div className="insight-text">{insight}</div>
        </div>
      </div>
    </>
  );
}
