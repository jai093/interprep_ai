import * as googleTTS from 'google-tts-api';

const run = async () => {
    try {
        const text = "Hi Sanjay, how's your day going?"; // Example question
        console.log("Testing text length:", text.length);

        const base64AudioArray = await googleTTS.getAllAudioBase64(text, {
            lang: 'en-US',
            slow: false,
            host: 'https://translate.google.com',
            splitPunct: ',.?'
        });
        
        console.log("SUCCESS");
    } catch (e) {
        console.error("ERROR CAUGHT:");
        console.error(e);
    }
};

run();
