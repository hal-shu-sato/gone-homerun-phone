'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from 'react-bootstrap';
import { useAudioPlayer } from 'react-use-audio-player';

import styles from './game.module.css';

const BUNT_THRESHOLD = 10;
const HIT_THRESHOLD = 15;
const CHEERS_THRESHOLD = 20;
const FILTER_SIZE = 5;

const filterAcceleration = { x: 0, y: 0, z: 0 };
let filterCount = 0;

export default function Game() {
  const [inPlay, setInPlay] = useState<boolean>(false);
  const inFlight = useRef<boolean>(false);
  const [accelerationHistory, setAccelerationHistory] = useState<number[]>([]);

  const envAudioPlayer = useAudioPlayer();
  const cheersAudioPlayer = useAudioPlayer();
  const hitAudioPlayer = useAudioPlayer();
  const buntAudioPlayer = useAudioPlayer();

  useEffect(() => {
    envAudioPlayer.load('/assets/sounds/lab-env.mp3', { loop: true });
    cheersAudioPlayer.load('/assets/sounds/metal/lab-cheers.mp3', {
      onend: () => {
        inFlight.current = false;
      },
    });
    hitAudioPlayer.load('/assets/sounds/metal/lab-far.mp3', {
      onend: () => {
        inFlight.current = false;
      },
    });
    buntAudioPlayer.load('/assets/sounds/metal/on-jin-bunt.mp3', {
      onend: () => {
        inFlight.current = false;
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeviceMotion = useCallback(
    (event: DeviceMotionEvent) => {
      if (inFlight.current) return;

      const { x, y, z } = event.acceleration ?? { x: null, y: null, z: null };
      if (x === null || y === null || z === null) return;

      filterCount++;
      filterAcceleration.x += x;
      filterAcceleration.y += y;
      filterAcceleration.z += z;

      if (filterCount < FILTER_SIZE) return;

      const { x: xSum, y: ySum, z: zSum } = filterAcceleration;

      filterCount = 0;
      filterAcceleration.x = 0;
      filterAcceleration.y = 0;
      filterAcceleration.z = 0;

      const totalAcceleration = Math.sqrt(
        (xSum / FILTER_SIZE) ** 2 +
          (ySum / FILTER_SIZE) ** 2 +
          (zSum / FILTER_SIZE) ** 2,
      );

      if (totalAcceleration < BUNT_THRESHOLD) return;

      inFlight.current = true;
      // For Android
      if (typeof window.navigator.vibrate === 'function')
        window.navigator.vibrate(200);

      setAccelerationHistory((prev) => [...prev, totalAcceleration]);

      if (totalAcceleration >= CHEERS_THRESHOLD) {
        cheersAudioPlayer.play();
      } else if (totalAcceleration >= HIT_THRESHOLD) {
        hitAudioPlayer.play();
      } else {
        buntAudioPlayer.play();
      }
    },
    [cheersAudioPlayer, hitAudioPlayer, buntAudioPlayer],
  );

  const start = useCallback(() => {
    if (inPlay) return;

    window.removeEventListener('devicemotion', handleDeviceMotion);
    setInPlay(true);

    envAudioPlayer.play();

    // For iOS 13+
    if (
      typeof (
        DeviceMotionEvent as unknown as DeviceMotionEvent & {
          requestPermission: unknown;
        }
      ).requestPermission === 'function'
    ) {
      void (
        DeviceMotionEvent as unknown as DeviceMotionEvent & {
          requestPermission: () => Promise<string>;
        }
      )
        .requestPermission()
        .then((permission: string) => {
          if (permission === 'granted') {
            window.addEventListener('devicemotion', handleDeviceMotion);
          }
        });
    } else {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }
  }, [inPlay, envAudioPlayer, handleDeviceMotion]);

  const stop = useCallback(() => {
    if (!inPlay) return;

    window.removeEventListener('devicemotion', handleDeviceMotion);
    envAudioPlayer.pause();
    setInPlay(false);
  }, [inPlay, handleDeviceMotion, envAudioPlayer]);

  if (inFlight.current) {
    return <div className={styles.flash} />;
  }

  return (
    <>
      <Button onClick={start} disabled={inPlay}>
        Start
      </Button>
      <Button onClick={stop}>Stop</Button>
      <pre>{JSON.stringify(accelerationHistory, null, 2)}</pre>
    </>
  );
}
