import axios from 'axios';
import https from 'https';
import { database } from '../db';
import { serversTable } from '../db/schema';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { and, eq } from 'drizzle-orm';
import * as cheerio from 'cheerio';
import { log } from '../logger';

let previousTime = '';
let tempTimestamp: string | null = null;
let sleepDuration = 15;

type Server = {
  id: number;
  channel_id: string;
  server_id: string;
};

export async function getEarthquakeUpdates(client: Client) {
  log.debug('Running method getEarthquakeUpdates()');
  let failedTaskPreviously = false;
  while (true) {
    try {
      const servers = await database.select().from(serversTable);

      const agent = new https.Agent({
        rejectUnauthorized: false, // disables SSL verification
      });
      const { data } = await axios.get(
        'https://earthquake.phivolcs.dost.gov.ph/',
        {
          httpsAgent: agent,
        }
      );

      for (const server of servers) {
        const channel = await client.channels.fetch(server.channel_id);

        if (channel instanceof TextChannel) {
          const $ = cheerio.load(data);
          try {
            tempTimestamp = await scrape_data($, channel);
          } catch (e) {
            log.error(
              `Something went wrong sending embed to channel ID: ${channel.id} has been deleted.`
            );
            await delete_subscription(server);
          }
        } else {
          await delete_subscription(server);
        }
      }

      if (tempTimestamp != null) {
        previousTime = tempTimestamp;
      }

      failedTaskPreviously = false;

      log.success('Finished running task.');
    } catch (e) {
      if (!failedTaskPreviously) {
        const servers = await database.select().from(serversTable);
        servers.forEach(async server => {
          const channel = await client.channels.fetch(server.channel_id);
          if (channel instanceof TextChannel) {
            await channel.send('Error fetching data from upstream server.');
            log.error('Error fetching data from upstream server.');
          }
        });
      }

      failedTaskPreviously = true;
    } finally {
      log.debug(`Sleeping for ${sleepDuration}s before looping.`);
      await new Promise(r => setTimeout(r, sleepDuration * 1000));
    }
  }
}

async function scrape_data(
  $: cheerio.CheerioAPI,
  channel: TextChannel
): Promise<string | null> {
  const firstRow = $(
    'div.auto-style94 > table:nth-child(4) > tbody:nth-child(1) > tr:nth-child(2)'
  );

  const tds = firstRow.find('td');
  const timestamp = $(tds[0]).text().trim();

  // Check if current data is same with previous data to prevent sending duplicates
  if (timestamp == previousTime) {
    log.debug('Data is the same previously. Skipping');
    return null;
  }

  const latitude = $(tds[1]).text().trim();
  const longitude = $(tds[2]).text().trim();
  const depth = $(tds[3]).text().trim();
  const magnitude = Number.parseFloat($(tds[4]).text().trim());
  const location = $(tds[5]).text().replace(/\s+/g, ' ').trim();

  let embedColor;
  if (magnitude < 3) {
    embedColor = 0x00b0f4;
  } else if (magnitude >= 3 && magnitude < 4) {
    embedColor = 0x00ff00;
  } else if (magnitude >= 4 && magnitude < 5) {
    embedColor = 0xffff00;
  } else if (magnitude >= 5) {
    embedColor = 0xff0000;
  } else {
    embedColor = 0x000000;
  }

  const embed = new EmbedBuilder();
  embed.setTitle('PHIVOLCS Latest Earthquake Information');
  embed.setURL('https://earthquake.phivolcs.dost.gov.ph/');
  embed.setDescription('Earthquake data in the Philippines');
  embed.addFields(
    {
      name: 'Timestamp',
      value: `${timestamp}`,
      inline: true,
    },
    {
      name: 'Coordinates',
      value: `[${latitude},${longitude}](https://www.google.com/maps/place/${latitude},${longitude}/@${latitude},${longitude},8z)`,
      inline: true,
    },
    {
      name: '',
      value: '',
      inline: true,
    },

    {
      name: 'Depth',
      value: `${depth} km`,
      inline: true,
    },
    {
      name: 'Magnitude',
      value: `${magnitude}`,
      inline: true,
    },
    {
      name: '',
      value: '',
      inline: true,
    },
    {
      name: 'Location',
      value: `${location}`,
      inline: true,
    }
  );
  embed.setColor(embedColor);
  embed.setFooter({
    text: 'Disclaimer: Data may change from time to time.',
    iconURL: 'https://objects.daijobudes.net/public/misc/favicons/phivolcs.png',
  });
  embed.setTimestamp();

  log.debug(
    `Earthquake updates sent to channel ID: ${channel.id} | ${channel.name}`
  );
  await channel.send({ embeds: [embed] });
  return timestamp;
}

async function delete_subscription(server: Server) {
  await database
    .delete(serversTable)
    .where(
      and(
        eq(serversTable.server_id, server.server_id),
        eq(serversTable.channel_id, server.channel_id)
      )
    );
}

function hexDump(str: string): string {
  return Array.from(str)
    .map(ch => ch.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ');
}
