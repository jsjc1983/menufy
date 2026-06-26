-- Add relational guarantees used by the application authorization and guest flows.
CREATE INDEX "Menu_restaurantId_idx" ON "Menu"("restaurantId");
CREATE UNIQUE INDEX "Course_menuId_order_key" ON "Course"("menuId", "order");
CREATE INDEX "Course_menuId_idx" ON "Course"("menuId");
CREATE INDEX "Dish_courseId_idx" ON "Dish"("courseId");
CREATE INDEX "Event_restaurantId_idx" ON "Event"("restaurantId");
CREATE INDEX "Event_menuId_idx" ON "Event"("menuId");
CREATE INDEX "Event_date_idx" ON "Event"("date");
CREATE UNIQUE INDEX "Guest_eventId_normalizedName_key" ON "Guest"("eventId", "normalizedName");
CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId");
CREATE INDEX "Selection_guestId_idx" ON "Selection"("guestId");
CREATE INDEX "Selection_dishId_idx" ON "Selection"("dishId");
ALTER TABLE "Selection" DROP CONSTRAINT IF EXISTS "Selection_guestId_fkey";
ALTER TABLE "Selection" ADD CONSTRAINT "Selection_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
