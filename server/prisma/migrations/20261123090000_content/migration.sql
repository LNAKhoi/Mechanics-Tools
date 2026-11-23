CREATE TABLE "Banner" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "linkUrl" TEXT,
  "placement" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Banner_placement_isEnabled_sortOrder_idx" ON "Banner"("placement", "isEnabled", "sortOrder");
CREATE TABLE "Page" ("id" SERIAL NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "html" TEXT NOT NULL DEFAULT '', "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Page_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
CREATE TABLE "SiteSettings" ("id" INTEGER NOT NULL DEFAULT 1, "address" TEXT NOT NULL, "hotlines" JSONB NOT NULL, "email" TEXT NOT NULL, "zaloUrl" TEXT, "messengerUrl" TEXT, "mapEmbedUrl" TEXT NOT NULL, "stores" JSONB NOT NULL, CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Popup" ("id" INTEGER NOT NULL DEFAULT 1, "title" TEXT NOT NULL, "html" TEXT NOT NULL DEFAULT '', "imageUrl" TEXT, "linkUrl" TEXT, "isEnabled" BOOLEAN NOT NULL DEFAULT false, "startsAt" TIMESTAMP(3), "endsAt" TIMESTAMP(3), "version" INTEGER NOT NULL DEFAULT 1, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Popup_pkey" PRIMARY KEY ("id"));
