'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button, FormControl } from 'react-bootstrap';
import { useAudioPlayer } from 'react-use-audio-player';

import styles from './game.module.css';

export default function Game() {
  const [inPlay, setInPlay] = useState<boolean>(false);
  const inFlight = useRef<boolean>(false);
  const [accelerationHistory, setAccelerationHistory] = useState<number[]>([]);
  const [accelerationThreshold, setAccelerationThreshold] = useState<
    number | null
  >(10);

  const envAudioPlayer = useAudioPlayer();
  const cheersAudioPlayer = useAudioPlayer();
  const hitAudioPlayer = useAudioPlayer();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeviceMotion = useCallback(
    (event: DeviceMotionEvent) => {
      if (inFlight.current) return;

      const { x, y, z } = event.acceleration ?? { x: null, y: null, z: null };
      if (x === null || y === null || z === null) return;

      const totalAcceleration = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
      const thld = accelerationThreshold ?? 10;

      if (totalAcceleration < thld) return;

      inFlight.current = true;
      // setTimeout(() => {
      //   inFlight.current = false;
      // }, 2000);
      // For Android
      if (typeof window.navigator.vibrate === 'function')
        window.navigator.vibrate(200);

      setAccelerationHistory((prev) => [...prev, totalAcceleration]);

      if (totalAcceleration >= 2 * thld) {
        cheersAudioPlayer.play();
      } else {
        hitAudioPlayer.play();
      }
    },
    [accelerationThreshold, cheersAudioPlayer, hitAudioPlayer],
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
      <Button onClick={start} disabled={inPlay}>
        Start
      </Button>
      <Button onClick={stop}>Stop</Button>
      <pre>{JSON.stringify(accelerationHistory, null, 2)}</pre>
    </>
  );
}
