-- CreateIndex
CREATE UNIQUE INDEX "StudentFee_studentId_feeStructureId_key" ON "StudentFee"("studentId", "feeStructureId");
