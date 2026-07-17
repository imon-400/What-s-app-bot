const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const axios = require('axios');
const { alldown, tikdown } = require('imon-videos-downloader');

// User data file
const usersFile = './users.json';
let users = [];
if (fs.existsSync(usersFile)) {
    try {
        users = JSON.parse(fs.readFileSync(usersFile));
    } catch (e) {
        users = [];
    }
}

// ⚠️ Put your WhatsApp number with Country Code here
const MY_PHONE_NUMBER = '88017XXXXXXXX'; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    // Generate Pairing Code for Login
    if (!sock.authState.creds.registered) {
        console.clear();
        console.log("=== IMON WHATSAPP BOT LOGIN ===");
        
        if (!MY_PHONE_NUMBER || MY_PHONE_NUMBER === '88017XXXXXXXX') {
            console.log("❌ ERROR: Please put your real WhatsApp number on line 26!");
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let cleanedNumber = MY_PHONE_NUMBER.replace(/[^0-9]/g, '');
                let code = await sock.requestPairingCode(cleanedNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n🔑 YOUR LOGIN CODE: ${code}`);
                console.log("Open WhatsApp > Linked Devices > Link with phone number and enter this code.\n");
            } catch (error) {
                console.error("Failed to generate code. Please restart server:", error);
            }
        }, 3000);
    }

    // Save login credentials
    sock.ev.on('creds.update', saveCreds);

    // Connection Monitor
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const statusCode = lastDisconnect.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`Connection closed (Status: ${statusCode}). Reconnecting...`);
            
            if (shouldReconnect) {
                setTimeout(() => startBot(), 5000);
            } else {
                console.log('❌ Session Logged Out! Delete auth_info folder and get new code.');
            }
        } else if (connection === 'open') {
            console.log('\n✨ Imon WhatsApp Bot is Online and Connected! ✨');
        }
    });

    // Message Handler
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const chatId = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            const pushName = msg.pushName || "No Username";

            if (!users.some(user => user.userId === chatId)) {
                const userCount = users.length + 1;
                users.push({ userId: chatId, count: userCount });
                fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
            }

            // Command /start
            if (text.startsWith('/start')) {
                const welcomeText = `✨❝𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐈𝐌𝐎𝐍 𝐀𝐥𝐥 𝐕𝐈𝐃𝐄𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 𝐁𝐎𝐓❞😗✨\n\n🔹 𝙎𝙀𝙉𝘿 𝙈𝙀 𝙑𝙄𝘿𝙀𝙊 𝙇𝙄𝙉𝙆 𝙏𝙊 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿 𝙑𝙄𝘿𝙀𝙊 🎥\n\n👨‍💻 ❝𝐁𝐎𝐓 𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑❞: 𝐈𝐌𝐎𝐍\n\n📞Contact:\n\n𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊 : https://www.facebook.com/Imon.132233\n\n🔹𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌 : @Farhan_islam12\n\n🎬 ╰•★★ Start Downloading Now! ★★•╯`;
                await sock.sendMessage(chatId, { text: welcomeText }, { quoted: msg });
                return;
            }

            // Command /user
            if (text.startsWith('/user')) {
                await sock.sendMessage(chatId, { text: `👥 Total Unique Users: ${users.length}` }, { quoted: msg });
                return;
            }

            // Video Link Processing
            if (text.startsWith('https://')) {
                console.log(`Link received from: ${pushName} (${chatId})`);
                const waitMsg = await sock.sendMessage(chatId, { text: "🔍 Please wait, processing your link..." }, { quoted: msg });

                try {
                    if (text.match(/tiktok\.com/)) {
                        const data = await tikdown(text);
                        const { title, video, images } = data.data;

                        if (images && images.length > 0) {
                            for (let i = 0; i < images.length; i++) {
                                if (i === 0) {
                                    await sock.sendMessage(chatId, { 
                                        image: { url: images[i] }, 
                                        caption: `🎬 TITLE: ${title}\n\n👨‍💻DEVELOPER: @Farhan_islam12\n\n🔗 Download Link:\n${video}` 
                                    });
                                } else {
                                    await sock.sendMessage(chatId, { image: { url: images[i] } });
                                }
                            }
                        } else {
                            const vidResponse = await axios.get(video, { responseType: 'arraybuffer' });
                            await sock.sendMessage(chatId, { 
                                video: Buffer.from(vidResponse.data), 
                                caption: `🎬 TITLE: ${title}\n\n👨‍💻DEVELOPER: @Farhan_islam12\n\n🔗 Direct Link:\n${video}` 
                            }, { quoted: msg });
                        }
                    } else {
                        const data = await alldown(text);
                        const { high, title } = data.data;

                        const vidResponse = await axios.get(high, { responseType: 'arraybuffer' });
                        await sock.sendMessage(chatId, { 
                            video: Buffer.from(vidResponse.data), 
                            caption: `🎬 TITLE: ${title}\n\n👨‍💻DEVELOPER: @Farhan_islam12\n\n🔗 Direct Link:\n${high}` 
                        }, { quoted: msg });
                    }

                    await sock.sendMessage(chatId, { delete: waitMsg.key });

                } catch (error) {
                    console.error("Error Processing Link:", error);
                    await sock.sendMessage(chatId, { delete: waitMsg.key });
                    await sock.sendMessage(chatId, { text: "❌ FAILED TO DOWNLOAD VIDEO.\nPlease check the link and try again." }, { quoted: msg });
                }
            }

        } catch (err) {
            console.error("Error in message event:", err);
        }
    });
}

startBot();
