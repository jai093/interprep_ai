import { tts } from 'edge-tts';

tts('Hello, this is a test from edge tts', { voice: 'en-US-JennyNeural' })
  .then(buf => {
    console.log('SUCCESS, buffer size:', buf.length);
  })
  .catch(err => {
    console.error('EDGE TTS ERROR:', err.message);
    console.error(err.stack);
  });
