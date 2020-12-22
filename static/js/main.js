'use strict';

(function () {
    // getting elements from the page
    // DECLARATIONS
    const microphoneBtn = document.querySelector('#btn-microphone');
    const audioElement = document.querySelector('#audio-option');
    const commandInputField = document.querySelector('#input-command');
    let messageSequence = [];
    const randomEmojis = ["😁", "😄", "🐒", "🔥", "💣", "😏", "🙊", "😎", "🤐"];

    const rate = document.querySelector('#rate');
    const rateValue = document.querySelector('#rate-value');
    const pitch = document.querySelector('#pitch');
    const pitchValue = document.querySelector('#pitch-value');

    const voiceSelect = document.querySelector('#voice-select');
    let voices = [];

    // helpers
    let listening = false;
    let sentWhatsappMsg = false;

    // web speech API for Text-to-Speech
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    // web speech API for Speech-to-text
    const SpeakSpeech = window.speechSynthesis;
    
    // for fetching voices
    const getVoices = () => {
        voices = SpeakSpeech.getVoices();
        // loopiing on the options and genrating options for the list
        voices.forEach(voice => {
            // Create option element
            const option = document.createElement('option');
            // Filling option with voices and languages
            option.textContent = voice.name + ' (' + voice.lang + ')';
            // Set needed option attributes
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
    
            voiceSelect.appendChild(option);
        })
    }
    getVoices();

    // Values are fetched Asynchronously,
    // to fix this, because onvoiceschanged event is fired
    if(SpeakSpeech.onvoiceschanged !== undefined){
        SpeakSpeech.onvoiceschanged = getVoices;
    }

    if (!(SpeechRecognition && SpeakSpeech)) {
        alert('You should not continue');
    }

    const recognition = new SpeechRecognition();

    // For intermediate results ---->less acurate
    recognition.interimResults = false;

    // For continous Results ---->
    recognition.continuous = true;



    microphoneBtn.addEventListener("click", function(event) {
        if (listening) {
            // on to off
            recognition.stop();
        }
        else {
            // off to on
            recognition.start();
        }
    })

    // event listeners for SpeechRecognition events
    recognition.addEventListener('start', function() {
        console.info('Speech Recognition : START');
        // visuals
        microphoneBtn.innerHTML = '<i class="fas fa-microphone-slash fa-4x"></i>';
        listening = true;
        // audio
        audioElement.src = "../static/sound/micOn.mp3";
        audioElement.play();
        commandInputField.value = "";
        commandInputField.focus();

        // to stop after this
        // if (messageSequence.length == 2 && messageSequence[0].includes('whatsapp')) {
        //     recognition.stop();
        // }
    });

    

    recognition.addEventListener('result', function(event) {
        const { resultIndex: currentResultIndex } = event;
        const { transcript }= event.results[currentResultIndex][0];
        console.log(transcript);
        commandInputField.value = transcript.trim();
        
        let keyword = transcript.trim();

        // before sending the query to server,
        // we can perform actions and and then send
        // recognition.stop();


        // sleep trigger
        if (keyword === 'terminate') {
            recognition.stop();
            commandInputField.value = "";
            return;
        }

        if(keyword == "") {
            recognition.stop();
            speak("Try again...")
            return
        }

        // for Whatsapp message
        if (keyword.toLowerCase().includes('whatsapp')) {
            messageSequence.push(keyword.toLowerCase());
            speak('And your message sir ?');
            console.log(messageSequence);
            return;
            // recognition.start();
            //... to next block
        }
        // let listLen = messageSequence.length;
        if (messageSequence[0].includes('whatsapp')) {
            const [, receiver] = messageSequence[0].split(" ");

            let message = {
                "phrase" : keyword,
                "receiver" : receiver,
                "task" : "whatsapp"
            }

            speak(`sending to ${receiver}`);
            sentWhatsappMsg = true;
            // send to server
            sendToServer(message);
            messageSequence = [];
            commandInputField.value = "👍";
        }


        // if (messageSequence.length == 0) {
        //     recognition.stop();
        //     return;
        // }
        // To speak function
        // speak(commandInputField.value);
    })

    recognition.addEventListener('end', function() {
        console.info('Speech Recognition : STOP');
        // visuals
        microphoneBtn.innerHTML = '<i class="fas fa-microphone fa-4x"></i>';
        listening = false;
        // audio
        audioElement.src = "../static/sound/micOff.mp3";
        audioElement.play();

        if (commandInputField.value === "") {
            commandInputField.value = randomEmojis[Math.floor(Math.random()*randomEmojis.length)];
        }
        commandInputField.blur();
    })



    // DEFINITIONS
    // Speak function
    function speak(inputValue) {
        // if already speaking
        if(SpeakSpeech.speaking) {
            console.error("Already Speaking...");
            return;
        }
    
        if(inputValue !== '') {
            // stop listening while speaking
            recognition.stop();

            const speakText = new SpeechSynthesisUtterance(inputValue);
            
            // on speak end
            speakText.onend = () => {
                console.log("Done Speaking...");

                if (sentWhatsappMsg) return;

                recognition.start();
            }

            // on speak error
            speakText.onerror = (err) => {
                console.error(`Something went wrong...${err}`);
            }
        
            // select voice
            const selectedVoice = voiceSelect.selectedOptions[0].getAttribute('data-name');
             //Loop through voices
             voices.forEach(voice => {
                if(voice.name == selectedVoice){
                    speakText.voice = voice;
                }
            });
    
            // Set pitch and rate
            speakText.rate = rate.value;
            // speakText.rate = 1;
            speakText.pitch = pitch.value;
            // speakText.pitch = 1;
        
            // speak
            SpeakSpeech.speak(speakText);
        }
        else {
            alert("Input field is empty!");
        }
    }

    // EVENT LISTENERS FOR TEXT-TO-SPEECH
    // speak again on voice change
    voiceSelect.addEventListener('change', e => {
        speak(commandInputField.value)
    });
    // Rate value change
    rate.addEventListener('change', (e) => {
        rateValue.textContent = rate.value;
        speak(commandInputField.value);
    });
    // Pitch value change
    pitch.addEventListener('change', (e) => {
        pitchValue.textContent = pitch.value;
        speak(commandInputField.value);
    });

    function sendToServer(obj) {
        const url = "http://127.0.0.1:5000/";
        // creating a new request
        let request = new Request(url, {
            method: "POST",
            body: JSON.stringify(obj),
            headers: new Headers({
                "Content-Type": "application/json",

            })
        })
    
        // sending the request
        fetch(request)
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch(err => console.error(err))
    }
})();