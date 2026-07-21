CREATE TABLE `NotificationChannel` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `encryptedConfig` TEXT NOT NULL,
  `encryptionIv` VARCHAR(191) NOT NULL,
  `encryptionTag` VARCHAR(191) NOT NULL,
  `configVersion` INTEGER NOT NULL DEFAULT 1,
  `isEnabled` BOOLEAN NOT NULL DEFAULT true,
  `lastTestedAt` DATETIME(3) NULL,
  `lastTestStatus` VARCHAR(191) NULL,
  `lastTestMessage` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `NotificationChannel_userId_type_key`(`userId`, `type`),
  INDEX `NotificationChannel_userId_idx`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NotificationSubscription` (
  `id` VARCHAR(191) NOT NULL,
  `channelId` VARCHAR(191) NOT NULL,
  `sources` JSON NOT NULL,
  `period` VARCHAR(191) NOT NULL,
  `limit` INTEGER NOT NULL,
  `scheduledMinute` INTEGER NOT NULL,
  `isEnabled` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `NotificationSubscription_channelId_key`(`channelId`),
  INDEX `NotificationSubscription_isEnabled_scheduledMinute_idx`(`isEnabled`, `scheduledMinute`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NotificationDelivery` (
  `id` VARCHAR(191) NOT NULL,
  `subscriptionId` VARCHAR(191) NOT NULL,
  `deliveryDate` VARCHAR(191) NOT NULL,
  `scheduledMinute` INTEGER NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `finishedAt` DATETIME(3) NULL,
  `failureMessage` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `NotificationDelivery_subscriptionId_deliveryDate_key`(`subscriptionId`, `deliveryDate`),
  INDEX `NotificationDelivery_status_startedAt_idx`(`status`, `startedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `NotificationChannel` ADD CONSTRAINT `NotificationChannel_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `NotificationSubscription` ADD CONSTRAINT `NotificationSubscription_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `NotificationChannel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `NotificationDelivery` ADD CONSTRAINT `NotificationDelivery_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `NotificationSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;