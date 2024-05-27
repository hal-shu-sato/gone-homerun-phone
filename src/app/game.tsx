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
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
    }, 500);
  }, []);

  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    const { x, y, z } = event.acceleration ?? {};
    if (x === undefined || y === undefined || z === undefined) {
      setAcceleration({ x: null, y: null, z: null });
      return;
    }
    setAcceleration({ x, y, z });
  }, []);

  const start = useCallback(() => {
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

    // window.navigator.vibrate(200);
    flashScreen();

    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, [handleDeviceMotion, flashScreen]);

  if (flash) {
    return <div className={styles.flash} />;
  }

  return (
    <>
      <Button onClick={start}>Start</Button>
      <pre>{JSON.stringify(acceleration, null, 2)}</pre>
    </>
  );
}
