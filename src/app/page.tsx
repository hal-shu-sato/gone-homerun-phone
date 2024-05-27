import { Container, Stack } from 'react-bootstrap';

import Game from './game';
import styles from './page.module.css';

export default function Home() {
  return (
    <Container as="main" className={styles.main}>
      <Stack gap={2} className="col-md-5 mx-auto my-5">
        <h1>Gone Home-run Phone</h1>
        <Game />
      </Stack>
    </Container>
  );
}
