import { db } from "@dokploy/server/db";
import { notifications } from "@dokploy/server/db/schema";
import { eq } from "drizzle-orm";
import {
	sendDiscordNotification,
	sendEmailNotification,
	sendGotifyNotification,
	sendNtfyNotification,
	sendSlackNotification,
	sendTelegramNotification,
} from "./utils";

export const sendUpdateAvailableNotifications = async (
	currentVersion: string,
	latestVersion: string,
) => {
	const allNotifications = await db
		.select()
		.from(notifications)
		.where(eq(notifications.updateAvailable, true));

	for (const notification of allNotifications) {
		const title = "Dokploy Update Available";
		const message = `🚀 A new version of Dokploy is available!\n\nCurrent: ${currentVersion}\nLatest: ${latestVersion}\n\nPlease update to get the latest features and improvements.`;

		try {
			if (notification.slackId) {
				const slack = await db.query.slack.findFirst({
					where: (slack, { eq }) => eq(slack.slackId, notification.slackId!),
				});

				if (slack) {
					await sendSlackNotification(slack, {
						text: message,
						username: "Dokploy",
						icon_emoji: ":rocket:",
					});
				}
			}

			if (notification.discordId) {
				const discord = await db.query.discord.findFirst({
					where: (discord, { eq }) => eq(discord.discordId, notification.discordId!),
				});

				if (discord) {
					await sendDiscordNotification(discord, {
						embeds: [{
							title: title,
							description: message,
							color: 0x3498db,
						}],
					});
				}
			}

			if (notification.telegramId) {
				const telegram = await db.query.telegram.findFirst({
					where: (telegram, { eq }) =>
						eq(telegram.telegramId, notification.telegramId!),
				});

				if (telegram) {
					await sendTelegramNotification(telegram, message);
				}
			}

			if (notification.emailId) {
				const email = await db.query.email.findFirst({
					where: (email, { eq }) => eq(email.emailId, notification.emailId!),
				});

				if (email) {
					await sendEmailNotification(email, title, `
						<h2>${title}</h2>
						<p>A new version of Dokploy is available!</p>
						<ul>
							<li><strong>Current Version:</strong> ${currentVersion}</li>
							<li><strong>Latest Version:</strong> ${latestVersion}</li>
						</ul>
						<p>Please update your installation to get the latest features and improvements.</p>
					`);
				}
			}

			if (notification.gotifyId) {
				const gotify = await db.query.gotify.findFirst({
					where: (gotify, { eq }) => eq(gotify.gotifyId, notification.gotifyId!),
				});

				if (gotify) {
					await sendGotifyNotification(gotify, title, message);
				}
			}

			if (notification.ntfyId) {
				const ntfy = await db.query.ntfy.findFirst({
					where: (ntfy, { eq }) => eq(ntfy.ntfyId, notification.ntfyId!),
				});

				if (ntfy) {
					await sendNtfyNotification(ntfy, title, "update", message, ntfy.priority.toString());
				}
			}
		} catch (error) {
			console.error(
				`Failed to send update notification via ${notification.notificationType}:`,
				error,
			);
		}
	}
};