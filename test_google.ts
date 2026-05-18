import * as googleTTS from 'google-tts-api';

const run = async () => {
    try {
        const url = googleTTS.getAudioUrl('Hello from Google TTS', {
            lang: 'en-US',
            slow: false,
            host: 'https://translate.google.com',
        });
        console.log('SUCCESS:', url);
        
        const b64 = await googleTTS.getAudioBase64('Hello from Base64', {
            lang: 'en-US',
            slow: false,
            host: 'https://translate.google.com',
        });
        console.log('BASE64 LENGTH:', b64.length);
    } catch (e) {
        console.error('ERROR:', e);
    }
}
run();
