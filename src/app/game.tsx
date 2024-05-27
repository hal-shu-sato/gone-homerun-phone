'use client';

import { useCallback, useState } from 'react';

import { Button } from 'react-bootstrap';

import styles from './game.module.css';

export default function Game() {
  const [acceleration, setAcceleration] = useState<{
    x: number | null;
    y: number | null;
    z: number | null;
  }>({ x: null, y: null, z: null });
  const [flash, setFlash] = useState<boolean>(false);

  const flashScreen = useCallback(() => {
    // For Android
    if (typeof window.navigator.vibrate === 'function')
      window.navigator.vibrate(200);
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
    }, 500);
  }, []);

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
      if (totalAcceleration >= 5) {
        flashScreen();
      }
    },
    [flashScreen],
  );

  const start = useCallback(() => {
    window.removeEventListener('devicemotion', handleDeviceMotion);

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
          if (permission === 'granted')
            window.addEventListener('devicemotion', handleDeviceMotion);
        });
    } else {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }
  }, [handleDeviceMotion]);

  const stop = useCallback(() => {
    window.removeEventListener('devicemotion', handleDeviceMotion);
  }, [handleDeviceMotion]);

  if (flash) {
    return <div className={styles.flash} />;
  }

  return (
    <>
      <Button onClick={start}>Start</Button>
      <Button onClick={stop}>Stop</Button>
      <pre>{JSON.stringify(acceleration, null, 2)}</pre>
    </>
  );
}
