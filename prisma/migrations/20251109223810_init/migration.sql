-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('Open', 'Canceled', 'Paid');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIM', 'USER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "restaurantName" TEXT,
    "password" TEXT,
    "role" "public"."UserRole" DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" SERIAL NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'Open',
    "total" DOUBLE PRECISION DEFAULT 0,
    "tableNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER,
    "price" DOUBLE PRECISION,
    "orderId" INTEGER,
    "menuItemId" INTEGER,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" INTEGER,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatSession" (
    "id" SERIAL NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "currentOrderId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_menuItemId_key" ON "public"."OrderItem"("orderId", "menuItemId");

-- CreateIndex
CREATE INDEX "ChatSession_tableNumber_idx" ON "public"."ChatSession"("tableNumber");

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
