ALTER TABLE `books` ADD `hasImages` enum('pending','generated','failed','none') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `books` ADD `imagesGeneratedAt` timestamp;