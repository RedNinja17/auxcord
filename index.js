import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', () => {
    console.log(`Ready; ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'share') {
        const userLink = interaction.options.getString('link');
        await interaction.deferReply();

        try {
            let trackName = "Auxcord Music Share";
            let artistName = "Cross-Platform Track";
            let accentColor = 787878;
            let thumbnail = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=60";

            if (userLink.includes('spotify.com')) {
                accentColor = 0x1DB954;
            } else if (userLink.includes('apple.com')) {
                accentColor = 0xFC3C44;
            } else if (userLink.includes('youtube.com') || userLink.includes('youtu.be')) {
                accentColor = 0xFF0000;
            }

            try {
                const res = await fetch(userLink, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)' }
                });
                const html = await res.text();

                const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
                if (imageMatch && imageMatch[1]) {
                    thumbnail = imageMatch[1];
                }

                const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
                if (titleMatch && titleMatch[1]) {
                    trackName = titleMatch[1].replace(/\s*\|\s*Spotify$/, '').replace(/\s*-\s*Spotify$/, '').trim();
                }

                const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
                if (descMatch && descMatch[1]) {
                    let rawDesc = descMatch[1];
                    console.log("Raw og:description fetched:", rawDesc);

                    if (userLink.includes('spotify.com')) {
                        if (rawDesc.includes(' · ')) {
                            const parts = rawDesc.split(' · ');
                            if (parts.length > 0) {
                                artistName = parts[0].trim();
                            }
                        } else if (rawDesc.toLowerCase().includes(' by ')) {
                            const parts = rawDesc.split(/ by /i);
                            if (parts.length > 1) {
                                artistName = parts[1].split(/ on /i)[0].replace(/\.$/, '').trim();
                            }
                        }
                    }
                }

                if (artistName === "Artist" || artistName === "Spotify Artist") {
                    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
                    if (jsonLdMatch && jsonLdMatch[1]) {
                        try {
                            const jsonData = JSON.parse(jsonLdMatch[1]);
                            console.log("JSON-LD data found:", jsonData);
                            if (jsonData.byArtist && jsonData.byArtist[0]?.name) {
                                artistName = jsonData.byArtist[0].name;
                            } else if (jsonData.name && userLink.includes('spotify.com')) {
                                if (jsonData.creator?.name) artistName = jsonData.creator.name;
                            }
                        } catch (jsonErr) {
                        }
                    }
                }

                if (userLink.includes('apple.com') && titleMatch) {
                    let rawTitle = titleMatch[1].replace(/^[\u200E\u200F]/, '').replace(/\s*on Apple Music$/, '');
                    const parts = rawTitle.split(/ by /i);
                    if (parts.length >= 2) {
                        trackName = parts[0].trim();
                        artistName = parts[1].trim();
                    }
                } else if ((userLink.includes('youtube.com') || userLink.includes('youtu.be')) && titleMatch) {
                    let rawTitle = titleMatch[1].replace(/\s*-\s*YouTube Music$/, '').replace(/\s*-\s*YouTube$/, '');
                    if (rawTitle.includes(' - ')) {
                        const parts = rawTitle.split(' - ');
                        artistName = parts[0].trim();
                        trackName = parts.slice(1).join(' - ').trim();
                    }
                }

            } catch (e) {
                console.error("Error fetching metadata:", e);
            }

            const searchQuery = encodeURIComponent(`${trackName} ${artistName}`);
            const spotifyUrl = userLink.includes('spotify.com') ? userLink : `https://open.spotify.com/search/${searchQuery}`;
            const appleMusicUrl = userLink.includes('apple.com') ? userLink : `https://music.apple.com/us/search?term=${searchQuery}`;
            const youtubeMusicUrl = userLink.includes('youtube.com') || userLink.includes('youtu.be') ? userLink : `https://music.youtube.com/search?q=${searchQuery}`;

            const componentsV2Payload = {
                flags: 32768,
                components: [
                    {
                        type: 17,
                        accent_color: accentColor,
                        components: [
                            {
                                type: 9,
                                components: [
                                    { type: 10, content: `### ${trackName}` },
                                    { type: 10, content: `**${artistName}**` }
                                ],
                                accessory: {
                                    type: 11,
                                    media: {
                                        url: thumbnail
                                    }
                                }
                            },
                            {
                                type: 14,
                                divider: true
                            },
                            {
                                type: 1,
                                components: [
                                    { type: 2, style: 5, label: 'Spotify', url: spotifyUrl },
                                    { type: 2, style: 5, label: 'Apple Music', url: appleMusicUrl },
                                    { type: 2, style: 5, label: 'YouTube Music', url: youtubeMusicUrl }
                                ]
                            }
                        ]
                    }
                ]
            };

            await interaction.editReply(componentsV2Payload);

        } catch (error) {
            console.error('Error processing music link:', error);
            await interaction.editReply(`Here is your link: ${userLink}`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);