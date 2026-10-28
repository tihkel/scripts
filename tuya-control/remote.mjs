#!/usr/bin/env node
import { TuyaOpenApiClient } from '@tuya/tuya-connector-nodejs';
import { spawn } from 'child_process';
import { config } from 'dotenv';

// --- Tuya Config ---
config({ path: `${process.env.HOME}/scripts/.env` });
const API_KEY = process.env.TUYA_API_KEY;
const API_SECRET = process.env.TUYA_API_SECRET;
const REGION = 'eu';

// --- Devices ---
const DEVICES = {
  led:     { id: 'bf5d15b4790c0d313aktzn', dps: 'switch_led', modeDps: 'work_mode', colorDps: 'colour_data' },
//  bulb1:   { id: 'bf6e935014ed7bc0fbqpjm', dps: 'switch_led', modeDps: 'work_mode', colorDps: 'colour_data' },
//  bulb2:   { id: 'bf6b60b62e8c124a3f0zxa', dps: 'switch_led', modeDps: 'work_mode', colorDps: 'colour_data' },
};

const COLORS = {
  magenta: '012d03e80064',
};

const client = new TuyaOpenApiClient({
  accessKey: API_KEY,
  secretKey: API_SECRET,
  baseUrl: REGION === 'eu' ? 'https://openapi.tuyaeu.com' : 'https://openapi.tuyain.com',
});

// --- Helper functions ---
async function sendCommand(device, body) {
  try {
    await client.request({
      path: `/v1.0/iot-03/devices/${device.id}/commands`,
      method: 'POST',
      body,
    });
  } catch (err) {
    console.error(`Tuya error (${device.id}):`, err.message || err);
  }
}

async function setBaseColor(device) {
  await sendCommand(device, {
    commands: [
      { code: device.modeDps, value: 'colour' },
      { code: device.colorDps, value: COLORS.magenta },
    ],
  });
}

async function turnOn(device) {
  await sendCommand(device, { commands: [{ code: device.dps, value: true }] });
}

async function turnOff(device) {
  await sendCommand(device, { commands: [{ code: device.dps, value: false }] });
}

async function all(action) {
  const tasks = Object.values(DEVICES).map(async (device) => {
    if (action === 'on') return turnOn(device);
    if (action === 'off') return turnOff(device);
    if (action === 'setcolor') return setBaseColor(device);
  });
  await Promise.all(tasks);
}

// --- Initialization ---
await all('setcolor');
await all('off');
console.log('💡 All devices set to magenta base color and turned off. Waiting for beats...');

// --- Audio Setup ---
const PULSE_SOURCE = process.env.TUYA_BEAT_SOURCE || 'spotify';
const BASS_HIGHPASS_HZ = Number.parseInt(process.env.TUYA_BEAT_HIGHPASS_HZ || '35', 10);
const BASS_LOWPASS_HZ = Number.parseInt(process.env.TUYA_BEAT_LOWPASS_HZ || '140', 10);
const ffmpeg = spawn("ffmpeg", [
  "-f", "pulse",
  "-i", PULSE_SOURCE,
  "-af", `highpass=f=${BASS_HIGHPASS_HZ},lowpass=f=${BASS_LOWPASS_HZ}`,
  "-ac", "1",
  "-ar", "4000",
  "-f", "f32le",
  "-"
]);

const SKIP = 50;
const THRESHOLD = Number.parseFloat(process.env.TUYA_BEAT_THRESHOLD || '0.025');
const PEAK_THRESHOLD = Number.parseFloat(process.env.TUYA_BEAT_PEAK_THRESHOLD || '0.09');
const PEAK_MULTIPLIER = Number.parseFloat(process.env.TUYA_BEAT_PEAK_MULTIPLIER || '1.35');
const BASS_SMOOTHING = Number.parseFloat(process.env.TUYA_BEAT_SMOOTHING || '0.92');
const SUSTAIN_THRESHOLD = Number.parseFloat(process.env.TUYA_BEAT_SUSTAIN_THRESHOLD || '0.018');
const SUSTAIN_WINDOW_MS = Number.parseInt(process.env.TUYA_BEAT_SUSTAIN_WINDOW_MS || '900', 10);
const SUSTAIN_RELEASE_MS = Number.parseInt(process.env.TUYA_BEAT_SUSTAIN_RELEASE_MS || '180', 10);
const BASS_CONFIRM_MS = Number.parseInt(process.env.TUYA_BEAT_BASS_CONFIRM_MS || '220', 10);
const KICK_PULSE_DROP_MS = Number.parseInt(process.env.TUYA_BEAT_PULSE_DROP_MS || '80', 10);
let lastKick = 0;
let averagePeak = 0;
const REFRACTORY = 320; // ms
const FLASH_DURATION = 270; // ms
let lightOn = false;
let offTimer = null;
let offDeadline = 0;
let pulseTimer = null;
let bassActive = false;
let bassCandidateSince = 0;

function formatLevel(value) {
  return value.toFixed(6);
}

function ensureLightOn() {
  if (lightOn) {
    return;
  }

  lightOn = true;
  all('on');
}

function scheduleLightOff(deadline) {
  if (deadline <= offDeadline) {
    return;
  }

  offDeadline = deadline;

  if (offTimer) {
    clearTimeout(offTimer);
  }

  offTimer = setTimeout(() => {
    lightOn = false;
    offTimer = null;
    offDeadline = 0;
    all('off');
  }, Math.max(0, deadline - Date.now()));
}

function pulseKick(deadline) {
  if (pulseTimer) {
    clearTimeout(pulseTimer);
    pulseTimer = null;
  }

  if (!lightOn) {
    ensureLightOn();
    scheduleLightOff(deadline);
    return;
  }

  lightOn = false;
  all('off');

  pulseTimer = setTimeout(() => {
    pulseTimer = null;
    ensureLightOn();
    scheduleLightOff(deadline);
  }, KICK_PULSE_DROP_MS);
}

ffmpeg.stdout.on("data", chunk => {
  const floatSamples = new Float32Array(chunk.buffer, chunk.byteOffset, chunk.byteLength / 4);
  let bass = 0;
  let peak = 0;
  const N = Math.floor(floatSamples.length / 4);
  for (let i = 0; i < N; i += SKIP) {
    const sample = Math.abs(floatSamples[i]);
    bass += sample;
    peak = Math.max(peak, sample);
  }
  bass /= N / SKIP;
  const dynamicPeakThreshold = Math.max(PEAK_THRESHOLD, averagePeak * PEAK_MULTIPLIER);

  const now = Date.now();
  const bassDetected = bass > SUSTAIN_THRESHOLD;
  const sustainEligible = now - lastKick <= SUSTAIN_WINDOW_MS;
  const kickDetected = bass > THRESHOLD && peak > dynamicPeakThreshold && now - lastKick > REFRACTORY;

  if (bassDetected && sustainEligible) {
    if (bassCandidateSince === 0) {
      bassCandidateSince = now;
    }

    if (!bassActive && now - bassCandidateSince >= BASS_CONFIRM_MS) {
      bassActive = true;
      console.log(`🟣 Bass start bass=${formatLevel(bass)} peak=${formatLevel(peak)}`);
    }
  } else {
    bassCandidateSince = 0;
  }

  if (bassActive && (!bassDetected || !sustainEligible)) {
    bassActive = false;
    console.log(`⚫ Bass end bass=${formatLevel(bass)} peak=${formatLevel(peak)}`);
  }

  if (kickDetected) {
    lastKick = now;
    console.log(`🎶 Kick bass=${formatLevel(bass)} peak=${formatLevel(peak)} peakThreshold=${formatLevel(dynamicPeakThreshold)} sustain=${sustainEligible ? 'yes' : 'no'}`);
    pulseKick(now + FLASH_DURATION);

    if (bassDetected) {
      bassCandidateSince = now;
    }
  }

  if (lightOn && sustainEligible && bassDetected) {
    scheduleLightOff(now + SUSTAIN_RELEASE_MS);
  }

  averagePeak = averagePeak === 0
    ? peak
    : (averagePeak * BASS_SMOOTHING) + (peak * (1 - BASS_SMOOTHING));
});

ffmpeg.stderr.on("data", () => {});
ffmpeg.on("close", () => console.log("🛑 FFmpeg closed"));
