CREATE TABLE "Customer" (
  "id" SERIAL NOT NULL,
  "phone" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
CREATE TABLE "Order" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "customerId" INTEGER NOT NULL,
  "province" TEXT NOT NULL,
  "ward" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "deliveryOption" TEXT NOT NULL,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'moi',
  "quotedTotal" INTEGER,
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "OrderItem" (
  "id" SERIAL NOT NULL, "orderId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "sku" TEXT NOT NULL, "image" TEXT, "quantity" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "OrderStatusEvent" (
  "id" SERIAL NOT NULL, "orderId" INTEGER NOT NULL, "from" TEXT, "to" TEXT NOT NULL, "adminUserId" INTEGER, "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderStatusEvent_orderId_at_idx" ON "OrderStatusEvent"("orderId", "at");
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
