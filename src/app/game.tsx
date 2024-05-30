'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button, FormCheck, FormGroup } from 'react-bootstrap';
import { useAudioPlayer } from 'react-use-audio-player';

import styles from './game.module.css';

const isDev = process.env.NODE_ENV === 'development';

const BUNT_THRESHOLD = 10;
const HIT_THRESHOLD = 15;
const HOMERUN_THRESHOLD = 25;
const FILTER_SIZE = 5;

const filterAcceleration = { x: 0, y: 0, z: 0 };
let filterCount = 0;

const SOUND_PATH = '/assets/sounds/';

const envSoundPath = 'lab-env.mp3';

const metalCheersSoundPath = 'metal/lab-cheers.mp3';
const metalFarSoundPaths = [
  'metal/lab-far.mp3',
  'metal/nhk.m4a',
  // 'metal/on-jin-far.mp3',
];
const metalNearSoundPaths = [
  'metal/lab-near.mp3',
  'metal/on-jin-near-1.mp3',
  'metal/on-jin-near-2.mp3',
];
const metalBuntSoundPath = 'metal/on-jin-bunt.mp3';

const woodFarSoundPath = 'wood/lab-far.mp3';
const woodNearSoundPaths = [
  'wood/lab-near.mp3',
  'wood/on-jin-hit-1.mp3',
  'wood/on-jin-hit-2.mp3',
  'wood/on-jin-hit-3.mp3',
];
const woodBuntSoundPath = 'wood/on-jin-bunt.mp3';

export default function Game() {
  const [inPlay, setInPlay] = useState<boolean>(false);
  const inFlight = useRef<boolean>(false);
  const [accelerationHistory, setAccelerationHistory] = useState<number[]>([]);
  const [flashColor, setFlashColor] = useState<string>('#ff0000');
  const [judge, setJudge] = useState<string>('');
  const [batMaterial, setBatMaterial] = useState<'metal' | 'wood'>('metal');

  const envAudioPlayer = useAudioPlayer();
  const homerunAudioPlayer = useAudioPlayer();
  const hitAudioPlayer = useAudioPlayer();
  const buntAudioPlayer = useAudioPlayer();

  const { load: envAudioPlayerLoad } = envAudioPlayer;
  const { load: homerunAudioPlayerLoad } = homerunAudioPlayer;
  const { load: hitAudioPlayerLoad } = hitAudioPlayer;
  const { load: buntAudioPlayerLoad } = buntAudioPlayer;

  const handleEnd = useCallback(() => {
    inFlight.current = false;
  }, []);

  useEffect(() => {
    envAudioPlayerLoad(SOUND_PATH + envSoundPath, { loop: true });
  }, [envAudioPlayerLoad]);

  useEffect(() => {
    if (batMaterial === 'metal') {
      homerunAudioPlayerLoad(SOUND_PATH + metalCheersSoundPath, {
        onend: handleEnd,
      });
      hitAudioPlayerLoad(
        SOUND_PATH +
          [...metalFarSoundPaths, ...metalNearSoundPaths][
            Math.floor(
              Math.random() *
                (metalFarSoundPaths.length + metalNearSoundPaths.length),
            )
          ],
        {
          onend: handleEnd,
        },
      );
      buntAudioPlayerLoad(SOUND_PATH + metalBuntSoundPath, {
        onend: handleEnd,
      });
    } else {
      homerunAudioPlayerLoad(SOUND_PATH + woodFarSoundPath, {
        onend: handleEnd,
      });
      hitAudioPlayerLoad(
        SOUND_PATH +
          woodNearSoundPaths[
            Math.floor(Math.random() * woodNearSoundPaths.length)
          ],
        {
          onend: handleEnd,
        },
      );
      buntAudioPlayerLoad(SOUND_PATH + woodBuntSoundPath, {
        onend: handleEnd,
      });
    }
  }, [
    batMaterial,
    handleEnd,
    homerunAudioPlayerLoad,
    hitAudioPlayerLoad,
    buntAudioPlayerLoad,
  ]);

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
      setAccelerationHistory((prev) => [...prev, totalAcceleration]);

      if (totalAcceleration < BUNT_THRESHOLD) return;

      inFlight.current = true;
      // For Android
      if (typeof window.navigator.vibrate === 'function')
        window.navigator.vibrate(200);

      if (totalAcceleration >= HOMERUN_THRESHOLD) {
        setFlashColor('#1154B8');
        setJudge('Home Run!');
        homerunAudioPlayer.play();
      } else if (totalAcceleration >= HIT_THRESHOLD) {
        setFlashColor('#1154B8');
        setJudge('Hit!');
        hitAudioPlayer.play();
      } else {
        setFlashColor('#FE5D26');
        setJudge('Bunt');
        buntAudioPlayer.play();
      }
    },
    [homerunAudioPlayer, hitAudioPlayer, buntAudioPlayer],
  );
  const handleDeviceMotionRef = useRef(handleDeviceMotion);

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
            handleDeviceMotionRef.current = handleDeviceMotion;
          }
        });
    } else {
      window.addEventListener('devicemotion', handleDeviceMotion);
      handleDeviceMotionRef.current = handleDeviceMotion;
    }
  }, [inPlay, envAudioPlayer, handleDeviceMotion]);

  const stop = useCallback(() => {
    if (!inPlay) return;

    window.removeEventListener('devicemotion', handleDeviceMotionRef.current);
    envAudioPlayer.pause();
    setInPlay(false);
  }, [inPlay, envAudioPlayer]);

  if (inFlight.current) {
    return (
      <div
        className={styles.flash}
        style={{
          backgroundColor: flashColor,
          color: judge === 'Bunt' ? '#000' : '#fff',
        }}
      >
        {judge}
      </div>
    );
  }

  return (
    <>
      <FormGroup>
        <FormCheck
          type="radio"
          name="bat-material"
          label="Metal"
          id="bat-material-metal"
          checked={batMaterial === 'metal'}
          onChange={() => setBatMaterial('metal')}
          disabled={inPlay}
        />
        <FormCheck
          type="radio"
          name="bat-material"
          label="Wood"
          id="bat-material-wood"
          checked={batMaterial === 'wood'}
          onChange={() => setBatMaterial('wood')}
          disabled={inPlay}
        />
      </FormGroup>

      <Button onClick={start} disabled={inPlay}>
        Start
      </Button>
      <Button onClick={stop}>Stop</Button>
      {isDev && (
        <div>
          <h2>Debugging</h2>
          <ul>
            <li>inPlay: {inPlay.toString()}</li>
            <li>inFlight: {inFlight.current.toString()}</li>
            <li>flashColor: {flashColor}</li>
            <li>judge: {judge}</li>
            <li>batMaterial: {batMaterial}</li>
            <li>envAudioPlayer: {envAudioPlayer.src}</li>
            <li>homerunAudioPlayer: {homerunAudioPlayer.src}</li>
            <li>hitAudioPlayer: {hitAudioPlayer.src}</li>
            <li>buntAudioPlayer: {buntAudioPlayer.src}</li>
          </ul>
          <pre>
            {JSON.stringify([...accelerationHistory].reverse(), null, 2)}
          </pre>
        </div>
      )}
    </>
  );
}
