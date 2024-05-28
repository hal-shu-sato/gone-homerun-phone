import Link from 'next/link';
import { Container, Stack } from 'react-bootstrap';

import Game from './game';
import styles from './page.module.css';

export default function Home() {
  return (
    <Container as="main" className={styles.main}>
      <Stack gap={2} className="col-md-5 mx-auto my-5">
        <h1>Gone Home-run Phone</h1>
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
        </div>
      </Stack>
    </Container>
  );
}
