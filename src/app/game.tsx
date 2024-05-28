'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button, FormControl } from 'react-bootstrap';
import { useAudioPlayer } from 'react-use-audio-player';

import styles from './game.module.css';

export default function Game() {
  const [acceleration, setAcceleration] = useState<{
    x: number | null;
    y: number | null;
    z: number | null;
  }>({ x: null, y: null, z: null });
  const [flash, setFlash] = useState<boolean>(false);
  const [accelerationHistory, setAccelerationHistory] = useState<number[]>([]);
  const [accelerationThreshold, setAccelerationThreshold] = useState<
    number | null
  >(10);

  const envAudioPlayer = useAudioPlayer();
  const cheersAudioPlayer = useAudioPlayer();
  const hitAudioPlayer = useAudioPlayer();

  useEffect(() => {
    envAudioPlayer.load('/assets/sounds/lab-env.mp3', { loop: true });
    cheersAudioPlayer.load('/assets/sounds/metal/lab-cheers.mp3');
    hitAudioPlayer.load('/assets/sounds/metal/lab-far.mp3');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flashScreen = useCallback(() => {
    // For Android
    if (typeof window.navigator.vibrate === 'function')
      window.navigator.vibrate(200);
    if (!flash) {
      setFlash(true);
      setTimeout(() => {
        setFlash(false);
      }, 500);
    }
  }, [flash]);

  const handleDeviceMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const { x, y, z } = event.acceleration ?? {};

      if (x === undefined || y === undefined || z === undefined) {
        setAcceleration({ x: null, y: null, z: null });
        return;
      }
      setAcceleration({ x, y, z });

      if (x === null || y === null || z === null) return;

      const totalAcceleration = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
      const thld = accelerationThreshold ?? 10;
      if (totalAcceleration >= 2 * thld) {
        setAccelerationHistory((prev) => [...prev, totalAcceleration]);
        if (!cheersAudioPlayer.playing) {
          cheersAudioPlayer.play();
          flashScreen();
        }
      } else if (totalAcceleration >= thld) {
        setAccelerationHistory((prev) => [...prev, totalAcceleration]);
        if (!hitAudioPlayer.playing) {
          hitAudioPlayer.play();
          flashScreen();
        }
      }
    },
    [flashScreen, accelerationThreshold, cheersAudioPlayer, hitAudioPlayer],
  );
  const handleDeviceMotionRef = useRef(handleDeviceMotion);

  const start = useCallback(() => {
    window.removeEventListener('devicemotion', handleDeviceMotionRef.current);

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
            handleDeviceMotionRef.current = handleDeviceMotion;
          }
        });
    } else {
      window.addEventListener('devicemotion', handleDeviceMotion);
      handleDeviceMotionRef.current = handleDeviceMotion;
    }
  }, [handleDeviceMotion, envAudioPlayer]);

  const stop = useCallback(() => {
    window.removeEventListener('devicemotion', handleDeviceMotionRef.current);
    envAudioPlayer.pause();
  }, [handleDeviceMotionRef, envAudioPlayer]);

  if (flash) {
    return <div className={styles.flash} />;
  }

  return (
    <>
      <FormControl
        type="number"
        value={accelerationThreshold ?? ''}
        onChange={(event) => {
          if (event.target.value === '') {
            setAccelerationThreshold(null);
            return;
          }
          setAccelerationThreshold(Number(event.target.value));
        }}
      />
      <Button onClick={start}>Start</Button>
      <Button onClick={stop}>Stop</Button>
      <pre>{JSON.stringify(acceleration, null, 2)}</pre>
      <pre>{JSON.stringify(accelerationHistory, null, 2)}</pre>
    </>
  );
}
