CREATE TABLE `videosBooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`bookId` int NOT NULL,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videosBooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `books` MODIFY COLUMN `videoId` int;