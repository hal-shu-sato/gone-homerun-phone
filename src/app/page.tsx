import Image from 'next/image';
import Link from 'next/link';
import { Container, Stack } from 'react-bootstrap';

import logoImg from '../assets/ghp.jpg';

import Game from './game';
import styles from './page.module.css';

export default function Home() {
  return (
    <Container as="main" className={styles.main}>
      <Stack gap={2} className="col-md-5 mx-auto my-5">
        <h1>Gone Home-run Phone</h1>
        <Image
          src={logoImg}
          alt="Gone Home-run Phone Logo"
          className="img-fluid"
        />
        <Game />
        <div className="text-end">
          効果音:{' '}
          <Link
            href="https://soundeffect-lab.info/"
            target="_blank"
            rel="noreferrer"
          >
            効果音ラボ
          </Link>
          ・
          <Link href="https://on-jin.com/" target="_blank" rel="noreferrer">
            On-Jin ～音人～
          </Link>
          ・
          <Link
            href="https://www.nhk.or.jp/archives/creative/"
            target="_blank"
            rel="noreferrer"
          >
            NHKクリエイティブ・ライブラリー
          </Link>
        </div>
      </Stack>
    </Container>
  );
}
